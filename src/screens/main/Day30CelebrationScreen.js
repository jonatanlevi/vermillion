import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { getOnboardingState } from '../../services/storage';
import { calcStreak } from '../../services/timeEngine';
import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../../services/financialTier';
import Avatar3D from '../../components/Avatar3D';

const CONFETTI_COLORS = ['#C0392B', '#D4AF37', '#27AE60', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6'];

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      x: useRef(new Animated.Value(Math.random() * 100)).current,
      y: useRef(new Animated.Value(-10 - Math.random() * 80)).current,
      r: useRef(new Animated.Value(0)).current,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      speed: 2000 + Math.random() * 2000,
      delay: Math.random() * 800,
    }))
  ).current;

  useEffect(() => {
    pieces.forEach(p => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.y, { toValue: 110, duration: p.speed, useNativeDriver: false }),
            Animated.timing(p.r, { toValue: 360, duration: p.speed, useNativeDriver: false }),
          ]),
          Animated.timing(p.y, { toValue: -10, duration: 0, useNativeDriver: false }),
          Animated.timing(p.r, { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            top: p.y.interpolate({ inputRange: [-10, 110], outputRange: ['-10%', '110%'] }),
            width: p.size,
            height: p.size / 1.5,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: [{ rotate: p.r.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
            opacity: 0.85,
          }}
        />
      ))}
    </View>
  );
}

export default function Day30CelebrationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [onbState, setOnbState] = useState(null);

  const heroOp    = useRef(new Animated.Value(0)).current;
  const statsOp   = useRef(new Animated.Value(0)).current;
  const statsY    = useRef(new Animated.Value(30)).current;
  const btnOp     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getOnboardingState().then(setOnbState);
    Animated.sequence([
      Animated.timing(heroOp,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(statsOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(statsY,  { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(btnOp,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const dailyAnswers = onbState || {};
  const regDate      = onbState?.startDate || new Date().toISOString();
  const streak       = calcStreak(dailyAnswers, regDate);
  const completion   = calcCompletion(dailyAnswers);
  const metrics      = computeFinancialMetrics(dailyAnswers);
  const tier         = classifyTier(metrics, completion);
  const daysCompleted = (onbState?.daysCompleted || []).length;

  const avatarStyle  = (() => {
    try {
      const raw = profile?.avatar_style;
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    } catch { return {}; }
  })();

  async function handleShare() {
    try {
      await Share.share({
        message: `סיימתי אתגר 30 יום ב-VerMillion! 🏆\n${daysCompleted} ימים, streak של ${streak}, דרגה: ${tier.label} ${tier.emoji}\nצור את ה-VerMillion האישי שלך: vermillion-ashen.vercel.app`,
      });
    } catch (_) {}
  }

  return (
    <View style={s.root}>
      <Confetti />
      <LinearGradient colors={['#1A0800', '#0A0A0A', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[s.hero, { opacity: heroOp }]}>
          <Text style={s.trophy}>🏆</Text>
          <Text style={s.headline}>30 ימים הושלמו!</Text>
          <Text style={s.subheadline}>
            {profile?.name ? `${profile.name}, ` : ''}עברת את כל 30 ימי האתגר.{'\n'}
            VerMillion גאה בך.
          </Text>

          <View style={s.avatarWrap}>
            <Avatar3D
              archetype={avatarStyle?.archetype || 'builder'}
              userId={profile?.id}
              equipment={avatarStyle?.equipment || []}
              overrides={avatarStyle?.overrides || {}}
              size={120}
              showGlow={true}
              accentColor="#D4AF37"
            />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[s.statsWrap, { opacity: statsOp, transform: [{ translateY: statsY }] }]}>
          <View style={s.statsRow}>
            <StatCard value={`${daysCompleted}/30`} label="ימים הושלמו" color="#D4AF37" />
            <StatCard value={`${streak}🔥`}         label="שיא streak"  color="#E74C3C" />
          </View>
          <View style={s.statsRow}>
            <StatCard value={`${completion}%`}      label="פרופיל מלא"  color="#27AE60" />
            <StatCard value={`${tier.emoji} ${tier.label}`} label="דרגה כלכלית" color={tier.color} />
          </View>

          {/* Journey summary */}
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>מה השגת ב-30 יום</Text>
            <SummaryRow emoji="✅" text="הכרת את עצמך פיננסית לעומק" />
            <SummaryRow emoji="📊" text={`ניתחת ${completion}% מהפרופיל הכלכלי שלך`} />
            <SummaryRow emoji="🧠" text={`קיבלת ${daysCompleted} המלצות מותאמות אישית`} />
            <SummaryRow emoji="💪" text={`streak של ${streak} ימים רצוף`} />
          </View>

          {/* What's next */}
          <View style={s.nextCard}>
            <Text style={s.nextTitle}>מה עכשיו?</Text>
            <Text style={s.nextBody}>
              VerMillion ימשיך ללוות אותך. הידע שנצבר לא הולך לשום מקום —
              כל ייעוץ מבוסס על הפרופיל שבנית ב-30 הימים האחרונים.
            </Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[s.btns, { opacity: btnOp }]}>
          <TouchableOpacity style={s.btnShare} onPress={handleShare} activeOpacity={0.85}>
            <Text style={s.btnShareText}>📤 שתף את ההישג</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnHome}
            onPress={() => navigation.replace('MainTabs')}
            activeOpacity={0.85}
          >
            <Text style={s.btnHomeText}>ממשיך עם VerMillion ▶</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, color }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ emoji, text }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryEmoji}>{emoji}</Text>
      <Text style={s.summaryText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0A0A0A' },
  scroll:  { paddingHorizontal: 24, alignItems: 'center' },

  hero:           { alignItems: 'center', marginBottom: 32, gap: 12 },
  trophy:         { fontSize: 72 },
  headline:       { color: '#D4AF37', fontSize: 32, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  subheadline:    { color: '#888', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  avatarWrap:     { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', backgroundColor: '#111', borderWidth: 2, borderColor: '#D4AF3755', alignItems: 'center', justifyContent: 'center' },

  statsWrap: { width: '100%', gap: 12 },
  statsRow:  { flexDirection: 'row', gap: 12 },
  statCard:  { flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11 },

  summaryCard:  { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1E1E1E', gap: 12 },
  summaryTitle: { color: '#888', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryEmoji: { fontSize: 16 },
  summaryText:  { color: '#CCC', fontSize: 14, lineHeight: 20, flex: 1, textAlign: 'right' },

  nextCard:  { backgroundColor: '#0D1A0D', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#27AE6033' },
  nextTitle: { color: '#27AE60', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  nextBody:  { color: '#8DB88D', fontSize: 14, lineHeight: 22, textAlign: 'right' },

  btns:        { width: '100%', gap: 12, marginTop: 24 },
  btnShare:    { borderWidth: 1, borderColor: '#333', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnShareText:{ color: '#888', fontSize: 15, fontWeight: '700' },
  btnHome:     { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnHomeText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
