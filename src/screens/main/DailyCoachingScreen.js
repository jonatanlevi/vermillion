import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockUser } from '../../mock/data';
import { computeFinancialMetrics } from '../../data/dailyQuestions';
import { classifyTier } from '../../services/financialTier';
import { getUserTimeStatus } from '../../services/timeEngine';
import { chatWithAI } from '../../services/aiService';
import { COACHING_DAYS } from '../../data/coachingContent';
import { useLanguage } from '../../context/LanguageContext';

export default function DailyCoachingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const ts = getUserTimeStatus(mockUser);
  const metrics = computeFinancialMetrics(mockUser.dailyAnswers || {});
  const tier = classifyTier(metrics, 100);
  const dayContent = COACHING_DAYS[ts.currentDay] || COACHING_DAYS[9];
  const safeTier = Math.max(tier.tier, 1);
  const tierContent = dayContent[safeTier] || dayContent[1];

  const [answer, setAnswer] = useState('');
  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const [done, setDone] = useState(!!mockUser.dailyAnswers?.[ts.currentDay]?._coaching);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (!aiTip) loadTodayTip();
    return () => { mountedRef.current = false; };
  }, []);

  async function loadTodayTip() {
    setLoadingTip(true);
    const prompt = `בהתבסס על פרופיל המשתמש, תן טיפ פיננסי אחד קצר (3-4 משפטים) רלוונטי ל"${tierContent.topic}". ישיר, מעשי, מותאם לשלב ${tier.label}.`;
    try {
      await chatWithAI(prompt, mockUser, (partial) => {
        if (mountedRef.current) setAiTip(partial);
      });
    } catch {
      if (mountedRef.current) setAiTip(tierContent.fallbackTip);
    }
    if (mountedRef.current) setLoadingTip(false);
  }

  function handleComplete() {
    if (!answer.trim()) return;
    setDone(true);
  }

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>{t.coachDoneTitle(ts.currentDay)}</Text>
        <Text style={styles.doneSub}>{t.coachDoneSub(ts.multiplier.toFixed(1), ts.daysLeft)}</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>{t.coachBackHome}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{t.coachDayBadge(ts.currentDay)}</Text>
          </View>
          <View style={[styles.tierPill, { backgroundColor: tier.color + '22', borderColor: tier.color + '44' }]}>
            <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.emoji} {tier.label}</Text>
          </View>
        </View>

        <Text style={styles.topic}>{tierContent.topic}</Text>
        <Text style={styles.sub}>{tierContent.description}</Text>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.aiDot} />
            <Text style={styles.tipHeaderText}>{t.coachAiTipHeader}</Text>
          </View>
          {loadingTip ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#C0392B" size="small" />
              <Text style={styles.loadingText}>{t.coachThinking}</Text>
            </View>
          ) : (
            <Text style={styles.tipText}>{aiTip || tierContent.fallbackTip}</Text>
          )}
        </View>

        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>{t.coachChallengeTitle}</Text>
          <Text style={styles.challengeText}>{tierContent.challenge}</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>{t.coachQuestionLabel}</Text>
          <Text style={styles.questionText}>{tierContent.question}</Text>
          <TextInput
            style={styles.answerInput}
            placeholder={t.coachAnswerPh}
            placeholderTextColor="#333"
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

        {ts.isLate && (
          <View style={styles.lateWarning}>
            <Text style={styles.lateWarningText}>
              {t.coachLateWarning(ts.deviation, ts.multiplier.toFixed(1))}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.completeBtn, !answer.trim() && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={!answer.trim()}
          activeOpacity={0.88}
        >
          <Text style={styles.completeBtnText}>
            {t.coachCompleteBtn(ts.currentDay, Math.round(100 * ts.multiplier))}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 50 },
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
