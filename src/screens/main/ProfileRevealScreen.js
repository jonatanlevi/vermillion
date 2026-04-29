import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOnboardingState } from '../../services/storage';
import { computeFinancialMetrics, calcCompletion, getBlindSpots } from '../../data/dailyQuestions';
import { classifyTier } from '../../services/financialTier';
import { chatWithAI, resetConversation } from '../../services/aiService';

const TIER_LABELS = {
  0: { label: 'עיוור', color: '#555555', emoji: '🌫️' },
  1: { label: 'ייצוב', color: '#E74C3C', emoji: '🔴' },
  2: { label: 'שרידות', color: '#E67E22', emoji: '🟠' },
  3: { label: 'בנייה', color: '#2980B9', emoji: '🔵' },
  4: { label: 'אופטימיזציה', color: '#27AE60', emoji: '🟢' },
};

const PROFILE_PROMPT = (userData, metrics, tierObj) => {
  const fmt = (n) => (n > 0 ? `₪${n.toLocaleString('he-IL')}` : '—');
  const m = metrics;
  return `בהתבסס על הנתונים הבאים של המשתמש, כתוב אפיון אישי תמציתי ב-4-5 משפטים.
פתח עם "VerMillion מכיר אותך עכשיו:" ואז תאר מי עומד מולי: המצב המשפחתי, סוג העסקה,
המצב הפיננסי בפועל (מספרים), האתגר העיקרי, והיעד. סיים עם משפט אחד על הצעד הראשון המומלץ.
כתוב בגוף שני (אתה) בעברית, ישיר וחד.

פרופיל:
- מצב משפחתי: ${m.familyStatus || 'לא מצוין'}
- סוג תעסוקה: ${m.employmentType || 'לא מצוין'}
- הכנסה חודשית: ${fmt(m.totalIncome)}
- הוצאות חודשיות: ${fmt(m.totalExpenses)}
- עודף/גירעון: ${fmt(m.monthlySurplus)} (${m.savingsRate}%)
- סך חובות: ${fmt(m.totalDebt)}
- שווי נקי: ${fmt(m.netWorth)}
- כרית ביטחון: ${m.monthsEmergency !== null ? `${m.monthsEmergency} חודשים` : 'לא ידוע'}
- שלב פיננסי: ${tierObj.label}
- מטרה עיקרית: ${m.moneyGoal || 'לא מצוין'}
- מחסום חיסכון: ${m.savingObstacle || 'לא מצוין'}`;
};

