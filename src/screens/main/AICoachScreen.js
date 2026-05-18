import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useVoice } from '../../hooks/useVoice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatWithAI, getAIStatus } from '../../services/aiService';
import { askTeam } from '../../services/agents';
import {
  getOnboardingState, getFinancialData, isOnboardingComplete,
  getChatHistory, saveChatHistory, appendChatMessage, getGameSessions,
  getProfile, saveAiMemory, getVoiceUnlocked,
} from '../../services/storage';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, generateProfile, DAY_PLAN,
} from '../../services/onboardingAI';

const USE_AGENT_TEAM = true;
const nextId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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
  const [phase, setPhase] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [dayProgress, setDayProgress] = useState({ total: 0, done: 0, complete: false });
  const [pendingField, setPendingField] = useState(null);
  const [voiceMode, setVoiceMode]       = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const flatListRef = useRef(null);
  const mountedRef = useRef(true);
  const onboardingStateRef = useRef({});
  const lastVoiceRef = useRef(false);
  const voiceReadyRef = useRef(false);
  const sendRef = useRef(null);
  const voice = useVoice();

  // Voice mode animations
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mountedRef.current = true;
    init();
    getAIStatus().then(ok => { if (mountedRef.current) setAiOnline(ok); });
    return () => { mountedRef.current = false; };
  }, []);

  // Pulse when speaking
  useEffect(() => {
    if (!voiceMode) return;
    if (voice.isSpeaking) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim,   { toValue: 1.14, duration: 480, useNativeDriver: true }),
        Animated.timing(pulseAnim,   { toValue: 1.0,  duration: 480, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 380, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.2, duration: 380, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      glowOpacity.stopAnimation();
      Animated.spring(pulseAnim,   { toValue: 1, friction: 5, useNativeDriver: true }).start();
      Animated.timing(glowOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [voiceMode, voice.isSpeaking]);

  // Ripple rings when listening
  useEffect(() => {
    if (!voiceMode) return;
    if (voice.isListening) {
      const ripple = (anim, delay) => {
        anim.setValue(0);
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ])).start();
      };
      ripple(ring1, 0);
      ripple(ring2, 500);
      ripple(ring3, 1000);
    } else {
      [ring1, ring2, ring3].forEach(r => { r.stopAnimation(); r.setValue(0); });
    }
  }, [voiceMode, voice.isListening]);

  // Auto-listen loop: after AI stops speaking → listen again
  useEffect(() => {
    sendRef.current = send;
  });

  useEffect(() => {
    if (!voiceMode || !voiceReadyRef.current) return;
    if (!voice.isSpeaking && !loading && !voice.isListening) {
      const timer = setTimeout(() => {
        if (!mountedRef.current || !voiceMode) return;
        voice.startListening((transcript) => {
          if (!transcript?.trim()) return;
          lastVoiceRef.current = true;
          sendRef.current?.(transcript);
        });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [voiceMode, voice.isSpeaking, loading, voice.isListening]);

  async function init() {
    getVoiceUnlocked().then(u => { if (mountedRef.current) setVoiceEnabled(u); });
    const complete = await isOnboardingComplete();
    const state = await getOnboardingState();
    const financialData = await getFinancialData();
    const gameSessions = await getGameSessions();
    const profile = await getProfile().catch(() => null);
    onboardingStateRef.current = { dailyAnswers: state, financialData, gameSessions, profile };
    const day = getDayNumber(state.startDate);
    setCurrentDay(day);

    if (complete) {
      setPhase('coaching');
      const history = await getChatHistory();
      if (history.length > 0) {
        setMessages(history.slice(-40));
        const lastMsg = history[history.length - 1];
        const ts = parseInt((lastMsg.id || '').split('_')[1] || '0', 10);
        const hoursAgo = ts > 0 ? (Date.now() - ts) / 3600000 : 99;
        if (hoursAgo > 3) addMsg('assistant', 'ברוך שובך 👋 ממשיכים?');
      } else {
        addMsg('assistant', state.profileText
          ? `${state.profileText}\n\nמה תרצה לדון בו היום?`
          : 'שלום שוב! הפרופיל שלך מוכן. מה תרצה לשאול?');
      }
    } else {
      setPhase('onboarding');
      const progress = await getDayProgress(day);
      setDayProgress(progress);
      if (progress.complete) {
        addMsg('assistant', `יום ${day} הושלם ✅\n\nחזור מחר ליום ${day + 1}.`);
      } else {
        await askNextQuestion(day);
      }
    }
  }

  function addMsg(role, text) {
    const msg = { id: nextId(), role, text };
    setMessages(prev => [...prev, msg]);
    if (role === 'assistant' && voiceEnabled) voice.speak(text);
    return msg.id;
  }

  async function askNextQuestion(day) {
    const prompt = await getTodayOnboardingPrompt(day);
    if (!prompt) {
      await completeDay(day);
      const progress = await getDayProgress(day);
      setDayProgress(progress);
      if (day >= 7) {
        addMsg('assistant', 'רגע — מכין את האפיון שלך...');
        const { profileText } = await generateProfile();
        setMessages(prev => [...prev.slice(0, -1),
          { id: nextId(), role: 'assistant', text: `${profileText}\n\n✅ האפיון שלך מוכן.\n\nמה תרצה לעבוד עליו קודם?` }
        ]);
        setPhase('coaching');
      } else {
        addMsg('assistant', `יום ${day} הושלם ✅\n\nחזור מחר ליום ${day + 1}.`);
      }
      setPendingField(null);
      return;
    }
    const { field, question } = prompt;
    setPendingField(field);
    let text = question;
    if (day === 1 && !(await getDayProgress(day)).done) {
      text = `שלום! אני VerMillion — היועץ הפיננסי האישי שלך.\n\nבשבוע הקרוב נכיר אחד את השני. כל יום כמה שאלות קצרות, ובסוף השבוע יהיה לי אפיון מלא של המצב שלך.\n\n${question}`;
    }
    addMsg('assistant', text);
  }

  function enterVoiceMode() {
    voiceReadyRef.current = false;
    voice.stopSpeaking();
    setVoiceMode(true);
    if (!voice.supported) return;
    setTimeout(() => {
      if (!mountedRef.current) return;
      voiceReadyRef.current = true;
      voice.startListening((transcript) => {
        if (!transcript?.trim()) return;
        lastVoiceRef.current = true;
        sendRef.current?.(transcript);
      });
    }, 500);
  }

  function exitVoiceMode() {
    voice.stopListening();
    voice.stopSpeaking();
    voiceReadyRef.current = false;
    setVoiceMode(false);
  }

  async function extractAndSaveMemory(allMessages, profile) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const recent = allMessages
        .filter(m => m.text?.trim() && !m.text.startsWith('🔍') && !m.text.startsWith('🧠'))
        .slice(-8);
      const existingInsights = profile?.ai_memory?.insights || [];
      const res = await fetch(`${origin}/api/extract-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recent, existingInsights }),
      });
      if (!res.ok) return;
      const { insights } = await res.json();
      if (insights?.length > 0) {
        await saveAiMemory(insights);
        const updatedProfile = await getProfile().catch(() => null);
        if (updatedProfile) {
          onboardingStateRef.current = { ...onboardingStateRef.current, profile: updatedProfile };
        }
      }
    } catch { /* non-critical */ }
  }

  const send = async (text) => {
    if (!text.trim() || loading) return;
    voice.stopSpeaking();
    setInput('');
    setLoading(true);

    const userMsgId = addMsg('user', text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (phase === 'onboarding' && pendingField) {
        await processOnboardingAnswer(pendingField, text);
        const progress = await getDayProgress(currentDay);
        setDayProgress(progress);
        setPendingField(null);
        const ack = getAck(pendingField, text);
        addMsg('assistant', ack);
        await new Promise(r => setTimeout(r, 600));
        await askNextQuestion(currentDay);
      } else {
        appendChatMessage({ id: userMsgId, role: 'user', text }).catch(() => {});
        const partialId = nextId();
        setMessages(prev => [...prev, { id: partialId, role: 'assistant', text: '' }]);

        if (USE_AGENT_TEAM) {
          const recentHistory = messages.filter(m => m.text && !m.text.startsWith('🔍') && !m.text.startsWith('🧠') && !m.text.startsWith('✓') && !m.text.startsWith('✨')).slice(-8);
          const { response } = await askTeam(text, onboardingStateRef.current, (progress) => {
            if (!mountedRef.current) return;
            let stageText = '';
            if (progress.stage === 'routing')      stageText = '🔍 מנתב לסוכנים...';
            if (progress.stage === 'thinking')     stageText = `🧠 ${progress.agents?.length || ''} סוכנים חושבים...`;
            if (progress.stage === 'agent_done')   stageText = `✓ ${progress.agent} סיים`;
            if (progress.stage === 'synthesizing') stageText = '✨ מאחד תובנות...';
            setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: stageText } : m));
          }, recentHistory);
          if (mountedRef.current) {
            const finalText = response || 'לא הגיעה תשובה — נסה שוב.';
            setMessages(prev => {
              const updated = prev.map(m => m.id === partialId ? { ...m, text: finalText } : m);
              saveChatHistory(updated).catch(() => {});
              // Every 5 user messages — background memory extraction (non-blocking)
              const userCount = updated.filter(m => m.role === 'user').length;
              if (userCount > 0 && userCount % 5 === 0) {
                extractAndSaveMemory(updated, onboardingStateRef.current?.profile);
              }
              return updated;
            });
            appendChatMessage({ id: partialId, role: 'assistant', text: finalText }).catch(() => {});
            if (voiceEnabled) voice.speak(finalText);
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

  // ── Voice Mode Screen ──────────────────────────────────────────
  if (voiceMode && voiceEnabled) {
    const rings = [ring1, ring2, ring3].map(r => ({
      scale:   r.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }),
      opacity: r.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.55, 0.4, 0] }),
    }));

    const status = voice.isListening         ? 'מקשיב לך...'
                 : loading                   ? 'חושב...'
                 : voice.isSpeaking          ? 'מדבר...'
                 : !voice.supported          ? 'כתוב הודעה למטה לשוחח'
                 : '· · ·';

    return (
      <View style={vm.container}>
        {/* Exit */}
        <TouchableOpacity style={[vm.exit, { top: insets.top + 16 }]} onPress={exitVoiceMode}>
          <Text style={vm.exitText}>✕</Text>
        </TouchableOpacity>

        {/* Name */}
        <Text style={[vm.name, { marginTop: insets.top + 72 }]}>VerMillion AI</Text>

        {/* Avatar + rings + glow */}
        <View style={vm.avatarWrap}>
          {rings.map((r, i) => (
            <Animated.View key={i} style={[vm.ring, { transform: [{ scale: r.scale }], opacity: r.opacity }]} />
          ))}
          <Animated.View style={[vm.glow, { opacity: glowOpacity }]} />
          <Animated.View style={[vm.avatar, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={vm.avatarV}>V</Text>
          </Animated.View>
        </View>

        {/* Status */}
        <Text style={vm.status}>{status}</Text>

        {/* What AI is saying */}
        {voice.isSpeaking && (
          <Text style={vm.caption} numberOfLines={3}>{voice.speakingText}</Text>
        )}
      </View>
    );
  }

  // ── Loading Screen ─────────────────────────────────────────────
  if (phase === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  // ── Normal Chat Screen ─────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? 'height' : undefined}
      keyboardVerticalOffset={90}
    >
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
        {voiceEnabled && (
          <TouchableOpacity
            style={[styles.voiceModeBtn, !voice.ttsSupported && { opacity: 0.35 }]}
            onPress={() => {
              if (!voice.ttsSupported) {
                if (Platform.OS === 'web') window.alert('דפדפן זה אינו תומך בדיבור. נסה ב-Chrome או Brave.');
                return;
              }
              enterVoiceMode();
            }}
          >
            <Text style={styles.voiceModeBtnText}>🎙</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Bubble message={item} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

      {voiceEnabled && voice.isSpeaking && (
        <View style={styles.speakingBar}>
          <Text style={styles.speakingIcon}>🔊</Text>
          <Text style={styles.speakingText} numberOfLines={2}>{voice.speakingText}</Text>
          <TouchableOpacity onPress={voice.stopSpeaking} style={styles.speakingStop}>
            <Text style={styles.speakingStopText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <TextInput
          style={styles.input}
          placeholder="כתוב כאן..."
          placeholderTextColor="#444"
          value={input}
          onChangeText={setInput}
          multiline
          textAlign="right"
        />
        {voiceEnabled && (
          <TouchableOpacity style={styles.muteBtn} onPress={voice.toggleMute}>
            <Text style={styles.muteBtnText}>{voice.muted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => { lastVoiceRef.current = false; send(input); }}
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
  const t = typeof answer === 'string' ? answer.toLowerCase() : '';
  if (field === 'endOfMonthFeeling') {
    if (/עצבני|לחוץ|מתח|מפחד|חרד/.test(t)) return 'לחץ בסוף חודש — זה נפוץ, נעבוד על זה ביחד.';
    if (/שקט|בסדר|טוב|רגוע/.test(t)) return 'שקט — זה כוח. נבנה עליו.';
    if (/לא בודק|לא מסתכל|מתעלם/.test(t)) return 'לא בודק — כנות! זה נקודת פתיחה טובה.';
    return 'הבנתי — נשים על זה עין ביחד.';
  }
  if (field === 'moneyPersonality') {
    if (/חוסך|שומר|שמרן/.test(t)) return 'חוסך — בסיס טוב לבניית עתיד.';
    if (/מוציא|מבזבז|קונה/.test(t)) return 'נוטה להוציא — נבין מה מניע את זה.';
    if (/לא מסתכל|לא בודק|מתעלם/.test(t)) return 'לא מסתכל — כנות! נתחיל לבנות תמונה ברורה.';
    return 'הבנתי. נלמד ביחד מה קורה עם הכסף.';
  }
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
    biggestDream:     /לא יודע|לא חושב|מורכב|קשה לענות|אין לי|אין/.test(t) ? 'בסדר — גם חוסר ודאות זה מידע. נמשיך.' : 'חלום יפה. בואו נגרום לזה לקרות.',
    spouseIncome:     'רשמתי.',
    retirementSavings: n !== null ? `₪${n.toLocaleString('he-IL')} לפנסיה — רשמתי.` : 'רשמתי.',
  };
  return acks[field] || 'רשמתי.';
}

const STAGE_RE = /^[🔍🧠✓✨⏳]/;

function Bubble({ message }) {
  const isUser = message.role === 'user';
  const isStage = !isUser && STAGE_RE.test(message.text || '');
  const [displayed, setDisplayed] = useState(message.text || '');
  const timerRef = useRef(null);

  useEffect(() => {
    const text = message.text || '';
    if (isUser || isStage || !text) { setDisplayed(text); return; }
    clearInterval(timerRef.current);
    let i = 0;
    setDisplayed('');
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timerRef.current);
    }, 22);
    return () => clearInterval(timerRef.current);
  }, [message.text]);

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleContainerUser : styles.bubbleContainerBot]}>
      {!isUser && (
        <View style={styles.miniAvatar}>
          <Text style={styles.miniAvatarText}>V</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {displayed}
        </Text>
      </View>
    </View>
  );
}

// ── Voice Mode Styles ──────────────────────────────────────────────
const vm = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#050505',
    alignItems: 'center', justifyContent: 'center',
  },
  exit: {
    position: 'absolute', right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  exitText: { color: '#666', fontSize: 18, fontWeight: '700' },
  name: {
    position: 'absolute', top: 0,
    color: '#333', fontSize: 13, fontWeight: '700', letterSpacing: 3,
  },
  avatarWrap: {
    width: 130, height: 130,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
  },
  ring: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 1.5, borderColor: '#C0392B',
  },
  glow: {
    position: 'absolute',
    width: 155, height: 155, borderRadius: 77.5,
    backgroundColor: '#C0392B',
  },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#FF5544',
  },
  avatarV: { color: '#FFF', fontSize: 48, fontWeight: '900' },
  status: {
    color: '#555', fontSize: 14, letterSpacing: 2, fontWeight: '600',
    marginBottom: 24,
  },
  caption: {
    paddingHorizontal: 36, color: '#444',
    fontSize: 14, lineHeight: 22, textAlign: 'center',
  },
});

// ── Chat Styles ────────────────────────────────────────────────────
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

  voiceModeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#C0392B44',
    alignItems: 'center', justifyContent: 'center',
  },
  voiceModeBtnText: { fontSize: 20 },

  messages: { padding: 16, paddingBottom: 100 },
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
  muteBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  muteBtnText: { fontSize: 18 },
  speakingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#0F0F0F', borderTopWidth: 1, borderTopColor: '#1A1A1A',
  },
  speakingIcon: { fontSize: 16 },
  speakingText: { flex: 1, color: '#888', fontSize: 13, lineHeight: 18, textAlign: 'right' },
  speakingStop: { padding: 4 },
  speakingStopText: { color: '#444', fontSize: 16, fontWeight: '700' },
});
