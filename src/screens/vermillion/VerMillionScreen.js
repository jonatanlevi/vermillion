import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOnboardingState, isOnboardingComplete, appendChatMessage, getChatHistory } from '../../services/storage';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, generateProfile,
} from '../../services/onboardingAI';
import { chatWithAI } from '../../services/aiService';
import { askTeam } from '../../services/agents';

const nextId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const QUESTIONS_PER_DAY = 3;

function getDayNumber(startDate) {
  if (!startDate) return 1;
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  return Math.min(diff + 1, 7);
}

export default function VerMillionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [pendingField, setPendingField] = useState(null);
  const [avatarMood, setAvatarMood] = useState('neutral');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    init();
    startPulse();
    return () => { mountedRef.current = false; };
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function init() {
    const complete = await isOnboardingComplete();
    const state = await getOnboardingState();
    const day = getDayNumber(state.startDate);
    setCurrentDay(day);

    if (complete) {
      setPhase('coaching');
      const history = await getChatHistory();
      if (history.length > 0) {
        setMessages(history.slice(-40));
      } else {
        addMsg('assistant', state.profileText
          ? `${state.profileText}\n\nמה תרצה לעבוד עליו היום?`
          : 'שלום! הפרופיל שלך מוכן. מה תרצה לשאול?');
      }
    } else {
      setPhase('onboarding');
      const progress = await getDayProgress(day);
      setQuestionsToday(progress.done);

      if (progress.complete) {
        addMsg('assistant', `יום ${day} הושלם ✅\n\nחזור מחר — VerMillion ימשיך להכיר אותך.`);
      } else {
        await askNextOnboardingQuestion(day, progress.done);
      }
    }
  }

  function addMsg(role, text) {
    const msg = { id: nextId(), role, text };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    return msg.id;
  }

  async function askNextOnboardingQuestion(day, doneCount) {
    const prompt = await getTodayOnboardingPrompt(day);

    if (!prompt) {
      await completeDay(day);
      setQuestionsToday(QUESTIONS_PER_DAY);

      if (day >= 7) {
        setAvatarMood('excited');
        addMsg('assistant', 'רגע אחד — מכין את האפיון האישי שלך...');
        setTimeout(async () => {
          if (!mountedRef.current) return;
          const { profileText } = await generateProfile();
          setMessages(prev => [
            ...prev.slice(0, -1),
            { id: nextId(), role: 'assistant', text: `${profileText}\n\n✅ VerMillion שלך מוכן לגמרי.\nמעכשיו יש לך יועץ פיננסי אישי — שלך בלבד.` },
          ]);
          setPhase('coaching');
        }, 1500);
      } else {
        setAvatarMood('happy');
        addMsg('assistant', `מצוין! סיימנו ליום ${day} 💪\n\nעובר אותך למשחקים...`);
        setTimeout(() => {
          navigation.getParent()?.navigate('Games');
        }, 1800);
      }
      setPendingField(null);
      return;
    }

    const { field, question, remaining } = prompt;
    setPendingField(field);
    setAvatarMood('asking');

    let text = question;
    if (day === 1 && doneCount === 0) {
      text = `שלום! אני VerMillion — היועץ הפיננסי האישי שלך.\n\nבשבוע הקרוב נכיר אחד את השני — 3 שאלות ביום. בסוף השבוע יהיה לי אפיון מלא ונוכל להתחיל לעבוד ברצינות.\n\n${question}`;
    }

    addMsg('assistant', text);
  }

  const send = async (text) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);
    setAvatarMood('thinking');

    addMsg('user', text);

    try {
      if (phase === 'onboarding' && pendingField) {
        await processOnboardingAnswer(pendingField, text);
        const newCount = questionsToday + 1;
        setQuestionsToday(newCount);
        setPendingField(null);

        const ack = getAck(pendingField, text);
        await new Promise(r => setTimeout(r, 300));
        addMsg('assistant', ack);
        await new Promise(r => setTimeout(r, 600));
        await askNextOnboardingQuestion(currentDay, newCount);

      } else {
        const partialId = nextId();
        setMessages(prev => [...prev, { id: partialId, role: 'assistant', text: '...' }]);

        const { response } = await askTeam(text, {}, (progress) => {
          if (!mountedRef.current) return;
          let t = '';
          if (progress.stage === 'routing')      t = '🎭 מנתח...';
          if (progress.stage === 'thinking')     t = '🧠 חושב...';
          if (progress.stage === 'synthesizing') t = '✨ מסכם...';
          if (t) setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: t } : m));
        });

        const finalText = response || 'לא קיבלתי תשובה. נסה שוב.';
        if (mountedRef.current) {
          setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: finalText } : m));
          await appendChatMessage({ id: partialId, role: 'assistant', text: finalText });
        }
        setAvatarMood('neutral');
      }
    } catch {
      addMsg('assistant', 'לא הצלחתי להתחבר. נסה שוב.');
      setAvatarMood('neutral');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  if (phase === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  const moodColors = {
    neutral:  '#C0392B',
    asking:   '#E67E22',
    thinking: '#8E44AD',
    happy:    '#27AE60',
    excited:  '#D4AF37',
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Avatar header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Animated.View style={[styles.avatarRing, { borderColor: moodColors[avatarMood], transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.avatar, { backgroundColor: moodColors[avatarMood] }]}>
            <Text style={styles.avatarText}>V</Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Text style={styles.avatarName}>VerMillion</Text>
          {phase === 'onboarding' ? (
            <Text style={styles.avatarSub}>
              יום {currentDay}/7 · שאלה {Math.min(questionsToday + 1, QUESTIONS_PER_DAY)}/{QUESTIONS_PER_DAY}
            </Text>
          ) : (
            <Text style={[styles.avatarSub, { color: '#4CAF50' }]}>● היועץ האישי שלך</Text>
          )}
        </View>

        {phase === 'onboarding' && (
          <View style={styles.progressDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.dot, i < questionsToday && styles.dotDone]} />
            ))}
          </View>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Bubble message={item} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="כתוב כאן..."
          placeholderTextColor="#444"
          value={input}
          onChangeText={setInput}
          multiline
          textAlign="right"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: moodColors[avatarMood] }, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function getAck(field, answer) {
  const n = typeof answer === 'number' ? answer : null;
  const map = {
    age:              `${answer} — מבין.`,
    familyStatus:     `${answer} — רשמתי.`,
    kids:             answer === 0 ? 'ללא ילדים.' : `${answer} ילדים — רשמתי.`,
    employmentType:   `${answer} — ברור.`,
    netIncome:        n ? `₪${n.toLocaleString('he-IL')} נטו — רשמתי.` : 'רשמתי.',
    incomeStability:  `${answer} — מבין.`,
    housingType:      `${answer} — רשמתי.`,
    housingCost:      n ? `₪${n.toLocaleString('he-IL')} — רשמתי.` : 'רשמתי.',
    fixedExpenses:    n === 0 ? 'ללא הוצאות קבועות נוספות.' : 'רשמתי.',
    variableExpenses: n ? `₪${n.toLocaleString('he-IL')} — מבין.` : 'רשמתי.',
    biggestExpense:   'מעניין — רשמתי.',
    creditDebt:       n === 0 ? 'ללא חוב כרטיס — טוב.' : `₪${(n||0).toLocaleString('he-IL')} — רשמתי.`,
    loans:            n === 0 ? 'ללא הלוואות.' : 'רשמתי.',
    overdraft:        n === 0 ? 'ללא מינוס — מצוין.' : `₪${(n||0).toLocaleString('he-IL')} מינוס.`,
    savings:          n ? `₪${n.toLocaleString('he-IL')} בצד — מבין.` : 'רשמתי.',
    assets:           'רשמתי.',
    moneyGoal:        'מטרה ברורה — רשמתי.',
    moneyFear:        'הבנתי. זה בדיוק מה שנעבוד עליו.',
    financialStress:  n >= 7 ? 'גבוה — נטפל בזה.' : n <= 3 ? 'נמוך — נחמד.' : 'ממוצע — מבין.',
    moneyPersonality: `${answer} — מעניין.`,
    biggestDream:     'חלום יפה. בואו נגרום לזה לקרות.',
  };
  return map[field] || 'רשמתי.';
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot]}>
      {!isUser && <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>V</Text></View>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textBot]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  loadingScreen: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  avatarName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  avatarSub: { color: '#666', fontSize: 12, marginTop: 2 },

  progressDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  dotDone: { backgroundColor: '#C0392B', borderColor: '#C0392B' },

  messages: { padding: 16, paddingBottom: 24 },
  bubbleWrap: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapBot: { justifyContent: 'flex-start' },
  miniAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  miniAvatarText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleBot: { backgroundColor: '#161616', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#C0392B22' },
  bubbleUser: { backgroundColor: '#C0392B', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 24, textAlign: 'right' },
  textBot: { color: '#E0E0E0' },
  textUser: { color: '#FFF', fontWeight: '500' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1, borderTopColor: '#1A1A1A', backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1, backgroundColor: '#161616', borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    color: '#FFF', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#222',
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#222' },
  sendBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
});
