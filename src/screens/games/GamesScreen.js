import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal, Easing, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import RunnerGame    from '../../components/RunnerGame';
import BreakoutGame  from '../../components/BreakoutGame';
import ObstacleGame  from '../../components/ObstacleGame';
import BubblePopGame from '../../components/BubblePopGame';
import ReflexGame    from '../../components/ReflexGame';
import TimingGame    from '../../components/TimingGame';
import SpeedTapGame   from '../../components/SpeedTapGame';
import StackGame      from '../../components/StackGame';
import CatchGame      from '../../components/CatchGame';
import TapRhythmGame  from '../../components/TapRhythmGame';
import PingPongGame   from '../../components/PingPongGame';
import MemoryTapGame  from '../../components/MemoryTapGame';
import ColorBoomGame  from '../../components/ColorBoomGame';
import WhackMoleGame from '../../components/WhackMoleGame';
import DodgeGame     from '../../components/DodgeGame';
import BullseyeGame  from '../../components/BullseyeGame';
import SortGame      from '../../components/SortGame';
import MathSprintGame  from '../../components/MathSprintGame';
import CardFlipGame    from '../../components/CardFlipGame';
import SafeCrackerGame from '../../components/SafeCrackerGame';
import WordSnapGame    from '../../components/WordSnapGame';
import TapOrderGame    from '../../components/TapOrderGame';
import NumberLineGame  from '../../components/NumberLineGame';
import StockTickerGame from '../../components/StockTickerGame';
import PinCrackGame    from '../../components/PinCrackGame';
import ScaleGame       from '../../components/ScaleGame';
import ChainTapGame    from '../../components/ChainTapGame';
import FlashCountGame  from '../../components/FlashCountGame';
import SpeedMatchGame  from '../../components/SpeedMatchGame';
import MathChainGame   from '../../components/MathChainGame';
import DiceAddGame     from '../../components/DiceAddGame';
import {
  saveCommitmentTime, saveChallengeTarget, getCommitmentTime,
  completeGame, saveGameStamp, getGameLog, getLeaderboard, saveGameSession, syncProfileTimezone,
  getVoiceUnlocked, setVoiceUnlocked,
} from '../../services/storage';
import { getDeviceTimezone, getLocalTimeParts, getStampWindowStatus, getWindowWarning, stampErrorMessage } from '../../utils/stampWindow';
import {
  canSetChallengeTarget, clampChallengeHM, getChallengeConfig, getDefaultChallengeHM,
  hmToMins, minsToHM,
} from '../../constants/stampChallenge';
import { getOnboardingState } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Avatar3D from '../../components/Avatar3D';
import DayScheduleBanner from '../../components/DayScheduleBanner';
import { getDayScheduleView } from '../../utils/dayScheduleDisplay';
import { getUnlockedEquipment, getEffectiveOverrides } from '../../utils/registrationGate';
import { telemetry } from '../../services/activityTelemetry';

const MONTH_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

// Game assigned to each day of month — 31 unique games
const DAILY_GAME_SCHEDULE = [
  'memorytap','reflex','sort','runner','colorboom',
  'speedtap','breakout','obstacle','timing','stack',
  'bubblepop','bullseye','catch','taprhythm','pingpong',
  'dodge','whackmole','mathsprint','cardflip','safecracker',
  'wordsnap','taporder','numberline','stockticker','pincrack',
  'scale','chaintap','flashcount','speedmatch','mathchain','diceadd',
];

function getDailyGame(dayOfMonth) {
  return DAILY_GAME_SCHEDULE[(dayOfMonth - 1) % DAILY_GAME_SCHEDULE.length];
}

const CATEGORIES = [
  { id: 'memory', label: 'זיכרון',  emoji: '🧠', color: '#3498DB', games: ['memorytap','colorboom','cardflip','pincrack','flashcount'] },
  { id: 'logic',  label: 'הגיון',   emoji: '💎', color: '#8E44AD', games: ['sort','stack','breakout','mathsprint','taporder','stockticker','scale','mathchain','diceadd'] },
  { id: 'reflex', label: 'תגובה',   emoji: '⚡', color: '#F39C12', games: ['reflex','speedtap','timing','bullseye','taprhythm','safecracker','numberline','chaintap'] },
  { id: 'focus',  label: 'ריכוז',   emoji: '🎴', color: '#C0392B', games: ['runner','obstacle','bubblepop','catch','pingpong','dodge','whackmole','wordsnap','speedmatch'] },
];

