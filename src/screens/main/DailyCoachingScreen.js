import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { computeFinancialMetrics } from '../../data/dailyQuestions';
import { classifyTier } from '../../services/financialTier';
import { getUserTimeStatus } from '../../services/timeEngine';
import { chatWithAI } from '../../services/aiService';
import { COACHING_DAYS } from '../../data/coachingContent';
import { getOnboardingState, saveOnboardingState, markDayComplete } from '../../services/storage';

export default function DailyCoachingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  const state = userData || {};
  const userObj = { registrationDate: state.startDate || new Date().toISOString(), dailyAnswers: state };
  const ts = getUserTimeStatus(userObj);
  const metrics = computeFinancialMetrics(state);
  const tier = classifyTier(metrics, 100);
  const dayContent = COACHING_DAYS[ts.currentDay] || COACHING_DAYS[9];
  const safeTier = Math.max(tier.tier, 1);
  const tierContent = dayContent[safeTier] || dayContent[1];

  useEffect(() => {
    mountedRef.current = true;
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    getOnboardingState().then(s => {
      if (!mountedRef.current) return;
      setUserData(s);
      const realTs = getUserTimeStatus({ registrationDate: s?.startDate || new Date().toISOString(), dailyAnswers: s || {} });
      setDone(!!s?.[realTs.currentDay]?._coaching || (s?.daysCompleted || []).includes(realTs.currentDay));
      loadTodayTip(s);
    });
    return () => { mountedRef.current = false; };
  }, []);

  async function loadTodayTip(s) {
    if (!s) return;
    setLoadingTip(true);
    const realUserObj = { registrationDate: s.startDate || new Date().toISOString(), dailyAnswers: s };
    const realMetrics = computeFinancialMetrics(s);
    const realTier = classifyTier(realMetrics, 100);
    const safeTierReal = Math.max(realTier.tier, 1);
    const realTs = getUserTimeStatus(realUserObj);
    const realDayContent = COACHING_DAYS[realTs.currentDay] || COACHING_DAYS[9];
    const realTierContent = realDayContent[safeTierReal] || realDayContent[1];
    const prompt = `בהתבסס על פרופיל המשתמש, תן טיפ פיננסי אחד קצר (3-4 משפטים) רלוונטי ל"${realTierContent.topic}". ישיר, מעשי, מותאם לשלב ${realTier.label}.`;
    try {
      await chatWithAI(prompt, realUserObj, (partial) => {
        if (mountedRef.current) setAiTip(partial);
      });
    } catch {
      if (mountedRef.current) setAiTip(realTierContent.fallbackTip);
    }
    if (mountedRef.current) setLoadingTip(false);
  }

  async function handleComplete() {
    if (!answer.trim()) return;
    const dayKey = ts.currentDay;
    await saveOnboardingState({
      [dayKey]: { _coaching: answer.trim(), _answeredAt: new Date().toISOString() },
    });
    await markDayComplete(dayKey);
    setDone(true);
  }

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>יום {ts.currentDay} הושלם</Text>
        <Text style={styles.doneSub}>מכפיל ×{ts.multiplier.toFixed(1)} · {ts.daysLeft} ימים לסיום</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>חזור לבית</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>יום {ts.currentDay}</Text>
          </View>
          <View style={[styles.tierPill, { backgroundColor: tier.color + '22', borderColor: tier.color + '44' }]}>
            <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.emoji} {tier.label}</Text>
          </View>
        </View>

        {/* Day 18 milestone */}
        {ts.currentDay === 18 && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneTitle}>🏁 מחצית הדרך — יום 18/30</Text>
            <Text style={styles.milestoneText}>עברת את הנקודה הקשה ביותר. 12 יום קדימה ופרס ₪45,000 מחכה לך.</Text>
          </View>
        )}

        {/* Topic */}
        <Text style={styles.topic}>{tierContent.topic}</Text>
        <Text style={styles.sub}>{tierContent.description}</Text>

        {/* AI Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.aiDot} />
            <Text style={styles.tipHeaderText}>VerMillion AI — טיפ היום</Text>
          </View>
          {loadingTip ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#C0392B" size="small" />
              <Text style={styles.loadingText}>VerMillion חושב...</Text>
            </View>
          ) : (
            <Text style={styles.tipText}>{aiTip || tierContent.fallbackTip}</Text>
          )}
        </View>

        {/* Challenge */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>🎯 אתגר היום</Text>
          <Text style={styles.challengeText}>{tierContent.challenge}</Text>
        </View>

        {/* Daily question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>שאלת היום</Text>
          <Text style={styles.questionText}>{tierContent.question}</Text>
          <TextInput
            style={styles.answerInput}
            placeholder="הכנס תשובה כאן..."
            placeholderTextColor="#333"
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

        {/* Multiplier notice */}
        {ts.isLate && (
          <View style={styles.lateWarning}>
            <Text style={styles.lateWarningText}>
              ⚠️ איחור של {ts.deviation}h · מכפיל ×{ts.multiplier.toFixed(1)} (בזמן = ×1.2)
            </Text>
          </View>
        )}

        {/* Complete button */}
        <TouchableOpacity
          style={[styles.completeBtn, !answer.trim() && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={!answer.trim()}
          activeOpacity={0.88}
        >
          <Text style={styles.completeBtnText}>
            סיים יום {ts.currentDay} · +{Math.round(100 * ts.multiplier)} נקודות
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 50 },

  milestoneCard: { backgroundColor: '#0A1A0A', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#27AE6044' },
  milestoneTitle: { color: '#27AE60', fontSize: 14, fontWeight: '900', marginBottom: 6 },
  milestoneText: { color: '#A0D0A0', fontSize: 14, lineHeight: 20, textAlign: 'right' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  backBtn: { padding: 8 },
  backText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  dayBadge: { backgroundColor: '#C0392B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  dayBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  tierPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  tierPillText: { fontSize: 12, fontWeight: '700' },

  topic: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 8, textAlign: 'right' },
  sub: { color: '#666', fontSize: 15, lineHeight: 22, marginBottom: 24, textAlign: 'right' },

  tipCard: { backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#C0392B33' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  tipHeaderText: { color: '#888', fontSize: 13 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#C0392B', fontSize: 13 },
  tipText: { color: '#E0E0E0', fontSize: 15, lineHeight: 24, textAlign: 'right' },

  challengeCard: { backgroundColor: '#0D1A0D', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1A3A1A' },
  challengeTitle: { color: '#27AE60', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  challengeText: { color: '#C0E0C0', fontSize: 14, lineHeight: 22, textAlign: 'right' },

  questionCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  questionLabel: { color: '#C0392B', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  questionText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 14, textAlign: 'right' },
  answerInput: {
    backgroundColor: '#161616', borderRadius: 12, padding: 14,
    color: '#FFF', fontSize: 15, minHeight: 80,
    borderWidth: 1, borderColor: '#222',
  },

  lateWarning: { backgroundColor: '#1A0E00', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A1800' },
  lateWarningText: { color: '#F39C12', fontSize: 13, textAlign: 'center' },

  completeBtn: { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  completeBtnDisabled: { backgroundColor: '#222' },
  completeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  doneContainer: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 40 },
  doneEmoji: { fontSize: 60, marginBottom: 20 },
  doneTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  doneSub: { color: '#555', fontSize: 16, marginBottom: 40 },
  doneBtn: { backgroundColor: '#C0392B', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