export default function ProfileRevealScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profileText, setProfileText] = useState('');
  const [generating, setGenerating] = useState(true);
  const [aiFailed, setAiFailed] = useState(false);
  const [onboardingState, setOnboardingState] = useState(null);
  const [stateLoading, setStateLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function init() {
      const state = await getOnboardingState();
      if (!mountedRef.current) return;
      setOnboardingState(state);
      setStateLoading(false);
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    init();
    return () => {
      mountedRef.current = false;
      loop.stop();
    };
  }, []);

  useEffect(() => {
    if (!stateLoading && onboardingState) generateProfile();
  }, [stateLoading]);

  const { metrics, tier, tierBadge, blindSpots } = useMemo(() => {
    const answers = onboardingState || {};
    const m = computeFinancialMetrics(answers);
    const comp = calcCompletion(answers);
    const t = classifyTier(m, comp);
    const tb = TIER_LABELS[t.tier] || TIER_LABELS[0];
    const bs = getBlindSpots(answers);
    return { metrics: m, tier: t, tierBadge: tb, blindSpots: bs };
  }, [onboardingState]);

  async function generateProfile() {
    if (!mountedRef.current) return;
    setGenerating(true);
    setAiFailed(false);
    setProfileText('');
    fadeAnim.setValue(0);
    const userObj = { registrationDate: onboardingState?.startDate || new Date().toISOString(), dailyAnswers: onboardingState || {} };
    try {
      resetConversation();
      const prompt = PROFILE_PROMPT(userObj, metrics, tier);
      const result = await chatWithAI(prompt, userObj, (partial) => {
        if (mountedRef.current) setProfileText(partial);
      }, 8);
      if (!mountedRef.current) return;
      const textOk = result && String(result).trim().length > 0;
      if (!textOk) {
        setProfileText(buildFallbackProfile(metrics, tier));
        setAiFailed(true);
      }
    } catch {
      if (mountedRef.current) {
        setProfileText(buildFallbackProfile(metrics, tier));
        setAiFailed(true);
      }
    }
    if (mountedRef.current) {
      setGenerating(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }
  }

  const handleApprove = () => {
    navigation.navigate('MainTabs');
  };

  const handleRetry = () => {
    generateProfile();
  };

  if (stateLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <View style={[styles.tierBadge, { borderColor: tierBadge.color }]}>
          <Text style={styles.tierEmoji}>{tierBadge.emoji}</Text>
          <Text style={[styles.tierBadgeLabel, { color: tierBadge.color }]}>{tierBadge.label}</Text>
        </View>
        <Text style={styles.title}>האפיון שלך מוכן</Text>
        <Text style={styles.sub}>VerMillion ניתח 7 ימים של נתונים</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="הכנסה" value={metrics.totalIncome > 0 ? `₪${metrics.totalIncome.toLocaleString()}` : '—'} accent="#27AE60" />
        <MetricCard label="הוצאות" value={metrics.totalExpenses > 0 ? `₪${metrics.totalExpenses.toLocaleString()}` : '—'} accent="#E67E22" />
        <MetricCard label="עודף" value={metrics.totalIncome > 0 ? `${metrics.savingsRate}%` : '—'} accent={metrics.savingsRate >= 0 ? '#27AE60' : '#E74C3C'} />
        <MetricCard label="שווי נקי" value={metrics.netWorth !== 0 ? `₪${metrics.netWorth.toLocaleString()}` : '—'} accent="#C0392B" />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <View style={styles.aiDot} />
          <Text style={styles.profileCardTitle}>VerMillion AI — אפיון אישי</Text>
        </View>

        {generating ? (
          <View style={styles.loadingWrap}>
            <Animated.View style={[styles.loadingPulse, { opacity: pulseAnim }]} />
            <Text style={styles.loadingText}>VerMillion מנתח 7 ימים של מידע...</Text>
            <Text style={styles.loadingSubtext}>זה לוקח עד 30 שניות</Text>
          </View>
        ) : (
          <>
            {aiFailed ? (
              <Text style={styles.fallbackBanner}>הפרופיל נוצר מהמספרים שלך — AI Coach יעדכן בקרוב</Text>
            ) : null}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.profileText}>{profileText}</Text>
            </Animated.View>
            {aiFailed ? (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                <Text style={styles.retryBtnText}>נסה שוב</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>

      <View style={[styles.tierCard, { borderColor: tier.color }]}>
        <Text style={[styles.tierCardTitle, { color: tier.color }]}>{tier.emoji} שלב {tier.tier}: {tier.label}</Text>
        <Text style={styles.tierCardDesc}>{tier.description}</Text>
        <Text style={styles.tierCardFocus}>הפוקוס שלך: {tier.focus_hebrew}</Text>
      </View>

      {blindSpots.length > 0 ? (
        <View style={styles.blindSpotsCard}>
          <Text style={styles.blindSpotsTitle}>👁 נקודות שVerMillion עדיין לא מכיר</Text>
          {blindSpots.slice(0, 3).map((b) => (
            <Text key={b.key} style={styles.blindSpotItem}>• {b.blindSpot}</Text>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('DailyQuestions')} activeOpacity={0.85}>
            <Text style={styles.blindSpotsAction}>השלם ← (+{blindSpots.length} נקודות)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!generating ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DailyQuestions')} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>✏️ תקן פרט</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.88}>
            <Text style={styles.approveBtnText}>✅ זה אני — נמשיך</Text>
          </TouchableOpacity>
        </View>
      ) : null}

    </ScrollView>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function _computeAge(dob) {
  if (!dob) return 0;
  const { dobD, dobM, dobY } = dob;
  if (!dobD || !dobM || !dobY) return 0;
  const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

function buildFallbackProfile(metrics, tier) {
  const fmt = (n) => (n > 0 ? `₪${n.toLocaleString('he-IL')}` : '—');
  return `VerMillion מכיר אותך עכשיו: הכנסה חודשית ${fmt(metrics.totalIncome)}, ` +
    `הוצאות ${fmt(metrics.totalExpenses)}, עודף ${fmt(metrics.monthlySurplus)} (${metrics.savingsRate}%). ` +
    `שווי נקי: ${fmt(metrics.netWorth)}. ` +
    `אתה בשלב ${tier.label} — ${tier.description} ` +
    `הצעד הראשון: ${tier.firstStep}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 50 },

  header: { alignItems: 'center', marginBottom: 24 },
  tierBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#111111',
  },
  tierEmoji: { fontSize: 16 },
  tierBadgeLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, textAlign: 'right', alignSelf: 'stretch' },
  sub: { color: '#888888', fontSize: 14, textAlign: 'right', alignSelf: 'stretch' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  metricValue: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  metricLabel: { color: '#888888', fontSize: 12, textAlign: 'center' },

  profileCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  profileCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  profileCardTitle: { color: '#888888', fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },

  loadingWrap: { alignItems: 'center', paddingVertical: 24 },
  loadingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C0392B',
    marginBottom: 16,
  },
  loadingText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  loadingSubtext: { color: '#888888', fontSize: 13, textAlign: 'center' },

  fallbackBanner: {
    color: '#F0C040',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20,
  },
  profileText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24, textAlign: 'right' },

  retryBtn: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C0392B',
  },
  retryBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '800' },

  tierCard: { borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1.5, backgroundColor: '#111111' },
  tierCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6, textAlign: 'right' },
  tierCardDesc: { color: '#888888', fontSize: 14, lineHeight: 20, marginBottom: 6, textAlign: 'right' },
  tierCardFocus: { color: '#C0392B', fontSize: 13, fontWeight: '700', textAlign: 'right' },

  blindSpotsCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  blindSpotsTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 12 },
  blindSpotItem: { color: '#888888', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 6 },
  blindSpotsAction: { color: '#F0C040', fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: 10 },

  actionRow: { flexDirection: 'row-reverse', gap: 12 },
  editBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  editBtnText: { color: '#888888', fontSize: 14, fontWeight: '700' },
  approveBtn: { flex: 2, backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  approveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
