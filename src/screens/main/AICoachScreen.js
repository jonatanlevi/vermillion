import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatWithAI, getAIStatus } from '../../services/aiService';
import { askTeam } from '../../services/agents';
import {
  getOnboardingState, isOnboardingComplete,
} from '../../services/storage';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, generateProfile, DAY_PLAN,
} from '../../services/onboardingAI';

const USE_AGENT_TEAM = true;
const nextId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── כמה ימים עברו מהיום הראשון ─────────────────────────────
function getDayNumber(startDate) {
  if (!startDate) return 1;
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  return Math.min(diff + 1, 7);
}

export default function AICoachScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiOnline, setAiOnline] = useState(null);
  const [phase, setPhase] = useState(null); // 'onboarding' | 'coaching' | null
  const [currentDay, setCurrentDay] = useState(1);
  const [dayProgress, setDayProgress] = useState({ total: 0, done: 0, complete: false });
  const [pendingField, setPendingField] = useState(null);
  const flatListRef = useRef(null);
  const mountedRef = useRef(true);
  const onboardingStateRef = useRef({});

  useEffect(() => {
    mountedRef.current = true;
    init();
    getAIStatus().then(ok => { if (mountedRef.current) setAiOnline(ok); });
    return () => { mountedRef.current = false; };
  }, []);

  async function init() {
    const complete = await isOnboardingComplete();
    const state = await getOnboardingState();
    onboardingStateRef.current = state;
    const day = getDayNumber(state.startDate);
    setCurrentDay(day);

    if (complete) {
      setPhase('coaching');
      addMsg('assistant', state.profileText
        ? `${state.profileText}\n\nמה תרצה לדון בו היום?`
        : 'שלום שוב! הפרופיל שלך מוכן. מה תרצה לשאול?');
    } else {
      setPhase('onboarding');
      const progress = await getDayProgress(day);
      setDayProgress(progress);

      if (progress.complete) {
        // יום זה כבר הושלם — מחכה ליום הבא
        addMsg('assistant',
          `יום ${day} הושלם ✅\n\nחזור מחר ליום ${day + 1}. בכל יום אנחנו מעמיקים קצת יותר — עד שיהיה לי תמונה מלאה של המצב שלך.`);
      } else {
        // שאל את השאלה הבאה של היום
        await askNextQuestion(day);
      }
    }
  }

  function addMsg(role, text) {
    const msg = { id: nextId(), role, text };
    setMessages(prev => [...prev, msg]);
    return msg.id;
  }

  async function askNextQuestion(day) {
    const prompt = await getTodayOnboardingPrompt(day);
    if (!prompt) {
      // יום הושלם
      await completeDay(day);
      const progress = await getDayProgress(day);
      setDayProgress(progress);

      if (day >= 7) {
        // אפיון מלא!
        addMsg('assistant', 'רגע — מכין את האפיון שלך...');
        const { profileText } = await generateProfile();
        setMessages(prev => [...prev.slice(0, -1),
          { id: nextId(), role: 'assistant', text: `${profileText}\n\n✅ האפיון שלך מוכן ונשמר על הטלפון שלך בלבד.\n\nמה תרצה לעבוד עליו קודם?` }
        ]);
        setPhase('coaching');
      } else {
        addMsg('assistant', `יום ${day} הושלם ✅\n\nחזור מחר ליום ${day + 1} — נעמיק עוד.`);
      }
      setPendingField(null);
      return;
    }

    const { field, question } = prompt;
    setPendingField(field);

    // פתיחה טבעית ביום 1
    let text = question;
    if (day === 1 && !(await getDayProgress(day)).done) {
      text = `שלום! אני VerMillion — היועץ הפיננסי האישי שלך.\n\nבשבוע הקרוב נכיר אחד את השני. כל יום כמה שאלות קצרות, ובסוף השבוע יהיה לי אפיון מלא של המצב שלך — ונוכל להתחיל לעבוד ברצינות.\n\n${question}`;
    }

    addMsg('assistant', text);
  }

  const send = async (text) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);

    addMsg('user', text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (phase === 'onboarding' && pendingField) {
        // שמור את התשובה
        await processOnboardingAnswer(pendingField, text);
        const progress = await getDayProgress(currentDay);
        setDayProgress(progress);
        setPendingField(null);

        // תגובה קצרה + שאלה הבאה
        const ack = getAck(pendingField, text);
        addMsg('assistant', ack);
        await new Promise(r => setTimeout(r, 600));
        await askNextQuestion(currentDay);

      } else {
        // מצב coaching — multi-agent
        const partialId = nextId();
        setMessages(prev => [...prev, { id: partialId, role: 'assistant', text: '' }]);

        if (USE_AGENT_TEAM) {
          const { response } = await askTeam(text, onboardingStateRef.current, (progress) => {
            if (!mountedRef.current) return;
            let stageText = '';
            if (progress.stage === 'routing')      stageText = '🎭 מנתב לסוכנים...';
            if (progress.stage === 'thinking')     stageText = `🧠 ${progress.agents?.length || ''} סוכנים חושבים...`;
            if (progress.stage === 'agent_done')   stageText = `✓ ${progress.agent} סיים`;
            if (progress.stage === 'synthesizing') stageText = '✨ מאחד תובנות...';
            setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: stageText } : m));
          });
          if (mountedRef.current) {
            setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: response || 'לא הגיעה תשובה — נסה שוב.' } : m));
          }
        } else {
          await chatWithAI(text, onboardingStateRef.current, (partial) => {
            if (!mountedRef.current) return;
            setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: partial } : m));
            flatListRef.current?.scrollToEnd({ animated: false });
          });
        }
      }
    } catch {
      addMsg('assistant', 'שגיאת חיבור — VerMillion עובד במצב דמו.');
    } finally {
      if (mountedRef.current) setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (phase === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>V</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiName}>VerMillion AI</Text>
          <Text style={[
            styles.aiStatus,
            aiOnline === null && { color: '#666' },
            aiOnline === true  && { color: '#4CAF50' },
            aiOnline === false && { color: '#F39C12' },
          ]}>
            {aiOnline === null ? '● מתחבר...' : aiOnline ? '● Online' : '● מצב דמו'}
          </Text>
        </View>
        {phase === 'onboarding' && (
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>יום {currentDay}/7</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(dayProgress.done / Math.max(dayProgress.total, 1)) * 100}%` }]} />
            </View>
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
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
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

// תגובות קצרות לאחר קבלת תשובה
function getAck(field, answer) {
  const n = typeof answer === 'number' ? answer : null;
  const acks = {
    age:              `${answer} — מבין.`,
    familyStatus:     `${answer} — נרשם.`,
    kids:             answer === 0 ? 'ללא ילדים — מבין.' : `${answer} ילדים — נרשם.`,
    employmentType:   `${answer} — ברור.`,
    netIncome:        n !== null ? `₪${n.toLocaleString('he-IL')} לחודש — רשמתי.` : 'רשמתי.',
    housingType:      `${answer} — מבין.`,
    housingCost:      n !== null ? `₪${n.toLocaleString('he-IL')} — רשמתי.` : 'רשמתי.',
    fixedExpenses:    n === 0 ? 'ללא הוצאות קבועות נוספות — מבין.' : 'רשמתי.',
    variableExpenses: n !== null ? `₪${n.toLocaleString('he-IL')} — מבין.` : 'רשמתי.',
    creditDebt:       n === 0 ? 'ללא חוב כרטיס — טוב.' : `₪${(n || 0).toLocaleString('he-IL')} — רשמתי.`,
    loans:            n === 0 ? 'ללא הלוואות — טוב.' : 'רשמתי.',
    overdraft:        n === 0 ? 'ללא מינוס — מצוין.' : `₪${(n || 0).toLocaleString('he-IL')} מינוס — רשמתי.`,
    savings:          n !== null ? `₪${n.toLocaleString('he-IL')} בצד — מבין.` : 'רשמתי.',
    assets:           'רשמתי.',
    moneyGoal:        'מטרה ברורה — רשמתי.',
    moneyFear:        'הבנתי. זה בדיוק מה שנעבוד עליו יחד.',
  };
  return acks[field] || 'רשמתי.';
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleContainerUser : styles.bubbleContainerBot]}>
      {!isUser && (
        <View style={styles.miniAvatar}>
          <Text style={styles.miniAvatarText}>V</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingTop: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
  },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FF4D4D',
  },
  aiAvatarText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  aiName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  aiStatus: { fontSize: 12, fontWeight: '500' },

  dayBadge: { alignItems: 'flex-end' },
  dayBadgeText: { color: '#C0392B', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  progressBar: { width: 60, height: 4, backgroundColor: '#222', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#C0392B', borderRadius: 2 },

  messages: { padding: 16, paddingBottom: 24 },
  bubbleContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  bubbleContainerUser: { justifyContent: 'flex-end' },
  bubbleContainerBot: { justifyContent: 'flex-start' },
  miniAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2,
  },
  miniAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  bubble: { maxWidth: '80%', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 14 },
  bubbleBot: { backgroundColor: '#1A1A1A', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#C0392B33' },
  bubbleUser: { backgroundColor: '#C0392B', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 24, textAlign: 'right' },
  bubbleTextBot: { color: '#E0E0E0' },
  bubbleTextUser: { color: '#FFF', fontWeight: '500' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    gap: 10, borderTopWidth: 1, borderTopColor: '#1A1A1A', backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1, backgroundColor: '#161616', borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    color: '#FFF', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#222',
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#222' },
  sendBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
});
