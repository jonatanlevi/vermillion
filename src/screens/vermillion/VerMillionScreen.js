import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVoice } from '../../hooks/useVoice';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getOnboardingState, getFinancialData, isOnboardingComplete, appendChatMessage, getChatHistory, getCommitmentTime, getMsUntilCommitment, getGameLog, getGameSessions } from '../../services/storage';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, generateProfile, generateCoachingOpener,
} from '../../services/onboardingAI';
import { askTeam } from '../../services/agents';
import Avatar3D from '../../components/Avatar3D';
import { useAuth } from '../../context/AuthContext';
import { getUnlockedEquipment, getEffectiveOverrides } from '../../utils/registrationGate';
import { getDayScheduleView } from '../../utils/dayScheduleDisplay';

const DEV_BYPASS_TIMER = false;

const nextId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const QUESTIONS_PER_DAY = 3;

function getActiveDay(daysCompleted) {
  return Math.min((daysCompleted || []).length + 1, 7);
}

function formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

// ─── DNA Timer component ───────────────────────────────────────
function DNATimer({ day, insets, onGoGames, onUnlock, userId, avatarStyle, equipment, purchasedEquipment }) {
  const [commitment, setCommitment] = useState(null);
  const [msLeft, setMsLeft] = useState(0);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    getCommitmentTime().then(c => {
      setCommitment(c);
      setSchedule(getDayScheduleView(c));
      setMsLeft(getMsUntilCommitment(c));
    });
  }, []);
  const pulseAnims = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.4))).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const tick = setInterval(() => {
      const ms = getMsUntilCommitment(commitment);
      setMsLeft(ms);
      setSchedule(getDayScheduleView(commitment));
      if (ms <= 0) {
        clearInterval(tick);
        onUnlock?.();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [commitment]);

  useEffect(() => {
    // Staggered pulse on each DNA node
    const anims = pulseAnims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    return () => anims.forEach(a => a.stop());
  }, []);

  const { h, m, s } = formatCountdown(msLeft);
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <ScrollView style={dna.container} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40, alignItems: 'center' }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={dna.header}>
        <Avatar3D
          archetype={avatarStyle?.archetype || 'builder'}
          userId={userId}
          seed={avatarStyle?.seed}
          equipment={equipment || []}
          overrides={getEffectiveOverrides(avatarStyle?.overrides, purchasedEquipment)}
          size={44}
          showGlow={false}
          accentColor="#C0392B"
        />
        <View>
          <Text style={dna.title}>VerMillion</Text>
          <Text style={dna.sub}>יום {day}/7 הושלם ✅</Text>
        </View>
      </View>

      {/* DNA strand visual */}
      <View style={dna.strandWrap}>
        <Animated.View style={[dna.glow, { opacity: glowOpacity }]} />
        <View style={dna.strand}>
          {pulseAnims.map((anim, i) => (
            <View key={i} style={dna.node}>
              <Animated.View style={[dna.dotLeft,  { opacity: anim, transform: [{ scale: anim }] }]} />
              <View style={dna.bridge} />
              <Animated.View style={[dna.dotRight, {
                opacity: pulseAnims[(i + 3) % 7],
                transform: [{ scale: pulseAnims[(i + 3) % 7] }],
              }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Countdown — שעות לפי יום (שישי / שבת / חול) */}
      {schedule ? (
        <View style={dna.scheduleBox}>
          <Text style={dna.scheduleHeadline}>{schedule.headline}</Text>
          {schedule.windowLine ? (
            <Text style={dna.scheduleWindow}>{schedule.windowLine}</Text>
          ) : null}
          <Text style={dna.scheduleTarget}>{schedule.targetLine}</Text>
          <Text style={dna.scheduleNow}>{schedule.nowLine}</Text>
        </View>
      ) : null}
      <Text style={dna.label}>
        {schedule?.targetStr
          ? `${schedule.kindLabel} בשעה ${schedule.targetStr} — בעוד`
          : commitment
            ? `השאלות שלך בשעה ${String(commitment.hour).padStart(2,'0')}:${String(commitment.minute).padStart(2,'0')} — בעוד`
            : 'שאלות חדשות בעוד'}
      </Text>
      <View style={dna.clockRow}>
        <View style={dna.clockBlock}>
          <Text style={dna.clockNum}>{h}</Text>
          <Text style={dna.clockUnit}>שעות</Text>
        </View>
        <Text style={dna.clockSep}>:</Text>
        <View style={dna.clockBlock}>
          <Text style={dna.clockNum}>{m}</Text>
          <Text style={dna.clockUnit}>דקות</Text>
        </View>
        <Text style={dna.clockSep}>:</Text>
        <View style={dna.clockBlock}>
          <Text style={dna.clockNum}>{s}</Text>
          <Text style={dna.clockUnit}>שניות</Text>
        </View>
      </View>

      {/* Day progress */}
      <View style={dna.dayRow}>
        {[1,2,3,4,5,6,7].map(d => (
          <View key={d} style={[dna.dayDot, d <= day && dna.dayDotDone]}>
            <Text style={[dna.dayDotText, d <= day && dna.dayDotTextDone]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={dna.gamesBtn} onPress={onGoGames} activeOpacity={0.85}>
        <Text style={dna.gamesBtnText}>🎮 למשחקים</Text>
      </TouchableOpacity>

      <Text style={dna.note}>
        {day < 7
          ? `עוד ${7 - day} ימים לאפיון המלא שלך`
          : 'מחר VerMillion שלך יהיה מוכן לגמרי'}
      </Text>
    </ScrollView>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function VerMillionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [phase, setPhase]             = useState(null);
  const [dayDone, setDayDone]         = useState(false);
  const [currentDay, setCurrentDay]   = useState(1);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [pendingField, setPendingField]     = useState(null);
  const [avatarMood, setAvatarMood]   = useState('neutral');
  const [needsFirstGame, setNeedsFirstGame] = useState(false);
  const [showCrisisBar, setShowCrisisBar] = useState(false);
  const [quickTopics, setQuickTopics] = useState([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const vmPulse    = useRef(new Animated.Value(1)).current;
  const vmGlow     = useRef(new Animated.Value(0)).current;
  const vmRing1    = useRef(new Animated.Value(0)).current;
  const vmRing2    = useRef(new Animated.Value(0)).current;
  const vmRing3    = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const mountedRef  = useRef(true);
  const lastVoiceRef    = useRef(false);
  const voiceReadyRef   = useRef(false);
  const voiceModeRef    = useRef(false);
  const sendRef         = useRef(null);
  const lastSavedFieldRef    = useRef(null);
  const currentQuestionRef   = useRef('');
  const voice = useVoice();

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      setMessages([]);
      setPhase(null);
      setDayDone(false);
      setNeedsFirstGame(false);
      setPendingField(null);
      setQuestionsToday(0);
      setQuickTopics([]);
      init();
      startPulse();
      return () => { mountedRef.current = false; };
    }, [])
  );

  // Keep sendRef and voiceModeRef current
  useEffect(() => { sendRef.current = send; });
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // Voice mode — pulse/glow when speaking
  useEffect(() => {
    if (!voiceMode) return;
    if (voice.isSpeaking) {
      Animated.loop(Animated.sequence([
        Animated.timing(vmPulse, { toValue: 1.12, duration: 500, useNativeDriver: true }),
        Animated.timing(vmPulse, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(vmGlow, { toValue: 0.7, duration: 400, useNativeDriver: true }),
        Animated.timing(vmGlow, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ])).start();
    } else {
      vmPulse.stopAnimation();
      vmGlow.stopAnimation();
      Animated.spring(vmPulse, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      Animated.timing(vmGlow, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [voiceMode, voice.isSpeaking]);

  // Voice mode — ripple rings when listening
  useEffect(() => {
    if (!voiceMode) return;
    if (voice.isListening) {
      const ripple = (anim, delay) => Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ]));
      ripple(vmRing1, 0).start();
      ripple(vmRing2, 400).start();
      ripple(vmRing3, 800).start();
    } else {
      [vmRing1, vmRing2, vmRing3].forEach(r => { r.stopAnimation(); r.setValue(0); });
    }
  }, [voiceMode, voice.isListening]);

  // Voice mode — auto-listen after AI stops speaking
  useEffect(() => {
    if (!voiceMode || !voiceReadyRef.current) return;
    if (!voice.isSpeaking && !loading && !voice.isListening && voice.supported) {
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

  function enterVoiceMode() {
    voiceReadyRef.current = false;
    voice.stopSpeaking();
    setVoiceMode(true);

    // קרא בקול את השאלה האחרונה של VerMillion
    const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.text && !m.text.startsWith('✨'));
    if (lastBotMsg?.text) {
      setTimeout(() => {
        if (!mountedRef.current) return;
        voice.speak(lastBotMsg.text);
      }, 300);
    }

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

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function init() {
    let contentReady = false;
    const showFallback = () => {
      if (!mountedRef.current || contentReady) return;
      contentReady = true;
      setPhase('onboarding');
      addMsg('assistant', 'שלום! אני VerMillion — היועץ הפיננסי האישי שלך.\n\nיש לך ילדים? כמה?');
      setPendingField('kids');
    };
    const bailTimer = setTimeout(showFallback, 5000);
    const markReady = () => { contentReady = true; clearTimeout(bailTimer); };

    try {
      const complete    = await isOnboardingComplete();
      const state       = await getOnboardingState();
      const commitment  = await getCommitmentTime();
      if (!mountedRef.current) { markReady(); return; }

      if (complete) {
        markReady();
        setPhase('coaching');
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history.slice(-40));
          const lastMsg = history[history.length - 1];
          const ts = parseInt((lastMsg.id || '').split('_')[1] || '0', 10);
          const hoursAgo = ts > 0 ? (Date.now() - ts) / 3600000 : 99;
          if (hoursAgo > 3) {
            const lastUser = [...history].reverse().find(m => m.role === 'user');
            const preview = lastUser ? `"${lastUser.text.slice(0, 45)}..."` : '';
            addMsg('assistant', `ברוך שובך 👋${preview ? `\nבפעם האחרונה: ${preview}` : ''}\n\nממשיכים? או רוצה לפתוח נושא חדש?`);
          }
        } else {
          const profile = state.profile || state;
          const { opener, topics } = generateCoachingOpener(profile);
          addMsg('assistant', opener);
          if (mountedRef.current) setQuickTopics(topics);
        }
        return;
      }

      if (!commitment) {
        // ── שלב 1: כניסה ראשונה — VerMillion קודם, משחק+טיימר בלחיצת CTA.
        setCurrentDay(1);
        const progress = await getDayProgress(1);
        if (!mountedRef.current) { markReady(); return; }
        setQuestionsToday(progress.done);
        markReady();
        setPhase('onboarding');
        if (progress.done === 0) {
          setNeedsFirstGame(true);
        } else if (progress.complete) {
          navigation.navigate('Games');
        } else {
          await askNextOnboardingQuestion(1, progress.done);
        }
      } else {
        // ── שלב 2: commitment נקבע — מחזור יומי רגיל ─────────
        const day = getActiveDay(state.daysCompleted);
        setCurrentDay(day);
        const progress = await getDayProgress(day);
        if (!mountedRef.current) { markReady(); return; }
        setQuestionsToday(progress.done);

        const todayLog = await getGameLog();
        if (!mountedRef.current) { markReady(); return; }

        const calDay   = new Date().getDate();
        const todayEntry = todayLog[calDay];
        const stampedToday = !!todayEntry &&
          new Date(todayEntry.stampedAt).toDateString() === new Date().toDateString();

        markReady();
        setPhase('onboarding');

        if (!DEV_BYPASS_TIMER && stampedToday && progress.complete) {
          setDayDone(true);
          return;
        }

        if (progress.complete) {
          if (day < 7) {
            navigation.navigate('Games');
          } else {
            setDayDone(true);
          }
        } else if (day > 1) {
          const now  = new Date();
          const gate = new Date(now);
          gate.setHours(commitment.hour, commitment.minute, 0, 0);
          if (!DEV_BYPASS_TIMER && now < gate && !stampedToday) {
            setDayDone(true);
          } else {
            if (DEV_BYPASS_TIMER || todayLog[calDay]) {
              await askNextOnboardingQuestion(day, progress.done);
            } else {
              if (!mountedRef.current) return;
              navigation.navigate('Games');
            }
          }
        } else {
          await askNextOnboardingQuestion(day, progress.done);
        }
      }
    } catch (e) {
      showFallback();
      console.error('[VM] init failed:', e?.message || e);
    }
  }

  function addMsg(role, text) {
    const id = nextId();
    if (role !== 'assistant') {
      setMessages(prev => [...prev, { id, role, text }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return id;
    }

    // Thinking delay then typewriter
    const thinkDelay = text.length < 50 ? 600 : text.length < 150 ? 700 : 800;
    const charDelay  = text.length < 50 ? 28  : text.length < 150 ? 18  : 10;

    setMessages(prev => [...prev, { id, role, text: '…' }]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(() => {
      if (!mountedRef.current) return;
      let i = 0;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, text: '' } : m));
      const iv = setInterval(() => {
        if (!mountedRef.current) { clearInterval(iv); return; }
        i++;
        setMessages(prev => prev.map(m => m.id === id ? { ...m, text: text.slice(0, i) } : m));
        flatListRef.current?.scrollToEnd({ animated: false });
        if (i >= text.length) {
          clearInterval(iv);
          if (voiceModeRef.current) voice.speak(text);
        }
      }, charDelay);
    }, thinkDelay);

    return id;
  }

  const DAY_INTROS = {
    2: 'יום 2 — היום נסתכל על הדיור וההוצאות הקבועות שלך.\n\n',
    3: 'יום 3 — היום נבין את ההוצאות המשתנות והחובות.\n\n',
    4: 'יום 4 — היום נצלול לחובות ולחיסכון שלך.\n\n',
    5: 'יום 5 — היום נגיע לנכסים ולמטרות שלך.\n\n',
    6: 'יום 6 — היום נבין את המנטליות הפיננסית שלך — החלק הכי מעניין.\n\n',
    7: 'יום 7 — יום אחרון לפני שהאפיון המלא שלך מוכן. כמעט שם.\n\n',
  };

  const DAY_COMPLETIONS = {
    1: 'יום 1 ✅\n\nלמדתי על המשפחה וההכנסה שלך — בסיס טוב.\n\nמחר נמשיך לדיור וההוצאות. כל יום מוסיף שכבה לתמונה.',
    2: 'יום 2 ✅\n\nעכשיו יש לי תמונה על הדיור וההוצאות שלך.\n\nמחר נגיע לחובות — זה בדרך כלל הנושא הכי מפתיע.',
    3: 'יום 3 ✅ — חצי דרך!\n\nיש לי כבר תמונה על ההוצאות והחובות שלך.\n\nמחר נצלול לחיסכון ולנכסים.',
    4: 'יום 4 ✅\n\nמצוין. עכשיו יש לי תמונה ברורה על החובות והחיסכון.\n\nמחר נגיע למטרות — מה אתה רוצה להשיג.',
    5: 'יום 5 ✅\n\nיש לי כבר פרופיל פיננסי עשיר עליך.\n\nמחר נדבר על מה שמניע אותך — הלב של הייעוץ.',
    6: 'יום 6 ✅\n\nיום נהדר! יש לי כמעט תמונה שלמה.\n\nמחר — יום אחרון. אחריו האפיון המלא שלך מוכן.',
  };

  async function askNextOnboardingQuestion(day, doneCount) {
    const prompt = await getTodayOnboardingPrompt(day);

    if (!prompt) {
      await completeDay(day);
      if (!mountedRef.current) return;
      setQuestionsToday(QUESTIONS_PER_DAY);

      if (day >= 7) {
        setAvatarMood('excited');
        addMsg('assistant', '⏳ רגע אחד — מכין את האפיון האישי שלך...');
        setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            const { profileText } = await generateProfile();
            setMessages(prev => [
              ...prev.slice(0, -1),
              { id: nextId(), role: 'assistant', text: `${profileText}\n\n✅ VerMillion שלך מוכן לגמרי.\nמעכשיו יש לך יועץ פיננסי אישי — שלך בלבד.` },
            ]);
          } catch {
            setMessages(prev => [
              ...prev.slice(0, -1),
              { id: nextId(), role: 'assistant', text: '✅ האפיון שלך מוכן!\n\nVerMillion ילמד אותך טוב יותר מיום ליום. אנחנו מתחילים.' },
            ]);
          }
          setPhase('coaching');
        }, 1500);
      } else {
        setAvatarMood('happy');
        addMsg('assistant', DAY_COMPLETIONS[day] || `יום ${day} ✅\n\nעובר אותך למשחקים...`);
        setTimeout(() => {
          if (!mountedRef.current) return;
          navigation.navigate('Games');
        }, 2200);
      }
      setPendingField(null);
      return;
    }

    const { field, question } = prompt;
    setPendingField(field);
    currentQuestionRef.current = question;
    setAvatarMood('asking');

    let text = question;
    if (day === 1 && doneCount === 0) {
      const firstName = profile?.first_name || profile?.name?.split(' ')[0] || '';
      const greeting = firstName ? `שלום ${firstName}! 👋` : 'שלום! 👋';
      text = `${greeting}\n\nאני VerMillion — היועץ הפיננסי האישי שלך.\n\nאנחנו יוצאים למסע של שבוע — 3 שאלות ביום. בסוף השבוע יהיה לי פרופיל פיננסי מלא עליך, ותקבל יועץ שמכיר אותך באמת.\n\nנתחיל?\n\n${question}`;
    } else if (doneCount === 0 && day > 1 && DAY_INTROS[day]) {
      text = `${DAY_INTROS[day]}${question}`;
    }

    addMsg('assistant', text);
  }

  const sendVoice = () => {
    if (voice.isListening) { voice.stopListening(); return; }
    voice.stopSpeaking();
    voice.startListening((transcript) => {
      setInput(transcript);
      lastVoiceRef.current = true;
      setTimeout(() => send(transcript), 700);
    });
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    voice.stopSpeaking();
    setInput('');
    setQuickTopics([]);
    setLoading(true);
    setAvatarMood('thinking');
    const userMsgId = addMsg('user', text);

    try {
      if (phase === 'onboarding' && pendingField) {
        // ── בלבול: חזור על השאלה ─────────────────────────────
        const CONFUSION_RE = /לא שמעתי|לא הבנתי|מה אמרת|תחזור|מה\?|סליחה\?|תגיד שוב|לא ברור|מה הכוונה|לא קלטתי/i;
        if (CONFUSION_RE.test(text)) {
          setLoading(false);
          const q = currentQuestionRef.current || 'נסה שוב — אני מקשיב.';
          const repeatMsg = `אחזור:\n\n${q}`;
          addMsg('assistant', repeatMsg);
          if (voiceModeRef.current) voice.speak(repeatMsg);
          return;
        }

        // ── תיקון: משתמש מתקן תשובה קודמת ──────────────────
        const CORRECTION_RE = /^(?:לא[,!\s]|לא נכון|לא זה|לא כך|רגע[,!\s]|תיקון|טעיתי|שגיתי|אני מתקן)/i;
        if (CORRECTION_RE.test(text) && lastSavedFieldRef.current) {
          const correctedText = text.replace(CORRECTION_RE, '').trim();
          if (correctedText.length > 1) {
            setLoading(false);
            const correctedValue = await processOnboardingAnswer(lastSavedFieldRef.current, correctedText);
            const ackMsg = `תוקן — ${getAck(lastSavedFieldRef.current, correctedValue)}`;
            addMsg('assistant', ackMsg);
            if (voiceModeRef.current) voice.speak(ackMsg);
            return;
          }
        }

        // ── ולידציה: שדות מספריים חייבים מספר ───────────────
        const NUMERIC_FIELDS = new Set(['netIncome','housingCost','fixedExpenses','variableExpenses',
          'creditDebt','loans','overdraft','savings','assets','spouseIncome','retirementSavings','kids']);
        const ZERO_WORDS = /^(אין|לא\b|אפס|כלום|שום|0|null|none|לא יודע|לא בטוח)/i;
        if (NUMERIC_FIELDS.has(pendingField) && !ZERO_WORDS.test(text.trim()) && !/\d/.test(text) && !/אלף|מאה|מיליון|אלפיים|אחד|שניים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר/.test(text)) {
          setLoading(false);
          const retryMsg = `לא קלטתי מספר. ${currentQuestionRef.current}`;
          addMsg('assistant', retryMsg);
          if (voiceModeRef.current) voice.speak(retryMsg);
          return;
        }

        const parsedValue = await processOnboardingAnswer(pendingField, text);
        lastSavedFieldRef.current = pendingField;
        const newCount = questionsToday + 1;
        setQuestionsToday(newCount);
        setPendingField(null);

        const ack = getAck(pendingField, parsedValue);
        await new Promise(r => setTimeout(r, 300));
        addMsg('assistant', ack);
        await new Promise(r => setTimeout(r, 600));
        await askNextOnboardingQuestion(currentDay, newCount);

      } else if (phase === 'coaching') {
        appendChatMessage({ id: userMsgId, role: 'user', text }).catch(() => {});
        const partialId = nextId();
        setMessages(prev => [...prev, { id: partialId, role: 'assistant', text: '...' }]);

        const [onbState, financialData, gameSessions] = await Promise.all([getOnboardingState(), getFinancialData(), getGameSessions()]);
        const recentHistory = messages.filter(m => m.role !== undefined && m.text && !m.text.startsWith('✨')).slice(-8);

        let streamStarted = false;
        const { response, isCrisis } = await askTeam(
          text,
          { dailyAnswers: onbState, financialData, gameSessions },
          null,
          recentHistory,
          (fullTextSoFar) => {
            if (!mountedRef.current) return;
            if (!streamStarted) { streamStarted = true; setLoading(false); }
            setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: fullTextSoFar, streaming: true } : m));
          },
        );

        const finalText = response || 'לא קיבלתי תשובה. נסה שוב.';
        if (mountedRef.current) {
          setMessages(prev => prev.map(m => m.id === partialId ? { ...m, text: finalText, streaming: false } : m));
          appendChatMessage({ id: partialId, role: 'assistant', text: finalText }).catch(() => {});
          if (isCrisis) setShowCrisisBar(true);
          if (voiceModeRef.current) voice.speak(finalText);
        }
        setAvatarMood('neutral');
      }
    } catch (err) {
      console.error('[VerMillion] send failed:', err);
      addMsg('assistant', 'לא הצלחתי להתחבר. נסה שוב.');
      setAvatarMood('neutral');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const moodColors = {
    neutral:  '#C0392B',
    asking:   '#E67E22',
    thinking: '#8E44AD',
    happy:    '#27AE60',
    excited:  '#D4AF37',
  };

  if (phase === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  // ── Voice Mode ─────────────────────────────────────────────────
  if (voiceMode) {
    const moodColor = moodColors[avatarMood] || '#C0392B';
    const rings = [vmRing1, vmRing2, vmRing3].map(r => ({
      scale:   r.interpolate({ inputRange: [0, 1], outputRange: [1, 3.0] }),
      opacity: r.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.5, 0.35, 0] }),
    }));
    const status = voice.isListening ? 'מקשיב...'
                 : loading           ? 'חושב...'
                 : voice.isSpeaking  ? 'מדבר...'
                 : !voice.supported  ? 'כתוב הודעה למטה'
                 : '· · ·';
    return (
      <KeyboardAvoidingView
        style={vm.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Exit */}
        <TouchableOpacity style={[vm.exit, { top: insets.top + 16 }]} onPress={exitVoiceMode}>
          <Text style={vm.exitText}>✕</Text>
        </TouchableOpacity>

        {/* Avatar stage */}
        <View style={vm.avatarStage}>
          {rings.map((r, i) => (
            <Animated.View key={i} style={[vm.ring, { borderColor: moodColor, transform: [{ scale: r.scale }], opacity: r.opacity }]} />
          ))}
          <Animated.View style={[vm.glow, { backgroundColor: moodColor, opacity: vmGlow }]} />
          <Animated.View style={{ transform: [{ scale: vmPulse }] }}>
            <Avatar3D
              archetype={profile?.avatar_style?.archetype || 'builder'}
              userId={user?.id}
              seed={profile?.avatar_style?.seed}
              equipment={getUnlockedEquipment(profile?.v_coins)}
              overrides={getEffectiveOverrides(profile?.avatar_style?.overrides, profile?.equipment)}
              size={200}
              showGlow={true}
              accentColor={moodColor}
            />
          </Animated.View>
        </View>

        {/* Status */}
        <Text style={vm.status}>{status}</Text>

        {/* Caption when speaking */}
        {voice.isSpeaking && (
          <Text style={vm.caption} numberOfLines={3}>{voice.speakingText}</Text>
        )}

        {/* Input row (for TTS-only mode) */}
        <View style={[vm.inputRow, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <TextInput
            style={vm.input}
            placeholder="כתוב כאן..."
            placeholderTextColor="#333"
            value={input}
            onChangeText={setInput}
            multiline
            textAlign="right"
          />
          <TouchableOpacity
            style={[vm.sendBtn, (!input.trim() || loading) && vm.sendBtnDisabled]}
            onPress={() => { lastVoiceRef.current = false; send(input); }}
            disabled={!input.trim() || loading}
          >
            <Text style={vm.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Show DNA timer when today's questions are done
  if (phase === 'onboarding' && dayDone) {
    return (
      <DNATimer
        day={currentDay}
        insets={insets}
        onGoGames={() => navigation.navigate('Games')}
        onUnlock={() => navigation.navigate('Games')}
        userId={user?.id}
        avatarStyle={profile?.avatar_style}
        equipment={getUnlockedEquipment(profile?.v_coins)}
        purchasedEquipment={profile?.equipment || []}
      />
    );
  }

  // First-run gate: show VerMillion screen with explicit CTA to Games.
  if (phase === 'onboarding' && needsFirstGame) {
    return (
      <View style={styles.firstGameGate}>
        <Text style={styles.firstGameTitle}>VerMillion מוכן להתחיל איתך</Text>
        <Text style={styles.firstGameSub}>
          לפני השאלות היומיות נקבע את שעת המחויבות שלך דרך משחק קצר.
        </Text>
        <TouchableOpacity
          style={styles.firstGameBtn}
          onPress={() => {
            setNeedsFirstGame(false);
            navigation.navigate('Games');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.firstGameBtnText}>🎮 המשך למשחק וטיימר</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? 'height' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ── CHARACTER STAGE ── */}
      <View style={[styles.characterStage, { paddingTop: insets.top + 4 }]}>
        <Animated.View style={[styles.characterWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.characterGlow, { shadowColor: moodColors[avatarMood] }]} />
          <Avatar3D
            archetype={profile?.avatar_style?.archetype || 'builder'}
            userId={user?.id}
            seed={profile?.avatar_style?.seed}
            equipment={getUnlockedEquipment(profile?.v_coins)}
            overrides={getEffectiveOverrides(profile?.avatar_style?.overrides, profile?.equipment)}
            size={120}
            showGlow={true}
            accentColor={moodColors[avatarMood]}
          />
        </Animated.View>

        <View style={styles.characterInfo}>
          <Text style={[styles.avatarName, { color: moodColors[avatarMood] }]}>VerMillion</Text>
          {phase === 'onboarding' ? (
            <View style={styles.progressDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, i < questionsToday && styles.dotDone]} />
              ))}
            </View>
          ) : (
            <Text style={styles.avatarSub}>● היועץ האישי שלך</Text>
          )}
        </View>
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

      {showCrisisBar && (
        <TouchableOpacity
          style={styles.crisisBar}
          onPress={() => setShowCrisisBar(false)}
          activeOpacity={0.85}
        >
          <Text style={styles.crisisBarText}>🆘 פעמונים — סיוע מיידי: 1-800-355-350</Text>
          <Text style={styles.crisisBarSub}>לחץ לסגירה</Text>
        </TouchableOpacity>
      )}

      {quickTopics.length > 0 && (
        <View style={styles.quickRepliesRow}>
          {quickTopics.map(t => (
            <TouchableOpacity
              key={t}
              style={styles.quickReplyBtn}
              onPress={() => send(t)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickReplyText}>{t}</Text>
            </TouchableOpacity>
          ))}
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
        <TouchableOpacity
          style={styles.voiceModeBtn}
          onPress={enterVoiceMode}
        >
          <Text style={styles.micBtnText}>🎙</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: moodColors[avatarMood] }, (!input.trim() || loading) && styles.sendBtnDisabled]}
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
  const fmt = x => `₪${Number(x).toLocaleString('he-IL')}`;

  if (field === 'kids') {
    if (answer === 0) return 'ללא ילדים תלויים — פותח גמישות רבה יותר בתכנון. 👍';
    const num = typeof answer === 'number' ? answer : parseInt(answer) || answer;
    return `${num} ילד${num > 1 ? 'ים' : ''} — מציין. נתחשב בזה בכל ההמלצות שניתן.`;
  }

  if (field === 'netIncome') {
    if (!n) return 'קיבלתי — זה הבסיס שנעבוד ממנו.';
    return `${fmt(n)} נטו — הבסיס שנעבוד ממנו. נראה כמה מזה נשאר בסוף החודש.`;
  }

  if (field === 'incomeStability') {
    if (/קבוע|קבועה/.test(t)) return 'הכנסה קבועה — יתרון גדול לתכנון. יאפשר לנו לבנות לוח זמנים מדויק.';
    return 'הכנסה משתנה — מורכב יותר, אבל יש אסטרטגיות מותאמות. נבנה אותן ביחד.';
  }

  if (field === 'housingType') {
    if (/שכיר|שכירות|שוכר/.test(t)) return 'שכירות — אחת ההוצאות הגדולות. נסתכל כמה מהכנסה היא לוקחת.';
    if (/משכנתא|בבעלות/.test(t)) return 'משכנתא — גם נכס וגם התחייבות חודשית. נסתכל על הפרמטרים.';
    if (/הורים|אמא|אבא/.test(t)) return 'אצל הורים — חוסך בהוצאות דיור, פוטנציאל גדול לצבירה מהירה.';
    return 'הבנתי — רשמתי את סוג הדיור שלך.';
  }

  if (field === 'housingCost') {
    if (!n || n === 0) return 'ללא עלות דיור — יתרון ממשי, עוד כסף להכניס לעבודה.';
    return `${fmt(n)} על דיור — רשמתי. אחת ההוצאות המרכזיות, נסתכל עליה בהקשר.`;
  }

  if (field === 'fixedExpenses') {
    if (n === 0) return 'ללא הוצאות קבועות נוספות — מצוין, עומס מינימלי על התקציב.';
    return n ? `${fmt(n)} בהוצאות קבועות — כל שקל כאן חשוב, רשמתי.` : 'הבנתי — רשמתי.';
  }

  if (field === 'variableExpenses') {
    return n ? `${fmt(n)} משתנות — כאן לרוב יש הכי הרבה מרחב לשיפור. רשמתי.` : 'הבנתי — רשמתי.';
  }

  if (field === 'biggestExpense') {
    return 'מעניין — זה מגלה הרבה על סדרי העדיפויות שלך. רשמתי.';
  }

  if (field === 'creditDebt') {
    if (n === 0) return 'ללא חוב בכרטיס — מצוין. אחד הדברים הכי בריאים שאפשר לראות.';
    return `${fmt(n)} בכרטיס — אשראי הוא לרוב היקר ביותר. נדע לטפל בו נכון.`;
  }

  if (field === 'loans') {
    if (n === 0) return 'ללא הלוואות — מצוין, פחות עומס חודשי.';
    return n ? `${fmt(n)} בהלוואות — הבנתי. נבנה יחד תכנית פירעון הגיונית.` : 'הבנתי — רשמתי.';
  }

  if (field === 'overdraft') {
    if (n === 0) return 'ללא מינוס — בסיס בריא מאוד. 👍';
    return `${fmt(n)} מינוס — נפוץ בישראל. זה יהיה מהראשונים שנייצב.`;
  }

  if (field === 'savings') {
    if (!n || n === 0) return 'ללא חיסכון נזיל עדיין — נבנה קרן חירום כנקודת פתיחה ראשונה.';
    return `${fmt(n)} בצד — טוב! נראה אם זה מספיק לפי הצרכים שלך.`;
  }

  if (field === 'assets') {
    return 'רשמתי את הנכסים — חשוב לתמונה הכוללת של העושר שלך.';
  }

  if (field === 'moneyGoal') {
    return 'מטרה ברורה — זה הכיוון שלנו. כל ההמלצות שלי יחתרו לקראתו.';
  }

  if (field === 'moneyFear') {
    return 'הבנתי — זה בדיוק מה שנטפל בו. לא לבד בזה.';
  }

  if (field === 'endOfMonthFeeling') {
    if (/עצבני|לחוץ|מתח|מפחד|חרד/.test(t)) return 'לחץ בסוף חודש — זה נפוץ יותר ממה שחושבים. בדיוק בשביל זה אני פה.';
    if (/שקט|בסדר|טוב|רגוע/.test(t)) return 'שקט פיננסי — זה כוח אמיתי. נשמר ונגדיל אותו.';
    if (/לא בודק|לא מסתכל|מתעלם/.test(t)) return 'לא בודק — כנות שמחייבת. נתחיל לבנות תמונה ברורה ביחד.';
    return 'הבנתי. תחושות כסף הן מידע חשוב — נשים על זה עין.';
  }

  if (field === 'moneyPersonality') {
    if (/חוסך|שומר|שמרן/.test(t)) return 'חוסך — בסיס מצוין. נגרום לחיסכון לעבוד קשה יותר בשבילך.';
    if (/מוציא|מבזבז|קונה/.test(t)) return 'נוטה להוציא — בסדר. נבין מה מניע את זה ונמצא איזון.';
    if (/לא מסתכל|לא בודק|מתעלם/.test(t)) return 'לא מסתכל — זה ישתנה. עד סוף השבוע תהיה לך תמונה ברורה.';
    return 'הבנתי. נלמד ביחד מה מאפיין אותך עם כסף.';
  }

  if (field === 'biggestDream') {
    if (/לא יודע|לא חושב|מורכב|קשה לענות|אין לי|אין/.test(t))
      return 'חוסר ודאות הוא גם מידע — יבוא הזמן שנגלה ביחד מה אתה רוצה.';
    return 'חלום יפה. בואו נגרום לבסיס הכלכלי לתמוך בו.';
  }

  if (field === 'spouseIncome') {
    if (n === 0) return 'ללא הכנסה נוספת בבית כרגע — עובדים עם מה שיש, ויש מה לעשות.';
    return n ? `${fmt(n)} נוספים — הכנסה משולבת משנה את החישוב. רשמתי.` : 'הבנתי — רשמתי.';
  }

  if (field === 'retirementSavings') {
    if (n === 0) return 'ללא הפקדות פנסיוניות כרגע — נקודה חשובה שנטפל בה.';
    return `${fmt(n)} בחודש לפנסיה — מצוין. נבין אם זה מספיק לפי גילך ומטרותיך.`;
  }

  return 'הבנתי — רשמתי.';
}

const STAGE_RE = /^[🔍🧠✓✨⏳]/;

function Bubble({ message }) {
  const isUser = message.role === 'user';
  const isStage = !isUser && STAGE_RE.test(message.text || '');
  const [displayed, setDisplayed] = useState(message.text || '');
  const timerRef = useRef(null);

  useEffect(() => {
    const text = message.text || '';
    // streaming: text already arrives token-by-token — show as-is
    if (isUser || isStage || !text || message.streaming) {
      clearInterval(timerRef.current);
      setDisplayed(text);
      return;
    }
    clearInterval(timerRef.current);
    let i = 0;
    setDisplayed('');
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timerRef.current);
    }, 22);
    return () => clearInterval(timerRef.current);
  }, [message.text, message.streaming]);

  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot]}>
      {!isUser && <View style={styles.miniAvatar} />}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textBot]}>
          {displayed}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0A0A0A' },
  loadingScreen: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  firstGameGate: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  firstGameTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  firstGameSub: {
    color: '#777',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  firstGameBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 26,
    width: '100%',
    alignItems: 'center',
  },
  firstGameBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  characterStage: {
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
  },
  characterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterGlow: {
    position: 'absolute',
    width: 160,
    height: 60,
    bottom: 0,
    borderRadius: 80,
    backgroundColor: 'transparent',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  characterInfo: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  avatarName: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  avatarSub:  { color: '#4CAF50', fontSize: 12, marginTop: 2 },

  progressDots: { flexDirection: 'row', gap: 6 },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  dotDone: { backgroundColor: '#C0392B', borderColor: '#C0392B' },

  messages:       { padding: 16, paddingBottom: 24 },
  bubbleWrap:     { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapBot:  { justifyContent: 'flex-start' },
  miniAvatar:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C0392B', marginRight: 10, marginBottom: 6 },
  bubble:    { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleBot: { backgroundColor: '#161616', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1E1414' },
  bubbleUser:{ backgroundColor: '#C0392B', borderBottomRightRadius: 4 },
  bubbleText:{ fontSize: 15, lineHeight: 24, textAlign: 'right' },
  textBot:   { color: '#E0E0E0' },
  textUser:  { color: '#FFF', fontWeight: '500' },

  quickRepliesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#0A0A0A',
  },
  quickReplyBtn: {
    backgroundColor: '#1A0A0A', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: '#C0392B44',
  },
  quickReplyText: { color: '#C0392B', fontSize: 13, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12,
    borderTopWidth: 1, borderTopColor: '#1A1A1A', backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1, backgroundColor: '#161616', borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    color: '#FFF', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#222',
  },
  sendBtn:        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#222' },
  sendBtnText:    { color: '#FFF', fontSize: 22, fontWeight: '700' },
  voiceModeBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A0808',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#C0392B55',
  },
  micBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  micBtnActive: { backgroundColor: '#7B0000', borderColor: '#C0392B' },
  micBtnText: { fontSize: 20 },
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

  crisisBar: {
    backgroundColor: '#7B0000',
    paddingVertical: 12, paddingHorizontal: 20,
    borderTopWidth: 1, borderTopColor: '#C0392B',
    alignItems: 'center',
  },
  crisisBarText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  crisisBarSub:  { color: '#FF9999', fontSize: 11, marginTop: 2 },
});

// ─── Voice Mode styles ────────────────────────────────────────
const vm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', alignItems: 'center' },
  exit: {
    position: 'absolute', right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  exitText: { color: '#666', fontSize: 18, fontWeight: '700' },
  avatarStage: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    opacity: 0,
  },
  status: {
    color: '#555', fontSize: 14, letterSpacing: 2, fontWeight: '600',
    marginBottom: 8,
  },
  caption: {
    paddingHorizontal: 36, color: '#444',
    fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, width: '100%',
    borderTopWidth: 1, borderTopColor: '#111', backgroundColor: '#050505',
  },
  input: {
    flex: 1, backgroundColor: '#0F0F0F', borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    color: '#FFF', fontSize: 15, maxHeight: 100,
    borderWidth: 1, borderColor: '#1A1A1A',
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#222' },
  sendBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
});

