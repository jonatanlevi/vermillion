import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import RunnerGame    from '../../components/RunnerGame';
import BreakoutGame  from '../../components/BreakoutGame';
import ObstacleGame  from '../../components/ObstacleGame';
import BubblePopGame from '../../components/BubblePopGame';
import ReflexGame    from '../../components/ReflexGame';
import TimingGame    from '../../components/TimingGame';
import SpeedTapGame  from '../../components/SpeedTapGame';
import { saveCommitmentTime, getCommitmentTime, saveGameStamp, getGameLog, getLeaderboard } from '../../services/storage';
import { getOnboardingState } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

const GAMES = [
  { key: 'runner',    label: 'ריצת VerMillion',   emoji: '🏃', desc: 'קפוץ מעל חובות וריביות',       color: '#C0392B' },
  { key: 'breakout',  label: 'שבור את החובות',    emoji: '🧱', desc: 'כדור ומחבט — שבור הכל',        color: '#E67E22' },
  { key: 'obstacle',  label: 'מרוץ המכשולים',     emoji: '🐦', desc: 'עוף מעל המכשולים הפיננסיים',   color: '#8E44AD' },
  { key: 'bubblepop', label: 'פוצץ את הבזבוזים',  emoji: '💸', desc: 'פוצץ הוצאות לפני שיברחו',      color: '#3498DB' },
  { key: 'reflex',    label: 'רפלקסים פיננסיים',  emoji: '🪙', desc: 'לכוד מטבעות לפני שנעלמים',    color: '#D4AF37' },
  { key: 'timing',    label: 'דיוק המשקיע',        emoji: '🎯', desc: 'קנה בדיוק בזמן הנכון',         color: '#2ECC71' },
  { key: 'speedtap',  label: 'מהירות הכסף',        emoji: '⚡', desc: 'הקש נכון, הימנע מהשגוי',       color: '#F39C12' },
];


