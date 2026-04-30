import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getOnboardingState, isOnboardingComplete, appendChatMessage, getChatHistory, getCommitmentTime, getMsUntilCommitment, getGameLog } from '../../services/storage';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, generateProfile,
} from '../../services/onboardingAI';
import { askTeam } from '../../services/agents';

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
function DNATimer({ day, insets, onGoGames, onUnlock }) {
  const [commitment, setCommitment] = useState(null);
  const [msLeft, setMsLeft] = useState(0);

  useEffect(() => {
    getCommitmentTime().then(c => {
      setCommitment(c);
      setMsLeft(getMsUntilCommitment(c));
    });
  }, []);
  const pulseAnims = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.4))).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const tick = setInterval(() => {
      const ms = getMsUntilCommitment(commitment);
      setMsLeft(ms);
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
    <View style={[dna.container, { paddingTop: insets.top + 24 }]}>

      {/* Header */}
      <View style={dna.header}>
        <View style={dna.avatarRing}>
          <View style={dna.avatar}><Text style={dna.avatarText}>V</Text></View>
        </View>
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

      {/* Countdown */}
      <Text style={dna.label}>
        {commitment
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
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function VerMillionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const mountedRef  = useRef(true);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      setMessages([]);
      setPhase(null);
      setDayDone(false);
      setNeedsFirstGame(false);
      setPendingField(null);
      setQuestionsToday(0);
      init();
      startPulse();
      return () => { mountedRef.current = false; };
    }, [])
  );

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function init() {
    try {
      const complete    = await isOnboardingComplete();
      const state       = await getOnboardingState();
      const commitment  = await getCommitmentTime();
      if (!mountedRef.current) return;

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
        return;
      }

      setPhase('onboarding');

      if (!commitment) {
        // ── שלב 1: כניסה ראשונה — VerMillion קודם, משחק+טיימר בלחיצת CTA.
        setCurrentDay(1);
        const progress = await getDayProgress(1);
        if (!mountedRef.current) return;
        setQuestionsToday(progress.done);
        if (progress.done === 0) {
          setNeedsFirstGame(true);
        } else if (progress.complete) {
          // שאלות יום 1 נגמרו — עבר למשחקים כדי לקבוע commitment
          if (!mountedRef.current) return;
          navigation.navigate('Games');
        } else {
          await askNextOnboardingQuestion(1, progress.done);
        }
      } else {
        // ── שלב 2: commitment נקבע — מחזור יומי רגיל ─────────
        const day = getActiveDay(state.daysCompleted);
        setCurrentDay(day);
        const progress = await getDayProgress(day);
        if (!mountedRef.current) return;
        setQuestionsToday(progress.done);

        if (progress.complete) {
          // שאלות היום הושלמו → DNA timer עד commitment הבא
          setDayDone(true);
        } else if (day > 1) {
          // לפני שאלות — בדוק אם הגיע זמן ה-commitment
          const now  = new Date();
          const gate = new Date(now);
          gate.setHours(commitment.hour, commitment.minute, 0, 0);
          if (now < gate) {
            setDayDone(true); // עוד לא הגיע הזמן → DNA timer
          } else {
            // הזמן הגיע — בדוק אם המשתמש כבר שיחק ביום הזה
            const gameLog = await getGameLog();
            if (gameLog[day]) {
              await askNextOnboardingQuestion(day, progress.done);
            } else {
              // לא שיחק עדיין — שלח למשחקים
              if (!mountedRef.current) return;
              navigation.navigate('Games');
            }
          }
        } else {
          // יום 1 עם commitment — שאל שאלות
          await askNextOnboardingQuestion(day, progress.done);
        }
      }
    } catch (e) {
      console.error('[VM] init failed:', e?.message || e);
      if (mountedRef.current) {
        setPhase('onboarding');
        addMsg('assistant', 'שלום! אני VerMillion — היועץ הפיננסי האישי שלך.\n\nיש לך ילדים? כמה?');
        setPendingField('kids');
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
      if (!mountedRef.current) return;
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
          if (!mountedRef.current) return;
          navigation.navigate('Games');
        }, 1800);
      }
      setPendingField(null);
      return;
    }

    const { field, question } = prompt;
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
        const parsedValue = await processOnboardingAnswer(pendingField, text);
        const newCount = questionsToday + 1;
        setQuestionsToday(newCount);
        setPendingField(null);

        const ack = getAck(pendingField, parsedValue);
        await new Promise(r => setTimeout(r, 300));
        addMsg('assistant', ack);
        await new Promise(r => setTimeout(r, 600));
        await askNextOnboardingQuestion(currentDay, newCount);

      } else if (phase === 'coaching') {
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
    } catch (err) {
      console.error('[VerMillion] send failed:', err);
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

  // Show DNA timer when today's questions are done
  if (phase === 'onboarding' && dayDone) {
    return (
      <DNATimer
        day={currentDay}
        insets={insets}
        onGoGames={() => navigation.navigate('Games')}
        onUnlock={() => navigation.navigate('Games')}
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

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Bubble message={item} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />

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
    kids:               answer === 0 ? 'ללא ילדים.' : `${answer} ילדים — רשמתי.`,
    netIncome:          n ? `₪${n.toLocaleString('he-IL')} נטו — רשמתי.` : 'רשמתי.',
    incomeStability:    `${answer} — מבין.`,
    housingType:        `${answer} — רשמתי.`,
    housingCost:        n ? `₪${n.toLocaleString('he-IL')} — רשמתי.` : 'רשמתי.',
    fixedExpenses:      n === 0 ? 'ללא הוצאות קבועות נוספות.' : 'רשמתי.',
    variableExpenses:   n ? `₪${n.toLocaleString('he-IL')} — מבין.` : 'רשמתי.',
    biggestExpense:     'מעניין — רשמתי.',
    creditDebt:         n === 0 ? 'ללא חוב כרטיס — טוב.' : `₪${(n||0).toLocaleString('he-IL')} — רשמתי.`,
    loans:              n === 0 ? 'ללא הלוואות.' : 'רשמתי.',
    overdraft:          n === 0 ? 'ללא מינוס — מצוין.' : `₪${(n||0).toLocaleString('he-IL')} מינוס.`,
    savings:            n ? `₪${n.toLocaleString('he-IL')} בצד — מבין.` : 'רשמתי.',
    assets:             'רשמתי.',
    moneyGoal:          'מטרה ברורה — רשמתי.',
    moneyFear:          'הבנתי. זה בדיוק מה שנעבוד עליו.',
    financialStress:    n >= 7 ? 'גבוה — נטפל בזה.' : n <= 3 ? 'נמוך — נחמד.' : 'ממוצע — מבין.',
    moneyPersonality:   `${answer} — מעניין.`,
    biggestDream:       'חלום יפה. בואו נגרום לזה לקרות.',
    spouseIncome:       n === 0 ? 'ללא הכנסה נוספת — רשמתי.' : 'רשמתי.',
    retirementSavings:  n === 0 ? 'ללא פנסיה כרגע — חשוב לדעת.' : 'רשמתי.',
    financialGoalYears: n ? `${n} שנים — יעד ברור.` : 'רשמתי.',
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

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  avatarRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatar:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  avatarName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  avatarSub:  { color: '#666', fontSize: 12, marginTop: 2 },

  progressDots: { flexDirection: 'row', gap: 6 },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  dotDone: { backgroundColor: '#C0392B', borderColor: '#C0392B' },

  messages:       { padding: 16, paddingBottom: 24 },
  bubbleWrap:     { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapBot:  { justifyContent: 'flex-start' },
  miniAvatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  miniAvatarText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  bubble:    { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleBot: { backgroundColor: '#161616', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1E1414' },
  bubbleUser:{ backgroundColor: '#C0392B', borderBottomRightRadius: 4 },
  bubbleText:{ fontSize: 15, lineHeight: 24, textAlign: 'right' },
  textBot:   { color: '#E0E0E0' },
  textUser:  { color: '#FFF', fontWeight: '500' },

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
  sendBtn:        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#222' },
  sendBtnText:    { color: '#FFF', fontSize: 22, fontWeight: '700' },
});

// ─── DNA Timer styles ──────────────────────────────────────────
const dna = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0A',
    alignItems: 'center', paddingHorizontal: 24,
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
