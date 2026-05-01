import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguagePicker from '../../components/LanguagePicker';
import { THEMES, ARCHETYPES } from '../../components/CharacterFigure';
import VermillionAvatar from '../../components/VermillionAvatar';
import { DAY_META, calcCompletion, getBlindSpots } from '../../data/dailyQuestions';
import { getUserTimeStatus, calcStreak } from '../../services/timeEngine';
import { getOnboardingState } from '../../services/storage';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { profile, signOut } = useAuth();

  const [onbState, setOnbState] = useState(null);

  useEffect(() => {
    getOnboardingState().then(setOnbState);
  }, []);

  const avatarStyle = (() => {
    try { return typeof profile?.avatar_style === 'string' ? JSON.parse(profile.avatar_style) : (profile?.avatar_style || {}); }
    catch { return {}; }
  })();

  const vm         = avatarStyle;
  const theme      = THEMES[vm?.appearance?.colors] || THEMES.fire;
  const archetype  = ARCHETYPES[vm?.appearance?.style] || ARCHETYPES.sage;
  const dailyAnswers = onbState || {};
  const completion = calcCompletion(dailyAnswers);
  const blindSpots = getBlindSpots(dailyAnswers).slice(0, 3);
  const regDate    = onbState?.startDate || new Date().toISOString();
  const ts         = getUserTimeStatus({ registrationDate: regDate, dailyAnswers });
  const streak     = calcStreak(dailyAnswers, regDate);
  const isPremium  = profile?.subscription === 'premium';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── HERO: VerMillion card + user info ── */}
      <LinearGradient colors={[theme.bg[0], '#0A0A0A']} style={[s.hero, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={s.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
        <View style={s.heroInner}>

          {/* ── Profile avatar (the VerMillion character in a circle) ── */}
          <VermillionAvatar appearance={vm?.appearance || {}} size={104} showGlow={true} />

          {/* User info */}
          <View style={s.userInfo}>
            <View style={[s.levelBadge, { borderColor: theme.accent + '66' }]}>
              <Text style={[s.levelText, { color: theme.accent }]}>
                {(ts.phase === 'lifestyle' || ts.phase === 'financial')
                  ? `יום ${ts.currentDay}/7`
                  : `יום ${ts.currentDay}/30`}
              </Text>
            </View>
            <Text style={s.userName}>{profile?.name || profile?.email || '—'}</Text>
            <Text style={[s.vmName, { color: theme.accent }]}>{vm?.name || 'VerMillion'}</Text>
            <Text style={s.userPhone}>{profile?.phone || ''}</Text>

            <View style={[s.subBadge, { borderColor: isPremium ? '#27AE60' : '#333' }]}>
              <Text style={[s.subText, { color: isPremium ? '#27AE60' : '#666' }]}>
                {isPremium
                  ? '✓ מנוי פעיל'
                  : (ts.phase === 'lifestyle' || ts.phase === 'financial')
                    ? `⏳ ניסיון — ${ts.currentDay}/7`
                    : `⏳ ניסיון — ${ts.currentDay}/30`}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── STATS ── */}
      <View style={s.statsGrid}>
        <StatBox label={t.rankLabel}     value="—"                             color="#F0C040" />
        <StatBox label={t.streakLabel}   value={`${streak} 🔥`}               color="#E74C3C" />
        <StatBox label="ימי אתגר"        value={`${(onbState?.daysCompleted || []).length}`} color="#2ECC71" />
        <StatBox label="ימים"
          value={(ts.phase === 'lifestyle' || ts.phase === 'financial')
            ? `${ts.currentDay}/7`
            : `${ts.currentDay}/30`}
          color={theme.accent} />
      </View>

      {/* ── DNA Completion ── */}
      <View style={s.section}>
        <View style={s.completionHeader}>
          <Text style={s.sectionTitle}>VERMILLION DNA</Text>
          <Text style={[s.completionPct, { color: completion > 70 ? '#27AE60' : completion > 40 ? '#F39C12' : '#C0392B' }]}>
            {completion}%
          </Text>
        </View>
        <View style={s.completionBar}>
          <View style={[s.completionFill, {
            width: `${completion}%`,
            backgroundColor: completion > 70 ? '#27AE60' : completion > 40 ? '#F39C12' : '#C0392B',
          }]} />
        </View>
        <Text style={s.completionSub}>
          {completion < 100
            ? `השלם ${100 - completion}% נוספים לייעוץ מדויק יותר`
            : '✓ פרופיל מלא — VerMillion מכיר אותך לגמרי'}
        </Text>

        {/* Blind spots */}
        {blindSpots.length > 0 && (
          <View style={s.blindSpotsBox}>
            <Text style={s.blindSpotsTitle}>⚠️ כתמות עיוורות:</Text>
            {blindSpots.map((bs, i) => (
              <View key={i} style={s.blindSpotRow}>
                <View style={s.blindDot} />
                <Text style={s.blindSpotText}>{bs.blindSpot}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── VerMillion Traits ── */}
      {vm?.tone && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>VERMILLION TRAITS</Text>
          <View style={s.traitsRow}>
            {[
              { label: 'סגנון', val: { direct: 'ישיר', gentle: 'עדין', tough: 'קשוח' }[vm.tone.advice_style] },
              { label: 'אישיות', val: { serious: 'רציני', friendly: 'חם', mentor: 'מנטור' }[vm.tone.personality] },
              { label: 'מטרה', val: { money: '💰 עושר', freedom: '🕊️ חופש', growth: '📈 צמיחה' }[vm.tone.goal_focus] },
            ].filter(t => t.val).map((tr, i) => (
              <View key={i} style={[s.traitChip, { borderColor: theme.accent + '55' }]}>
                <Text style={[s.traitVal, { color: theme.accent }]}>{tr.val}</Text>
                <Text style={s.traitLabel}>{tr.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Language ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>LANGUAGE</Text>
        <LanguagePicker />
      </View>

      {/* ── Menu ── */}
      <View style={s.section}>
        <MenuItem icon="💳" label="מנוי"          onPress={() => {}} />
        <MenuItem icon="🔔" label="התראות"        onPress={() => {}} />
        <MenuItem icon="📋" label="תנאי שימוש"    onPress={() => {}} />
        <MenuItem icon="❓" label="עזרה ותמיכה"   onPress={() => {}} />
        <MenuItem icon="🚪" label="התנתקות"       onPress={signOut} danger />
      </View>

    </ScrollView>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.menuIcon}>{icon}</Text>
      <Text style={[s.menuLabel, danger && s.menuDanger]}>{label}</Text>
      <Text style={s.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content:   { paddingBottom: 110 },

  /* Hero */
  hero: { paddingTop: 12, paddingBottom: 24, paddingHorizontal: 20 },
  settingsBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  settingsBtnText: { fontSize: 22 },
  heroInner: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },

  /* User info */
  userInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  levelBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  levelText:  { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  userName:   { color: '#FFF', fontSize: 20, fontWeight: '800' },
  vmName:     { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  userPhone:  { color: '#444', fontSize: 13 },
  subBadge:   { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  subText:    { fontSize: 12, fontWeight: '600' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  statBox:   { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 4 },

  /* DNA Completion */
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionPct:    { fontSize: 18, fontWeight: '900' },
  completionBar:    { height: 6, backgroundColor: '#1E1E1E', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  completionFill:   { height: '100%', borderRadius: 3 },
  completionSub:    { color: '#555', fontSize: 12, marginBottom: 12 },
  blindSpotsBox:    { backgroundColor: '#0F0F0F', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1A1A1A', gap: 8 },
  blindSpotsTitle:  { color: '#666', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  blindSpotRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blindDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C0392B' },
  blindSpotText:    { color: '#555', fontSize: 13 },

  /* Traits */
  section:    { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { color: '#333', fontSize: 10, letterSpacing: 2, marginBottom: 12, fontWeight: '700' },
  traitsRow:  { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  traitChip:  { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 80, backgroundColor: 'rgba(255,255,255,0.02)' },
  traitVal:   { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  traitLabel: { color: '#444', fontSize: 10 },

  /* Menu */
  menuItem:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#1E1E1E' },
  menuIcon:  { fontSize: 20 },
  menuLabel: { flex: 1, color: '#FFF', fontSize: 15 },
  menuDanger:{ color: '#C0392B' },
  menuArrow: { color: '#333', fontSize: 20 },
});