// ─── DNA Timer styles ──────────────────────────────────────────
const dna = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 32, alignSelf: 'flex-start',
  },
  avatarRing: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    borderColor: '#C0392B', alignItems: 'center', justifyContent: 'center',
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  title:      { color: '#FFF', fontSize: 17, fontWeight: '800' },
  sub:        { color: '#C0392B', fontSize: 12, marginTop: 2 },

  strandWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 28, position: 'relative' },
  glow: {
    position: 'absolute',
    width: 120, height: 240,
    backgroundColor: '#C0392B',
    borderRadius: 60,
  },
  strand:  { gap: 10, alignItems: 'center' },
  node:    { flexDirection: 'row', alignItems: 'center', gap: 0 },
  dotLeft: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#C0392B' },
  bridge:  { width: 64, height: 2, backgroundColor: '#2A2A2A' },
  dotRight:{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#E67E22' },

  scheduleBox:      { width: '100%', alignItems: 'flex-end', marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#222' },
  scheduleHeadline: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  scheduleWindow:   { color: '#D4AF37', fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  scheduleTarget: { color: '#AAA', fontSize: 12, textAlign: 'right', marginBottom: 2 },
  scheduleNow:    { color: '#666', fontSize: 11, textAlign: 'right' },

  label: { color: '#555', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  clockRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 },
  clockBlock:{ alignItems: 'center' },
  clockNum:  { color: '#FFF', fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] },
  clockUnit: { color: '#444', fontSize: 11, marginTop: 2 },
  clockSep:  { color: '#333', fontSize: 36, fontWeight: '900', marginBottom: 14 },

  dayRow:       { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dayDot:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
  dayDotDone:   { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  dayDotText:   { color: '#333', fontSize: 13, fontWeight: '700' },
  dayDotTextDone:{ color: '#FFF' },

  gamesBtn:     { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 16, width: '100%', alignItems: 'center' },
  gamesBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  note: { color: '#333', fontSize: 13, textAlign: 'center' },
});

