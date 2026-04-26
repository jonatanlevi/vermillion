import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockUser, mockPrizePool, canUseFeature } from '../../mock/data';
import { useLanguage } from '../../context/LanguageContext';
import LanguagePicker from '../../components/LanguagePicker';
import { DAY_META, calcCompletion } from '../../data/dailyQuestions';
import { getUserTimeStatus } from '../../services/timeEngine';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const ts = getUserTimeStatus(mockUser);
  const completion = calcCompletion(mockUser.dailyAnswers || {});
  const isPremium = mockUser.subscription === 'premium';

  const todayMeta = DAY_META[ts.currentDay];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.greeting(mockUser.name.split(' ')[0])}</Text>
            <Text style={styles.date}>{ts.hebrewDate}</Text>
          </View>
          <View style={styles.headerRight}>
            <LanguagePicker />
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{ts.streak}</Text>
            </View>
          </View>
        </View>

        {/* Free user paywall nudge */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.paywallBanner}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.88}
          >
            <View style={styles.paywallLeft}>
              <Text style={styles.paywallTitle}>🔒 VerMillion Premium</Text>
              <Text style={styles.paywallSub}>
                שאלון האפיון · אתגר 30 יום · AI Coach · תחרות ₪45,000
              </Text>
            </View>
            <View style={styles.paywallBtn}>
              <Text style={styles.paywallBtnText}>₪79/חודש</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Onboarding timeline — premium only, days 1-7 */}
        {isPremium && ts.phase !== 'complete' && ts.currentDay <= 7 && (
          <View style={styles.onboardingCard}>
            <View style={styles.onboardingHeader}>
              <Text style={styles.onboardingTitle}>
                {ts.phase === 'lifestyle' ? 'שבוע הכרות — אישי' : 'שבוע הכרות — כספי'}
              </Text>
              <Text style={styles.onboardingDaysLeft}>
                {ts.daysLeft} ימים נותרו
              </Text>
            </View>
            <View style={styles.timeline}>
              {[1,2,3,4,5,6,7].map((day) => (
                <View key={day} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    day < ts.currentDay  && styles.timelineDotDone,
                    day === ts.currentDay && styles.timelineDotToday,
                    day > ts.currentDay  && styles.timelineDotFuture,
                  ]}>
                    {day < ts.currentDay
                      ? <Text style={styles.timelineCheck}>✓</Text>
                      : <Text style={styles.timelineDayNum}>{day}</Text>}
                  </View>
                  {day < 7 && (
                    <View style={[
                      styles.timelineLine,
                      day < ts.currentDay && styles.timelineLineDone,
                    ]} />
                  )}
                </View>
              ))}
            </View>
            {/* Phase divider label */}
            <View style={styles.phaseDivider}>
              <Text style={[styles.phaseLabel, ts.currentDay <= 3 && styles.phaseLabelActive]}>אישי (1-3)</Text>
              <View style={styles.phaseDividerLine} />
              <Text style={[styles.phaseLabel, ts.currentDay > 3 && styles.phaseLabelActive]}>כספי (4-7)</Text>
            </View>
          </View>
        )}

        {/* Profile Reveal — Day 8 */}
        {isPremium && ts.phase === 'reveal' && (
          <TouchableOpacity
            style={styles.revealCard}
            onPress={() => navigation.navigate('ProfileReveal')}
            activeOpacity={0.88}
          >
            <Text style={styles.revealEmoji}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.revealTitle}>האפיון שלך מוכן!</Text>
              <Text style={styles.revealSub}>VerMillion סיים לנתח — בוא נראה מי אתה</Text>
            </View>
            <Text style={styles.revealArrow}>←</Text>
          </TouchableOpacity>
        )}

        {/* Daily Mission — premium, days 1-7 */}
        {isPremium && todayMeta && ts.phase !== 'reveal' && ts.phase !== 'coaching' && (
          <TouchableOpacity
            style={[
              styles.missionCard,
              { borderColor: ts.todayDone ? '#27AE60' : todayMeta.color },
              ts.isLate && !ts.todayDone && styles.missionCardLate,
            ]}
            onPress={() => !ts.todayDone && navigation.navigate('DailyQuestions')}
            activeOpacity={ts.todayDone ? 1 : 0.88}
          >
            <View style={styles.missionLeft}>
              <Text style={styles.missionIcon}>{todayMeta.icon}</Text>
              <View>
                <Text style={[styles.missionDay, { color: ts.todayDone ? '#27AE60' : todayMeta.color }]}>
                  {ts.todayDone
                    ? '✓ הושלם'
                    : ts.isLate
                      ? `⚠️ יום ${ts.currentDay} — ${ts.deviation}h איחור`
                      : `יום ${ts.currentDay} — VerMillion שואל`}
                </Text>
                <Text style={styles.missionTopic}>{todayMeta.topic}</Text>
                <Text style={styles.missionSub}>
                  {ts.todayDone
                    ? 'VerMillion קיבל את המידע'
                    : `~2 דקות · מכפיל ×${ts.multiplier.toFixed(1)}`}
                </Text>
              </View>
            </View>
            {!ts.todayDone && (
              <View style={[styles.missionBtn, { backgroundColor: todayMeta.color }]}>
                <Text style={styles.missionBtnText}>ענה →</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Daily Coaching Mission — premium, days 9-30 */}
        {isPremium && ts.phase === 'coaching' && (
          <TouchableOpacity
            style={[styles.missionCard, { borderColor: ts.todayDone ? '#27AE60' : '#C0392B' }]}
            onPress={() => !ts.todayDone && navigation.navigate('DailyCoaching')}
            activeOpacity={ts.todayDone ? 1 : 0.88}
          >
            <View style={styles.missionLeft}>
              <Text style={styles.missionIcon}>💡</Text>
              <View>
                <Text style={[styles.missionDay, { color: ts.todayDone ? '#27AE60' : '#C0392B' }]}>
                  {ts.todayDone ? '✓ יום ' + ts.currentDay + ' הושלם' : `יום ${ts.currentDay} — יעוץ יומי`}
                </Text>
                <Text style={styles.missionTopic}>
                  {ts.todayDone ? 'VerMillion מחכה מחר' : 'טיפ + אתגר + שאלה אחת'}
                </Text>
                <Text style={styles.missionSub}>
                  {ts.todayDone ? '' : `מכפיל ×${ts.multiplier.toFixed(1)} · ${ts.daysLeft} ימים לסוף`}
                </Text>
              </View>
            </View>
            {!ts.todayDone && (
              <View style={[styles.missionBtn, { backgroundColor: '#C0392B' }]}>
                <Text style={styles.missionBtnText}>פתח →</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Profile completion meter — premium only */}
        {isPremium && (
          <View style={styles.completionRow}>
            <View style={styles.completionBar}>
              <View style={[styles.completionFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.completionLabel}>
              VerMillion מכיר אותך על{' '}
              <Text style={styles.completionPct}>{completion}%</Text>
            </Text>
          </View>
        )}

        {/* Challenge Hero — premium only */}
        {isPremium ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.challengeHero}
              onPress={() => navigation.navigate('Challenge')}
              activeOpacity={0.92}
            >
              <View style={styles.challengeGlow} />
              <View style={styles.challengeInner}>
                <View style={styles.challengeTopRow}>
                  <Text style={styles.challengeEmojiLabel}>{t.challengeLabel}</Text>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.challengeTitle}>{t.challengeTitle}</Text>
                <Text style={styles.challengeSub}>{t.challengeSub}</Text>
                <View style={styles.challengeFooter}>
                  <View style={styles.attemptsRow}>
                    {[1,2,3].map(i => <View key={i} style={[styles.attemptDot, styles.attemptDotFull]} />)}
                    <Text style={styles.attemptsLabel}>{t.attempts(3)}</Text>
                  </View>
                  <View style={styles.playBtn}>
                    <Text style={styles.playBtnText}>{t.playBtn}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Free user: locked challenge teaser */
          <TouchableOpacity
            style={styles.challengeLocked}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.88}
          >
            <Text style={styles.challengeLockedIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeLockedTitle}>אתגר 30 יום — ₪45,000 בפרסים</Text>
              <Text style={styles.challengeLockedSub}>זמין למנויים בלבד · נעול</Text>
            </View>
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="🏆" label={t.rankLabel}     value={isPremium ? `#${mockUser.rank}` : '—'} accent="#F0C040" />
          <StatCard icon="🔥" label={t.streakLabel}   value={`${ts.streak}d`}                       accent="#E74C3C" />
          <StatCard icon="🎯" label={t.accuracyLabel} value={isPremium ? `${mockUser.score}%` : '—'} accent="#2ECC71" />
        </View>

        {/* Prize Pool */}
        <TouchableOpacity
          style={styles.prizeCard}
          onPress={() => navigation.navigate(isPremium ? 'Leaderboard' : 'Subscription')}
          activeOpacity={0.88}
        >
          <View style={styles.prizeLeft}>
            <Text style={styles.prizeMonth}>{mockPrizePool.month}</Text>
            <Text style={styles.prizeTitle}>{t.prizePoolTitle}</Text>
            <View style={styles.prizeAmountRow}>
              <Text style={styles.prizeCurrency}>{t.currencySymbol}</Text>
              <Text style={styles.prizeAmount}>{mockPrizePool.total.toLocaleString()}</Text>
            </View>
            <Text style={styles.prizeAction}>{isPremium ? t.seeFullRank : '🔒 למנויים בלבד'}</Text>
          </View>
          <View style={styles.prizeRight}>
            {mockPrizePool.distribution.slice(0, 3).map((p, i) => (
              <View key={p.rank} style={styles.prizeRow}>
                <Text style={styles.prizeMedal}>{['🥇','🥈','🥉'][i]}</Text>
                <Text style={[styles.prizeRowAmount, i === 0 && styles.prizeRowAmountFirst]}>
                  {t.currencySymbol}{(p.amount / 1000).toFixed(0)}K
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* AI Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('AICoach')}
          activeOpacity={0.88}
        >
          <View style={styles.aiLeft}>
            <View style={styles.aiDot} />
            <Text style={styles.aiTitle}>VerMillion AI</Text>
            {!isPremium && <Text style={styles.aiFreeBadge}>3 הודעות חינם</Text>}
          </View>
          <Text style={styles.aiMsg}>{t.askAI}</Text>
        </TouchableOpacity>

      </Animated.View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  date: { fontSize: 13, color: '#555', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakBadge: { backgroundColor: '#1A0E0E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#3A1A1A' },
  streakFire: { fontSize: 16 },
  streakCount: { color: '#E74C3C', fontSize: 18, fontWeight: '900' },

  // Paywall banner
  paywallBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#110800', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2A1800', gap: 12 },
  paywallLeft: { flex: 1 },
  paywallTitle: { color: '#F0C040', fontSize: 14, fontWeight: '800', marginBottom: 3 },
  paywallSub: { color: '#7A5A20', fontSize: 12, lineHeight: 18 },
  paywallBtn: { backgroundColor: '#C0392B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  paywallBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Onboarding
  onboardingCard: { backgroundColor: '#111', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  onboardingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  onboardingTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  onboardingDaysLeft: { color: '#C0392B', fontSize: 13, fontWeight: '600' },
  timeline: { flexDirection: 'row', alignItems: 'center' },
  timelineItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: '#C0392B' },
  timelineDotToday: { backgroundColor: '#1A0E0E', borderWidth: 2, borderColor: '#C0392B' },
  timelineDotFuture: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  timelineCheck: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  timelineDayNum: { color: '#555', fontSize: 11, fontWeight: '600' },
  timelineLine: { flex: 1, height: 2, backgroundColor: '#1E1E1E' },
  timelineLineDone: { backgroundColor: '#C0392B' },
  phaseDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  phaseDividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  phaseLabel: { color: '#333', fontSize: 11, fontWeight: '600' },
  phaseLabelActive: { color: '#C0392B' },

  // Profile reveal card
  revealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#110A00', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#F0C040', gap: 12 },
  revealEmoji: { fontSize: 28 },
  revealTitle: { color: '#F0C040', fontSize: 16, fontWeight: '800' },
  revealSub: { color: '#7A6020', fontSize: 13, marginTop: 2 },
  revealArrow: { color: '#F0C040', fontSize: 20, fontWeight: '700' },

  // Mission card
  missionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  missionCardLate: { backgroundColor: '#0E0800' },
  missionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  missionIcon: { fontSize: 28 },
  missionDay:  { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  missionTopic:{ color: '#FFF', fontSize: 15, fontWeight: '700' },
  missionSub:  { color: '#555', fontSize: 12, marginTop: 2 },
  missionBtn:  { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  missionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Completion meter
  completionRow: { marginBottom: 16, gap: 6 },
  completionBar: { height: 3, backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' },
  completionFill: { height: '100%', backgroundColor: '#C0392B', borderRadius: 2 },
  completionLabel: { color: '#444', fontSize: 11, textAlign: 'right' },
  completionPct: { color: '#C0392B', fontWeight: '700' },

  // Challenge hero
  challengeHero: { borderRadius: 24, marginBottom: 16, overflow: 'hidden', backgroundColor: '#C0392B' },
  challengeGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  challengeInner: { padding: 24 },
  challengeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  challengeEmojiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7FFFD4' },
  liveText: { color: '#7FFFD4', fontSize: 12, fontWeight: '700' },
  challengeTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  challengeSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attemptsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attemptDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  attemptDotFull: { backgroundColor: 'rgba(255,255,255,0.9)' },
  attemptsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginLeft: 4 },
  playBtn: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  playBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // Locked challenge
  challengeLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E', gap: 12 },
  challengeLockedIcon: { fontSize: 28 },
  challengeLockedTitle: { color: '#555', fontSize: 15, fontWeight: '700' },
  challengeLockedSub: { color: '#333', fontSize: 12, marginTop: 3 },
  lockIcon: { fontSize: 22 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#1E1E1E' },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11 },

  // Prize card
  prizeCard: { backgroundColor: '#111', borderRadius: 22, padding: 22, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#1E1E1E' },
  prizeLeft: { flex: 1 },
  prizeMonth: { color: '#555', fontSize: 12, marginBottom: 2 },
  prizeTitle: { color: '#888', fontSize: 13, marginBottom: 6 },
  prizeAmountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  prizeCurrency: { color: '#F0C040', fontSize: 22, fontWeight: '700', paddingBottom: 4 },
  prizeAmount: { color: '#F0C040', fontSize: 44, fontWeight: '900', lineHeight: 48 },
  prizeAction: { color: '#555', fontSize: 13, marginTop: 12 },
  prizeRight: { justifyContent: 'center', gap: 8, paddingLeft: 16 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prizeMedal: { fontSize: 18 },
  prizeRowAmount: { color: '#666', fontSize: 13, fontWeight: '600' },
  prizeRowAmountFirst: { color: '#F0C040', fontWeight: '800' },

  // AI banner
  aiBanner: { backgroundColor: '#111', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
  aiLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  aiTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  aiFreeBadge: { backgroundColor: '#1A1A0A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#2A2A0A' },
  aiMsg: { color: '#555', fontSize: 13 },
});
