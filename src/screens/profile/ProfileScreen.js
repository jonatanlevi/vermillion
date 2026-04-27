import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getFinancialData, getOnboardingState, clearAllData } from '../../services/storage';
import { computeSkills, DAY_PLAN } from '../../services/onboardingAI';

const TIER_LABELS = ['עיוור', 'ייצוב', 'שרידות', 'בנייה', 'אופטימיזציה'];
const TIER_COLORS = ['#444', '#E74C3C', '#E67E22', '#3498DB', '#D4AF37'];

const LEADERBOARD = [
  { rank: 1, name: 'רועי ב.',  score: 4820, badge: '🥇' },
  { rank: 2, name: 'שירה מ.',  score: 4100, badge: '🥈' },
  { rank: 3, name: 'אתה',       score: 2340, badge: '🥉', isUser: true },
  { rank: 4, name: 'דנה כ.',   score: 1980, badge: '' },
  { rank: 5, name: 'יוסי ל.',  score: 1750, badge: '' },
  { rank: 6, name: 'מיכל ר.',  score: 1420, badge: '' },
  { rank: 7, name: 'אבי ש.',   score: 1100, badge: '' },
];

const SKILL_LABELS = {
  saving:   { label: 'חיסכון',     icon: '💰', desc: 'יחס חיסכון מהכנסה' },
  debtMgmt: { label: 'ניהול חוב',  icon: '📉', desc: 'יחס חוב להכנסה' },
  planning: { label: 'תכנון',      icon: '🎯', desc: 'מטרות פיננסיות' },
  mindset:  { label: 'מנטליות',    icon: '🧠', desc: 'רמת לחץ פיננסי' },
  investment:{ label: 'השקעות',    icon: '📈', desc: 'נכסים ותיק השקעות' },
};

function SkillBar({ skill, value, color }) {
  const meta = SKILL_LABELS[skill] || { label: skill, icon: '•', desc: '' };
  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillIcon}>{meta.icon}</Text>
      <View style={styles.skillContent}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillLabel}>{meta.label}</Text>
          <Text style={[styles.skillValue, { color }]}>{value}/100</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.skillDesc}>{meta.desc}</Text>
      </View>
    </View>
  );
}

function LeaderboardModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🏆 לוח זוכים — אפריל</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.prizeBox}>
            <Text style={styles.prizeLabel}>פרס חודשי</Text>
            <Text style={styles.prizeAmt}>₪45,000</Text>
            <Text style={styles.prizeNote}>27 ימים נותרו</Text>
          </View>

          <FlatList
            data={LEADERBOARD}
            keyExtractor={item => String(item.rank)}
            renderItem={({ item }) => (
              <View style={[styles.lbRow, item.isUser && styles.lbRowUser]}>
                <Text style={styles.lbRank}>{item.badge || `#${item.rank}`}</Text>
                <Text style={[styles.lbName, item.isUser && { color: '#C0392B', fontWeight: '800' }]}>
                  {item.name}
                </Text>
                <Text style={styles.lbScore}>{item.score.toLocaleString()} נק'</Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [financial, setFinancial]   = useState({});
  const [onboarding, setOnboarding] = useState({});
  const [skills, setSkills]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showLB, setShowLB]         = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    const [fin, ob] = await Promise.all([getFinancialData(), getOnboardingState()]);
    setFinancial(fin);
    setOnboarding(ob);

    if (Object.keys(fin).length > 0) {
      const surplus = (fin.netIncome || 0) - (fin.housingCost || 0)
        - (fin.fixedExpenses || 0) - (fin.variableExpenses || 0);
      const totalDebt = (fin.creditDebt || 0) + (fin.loans || 0) + (fin.overdraft || 0);
      const savingsRate = fin.netIncome > 0 ? Math.round((surplus / fin.netIncome) * 100) : 0;
      setSkills(computeSkills(fin, surplus, totalDebt, savingsRate));
    }
    setLoading(false);
  }

  function getTier() {
    if (!skills) return 0;
    const avg = Object.values(skills).reduce((a, b) => a + b, 0) / 5;
    if (avg >= 80) return 4;
    if (avg >= 60) return 3;
    if (avg >= 40) return 2;
    if (avg >= 20) return 1;
    return 0;
  }

  function getSkillColor(value) {
    if (value >= 75) return '#27AE60';
    if (value >= 50) return '#F39C12';
    if (value >= 25) return '#E67E22';
    return '#E74C3C';
  }

  function countAnswered() {
    const allFields = Object.values(DAY_PLAN).flat();
    return allFields.filter(f => financial[f] !== undefined && financial[f] !== null).length;
  }

  const answered = countAnswered();
  const totalQ   = 21;
  const tier     = getTier();
  const tierColor = TIER_COLORS[tier];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarCircle, { borderColor: tierColor }]}>
          <Text style={styles.avatarLetter}>V</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>VerMillion שלך</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '22', borderColor: tierColor + '66' }]}>
            <Text style={[styles.tierLabel, { color: tierColor }]}>{TIER_LABELS[tier]}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.lbBtn} onPress={() => setShowLB(true)}>
          <Text style={styles.lbBtnIcon}>🏆</Text>
          <Text style={styles.lbBtnText}>לוח זוכים</Text>
        </TouchableOpacity>
      </View>

      {/* Score row */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreVal}>#3</Text>
          <Text style={styles.scoreKey}>דירוג</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreVal}>2,340</Text>
          <Text style={styles.scoreKey}>נקודות</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreVal}>27</Text>
          <Text style={styles.scoreKey}>ימים נותרו</Text>
        </View>
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>כישורי VerMillion</Text>
          <Text style={styles.sectionSub}>{answered}/{totalQ} שאלות</Text>
        </View>

        {skills ? (
          <View style={styles.skillsCard}>
            {Object.entries(skills).map(([key, val]) => (
              <SkillBar key={key} skill={key} value={val} color={getSkillColor(val)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptySkills}>
            <Text style={styles.emptySkillsText}>הכישורים יחושבו לאחר שתענה על שאלות היכרות</Text>
          </View>
        )}

        {/* Build skills button */}
        <TouchableOpacity
          style={styles.buildBtn}
          onPress={() => navigation.getParent()?.navigate('VerMillion')}
          activeOpacity={0.85}
        >
          <Text style={styles.buildBtnText}>
            {answered < totalQ ? `בנה כישורים → (${totalQ - answered} שאלות נותרו)` : 'שוחח עם VerMillion →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Financial summary (if data exists) */}
      {financial.netIncome ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סיכום פיננסי</Text>
          <View style={styles.finCard}>
            {[
              { label: 'הכנסה נטו',  val: financial.netIncome,   prefix: '₪' },
              { label: 'הוצאות קבועות', val: (financial.housingCost || 0) + (financial.fixedExpenses || 0), prefix: '₪' },
              { label: 'הוצאות משתנות', val: financial.variableExpenses, prefix: '₪' },
              { label: 'חוב כולל',   val: (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0), prefix: '₪' },
              { label: 'חיסכון נזיל', val: financial.savings,   prefix: '₪' },
            ].filter(r => r.val !== undefined && r.val !== null).map((row, i) => (
              <View key={i} style={styles.finRow}>
                <Text style={styles.finVal}>{row.prefix}{(row.val || 0).toLocaleString('he-IL')}</Text>
                <Text style={styles.finLabel}>{row.label}</Text>
              </View>
            ))}
          </View>
          {financial.moneyGoal ? (
            <View style={styles.goalBox}>
              <Text style={styles.goalLabel}>המטרה שלך</Text>
              <Text style={styles.goalText}>"{financial.moneyGoal}"</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הישגים</Text>
        <View style={styles.achieveRow}>
          {[
            { icon: '🔥', label: '7 ימים', locked: answered < 21 },
            { icon: '💬', label: 'שיחה ראשונה', locked: false },
            { icon: '🏆', label: 'TOP 10', locked: true },
            { icon: '⭐', label: 'PREMIUM', locked: true },
          ].map((a, i) => (
            <View key={i} style={[styles.achieveBadge, a.locked && styles.achieveLocked]}>
              <Text style={styles.achieveIcon}>{a.locked ? '🔒' : a.icon}</Text>
              <Text style={[styles.achieveLabel, a.locked && { color: '#333' }]}>{a.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          await clearAllData();
          navigation.getParent()?.navigate('VerMillion');
        }}
      >
        <Text style={styles.logoutText}>איפוס נתונים (dev)</Text>
      </TouchableOpacity>

      <LeaderboardModal visible={showLB} onClose={() => setShowLB(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content:   { paddingHorizontal: 20, paddingBottom: 48 },
  center:    { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2.5,
    backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  userName: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  tierBadge: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  tierLabel: { fontSize: 12, fontWeight: '800' },
  lbBtn: { alignItems: 'center', gap: 3, padding: 8 },
  lbBtnIcon: { fontSize: 22 },
  lbBtnText: { color: '#888', fontSize: 10, fontWeight: '600' },

  scoreCard: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1E1E1E',
    justifyContent: 'space-around', alignItems: 'center',
  },
  scoreItem: { alignItems: 'center' },
  scoreVal:  { color: '#FFF', fontSize: 22, fontWeight: '900' },
  scoreKey:  { color: '#555', fontSize: 11, marginTop: 2 },
  divider:   { width: 1, height: 32, backgroundColor: '#222' },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { color: '#FFF', fontSize: 16, fontWeight: '800' },
  sectionSub:    { color: '#555', fontSize: 12 },

  skillsCard:  { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E1E1E', gap: 16 },
  skillRow:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  skillIcon:   { fontSize: 20, marginTop: 2 },
  skillContent:{ flex: 1 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skillLabel:  { color: '#DDD', fontSize: 14, fontWeight: '700' },
  skillValue:  { fontSize: 13, fontWeight: '800' },
  barTrack:    { height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 4 },
  barFill:     { height: 6, borderRadius: 3 },
  skillDesc:   { color: '#444', fontSize: 11 },

  emptySkills:     { backgroundColor: '#111', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1E1E1E', alignItems: 'center' },
  emptySkillsText: { color: '#444', fontSize: 14, textAlign: 'center' },

  buildBtn:     {
    marginTop: 12, backgroundColor: '#C0392B', borderRadius: 14,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  buildBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  finCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  finRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#181818' },
  finVal:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
  finLabel:{ color: '#666', fontSize: 13 },
  goalBox: { marginTop: 10, backgroundColor: '#0D1A0D', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1A3A1A' },
  goalLabel:{ color: '#4CAF50', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  goalText: { color: '#E0E0E0', fontSize: 14, fontStyle: 'italic' },

  achieveRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  achieveBadge: { alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1E1E1E', minWidth: 70 },
  achieveLocked:{ borderColor: '#161616', backgroundColor: '#0D0D0D' },
  achieveIcon:  { fontSize: 24, marginBottom: 6 },
  achieveLabel: { color: '#888', fontSize: 10, fontWeight: '600' },

  logoutBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  logoutText:{ color: '#2A2A2A', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { color: '#FFF', fontSize: 17, fontWeight: '800' },
  modalClose:   { padding: 6 },
  modalCloseText: { color: '#666', fontSize: 18 },
  prizeBox:     { backgroundColor: '#1A1400', borderRadius: 14, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#D4AF3744' },
  prizeLabel:   { color: '#7A6A20', fontSize: 12, marginBottom: 4 },
  prizeAmt:     { color: '#D4AF37', fontSize: 32, fontWeight: '900' },
  prizeNote:    { color: '#7A6A20', fontSize: 11, marginTop: 4 },
  lbRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  lbRowUser:    { backgroundColor: '#1A0808', borderRadius: 10, paddingHorizontal: 8 },
  lbRank:       { color: '#D4AF37', fontSize: 18, width: 40, textAlign: 'center' },
  lbName:       { flex: 1, color: '#DDD', fontSize: 14, textAlign: 'right' },
  lbScore:      { color: '#888', fontSize: 13, marginLeft: 12 },
});
