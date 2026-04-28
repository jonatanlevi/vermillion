import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockUser } from '../../mock/data';
import { computeFinancialMetrics } from '../../data/dailyQuestions';
import { classifyTier } from '../../services/financialTier';
import { chatWithAI } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';

const PROFILE_PROMPT = (metrics, tier) => {
  const fmt = (n) => n > 0 ? `₪${n.toLocaleString('he-IL')}` : '—';
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
- כרית ביטחון: ${m.monthsEmergency !== null ? m.monthsEmergency + ' חודשים' : 'לא ידוע'}
- שלב פיננסי: ${tier.label}
- מטרה עיקרית: ${m.moneyGoal || 'לא מצוין'}
- מחסום חיסכון: ${m.savingObstacle || 'לא מצוין'}`;
};

export default function ProfileRevealScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  const metrics = computeFinancialMetrics({
    ...mockUser.dailyAnswers,
    _age: { _computed_age: _computeAge(mockUser.dob) },
  });
  const tier = classifyTier(metrics, 100);

  useEffect(() => {
    mountedRef.current = true;
    generateProfile();
    return () => { mountedRef.current = false; };
  }, []);

  async function generateProfile() {
    const prompt = PROFILE_PROMPT(metrics, tier);
    try {
      await chatWithAI(prompt, mockUser, (partial) => {
        if (!mountedRef.current) return;
        setProfileText(partial);
        if (loading) setLoading(false);
      });
    } catch {
      if (mountedRef.current) {
        setProfileText(buildFallbackProfile(metrics, tier));
        setLoading(false);
      }
    }
    if (mountedRef.current) {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }
  }

  const handleApprove = () => {
    navigation.replace('MainTabs');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.tierBadge}>
          <Text style={styles.tierLabel}>{tier.label}</Text>
        </View>
        <Text style={styles.title}>{t.revealTitle}</Text>
        <Text style={styles.sub}>{t.revealSub}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label={t.revealMetricIncome}   value={metrics.totalIncome > 0 ? `₪${metrics.totalIncome.toLocaleString()}` : '—'} accent="#27AE60" />
        <MetricCard label={t.revealMetricExpenses}  value={metrics.totalExpenses > 0 ? `₪${metrics.totalExpenses.toLocaleString()}` : '—'} accent="#E67E22" />
        <MetricCard label={t.revealMetricSurplus}   value={metrics.totalIncome > 0 ? `${metrics.savingsRate}%` : '—'} accent={metrics.savingsRate >= 0 ? '#27AE60' : '#E74C3C'} />
        <MetricCard label={t.revealMetricNetWorth}  value={metrics.netWorth !== 0 ? `₪${metrics.netWorth.toLocaleString()}` : '—'} accent="#C0392B" />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <View style={styles.aiDot} />
          <Text style={styles.profileCardTitle}>{t.revealCardTitle}</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#C0392B" size="small" />
            <Text style={styles.loadingText}>{t.revealLoading}</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.profileText}>{profileText}</Text>
          </Animated.View>
        )}
      </View>

      <View style={[styles.tierCard, { borderColor: tier.color }]}>
        <Text style={[styles.tierCardTitle, { color: tier.color }]}>{tier.emoji} שלב {tier.tier}: {tier.label}</Text>
        <Text style={styles.tierCardDesc}>{tier.description}</Text>
        <Text style={styles.tierCardFocus}>{t.revealFocus(tier.focus_hebrew)}</Text>
      </View>

      {!loading && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DailyQuestions')} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>{t.revealEditBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.88}>
            <Text style={styles.approveBtnText}>{t.revealApproveBtn}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  const fmt = (n) => n > 0 ? `₪${n.toLocaleString('he-IL')}` : '—';
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
  tierBadge: { backgroundColor: '#1A0808', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 12, borderWidth: 1, borderColor: '#C0392B44' },
  tierLabel: { color: '#C0392B', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 6 },
  sub: { color: '#555', fontSize: 14 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
  metricValue: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  metricLabel: { color: '#555', fontSize: 12 },
  profileCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#C0392B44' },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  profileCardTitle: { color: '#888', fontSize: 13, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#C0392B', fontSize: 13 },
  profileText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24, textAlign: 'right' },
  tierCard: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1.5, backgroundColor: '#0D0D0D' },
  tierCardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  tierCardDesc: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  tierCardFocus: { color: '#C0392B', fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  editBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  editBtnText: { color: '#888', fontSize: 14, fontWeight: '700' },
  approveBtn: { flex: 2, backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  approveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