// ─── Glass Dome Button ─────────────────────────────────────────
function GlassButton({ onPress }) {
  const pressAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const leverAnim  = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handlePress() {
    if (pressed) return;
    setPressed(true);
    Animated.sequence([
      Animated.timing(leverAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pressAnim,  { toValue: 0.88, friction: 4, useNativeDriver: true }),
      Animated.spring(pressAnim,  { toValue: 1,    friction: 4, useNativeDriver: true }),
    ]).start(() => onPress());
  }

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });
  const leverRotate = leverAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-35deg'] });

  return (
    <View style={gb.wrap}>
      <Text style={gb.label}>נעל את הזמן שלך</Text>
      <Text style={gb.sub}>לחץ כדי לקבוע מתי VerMillion ממתין לך מחר</Text>

      <View style={gb.scene}>
        {/* Glow */}
        <Animated.View style={[gb.glow, { opacity: glowOpacity }]} />

        {/* Glass dome */}
        <View style={gb.dome}>
          <View style={gb.domeInner} />
        </View>

        {/* Base */}
        <View style={gb.base}>
          {/* Button inside dome */}
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={gb.btnTouch}>
            <Animated.View style={[gb.btn, { transform: [{ scale: pressAnim }] }]}>
              <Text style={gb.btnText}>START</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Lever */}
          <Animated.View style={[gb.lever, { transform: [{ rotate: leverRotate }] }]}>
            <View style={gb.leverBar} />
            <View style={gb.leverKnob} />
          </Animated.View>

          {/* Corner bolts */}
          <View style={[gb.bolt, { top: 6, left: 6 }]} />
          <View style={[gb.bolt, { top: 6, right: 6 }]} />
          <View style={[gb.bolt, { bottom: 6, left: 6 }]} />
          <View style={[gb.bolt, { bottom: 6, right: 6 }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Commitment confirmation modal ──────────────────────────────
function CommitModal({ visible, time, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!time) return null;
  const h = String(time.hour).padStart(2, '0');
  const m = String(time.minute).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={cm.overlay}>
        <Animated.View style={[cm.card, { opacity: opacAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={cm.emoji}>🔒</Text>
          <Text style={cm.title}>הזמן נקבע</Text>
          <Text style={cm.time}>{h}:{m}</Text>
          <Text style={cm.desc}>
            כל יום בשעה {h}:{m}{'\n'}
            VerMillion ממתין לך עם 3 שאלות חדשות.
          </Text>
          <Text style={cm.note}>זה הרגל — ולא לוח זמנים.</Text>
          <TouchableOpacity style={cm.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={cm.btnText}>מעולה, אני מחויב</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Daily stamp guidance card ─────────────────────────────────
function DailyStampCard({ commitTime, todayStamped, activeDay }) {
  const h   = commitTime ? String(commitTime.hour).padStart(2, '0')   : '--';
  const m   = commitTime ? String(commitTime.minute).padStart(2, '0') : '--';
  const now = new Date();
  const nowH = String(now.getHours()).padStart(2, '0');
  const nowM = String(now.getMinutes()).padStart(2, '0');

  const gate = new Date(now);
  if (commitTime) gate.setHours(commitTime.hour, commitTime.minute, 0, 0);
  const timeReached = commitTime && now >= gate;

  if (todayStamped) {
    return (
      <View style={dsc.card}>
        <Text style={dsc.doneText}>✅ חתמת היום! שחק לכיף בלבד</Text>
      </View>
    );
  }

  if (!timeReached) {
    return (
      <View style={dsc.card}>
        <View style={dsc.topRow}>
          <Text style={dsc.icon}>🔒</Text>
          <Text style={dsc.dayText}>חזור ב-{h}:{m} לחתום</Text>
        </View>
        <Text style={dsc.times}>עכשיו: {nowH}:{nowM}  ·  נעול עד {h}:{m}</Text>
        <Text style={dsc.hintLocked}>שחק עכשיו לכיף — stamp נפתח בזמן שקבעת</Text>
      </View>
    );
  }

  return (
    <View style={[dsc.card, dsc.cardActive]}>
      <View style={dsc.topRow}>
        <Text style={dsc.icon}>⏱</Text>
        <Text style={dsc.dayText}>הגיע הזמן — שחק וחתום!</Text>
      </View>
      <Text style={dsc.times}>קבעת: {h}:{m}  ·  עכשיו: {nowH}:{nowM}</Text>
      <Text style={dsc.hint}>כל משחק יפתח את כפתור החתימה →</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function GamesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeGame, setActiveGame]         = useState(null);
  const [sessionScore, setSessionScore]     = useState(0);
  const [showCommitBtn, setShowCommitBtn]   = useState(false);
  const [commitTime, setCommitTime]         = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [hasCommitment, setHasCommitment]   = useState(false);
  const [showDailyStamp, setShowDailyStamp] = useState(false);
  const [stampAccuracy, setStampAccuracy]   = useState(null);
  const [activeDay, setActiveDay]           = useState(1);
  const [todayStamped, setTodayStamped]     = useState(false);
  const [userRank, setUserRank]             = useState(null);
  const [leaderScore, setLeaderScore]       = useState(0);
  const [daysLeft, setDaysLeft]             = useState(0);
  const calendarDay = new Date().getDate();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickedHour, setPickedHour]         = useState(8);
  const [pickedMinute, setPickedMinute]     = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      setDaysLeft(daysInMonth - now.getDate());

      Promise.all([getCommitmentTime(), getOnboardingState(), getGameLog()]).then(([c, state, log]) => {
        const onbDay = Math.min((state?.daysCompleted || []).length + 1, 7);
        setActiveDay(onbDay);
        if (c) {
          setHasCommitment(true);
          setCommitTime(c);
          const entry = log[new Date().getDate()];
          const stampedToday = !!entry &&
            new Date(entry.stampedAt).toDateString() === new Date().toDateString();
          setTodayStamped(stampedToday);
        }
      });

      if (user?.id) {
        getLeaderboard().then(board => {
          const entry = board.find(e => e.user_id === user.id);
          setUserRank(entry?.rank ?? null);
          setLeaderScore(entry?.total_score ?? 0);
        }).catch(() => {});
      }
    }, [user?.id])
  );

  function selectGame(key) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setActiveGame(key);
      setShowCommitBtn(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }

  async function handleGameFinish(score) {
    setSessionScore(score);
    setActiveGame(null);
    if (!hasCommitment) {
      setShowCommitBtn(true);
      return;
    }
    if (todayStamped) return;
    const now  = new Date();
    const gate = new Date(now);
    gate.setHours(commitTime.hour, commitTime.minute, 0, 0);
    if (now >= gate) setShowDailyStamp(true);
    // לפני הזמן — רק מציג ניקוד, stamp נעול
  }

  async function handleDailyStamp() {
    const result = await saveGameStamp(calendarDay);
    setStampAccuracy(result?.ms_diff ?? 0);
  }

  function handleStampDone() {
    setShowDailyStamp(false);
    setStampAccuracy(null);
    setTodayStamped(true);
    navigation.navigate('VerMillion');
  }

  async function handleCommit(hour, minute) {
    await saveCommitmentTime(hour, minute);
    const saved = await getCommitmentTime();
    setCommitTime(saved);
    setHasCommitment(true);
    setShowCommitBtn(false);
    setShowTimePicker(false);
    setShowModal(true);
  }

  if (activeGame) {
    return (
      <Animated.View style={[styles.gameFullscreen, { opacity: fadeAnim, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.exitBtn} onPress={() => setActiveGame(null)}>
          <Text style={styles.exitBtnText}>✕ יציאה</Text>
        </TouchableOpacity>
        {activeGame === 'runner'    && <RunnerGame    onFinish={handleGameFinish} />}
        {activeGame === 'breakout'  && <BreakoutGame  onFinish={handleGameFinish} />}
        {activeGame === 'obstacle'  && <ObstacleGame  onFinish={handleGameFinish} />}
        {activeGame === 'bubblepop' && <BubblePopGame onFinish={handleGameFinish} />}
        {activeGame === 'reflex'    && <ReflexGame    onFinish={handleGameFinish} />}
        {activeGame === 'timing'    && <TimingGame    onFinish={handleGameFinish} />}
        {activeGame === 'speedtap'  && <SpeedTapGame  onFinish={handleGameFinish} />}
      </Animated.View>
    );
  }

  // יום 2+: מסך חיתום דיוק יומי
  if (showDailyStamp) {
    const h = commitTime ? String(commitTime.hour).padStart(2,'0')   : '--';
    const m = commitTime ? String(commitTime.minute).padStart(2,'0') : '--';
    const accuracySec = stampAccuracy !== null ? Math.round(stampAccuracy / 1000) : null;
    const accuracyLabel =
      accuracySec === null ? null :
      accuracySec < 30     ? `${accuracySec} שניות — מדהים! 🎯` :
      accuracySec < 120    ? `${accuracySec} שניות — טוב מאוד 💪` :
      `${Math.round(accuracySec / 60)} דקות — תשפר מחר`;

    return (
      <View style={[styles.commitScreen, { paddingTop: insets.top + 20 }]}>
        <Text style={ds.dayLabel}>יום {activeDay} / 7</Text>
        <Text style={ds.title}>הזמן האישי שלך</Text>
        <Text style={ds.commitTimeDisplay}>{h}:{m}</Text>

        {stampAccuracy === null ? (
          <>
            <Text style={ds.sub}>כבש את הרגע — לחץ כמה שיותר קרוב לשעה שקבעת</Text>
            <Text style={ds.subHint}>המדידה: כמה שניות/דקות עברו מהשעה שלך עד עכשיו</Text>
            <TouchableOpacity style={ds.stampBtn} onPress={handleDailyStamp} activeOpacity={0.85}>
              <Text style={ds.stampBtnText}>⏱ חתום עכשיו</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={ds.accuracy}>{accuracyLabel}</Text>
            <TouchableOpacity style={ds.continueBtn} onPress={handleStampDone} activeOpacity={0.85}>
              <Text style={ds.continueBtnText}>המשך לשאלות VerMillion →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  // Post-game commitment screen
  if (showCommitBtn) {
    if (showTimePicker) {
      const hh = String(pickedHour).padStart(2,'0');
      const mm = String(pickedMinute).padStart(2,'0');
      return (
        <View style={[styles.commitScreen, { paddingTop: insets.top + 20 }]}>
          <Text style={tp.title}>מתי VerMillion ממתין לך?</Text>
          <Text style={tp.sub}>בחר את שעת המחויבות היומית שלך</Text>
          <View style={tp.row}>
            <View style={tp.col}>
              <TouchableOpacity onPress={() => setPickedHour(h => (h + 1) % 24)} style={tp.arrow}><Text style={tp.arrowText}>▲</Text></TouchableOpacity>
              <Text style={tp.digit}>{hh}</Text>
              <TouchableOpacity onPress={() => setPickedHour(h => (h + 23) % 24)} style={tp.arrow}><Text style={tp.arrowText}>▼</Text></TouchableOpacity>
            </View>
            <Text style={tp.colon}>:</Text>
            <View style={tp.col}>
              <TouchableOpacity onPress={() => setPickedMinute(m => (m + 5) % 60)} style={tp.arrow}><Text style={tp.arrowText}>▲</Text></TouchableOpacity>
              <Text style={tp.digit}>{mm}</Text>
              <TouchableOpacity onPress={() => setPickedMinute(m => (m + 55) % 60)} style={tp.arrow}><Text style={tp.arrowText}>▼</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={tp.confirmBtn} onPress={() => handleCommit(pickedHour, pickedMinute)} activeOpacity={0.85}>
            <Text style={tp.confirmText}>נעל את השעה {hh}:{mm} 🔒</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.commitScreen, { paddingTop: insets.top + 20 }]}>
        <View style={styles.scoreResult}>
          <Text style={styles.scoreResultLabel}>סיימת את המשחק</Text>
          <Text style={styles.scoreResultVal}>+{sessionScore} נקודות 🔥</Text>
        </View>
        <GlassButton onPress={() => setShowTimePicker(true)} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>אתגר החודש</Text>
          <View style={styles.daysLeftBadge}>
            <Text style={styles.daysLeftText}>{daysLeft} ימים</Text>
          </View>
        </View>

        {/* Score bar */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{userRank ? `#${userRank}` : '-'}</Text>
            <Text style={styles.scoreLabel}>דירוג</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{leaderScore.toLocaleString()}</Text>
            <Text style={styles.scoreLabel}>ניקוד</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>×1.2</Text>
            <Text style={styles.scoreLabel}>מכפיל</Text>
          </View>
        </View>

        {sessionScore > 0 && (
          <View style={styles.sessionBanner}>
            <Text style={styles.sessionText}>+{sessionScore} נקודות הסשן האחרון 🔥</Text>
          </View>
        )}

        {hasCommitment && (
          <DailyStampCard
            commitTime={commitTime}
            todayStamped={todayStamped}
            activeDay={activeDay}
          />
        )}

        <Text style={styles.sectionTitle}>בחר משחק</Text>

        {GAMES.map(game => (
          <TouchableOpacity
            key={game.key}
            style={[styles.gameCard, { borderColor: game.color + '44' }]}
            onPress={() => selectGame(game.key)}
            activeOpacity={0.85}
          >
            <View style={[styles.gameEmoji, { backgroundColor: game.color + '22' }]}>
              <Text style={styles.gameEmojiText}>{game.emoji}</Text>
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameLabel}>{game.label}</Text>
              <Text style={styles.gameDesc}>{game.desc}</Text>
            </View>
            <View style={[styles.playBtn, { backgroundColor: game.color }]}>
              <Text style={styles.playBtnText}>▶</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.prizeCard}>
          <Text style={styles.prizeTitle}>🏆 פרס חודשי</Text>
          <Text style={styles.prizeAmount}>₪45,000</Text>
          <Text style={styles.prizeSub}>לשחקן עם הניקוד הגבוה ביותר בסוף החודש</Text>
        </View>
      </ScrollView>

      <CommitModal
        visible={showModal}
        time={commitTime}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0A0A' },
  content:    { paddingHorizontal: 20, paddingBottom: 40 },
  gameFullscreen: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:  { color: '#FFF', fontSize: 26, fontWeight: '900' },
  daysLeftBadge: { backgroundColor: '#1A0808', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#C0392B44' },
  daysLeftText:  { color: '#C0392B', fontSize: 13, fontWeight: '800' },

  scoreCard: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E',
    justifyContent: 'space-around', alignItems: 'center',
  },
  scoreItem:    { alignItems: 'center' },
  scoreValue:   { color: '#FFF', fontSize: 22, fontWeight: '900' },
  scoreLabel:   { color: '#555', fontSize: 11, marginTop: 2 },
  scoreDivider: { width: 1, height: 32, backgroundColor: '#222' },

  sessionBanner: {
    backgroundColor: '#0D1A0D', borderRadius: 10, padding: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#1A3A1A', alignItems: 'center',
  },
  sessionText: { color: '#27AE60', fontSize: 14, fontWeight: '700' },

  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  gameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  gameEmoji:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gameEmojiText: { fontSize: 26 },
  gameInfo:  { flex: 1 },
  gameLabel: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'right' },
  gameDesc:  { color: '#555', fontSize: 12, marginTop: 3, textAlign: 'right' },
  playBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playBtnText: { color: '#FFF', fontSize: 16 },

  prizeCard: {
    backgroundColor: '#1A1400', borderRadius: 16, padding: 20,
    marginTop: 8, borderWidth: 1, borderColor: '#D4AF3744', alignItems: 'center',
  },
  prizeTitle:  { color: '#D4AF37', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  prizeAmount: { color: '#D4AF37', fontSize: 36, fontWeight: '900', marginBottom: 4 },
  prizeSub:    { color: '#7A6A20', fontSize: 13, textAlign: 'center' },

  exitBtn:     { alignSelf: 'flex-start', padding: 12, marginBottom: 8 },
  exitBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '700' },

  commitScreen: {
    flex: 1, backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  scoreResult:     { alignItems: 'center', marginBottom: 48 },
  scoreResultLabel:{ color: '#555', fontSize: 14, marginBottom: 6 },
  scoreResultVal:  { color: '#FFF', fontSize: 28, fontWeight: '900' },
});

const dsc = StyleSheet.create({
  card: {
    backgroundColor: '#0D0D1A', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#C0392B44',
  },
  topRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  icon:    { fontSize: 18 },
  dayText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'right', flex: 1 },
  times:   { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  hint:    { color: '#C0392B', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  cardActive:  { borderColor: '#C0392BAA' },
  doneText:    { color: '#27AE60', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  hintLocked:  { color: '#555', fontSize: 12, textAlign: 'right' },
});

// ─── Daily Stamp styles ─────────────────────────────────────────
const ds = StyleSheet.create({
  dayLabel:          { color: '#555', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title:             { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 12 },
  commitTimeDisplay: { color: '#D4AF37', fontSize: 64, fontWeight: '900', marginBottom: 8 },
  sub:               { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  subHint:           { color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 32 },
  stampBtn: {
    backgroundColor: '#C0392B', borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 48, alignItems: 'center',
  },
  stampBtnText:  { color: '#FFF', fontSize: 18, fontWeight: '900' },
  accuracy:      { color: '#27AE60', fontSize: 18, fontWeight: '800', marginBottom: 40, textAlign: 'center' },
  continueBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#C0392B44',
    paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', width: '100%',
  },
  continueBtnText: { color: '#C0392B', fontSize: 16, fontWeight: '800' },
});

// ─── Glass Button styles ────────────────────────────────────────
const gb = StyleSheet.create({
  wrap:  { alignItems: 'center', width: '100%' },
  label: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  sub:   { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 32, lineHeight: 20 },

  scene: { alignItems: 'center', justifyContent: 'center', width: 200, height: 240 },

  glow: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#D4AF37',
  },

  dome: {
    position: 'absolute', top: 0,
    width: 160, height: 130,
    borderTopLeftRadius: 80, borderTopRightRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  domeInner: {
    width: 40, height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    position: 'absolute', top: 12, right: 20,
  },

  base: {
    position: 'absolute', bottom: 0,
    width: 160, height: 120,
    backgroundColor: '#2A2218',
    borderRadius: 12,
    borderWidth: 2, borderColor: '#3D3020',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },

  btnTouch: { zIndex: 3 },
  btn: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 12, elevation: 12,
    borderWidth: 2, borderColor: '#F5D060',
  },
  btnText: { color: '#1A0A00', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  lever: {
    position: 'absolute', right: 16, bottom: 20,
    transformOrigin: 'bottom',
    zIndex: 4,
  },
  leverBar:  { width: 6, height: 44, backgroundColor: '#888', borderRadius: 3 },
  leverKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#AAA', marginTop: -2, marginLeft: -5 },

  bolt: {
    position: 'absolute', width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#4A3A28',
    borderWidth: 1, borderColor: '#5A4A38',
  },
});

// ─── Time Picker styles ─────────────────────────────────────────
const tp = StyleSheet.create({
  title:      { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  sub:        { color: '#555', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 48 },
  col:        { alignItems: 'center', gap: 12 },
  arrow:      { padding: 10 },
  arrowText:  { color: '#C0392B', fontSize: 22, fontWeight: '900' },
  digit:      { color: '#D4AF37', fontSize: 72, fontWeight: '900', minWidth: 100, textAlign: 'center' },
  colon:      { color: '#444', fontSize: 72, fontWeight: '900', marginBottom: 8 },
  confirmBtn: { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  confirmText:{ color: '#FFF', fontSize: 16, fontWeight: '900' },
});

// ─── Commit Modal styles ────────────────────────────────────────
const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: {
    backgroundColor: '#111', borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#D4AF3744', width: '100%',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  time:  { color: '#D4AF37', fontSize: 52, fontWeight: '900', marginBottom: 16 },
  desc:  { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  note:  { color: '#444', fontSize: 12, marginBottom: 24 },
  btn:   { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