const GAMES = [
  { key: 'runner',    label: 'ריצת VerMillion',   emoji: '🏃', desc: 'קפוץ מעל חובות וריביות',       color: '#C0392B' },
  { key: 'breakout',  label: 'שבור את החובות',    emoji: '🧱', desc: 'כדור ומחבט — שבור הכל',        color: '#E67E22' },
  { key: 'obstacle',  label: 'מרוץ המכשולים',     emoji: '🐦', desc: 'עוף מעל המכשולים הפיננסיים',   color: '#8E44AD' },
  { key: 'bubblepop', label: 'פוצץ את הבזבוזים',  emoji: '💸', desc: 'פוצץ הוצאות לפני שיברחו',      color: '#3498DB' },
  { key: 'reflex',    label: 'רפלקסים פיננסיים',  emoji: '🪙', desc: 'לכוד מטבעות לפני שנעלמים',    color: '#D4AF37' },
  { key: 'timing',    label: 'דיוק המשקיע',        emoji: '🎯', desc: 'קנה בדיוק בזמן הנכון',         color: '#2ECC71' },
  { key: 'speedtap',  label: 'מהירות הכסף',        emoji: '⚡', desc: 'הקש נכון, הימנע מהשגוי',       color: '#F39C12' },
  { key: 'stack',     label: 'מגדל החיסכון',       emoji: '🏗️', desc: 'ערום בלוקים — הדיוק קובע',     color: '#D4AF37' },
  { key: 'catch',     label: 'לכוד הזדמנויות',     emoji: '🧺', desc: 'לכוד מטבעות, הימנע מפצצות',   color: '#1ABC9C' },
  { key: 'taprhythm', label: 'קצב המשקיע',          emoji: '🎵', desc: 'הקש בדיוק כשהטבעת מגיעה',     color: '#9B59B6' },
  { key: 'pingpong',  label: 'מנצח הריבית',         emoji: '🏓', desc: 'אל תתן לכדור ליפול',           color: '#E74C3C' },
  { key: 'memorytap', label: 'זיכרון פיננסי',        emoji: '🧠', desc: 'שנן וחזור על הרצף',            color: '#3498DB' },
  { key: 'colorboom', label: 'פוצץ הנכון',           emoji: '🎨', desc: 'פוצץ רק את הצבע הנדרש',       color: '#E67E22' },
  { key: 'whackmole', label: 'הכה את החובות',        emoji: '🔨', desc: 'הכה מטבעות לפני שייעלמו',       color: '#D4AF37' },
  { key: 'dodge',     label: 'חמוק מהחובות',         emoji: '💨', desc: 'חמוק מ-💸 שנופלים עליך',        color: '#C0392B' },
  { key: 'bullseye',  label: 'מרכז העניינים',         emoji: '🎯', desc: 'ירה כשהנקודה במרכז',            color: '#9B59B6' },
  { key: 'sort',        label: 'מיין את הכסף',         emoji: '🗂️', desc: 'הכנסה או הוצאה — מהר!',        color: '#2ECC71' },
  { key: 'mathsprint',  label: 'חשבון מהיר',           emoji: '🧮', desc: 'חשב ₪ תוך 4 שניות',            color: '#8E44AD' },
  { key: 'cardflip',    label: 'זיכרון זוגות',          emoji: '🃏', desc: 'מצא 6 זוגות פיננסיים',          color: '#3498DB' },
  { key: 'safecracker', label: 'פצח את הכספת',         emoji: '🔐', desc: 'עצור בדיוק על המספר',           color: '#F39C12' },
  { key: 'wordsnap',    label: 'חיובי / שלילי',        emoji: '📝', desc: 'מלה פיננסית — קבע מהר',         color: '#C0392B' },
  { key: 'taporder',    label: 'סדר עולה',              emoji: '📊', desc: 'הקש סכומים מהנמוך לגבוה',       color: '#1ABC9C' },
  { key: 'numberline',  label: 'קו מספרים',            emoji: '📏', desc: 'עצור את הסמן באזור הירוק',      color: '#E74C3C' },
  { key: 'stockticker', label: 'מסחר מהיר',            emoji: '📈', desc: 'קנה ומכור — הרוויח כמה שתוכל', color: '#2ECC71' },
  { key: 'pincrack',    label: 'פצח את הקוד',          emoji: '🔢', desc: 'שנן PIN מבזיק והכנס אותו',       color: '#3498DB' },
  { key: 'scale',       label: 'מאזניים',               emoji: '⚖️', desc: 'הקש על הסכום הגדול יותר',       color: '#8E44AD' },
  { key: 'chaintap',    label: 'שרשרת מספרים',         emoji: '🔗', desc: 'הקש עיגולים בסדר עולה',          color: '#F39C12' },
  { key: 'flashcount',  label: 'ספור מהיר',             emoji: '💰', desc: 'כמה מטבעות הבזיקו?',             color: '#D4AF37' },
  { key: 'speedmatch',  label: 'התאמה מהירה',           emoji: '🔀', desc: 'אותה קטגוריה? כן / לא',          color: '#C0392B' },
  { key: 'mathchain',   label: 'שרשרת חשבון',           emoji: '➕', desc: 'עקוב אחרי סכום רץ',              color: '#E67E22' },
  { key: 'diceadd',     label: 'קוביות מהיר',           emoji: '🎲', desc: 'חשב סכום קוביות תוך שניות',      color: '#1ABC9C' },
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

function getChallengeTarget(commitTime, mode) {
  if (!commitTime || !mode) return null;
  if (mode === 'friday') return commitTime.fridayTarget || null;
  if (mode === 'saturday') return commitTime.saturdayTarget || null;
  return null;
}

function isTargetTimeReached(target) {
  if (!target) return false;
  const now = new Date();
  const gate = new Date(now);
  gate.setHours(target.hour, target.minute, 0, 0);
  return now >= gate;
}

// ─── Daily stamp guidance card ─────────────────────────────────
function DailyStampCard({ commitTime, todayStamped, stampWindow, onSetChallengeTime }) {
  const schedule = getDayScheduleView(commitTime);

  const isChallenge = stampWindow?.mode === 'friday' || stampWindow?.mode === 'saturday';
  const challengeTarget = isChallenge ? getChallengeTarget(commitTime, stampWindow.mode) : null;
  const activeTarget = isChallenge ? challengeTarget : commitTime;
  const h = activeTarget ? String(activeTarget.hour).padStart(2, '0') : '--';
  const m = activeTarget ? String(activeTarget.minute).padStart(2, '0') : '--';

  const now = new Date();
  const gate = new Date(now);
  if (activeTarget) gate.setHours(activeTarget.hour, activeTarget.minute, 0, 0);
  const timeReached = activeTarget && now >= gate;

  const winCfg = isChallenge ? getChallengeConfig(stampWindow.mode) : null;
  const { day, mins } = schedule;
  const maySetChallenge = isChallenge && !challengeTarget && canSetChallengeTarget(day, mins);

  if (todayStamped) {
    return (
      <View style={dsc.card}>
        <Text style={dsc.doneText}>✅ חתמת היום! שחק לכיף בלבד</Text>
      </View>
    );
  }

  // שישי/שבת: המשתמש קובע שעה בתוך הטווח, ואז חותם כשמגיע
  if (isChallenge) {
    if (!stampWindow.open && !maySetChallenge) {
      return (
        <View style={dsc.card}>
          <View style={dsc.topRow}>
            <Text style={dsc.icon}>🔒</Text>
            <Text style={dsc.dayText}>אתגר {winCfg.labelHe} — חלון סגור</Text>
          </View>
          <Text style={dsc.times}>{schedule.nowLine}</Text>
          <Text style={dsc.hintLocked}>{stampWindow.message}</Text>
        </View>
      );
    }
    if (maySetChallenge) {
      return (
        <View style={[dsc.card, dsc.cardActive]}>
          <View style={dsc.topRow}>
            <Text style={dsc.icon}>📌</Text>
            <Text style={dsc.dayText}>קבע מתי תחתום היום</Text>
          </View>
          <Text style={dsc.times}>טווח מותר: {winCfg.openLabel} – {winCfg.closeLabel}</Text>
          <TouchableOpacity style={dsc.setTimeBtn} onPress={() => onSetChallengeTime(stampWindow.mode)} activeOpacity={0.85}>
            <Text style={dsc.setTimeBtnText}>בחר שעת חתימה</Text>
          </TouchableOpacity>
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
          <Text style={dsc.times}>יעד: {h}:{m}  ·  {schedule.nowLine}</Text>
          <Text style={dsc.hintLocked}>שחק לכיף — החתימה נפתחת בשעה שבחרת (בתוך הטווח)</Text>
        </View>
      );
    }
    return (
      <View style={[dsc.card, dsc.cardActive]}>
        <View style={dsc.topRow}>
          <Text style={dsc.icon}>⏱</Text>
          <Text style={dsc.dayText}>הגיע הזמן — שחק וחתום!</Text>
        </View>
        <Text style={dsc.times}>יעד: {h}:{m}  ·  {schedule.nowLine}</Text>
        <Text style={dsc.hint}>טווח {winCfg.openLabel}–{winCfg.closeLabel} · כל משחק יפתח חתימה</Text>
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
        <Text style={dsc.times}>{schedule.nowLine}  ·  נעול עד {h}:{m}</Text>
        <Text style={dsc.hintLocked}>שחק עכשיו לכיף — stamp נפתח בזמן ה-DNA שקבעת</Text>
      </View>
    );
  }

  return (
    <View style={[dsc.card, dsc.cardActive]}>
      <View style={dsc.topRow}>
        <Text style={dsc.icon}>⏱</Text>
        <Text style={dsc.dayText}>הגיע הזמן — שחק וחתום!</Text>
      </View>
      <Text style={dsc.times}>DNA: {h}:{m}  ·  {schedule.nowLine}</Text>
      <Text style={dsc.hint}>כל משחק יפתח את כפתור החתימה →</Text>
    </View>
  );
}

// ─── Window Warning Banner ─────────────────────────────────────
function WindowWarningBanner({ warning }) {
  if (!warning) return null;
  return (
    <View style={[lob.windowBanner, { backgroundColor: warning.bg, borderColor: warning.color + '55' }]}>
      <Text style={[lob.windowBannerText, { color: warning.color }]}>
        {warning.icon}  {warning.title}
      </Text>
      <Text style={[lob.windowBannerText, { color: '#888', fontSize: 12, fontWeight: '400', marginTop: 2 }]}>
        {warning.body}
      </Text>
    </View>
  );
}

// ─── Real Week Intro Modal ─────────────────────────────────────
function RealWeekIntroModal({ visible, onDismiss }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={rwi.overlay}>
        <View style={rwi.card}>
          <Text style={rwi.headline}>✨ שבוע אמיתי</Text>
          <Text style={rwi.sub}>
            7 הימים הראשונים הסתיימו.{'\n'}עכשיו מתחיל האתגר האמיתי.
          </Text>
          <View style={rwi.infoRow}>
            <View style={rwi.infoCard}>
              <Text style={rwi.infoIcon}>🧬</Text>
              <Text style={rwi.infoTitle}>DNA</Text>
              <Text style={rwi.infoDesc}>שעה אחת שבחרת{'\n'}VerMillion ממתין לך כל יום</Text>
              <Text style={rwi.infoScore}>עד 1,000 נק׳</Text>
            </View>
            <View style={[rwi.infoCard, { borderColor: '#D4AF3744' }]}>
              <Text style={rwi.infoIcon}>📌</Text>
              <Text style={[rwi.infoTitle, { color: '#D4AF37' }]}>שישי</Text>
              <Text style={rwi.infoDesc}>00:01 עד 15:30{'\n'}לשחקני בוקר</Text>
            </View>
            <View style={[rwi.infoCard, { borderColor: '#8E44AD44' }]}>
              <Text style={rwi.infoIcon}>🌙</Text>
              <Text style={[rwi.infoTitle, { color: '#8E44AD' }]}>שבת</Text>
              <Text style={rwi.infoDesc}>21:00 עד 23:59{'\n'}לשחקני ערב</Text>
            </View>
          </View>
          <Text style={rwi.note}>
            הניקוד פוחת ככל שחותמים רחוק יותר מהשעה שבחרת.{'\n'}
            שישי ושבת — מנגנון שונה לגמרי מהשגרה.
          </Text>
          <TouchableOpacity style={rwi.btn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={rwi.btnText}>הבנתי — בוא נשחק 🎮</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Helpers ───────────────────────────────────────────────────
function countStreak(log, today) {
  const now = new Date();
  let streak = 0;
  for (let d = today; d >= 1; d--) {
    const entry = log[d];
    if (!entry?.stampedAt) break;
    const expected = new Date(now.getFullYear(), now.getMonth(), d).toDateString();
    if (new Date(entry.stampedAt).toDateString() !== expected) break;
    streak++;
  }
  return streak;
}

// ─── Voice Unlock Modal ────────────────────────────────────────
function VoiceUnlockModal({ visible, onDismiss }) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const circleScale    = useRef(new Animated.Value(0)).current;
  const micScale       = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textTranslate  = useRef(new Animated.Value(24)).current;
  const btnOpacity     = useRef(new Animated.Value(0)).current;
  const glowPulse      = useRef(new Animated.Value(0.15)).current;
  const ring1          = useRef(new Animated.Value(0)).current;
  const ring2          = useRef(new Animated.Value(0)).current;
  const ring3          = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    overlayOpacity.setValue(0);
    circleScale.setValue(0);
    micScale.setValue(0);
    textOpacity.setValue(0);
    textTranslate.setValue(24);
    btnOpacity.setValue(0);
    glowPulse.setValue(0.15);
    ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);

    Animated.timing(overlayOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.spring(circleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }, 150);

    setTimeout(() => {
      Animated.spring(micScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
      const ripple = (anim, delay) => {
        anim.setValue(0);
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])).start();
      };
      ripple(ring1, 0);
      ripple(ring2, 650);
      ripple(ring3, 1300);
      Animated.loop(Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.75, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.15, duration: 1000, useNativeDriver: true }),
      ])).start();
    }, 450);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity,   { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, 1400);
  }, [visible]);

  if (!visible) return null;

  const ringStyle = (anim) => ({
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    top: 20, left: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
  });

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[vu.overlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[vu.circleWrap, { transform: [{ scale: circleScale }] }]}>
          <Animated.View style={ringStyle(ring1)} />
          <Animated.View style={ringStyle(ring2)} />
          <Animated.View style={ringStyle(ring3)} />
          <Animated.View style={[vu.glow, { opacity: glowPulse }]} />
          <View style={vu.circle}>
            <Animated.Text style={[vu.micEmoji, { transform: [{ scale: micScale }] }]}>🎙</Animated.Text>
          </View>
        </Animated.View>

        <Animated.View style={[vu.textBlock, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
          <Text style={vu.headline}>יכולת הדיבור נפתחה!</Text>
          <Text style={vu.sub1}>7 ימים רצופים — הגעת לרמה חדשה</Text>
          <Text style={vu.sub2}>VerMillion ידבר איתך. אתה תדבר אליו.</Text>
        </Animated.View>

        <Animated.View style={{ opacity: btnOpacity }}>
          <TouchableOpacity style={vu.btn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={vu.btnText}>בוא נדבר! 🎙</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const vu = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', gap: 32 },
  circleWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  glow:       { position: 'absolute', top: 5, left: 5, width: 150, height: 150, borderRadius: 75, backgroundColor: '#D4AF37' },
  circle:     { width: 110, height: 110, borderRadius: 55, backgroundColor: '#080808', borderWidth: 2, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  micEmoji:   { fontSize: 52 },
  textBlock:  { alignItems: 'center', paddingHorizontal: 28, gap: 8 },
  headline:   { color: '#D4AF37', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub1:       { color: '#FFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sub2:       { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btn:        { backgroundColor: '#D4AF37', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 52 },
  btnText:    { color: '#0A0A0A', fontSize: 18, fontWeight: '900', textAlign: 'center' },
});

// ─── Main screen ───────────────────────────────────────────────
export default function GamesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile, reloadProfile } = useAuth();
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
  const [gameToken, setGameToken]           = useState(null);
  const gameStartedAt                       = useRef(null);
  const [userRank, setUserRank]             = useState(null);
  const [leaderScore, setLeaderScore]       = useState(0);
  const [daysLeft, setDaysLeft]             = useState(0);
  const [weeklyPool, setWeeklyPool]         = useState(0);
  const [activeSubs, setActiveSubs]         = useState(0);
  const calendarDay = new Date().getDate();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickedHour, setPickedHour]         = useState(8);
  const [pickedMinute, setPickedMinute]     = useState(0);
  const [challengePickerMode, setChallengePickerMode] = useState(null);
  const [pickedChallengeMins, setPickedChallengeMins] = useState(600);
  const [gameLog, setGameLog]               = useState({});
  const [stampWindow, setStampWindow]       = useState({ open: true, message: null });
  const [stampError, setStampError]         = useState(null);
  const [windowWarning, setWindowWarning]       = useState(null);
  const [showRealWeekIntro, setShowRealWeekIntro] = useState(false);
  const [showVoiceUnlock, setShowVoiceUnlock]     = useState(false);
  const [voiceJustUnlocked, setVoiceJustUnlocked] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      setDaysLeft(daysInMonth - now.getDate());

      syncProfileTimezone().catch(() => {});
      const refreshSchedule = () => {
        const tz = getDeviceTimezone();
        setStampWindow(getStampWindowStatus(tz));
        setWindowWarning(getWindowWarning(tz));
      };
      refreshSchedule();

      Promise.all([getCommitmentTime(), getOnboardingState(), getGameLog()]).then(([c, state, log]) => {
        const onbDay = Math.min((state?.daysCompleted || []).length + 1, 7);
        setActiveDay(onbDay);
        setGameLog(log || {});
        const completed = (state?.daysCompleted || []).length;
        if (completed >= 7) {
          try {
            const seenKey = `@vermillion/real_week_intro_seen/${user?.id || 'local'}`;
            const seen = typeof localStorage !== 'undefined' && localStorage.getItem(seenKey) === '1';
            if (!seen) setShowRealWeekIntro(true);
          } catch {}
        }
        if (c) {
          setCommitTime(c);
          setHasCommitment(c.hour != null && c.minute != null);
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
      fetch('/api/prize-pool').then(r => r.json()).then(d => {
        if (d?.weeklyPrizePool != null) { setWeeklyPool(d.weeklyPrizePool); setActiveSubs(d.activeSubscribers); }
      }).catch(() => {});
      const tick = setInterval(refreshSchedule, 30_000);
      return () => clearInterval(tick);
    }, [user?.id])
  );

  function selectGame(key) {
    gameStartedAt.current = new Date().toISOString();
    setGameToken(null);
    telemetry.gameStarted(key, activeDay, 'Games');
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setActiveGame(key);
      setShowCommitBtn(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }

  function playCategory(cat) {
    const key = cat.games[Math.floor(Math.random() * cat.games.length)];
    selectGame(key);
  }

  async function handleGameFinish(score) {
    const playedGame  = activeGame;
    const startedAt   = gameStartedAt.current || new Date().toISOString();
    const durationMs  = new Date().getTime() - new Date(startedAt).getTime();
    telemetry.gameFinished(playedGame, score, durationMs, 'Games');
    setSessionScore(score);
    setActiveGame(null);

    // Issue game token — proves this game was actually played
    const gameResult = await completeGame({
      day:        calendarDay,
      gameKey:    playedGame,
      gameScore:  score,
      startedAt,
      durationMs,
    });
    setGameToken(gameResult.token);
    if (!gameResult.ok || !gameResult.token) {
      const msg = stampErrorMessage(gameResult.error, gameResult.message);
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('לא ניתן לאשר את המשחק', msg);
      return;
    }

    const cat = CATEGORIES.find(c => c.games.includes(playedGame));
    if (playedGame && cat) saveGameSession(playedGame, cat.id, score).catch(() => {});

    if (user?.id && !user.id.startsWith('local_') && profile) {
      const earned = Math.max(5, Math.min(50, Math.ceil(score / 3)));
      try {
        await supabase
          .from('profiles')
          .update({ v_coins: (profile.v_coins ?? 0) + earned })
          .eq('id', user.id);
        await reloadProfile();
      } catch (_) {}
    }

    const win = getStampWindowStatus(getDeviceTimezone());
    setStampWindow(win);
    const { day, mins } = getLocalTimeParts(new Date(), getDeviceTimezone());
    const needsChallengeTarget =
      (win.mode === 'friday' || win.mode === 'saturday') &&
      !getChallengeTarget(commitTime, win.mode);

    if (!hasCommitment || needsChallengeTarget) {
      if (win.mode === 'friday' || win.mode === 'saturday') {
        if (canSetChallengeTarget(day, mins)) {
          openChallengePicker(win.mode);
        }
        return;
      }
      if (!hasCommitment) {
        setShowCommitBtn(true);
        return;
      }
    }
    if (todayStamped) return;

    const now  = new Date();
    if (win.mode === 'friday' || win.mode === 'saturday') {
      const target = getChallengeTarget(commitTime, win.mode);
      if (!target) return;
      if (!win.open || !isTargetTimeReached(target)) return;
      setShowDailyStamp(true);
    } else {
      const gate = new Date(now);
      gate.setHours(commitTime.hour, commitTime.minute, 0, 0);
      if (now >= gate) setShowDailyStamp(true);
    }
  }

  async function handleDailyStamp() {
    setStampError(null);
    const win = getStampWindowStatus(getDeviceTimezone());
    setStampWindow(win);
    if (!win.open) {
      setStampError(stampErrorMessage('WINDOW_CLOSED', win.message));
      return;
    }
    if (win.mode === 'friday' || win.mode === 'saturday') {
      const target = getChallengeTarget(commitTime, win.mode);
      if (!target) {
        setStampError(stampErrorMessage('CHALLENGE_TIME_REQUIRED'));
        return;
      }
      if (!isTargetTimeReached(target)) {
        setStampError(`החתימה נפתחת ב-${String(target.hour).padStart(2, '0')}:${String(target.minute).padStart(2, '0')}`);
        return;
      }
    }
    if (!gameToken) {
      setStampError(stampErrorMessage('GAME_TOKEN_REQUIRED'));
      return;
    }
    const result = await saveGameStamp(calendarDay, gameToken);
    if (!result.ok) {
      telemetry.stampAttempt(false, null, result.error, 'Games');
      setStampError(stampErrorMessage(result.error, result.message));
      return;
    }

    telemetry.stampAttempt(true, result.ms_diff ?? null, null, 'Games');
    const updatedLog = { ...gameLog, [calendarDay]: { msDiff: result.ms_diff ?? 0, score: result.score || 1, stampedAt: new Date().toISOString() } };
    setGameLog(updatedLog);

    const alreadyUnlocked = await getVoiceUnlocked();
    if (!alreadyUnlocked && countStreak(updatedLog, calendarDay) >= 7) {
      await setVoiceUnlocked();
      setVoiceJustUnlocked(true);
    }

    setStampAccuracy(result.ms_diff ?? 0);
  }

  function handleStampDone() {
    setShowDailyStamp(false);
    setStampAccuracy(null);
    setTodayStamped(true);
    if (voiceJustUnlocked) {
      setVoiceJustUnlocked(false);
      setShowVoiceUnlock(true);
      return;
    }
    navigation.navigate('VerMillion');
  }

  async function handleCommit(hour, minute) {
    const res = await saveCommitmentTime(hour, minute);
    if (!res?.ok) {
      const msg = stampErrorMessage(res?.error || 'DNA_LOCKED');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('שעה נעולה', msg);
      return;
    }
    const saved = await getCommitmentTime();
    setCommitTime(saved);
    setHasCommitment(true);
    setShowCommitBtn(false);
    setShowTimePicker(false);
    setShowModal(true);
  }

  function openChallengePicker(mode) {
    setShowCommitBtn(false);
    setShowTimePicker(false);
    const existing = getChallengeTarget(commitTime, mode);
    const def = existing || getDefaultChallengeHM(mode);
    const clamped = clampChallengeHM(mode, def.hour, def.minute);
    setPickedChallengeMins(hmToMins(clamped.hour, clamped.minute));
    setChallengePickerMode(mode);
  }

  async function handleChallengeCommit() {
    if (!challengePickerMode) return;
    const { hour, minute } = minsToHM(pickedChallengeMins);
    const res = await saveChallengeTarget(challengePickerMode, hour, minute);
    if (!res.ok) {
      const msg = stampErrorMessage(res.error);
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('שעה לא תקינה', msg);
      return;
    }
    const saved = await getCommitmentTime();
    setCommitTime(saved);
    setChallengePickerMode(null);
  }

  if (activeGame) {
    return (
      <Animated.View style={[styles.gameFullscreen, { opacity: fadeAnim, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.exitBtn} onPress={() => {
          setActiveGame(null);
          if (!hasCommitment) setShowCommitBtn(true);
        }}>
          <Text style={styles.exitBtnText}>✕ יציאה</Text>
        </TouchableOpacity>
        {activeGame === 'runner'    && <RunnerGame    onFinish={handleGameFinish} />}
        {activeGame === 'breakout'  && <BreakoutGame  onFinish={handleGameFinish} />}
        {activeGame === 'obstacle'  && <ObstacleGame  onFinish={handleGameFinish} />}
        {activeGame === 'bubblepop' && <BubblePopGame onFinish={handleGameFinish} />}
        {activeGame === 'reflex'    && <ReflexGame    onFinish={handleGameFinish} />}
        {activeGame === 'timing'    && <TimingGame    onFinish={handleGameFinish} />}
        {activeGame === 'speedtap'  && <SpeedTapGame   onFinish={handleGameFinish} />}
        {activeGame === 'stack'     && <StackGame      onFinish={handleGameFinish} />}
        {activeGame === 'catch'     && <CatchGame      onFinish={handleGameFinish} />}
        {activeGame === 'taprhythm' && <TapRhythmGame  onFinish={handleGameFinish} />}
        {activeGame === 'pingpong'  && <PingPongGame   onFinish={handleGameFinish} />}
        {activeGame === 'memorytap' && <MemoryTapGame  onFinish={handleGameFinish} />}
        {activeGame === 'colorboom' && <ColorBoomGame  onFinish={handleGameFinish} />}
        {activeGame === 'whackmole' && <WhackMoleGame  onFinish={handleGameFinish} />}
        {activeGame === 'dodge'     && <DodgeGame      onFinish={handleGameFinish} />}
        {activeGame === 'bullseye'  && <BullseyeGame   onFinish={handleGameFinish} />}
        {activeGame === 'sort'        && <SortGame        onFinish={handleGameFinish} />}
        {activeGame === 'mathsprint'  && <MathSprintGame  onFinish={handleGameFinish} />}
        {activeGame === 'cardflip'    && <CardFlipGame    onFinish={handleGameFinish} />}
        {activeGame === 'safecracker' && <SafeCrackerGame onFinish={handleGameFinish} />}
        {activeGame === 'wordsnap'    && <WordSnapGame    onFinish={handleGameFinish} />}
        {activeGame === 'taporder'    && <TapOrderGame    onFinish={handleGameFinish} />}
        {activeGame === 'numberline'  && <NumberLineGame  onFinish={handleGameFinish} />}
        {activeGame === 'stockticker' && <StockTickerGame onFinish={handleGameFinish} />}
        {activeGame === 'pincrack'    && <PinCrackGame    onFinish={handleGameFinish} />}
        {activeGame === 'scale'       && <ScaleGame       onFinish={handleGameFinish} />}
        {activeGame === 'chaintap'    && <ChainTapGame    onFinish={handleGameFinish} />}
        {activeGame === 'flashcount'  && <FlashCountGame  onFinish={handleGameFinish} />}
        {activeGame === 'speedmatch'  && <SpeedMatchGame  onFinish={handleGameFinish} />}
        {activeGame === 'mathchain'   && <MathChainGame   onFinish={handleGameFinish} />}
        {activeGame === 'diceadd'     && <DiceAddGame     onFinish={handleGameFinish} />}
      </Animated.View>
    );
  }

  // יום 2+: מסך חיתום דיוק יומי
  if (challengePickerMode) {
    const cfg = getChallengeConfig(challengePickerMode);
    const { hour, minute } = minsToHM(pickedChallengeMins);
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return (
      <View style={[styles.commitScreen, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => setChallengePickerMode(null)} style={tp.backBtn}>
          <Text style={tp.backText}>← חזור</Text>
        </TouchableOpacity>
        <Text style={tp.title}>מתי תחתום ב{cfg.labelHe}?</Text>
        <Text style={tp.sub}>בטווח {cfg.openLabel} – {cfg.closeLabel} (שעון מקומי)</Text>
        <View style={tp.row}>
          <View style={tp.col}>
            <TouchableOpacity
              onPress={() => setPickedChallengeMins((m) => Math.min(cfg.closeMins, m + 5))}
              style={tp.arrow}
            ><Text style={tp.arrowText}>▲</Text></TouchableOpacity>
            <Text style={tp.digit}>{hh}:{mm}</Text>
            <TouchableOpacity
              onPress={() => setPickedChallengeMins((m) => Math.max(cfg.openMins, m - 5))}
              style={tp.arrow}
            ><Text style={tp.arrowText}>▼</Text></TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={tp.confirmBtn} onPress={handleChallengeCommit} activeOpacity={0.85}>
          <Text style={tp.confirmText}>נעל {hh}:{mm} ל{cfg.labelHe} 🔒</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showDailyStamp) {
    const stampTarget = (stampWindow.mode === 'friday' || stampWindow.mode === 'saturday')
      ? getChallengeTarget(commitTime, stampWindow.mode)
      : commitTime;
    const h = stampTarget ? String(stampTarget.hour).padStart(2,'0')   : '--';
    const m = stampTarget ? String(stampTarget.minute).padStart(2,'0') : '--';
    const accuracySec = stampAccuracy !== null ? Math.round(stampAccuracy / 1000) : null;
    const accuracyLabel =
      accuracySec === null ? null :
      accuracySec < 30     ? `${accuracySec} שניות — מדהים! 🎯` :
      accuracySec < 120    ? `${accuracySec} שניות — טוב מאוד 💪` :
      `${Math.round(accuracySec / 60)} דקות — תשפר מחר`;

    return (
      <View style={[styles.commitScreen, { paddingTop: insets.top + 20 }]}>
        <Text style={ds.dayLabel}>יום {activeDay} / 7</Text>
        {(() => {
          const sv = getDayScheduleView(commitTime);
          return (
            <>
              <Text style={ds.title}>{sv.headline}</Text>
              <Text style={ds.commitTimeDisplay}>{h}:{m}</Text>
              {sv.windowLine ? <Text style={ds.sub}>{sv.windowLine}</Text> : null}
              <Text style={ds.subHint}>{sv.nowLine}</Text>
              <Text style={ds.sub}>
                {stampWindow.mode === 'weekday'
                  ? 'חתום קרוב לשעת ה-DNA שקבעת בהרשמה'
                  : 'חתום קרוב לשעה שבחרת לאתגר — בתוך הטווח'}
              </Text>
            </>
          );
        })()}

        {stampAccuracy === null ? (
          <>
            {stampWindow.mode === 'weekday' ? (
              <>
                <Text style={ds.sub}>כבש את הרגע — לחץ כמה שיותר קרוב לשעת ה-DNA שקבעת בהרשמה</Text>
                <Text style={ds.subHint}>הניקוד לפי השעון המקומי שלך עכשיו (איפה שאתה נמצא)</Text>
              </>
            ) : null}
            {stampError ? <Text style={ds.stampErr}>{stampError}</Text> : null}
            <TouchableOpacity
              style={[ds.stampBtn, (!stampWindow.open || !gameToken) && ds.stampBtnDisabled]}
              onPress={handleDailyStamp}
              activeOpacity={0.85}
              disabled={!stampWindow.open || !gameToken}
            >
              <Text style={ds.stampBtnText}>⏱ חתום עכשיו</Text>
            </TouchableOpacity>
            {!stampWindow.open && stampWindow.message ? (
              <Text style={ds.windowClosed}>{stampWindow.message}</Text>
            ) : null}
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
          <TouchableOpacity onPress={() => setShowTimePicker(false)} style={tp.backBtn}>
            <Text style={tp.backText}>← חזור</Text>
          </TouchableOpacity>
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
        <GlassButton onPress={() => {
          const win = getStampWindowStatus(getDeviceTimezone());
          if (win.mode === 'friday' || win.mode === 'saturday') {
            const { day, mins } = getLocalTimeParts(new Date(), getDeviceTimezone());
            if (canSetChallengeTarget(day, mins)) openChallengePicker(win.mode);
            return;
          }
          setShowTimePicker(true);
        }} />
      </View>
    );
  }

  // ── Calendar helpers ──────────────────────────────────────────
  const now         = new Date();
  const monthName   = MONTH_HE[now.getMonth()];
  const year        = now.getFullYear();
  const today       = now.getDate();
  const firstDow    = new Date(year, now.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const calCells    = [];
  for (let i = 0; i < firstDow; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);
  while (calCells.length % 7 !== 0) calCells.push(null);

  const stampsThisMonth = Object.values(gameLog).filter(e => {
    const d = new Date(e?.stampedAt || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === year;
  }).length;

  const avatarStyle = (() => {
    try {
      const raw = typeof profile?.avatar_style === 'string'
        ? JSON.parse(profile.avatar_style) : (profile?.avatar_style || {});
      return raw;
    } catch { return {}; }
  })();
  const vCoins = profile?.v_coins ?? 0;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={lob.header}>
          <View>
            <Text style={lob.seasonLabel}>לוח עונות</Text>
            <Text style={lob.monthTitle}>{monthName} {year}</Text>
          </View>
          <View style={lob.headerRight}>
            <View style={lob.coinChip}>
              <Text style={lob.coinText}>💰 {vCoins.toLocaleString('he-IL')}</Text>
            </View>
            {userRank && (
              <View style={lob.rankChip}>
                <Text style={lob.rankText}>#{userRank}</Text>
              </View>
            )}
          </View>
        </View>

        <WindowWarningBanner warning={windowWarning} />

        {/* ── 4 Category Cards — free play ── */}
        <View style={lob.categoriesWrap}>
          <Text style={lob.categoriesTitle}>שחק חופשי לפי קטגוריה</Text>
          <View style={lob.categoriesRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[lob.catCard, { borderColor: cat.color + '55' }]}
                onPress={() => playCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={lob.catEmoji}>{cat.emoji}</Text>
                <Text style={[lob.catLabel, { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            )            )}
          </View>
        </View>

        {hasCommitment ? <DayScheduleBanner commitTime={commitTime} /> : null}

        {/* ── Calendar ── */}
        <View style={lob.calendarSection}>
          <View style={lob.dayHeaders}>
            {['א','ב','ג','ד','ה','ו','ש'].map(d => (
              <Text key={d} style={lob.dayHeader}>{d}</Text>
            ))}
          </View>

          <View style={lob.calGrid}>
            {calCells.map((day, i) => {
              const stamped = day && !!gameLog[day] &&
                new Date(gameLog[day]?.stampedAt).toDateString() === new Date(year, now.getMonth(), day).toDateString();
              const isToday  = day === today;
              const isPast   = day && day < today;
              const isFuture = day && day > today;
              const isActive = isToday || isPast;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    lob.dayCell,
                    isToday  && lob.dayCellToday,
                    stamped  && lob.dayCellStamped,
                    isFuture && lob.dayCellLocked,
                  ]}
                  onPress={() => isActive && selectGame(getDailyGame(day))}
                  activeOpacity={isActive ? 0.7 : 1}
                  disabled={!isActive || !day}
                >
                  {day ? (
                    <>
                      <Text style={[lob.dayNum, isToday && lob.dayNumToday, stamped && lob.dayNumStamped, isFuture && lob.dayNumLocked]}>
                        {day}
                      </Text>
                      {stamped  && <View style={lob.stampDot} />}
                      {isToday  && !stamped && <View style={lob.todayDot} />}
                    </>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Avatar Row ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate('VerMillion')}
          activeOpacity={0.85}
          style={lob.avatarRow}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Avatar3D
              archetype={avatarStyle.archetype || 'builder'}
              userId={user?.id}
              seed={avatarStyle.seed}
              equipment={getUnlockedEquipment(vCoins)}
              overrides={getEffectiveOverrides(avatarStyle.overrides, profile?.equipment)}
              size={100}
              showGlow={true}
              accentColor="#C0392B"
            />
          </Animated.View>
          <View style={lob.avatarLabel}>
            <Text style={lob.avatarLabelText}>VerMillion שלך</Text>
            <Text style={lob.avatarLabelSub}>לחץ לשיחה</Text>
          </View>
        </TouchableOpacity>

        {/* ── Stats Row ── */}
        <View style={lob.statsRow}>
          <View style={lob.statChip}>
            <Text style={lob.statVal}>{stampsThisMonth}</Text>
            <Text style={lob.statLabel}>השלמות החודש</Text>
          </View>
          <View style={lob.statDivider} />
          <View style={lob.statChip}>
            <Text style={lob.statVal}>{leaderScore.toLocaleString()}</Text>
            <Text style={lob.statLabel}>ניקוד כולל</Text>
          </View>
          <View style={lob.statDivider} />
          <View style={lob.statChip}>
            <Text style={lob.statVal}>{daysLeft}</Text>
            <Text style={lob.statLabel}>ימים לסיום</Text>
          </View>
        </View>

        {/* ── Daily stamp status ── */}
        {hasCommitment && (
          <DailyStampCard
            commitTime={commitTime}
            todayStamped={todayStamped}
            stampWindow={stampWindow}
            onSetChallengeTime={openChallengePicker}
          />
        )}

        {sessionScore > 0 && (
          <View style={styles.sessionBanner}>
            <Text style={styles.sessionText}>+{sessionScore} נקודות הסשן האחרון 🔥</Text>
          </View>
        )}

        {/* ── Prize card ── */}
        <View style={styles.prizeCard}>
          <Text style={styles.prizeTitle}>🏆 קופת פרסים שבועית</Text>
          <Text style={styles.prizeAmount}>
            {weeklyPool > 0 ? `₪${weeklyPool.toLocaleString('he-IL')}` : '—'}
          </Text>
          <Text style={styles.prizeSub}>
            {activeSubs > 0 ? `${activeSubs.toLocaleString('he-IL')} משתתפים פעילים` : 'טוען...'}
          </Text>
        </View>
      </ScrollView>

      <CommitModal
        visible={showModal}
        time={commitTime}
        onClose={() => setShowModal(false)}
      />
      <RealWeekIntroModal
        visible={showRealWeekIntro}
        onDismiss={() => {
          try {
            const seenKey = `@vermillion/real_week_intro_seen/${user?.id || 'local'}`;
            if (typeof localStorage !== 'undefined') localStorage.setItem(seenKey, '1');
          } catch {}
          setShowRealWeekIntro(false);
        }}
      />
      <VoiceUnlockModal
        visible={showVoiceUnlock}
        onDismiss={() => { setShowVoiceUnlock(false); navigation.navigate('VerMillion'); }}
      />
    </>
  );
}

// ─── Lobby styles ──────────────────────────────────────────────
const lob = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  seasonLabel: { color: '#C0392B', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  monthTitle:  { color: '#FFF', fontSize: 22, fontWeight: '900' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  coinChip:    { backgroundColor: '#1A1400', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#D4AF3744' },
  coinText:    { color: '#D4AF37', fontSize: 13, fontWeight: '800' },
  rankChip:    { backgroundColor: '#1A0808', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#C0392B44' },
  rankText:    { color: '#C0392B', fontSize: 13, fontWeight: '800' },
  windowBanner: {
    backgroundColor: '#1A1208', borderRadius: 12, borderWidth: 1, borderColor: '#D4AF3744',
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  windowBannerText: { color: '#D4AF37', fontSize: 13, fontWeight: '700', textAlign: 'right', lineHeight: 20 },

  categoriesWrap: { marginBottom: 14 },
  categoriesTitle: { color: '#333', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  categoriesRow: { flexDirection: 'row', gap: 8 },
  catCard: {
    flex: 1, backgroundColor: '#0F0F0F', borderRadius: 14, borderWidth: 1,
    paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  catEmoji: { fontSize: 20 },
  catLabel: { fontSize: 11, fontWeight: '800' },

  calendarSection: { backgroundColor: '#0D0D0D', borderRadius: 18, borderWidth: 1, borderColor: '#1A1A1A', overflow: 'hidden', marginBottom: 14 },
  dayHeaders: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  dayHeader:  { flex: 1, textAlign: 'center', color: '#C0392B', fontSize: 11, fontWeight: '800' },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingBottom: 8 },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, marginVertical: 2,
  },
  dayCellToday:   { backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#C0392B88' },
  dayCellStamped: { backgroundColor: '#0A1A0A' },
  dayCellLocked:  { opacity: 0.25 },
  dayNum:         { color: '#666', fontSize: 13, fontWeight: '600' },
  dayNumToday:    { color: '#C0392B', fontWeight: '900', fontSize: 14 },
  dayNumStamped:  { color: '#27AE60', fontWeight: '800' },
  dayNumLocked:   { color: '#222' },
  stampDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: '#27AE60', marginTop: 1 },
  todayDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C0392B', marginTop: 1 },

  avatarRow: {
    alignItems: 'center',
    backgroundColor: '#0D0D0D', borderRadius: 18, borderWidth: 1, borderColor: '#1A1A1A',
    paddingVertical: 12, marginBottom: 14, overflow: 'hidden',
  },
  avatarLabel: { alignItems: 'center', gap: 2 },
  avatarLabelText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  avatarLabelSub:  { color: '#C0392B', fontSize: 11, fontWeight: '700' },

  statsRow:    { flexDirection: 'row', backgroundColor: '#0F0F0F', borderRadius: 16, borderWidth: 1, borderColor: '#1A1A1A', padding: 14, marginBottom: 14, justifyContent: 'space-around', alignItems: 'center' },
  statChip:    { alignItems: 'center' },
  statVal:     { color: '#FFF', fontSize: 20, fontWeight: '900' },
  statLabel:   { color: '#444', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#1E1E1E' },
});

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0A0A' },
  content:    { paddingHorizontal: 16, paddingBottom: 40 },
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
  hintLocked:     { color: '#555', fontSize: 12, textAlign: 'right' },
  setTimeBtn:     { marginTop: 14, backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  setTimeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
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
  stampBtnText:      { color: '#FFF', fontSize: 18, fontWeight: '900' },
  stampBtnDisabled:  { opacity: 0.45 },
  stampErr:          { color: '#E74C3C', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  windowClosed:      { color: '#D4AF37', fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  accuracy:          { color: '#27AE60', fontSize: 18, fontWeight: '800', marginBottom: 40, textAlign: 'center' },
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
  backBtn:    { alignSelf: 'flex-start', padding: 12, marginBottom: 8 },
  backText:   { color: '#C0392B', fontSize: 15, fontWeight: '700' },
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

// ─── Real Week Intro styles ─────────────────────────────────────
const rwi = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#111', borderRadius: 20, padding: 24, width: '100%',
    borderWidth: 1, borderColor: '#C0392B44',
  },
  headline: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  sub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  infoRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: '#C0392B22', alignItems: 'center', gap: 4,
  },
  infoIcon:  { fontSize: 20 },
  infoTitle: { color: '#C0392B', fontSize: 13, fontWeight: '900' },
  infoDesc:  { color: '#666', fontSize: 10, textAlign: 'center', lineHeight: 15 },
  infoScore: { color: '#555', fontSize: 10, fontWeight: '700' },
  note: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  btn: {
    backgroundColor: '#C0392B', borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
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
