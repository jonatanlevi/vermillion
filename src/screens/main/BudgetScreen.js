import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getFinancialData, saveExpense, getExpenses, deleteExpense, getGoals, saveGoal, deleteGoal } from '../../services/storage';
import { buildBudget, buildDebtPayoff, buildSavingsProjection, EXPENSE_CATEGORIES } from '../../services/budgetEngine';

const fmt    = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;
const nowKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

const REC_COLORS = {
  danger:  { bg: '#2A0A0A', border: '#C0392B', text: '#FF6B6B' },
  warning: { bg: '#2A1A00', border: '#E67E22', text: '#F39C12' },
  info:    { bg: '#0A1A2A', border: '#3498DB', text: '#5DADE2' },
  success: { bg: '#0A2A0A', border: '#27AE60', text: '#58D68D' },
  action:  { bg: '#1A1A2A', border: '#8E44AD', text: '#BB8FCE' },
};

export default function BudgetScreen({ navigation }) {
  const insets  = useSafeAreaInsets();
  const [budget, setBudget]       = useState(null);
  const [expenses, setExpenses]   = useState([]);
  const [goals, setGoals]         = useState([]);
  const [tab, setTab]             = useState('budget'); // budget | expenses | goals
  const [loading, setLoading]     = useState(true);
  const [monthKey, setMonthKey]   = useState(nowKey());

  // ── Add expense modal ──────────────────────────────────────
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [expAmount, setExpAmount]   = useState('');
  const [expCategory, setExpCategory] = useState('food');
  const [expDesc, setExpDesc]       = useState('');

  // ── Add goal modal ─────────────────────────────────────────
  const [addGoalVisible, setAddGoalVisible] = useState(false);
  const [goalName, setGoalName]     = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonthly, setGoalMonthly] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [financial, exp, gl] = await Promise.all([
      getFinancialData(),
      getExpenses(monthKey),
      getGoals(),
    ]);
    setBudget(buildBudget(financial || {}));
    setExpenses(exp || []);
    setGoals(gl || []);
    setLoading(false);
  }, [monthKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAddExpense = async () => {
    const amount = parseFloat(expAmount.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) return;
    await saveExpense({ amount, category: expCategory, description: expDesc });
    setAddExpenseVisible(false);
    setExpAmount(''); setExpDesc(''); setExpCategory('food');
    const exp = await getExpenses(monthKey);
    setExpenses(exp || []);
  };

  const handleDeleteExpense = async (id) => {
    await deleteExpense(id);
    const exp = await getExpenses(monthKey);
    setExpenses(exp || []);
  };

  const handleAddGoal = async () => {
    const target  = parseFloat(goalTarget.replace(/[^0-9.]/g, ''));
    const monthly = parseFloat(goalMonthly.replace(/[^0-9.]/g, ''));
    if (!goalName.trim() || !target) return;
    await saveGoal({ name: goalName.trim(), target, monthly: monthly || 0, current: 0 });
    setAddGoalVisible(false);
    setGoalName(''); setGoalTarget(''); setGoalMonthly('');
    const gl = await getGoals(); setGoals(gl || []);
  };

  const handleDeleteGoal = async (id) => {
    await deleteGoal(id);
    const gl = await getGoals(); setGoals(gl || []);
  };

  // ── Monthly expense totals by category ────────────────────
  const expByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const totalThisMonth = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) return (
    <View style={[styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color="#C0392B" size="large" />
    </View>
  );

  const debtInfo = budget ? buildDebtPayoff(budget, 0) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>התקציב שלי</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'budget',   label: '📊 תקציב' },
          { key: 'expenses', label: '💸 הוצאות' },
          { key: 'goals',    label: '🎯 מטרות' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── BUDGET TAB ────────────────────────────────────── */}
        {tab === 'budget' && budget && (
          <>
            {/* Income summary */}
            <View style={styles.incomeCard}>
              <Text style={styles.incomeLabel}>הכנסה חודשית נטו</Text>
              <Text style={styles.incomeAmount}>{fmt(budget.income)}</Text>
              <View style={styles.surplusRow}>
                <Text style={[styles.surplusLabel, { color: budget.surplus >= 0 ? '#27AE60' : '#E74C3C' }]}>
                  {budget.surplus >= 0 ? '▲ עודף' : '▼ גירעון'} {fmt(budget.surplus)}
                </Text>
                <Text style={styles.savingsRateLabel}>{budget.savingsRate}% חיסכון</Text>
              </View>
            </View>

            {/* Category bars */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>פירוט הוצאות</Text>
              {budget.categories.map(cat => (
                <View key={cat.key} style={styles.catRow}>
                  <View style={styles.catLeft}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <View>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <Text style={styles.catPct}>{cat.pct}% מהכנסה</Text>
                    </View>
                  </View>
                  <Text style={[styles.catAmount, { color: cat.color }]}>{fmt(cat.amount)}</Text>
                </View>
              ))}
            </View>

            {/* Progress bar */}
            {budget.income > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>חלוקה גרפית</Text>
                <View style={styles.barContainer}>
                  {budget.categories.filter(c => c.amount > 0).map(cat => (
                    <View
                      key={cat.key}
                      style={[styles.barSegment, { flex: cat.amount, backgroundColor: cat.color }]}
                    />
                  ))}
                </View>
                <View style={styles.barLegend}>
                  {budget.categories.filter(c => c.amount > 0).map(cat => (
                    <View key={cat.key} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.legendText}>{cat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations */}
            {budget.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>המלצות אישיות</Text>
                {budget.recommendations.map((rec, i) => {
                  const colors = REC_COLORS[rec.type] || REC_COLORS.info;
                  return (
                    <View key={i} style={[styles.recCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                      <Text style={styles.recIcon}>{rec.icon}</Text>
                      <Text style={[styles.recText, { color: colors.text }]}>{rec.text}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Debt payoff */}
            {debtInfo && debtInfo.totalDebt > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>סגירת חוב</Text>
                <View style={styles.projCard}>
                  <Text style={styles.projLabel}>סך חובות</Text>
                  <Text style={styles.projValue}>{fmt(debtInfo.totalDebt)}</Text>
                  {debtInfo.months ? (
                    <>
                      <Text style={styles.projLabel}>תאריך סיום משוער</Text>
                      <Text style={[styles.projValue, { color: '#27AE60' }]}>{debtInfo.date}</Text>
                      <Text style={styles.projNote}>({debtInfo.months} חודשים בקצב הנוכחי)</Text>
                    </>
                  ) : (
                    <Text style={[styles.projNote, { color: '#E74C3C' }]}>אין עודף פנוי לסגירת חוב</Text>
                  )}
                </View>
              </View>
            )}

            {/* Savings projection */}
            {budget.surplus > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>הקרנת חיסכון</Text>
                <View style={styles.projCard}>
                  {[5, 10, 20].map(years => (
                    <View key={years} style={styles.projRow}>
                      <Text style={styles.projYears}>{years} שנים</Text>
                      <Text style={styles.projFV}>{fmt(buildSavingsProjection(Math.max(0, budget.surplus), years))}</Text>
                    </View>
                  ))}
                  <Text style={styles.projNote}>מבוסס על עודף חודשי {fmt(budget.surplus)} ב-7% שנתי</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── EXPENSES TAB ──────────────────────────────────── */}
        {tab === 'expenses' && (
          <>
            {/* Month selector */}
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => {
                const d = new Date(monthKey + '-01');
                d.setMonth(d.getMonth() - 1);
                setMonthKey(d.toISOString().slice(0, 7));
              }}>
                <Text style={styles.monthNav}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {new Date(monthKey + '-01').toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const d = new Date(monthKey + '-01');
                d.setMonth(d.getMonth() + 1);
                if (d <= new Date()) setMonthKey(d.toISOString().slice(0, 7));
              }}>
                <Text style={styles.monthNav}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Monthly total */}
            <View style={styles.incomeCard}>
              <Text style={styles.incomeLabel}>סך הוצאות החודש</Text>
              <Text style={[styles.incomeAmount, { color: '#E67E22' }]}>{fmt(totalThisMonth)}</Text>
              {budget && budget.variableExpenses > 0 && (
                <Text style={[styles.surplusLabel, {
                  color: totalThisMonth > budget.variableExpenses ? '#E74C3C' : '#27AE60'
                }]}>
                  {totalThisMonth > budget.variableExpenses
                    ? `▼ חריגה של ${fmt(totalThisMonth - budget.variableExpenses)}`
                    : `✓ בתוך התקציב — נשאר ${fmt(budget.variableExpenses - totalThisMonth)}`
                  }
                </Text>
              )}
            </View>

            {/* Category breakdown */}
            {Object.keys(expByCategory).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>לפי קטגוריה</Text>
                {EXPENSE_CATEGORIES.filter(c => expByCategory[c.key]).map(cat => (
                  <View key={cat.key} style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                    </View>
                    <Text style={[styles.catAmount, { color: cat.color }]}>{fmt(expByCategory[cat.key])}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add expense button */}
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddExpenseVisible(true)}>
              <Text style={styles.addBtnText}>+ הוסף הוצאה</Text>
            </TouchableOpacity>

            {/* Expense list */}
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>אין הוצאות החודש — הוסף הוצאה ראשונה</Text>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>כל ההוצאות</Text>
                {expenses.map(exp => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.key === exp.category) || EXPENSE_CATEGORIES[7];
                  return (
                    <View key={exp.id} style={styles.expRow}>
                      <Text style={styles.expEmoji}>{cat.emoji}</Text>
                      <View style={styles.expMid}>
                        <Text style={styles.expLabel}>{exp.description || cat.label}</Text>
                        <Text style={styles.expDate}>{exp.date}</Text>
                      </View>
                      <Text style={[styles.expAmount, { color: cat.color }]}>{fmt(exp.amount)}</Text>
                      <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)} style={styles.delBtn}>
                        <Text style={styles.delText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── GOALS TAB ─────────────────────────────────────── */}
        {tab === 'goals' && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddGoalVisible(true)}>
              <Text style={styles.addBtnText}>+ מטרה חדשה</Text>
            </TouchableOpacity>

            {goals.length === 0 ? (
              <Text style={styles.emptyText}>אין מטרות עדיין — הוסף מטרה ראשונה</Text>
            ) : goals.map(goal => {
              const progress = goal.target > 0 ? Math.min(1, (goal.current || 0) / goal.target) : 0;
              const monthsLeft = goal.monthly > 0
                ? Math.ceil((goal.target - (goal.current || 0)) / goal.monthly)
                : null;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)}>
                      <Text style={styles.delText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.goalAmounts}>
                    <Text style={styles.goalCurrent}>{fmt(goal.current || 0)}</Text>
                    <Text style={styles.goalSep}> / </Text>
                    <Text style={styles.goalTarget}>{fmt(goal.target)}</Text>
                  </View>
                  {/* Progress bar */}
                  <View style={styles.goalBar}>
                    <View style={[styles.goalBarFill, { flex: progress, backgroundColor: '#27AE60' }]} />
                    <View style={[styles.goalBarEmpty, { flex: 1 - progress }]} />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalPct}>{Math.round(progress * 100)}% הושלם</Text>
                    {monthsLeft && <Text style={styles.goalMonths}>≈ {monthsLeft} חודשים</Text>}
                  </View>
                  {/* Update progress */}
                  <GoalProgressInput goal={goal} onUpdate={async (cur) => {
                    const { saveGoal: sg } = await import('../../services/storage');
                    await sg({ ...goal, current: cur });
                    const gl = await getGoals(); setGoals(gl || []);
                  }} />
                </View>
              );
            })}
          </>
        )}

      </ScrollView>

      {/* ── Add Expense Modal ─────────────────────────────────── */}
      <Modal visible={addExpenseVisible} transparent animationType="slide" onRequestClose={() => setAddExpenseVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>הוספת הוצאה</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="סכום (₪)"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={expAmount}
              onChangeText={setExpAmount}
              textAlign="right"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="תיאור (אופציונלי)"
              placeholderTextColor="#555"
              value={expDesc}
              onChangeText={setExpDesc}
              textAlign="right"
            />
            <Text style={styles.modalSubtitle}>קטגוריה</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, expCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '22' }]}
                  onPress={() => setExpCategory(cat.key)}
                >
                  <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catChipLabel, expCategory === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddExpenseVisible(false)}>
                <Text style={styles.cancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddExpense}>
                <Text style={styles.confirmText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Goal Modal ────────────────────────────────────── */}
      <Modal visible={addGoalVisible} transparent animationType="slide" onRequestClose={() => setAddGoalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>מטרה חדשה</Text>
            <TextInput style={styles.modalInput} placeholder="שם המטרה (קרן חירום, חופשה...)" placeholderTextColor="#555"
              value={goalName} onChangeText={setGoalName} textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="יעד ₪" placeholderTextColor="#555"
              keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="חיסכון חודשי ₪ (אופציונלי)" placeholderTextColor="#555"
              keyboardType="numeric" value={goalMonthly} onChangeText={setGoalMonthly} textAlign="right" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddGoalVisible(false)}>
                <Text style={styles.cancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddGoal}>
                <Text style={styles.confirmText}>צור מטרה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function GoalProgressInput({ goal, onUpdate }) {
  const [val, setVal] = useState(String(goal.current || 0));
  return (
    <View style={styles.goalUpdateRow}>
      <Text style={styles.goalUpdateLabel}>עדכן סכום שנחסך:</Text>
      <TextInput
        style={styles.goalUpdateInput}
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        textAlign="right"
      />
      <TouchableOpacity style={styles.goalUpdateBtn} onPress={() => onUpdate(parseFloat(val) || 0)}>
        <Text style={styles.goalUpdateBtnText}>✓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0A0A0A' },
  center:     { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:   { color: '#888', fontSize: 22 },
  title:      { color: '#FFF', fontSize: 20, fontWeight: '700' },
  scroll:     { flex: 1, paddingHorizontal: 20 },

  tabs:       { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#161616', borderRadius: 12, padding: 4 },
  tabBtn:     { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#1A1A1A' },
  tabText:    { color: '#555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },

  incomeCard: { backgroundColor: '#161616', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  incomeLabel:{ color: '#888', fontSize: 13, marginBottom: 4 },
  incomeAmount: { color: '#FFF', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  surplusRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  surplusLabel: { fontSize: 14, fontWeight: '600' },
  savingsRateLabel: { color: '#888', fontSize: 13 },

  section:    { marginBottom: 20 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'right' },

  catRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161616', borderRadius: 12, padding: 14, marginBottom: 8 },
  catLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catEmoji:   { fontSize: 22 },
  catLabel:   { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  catPct:     { color: '#555', fontSize: 12, textAlign: 'right' },
  catAmount:  { fontSize: 16, fontWeight: '700' },

  barContainer: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', marginBottom: 12 },
  barSegment: { minWidth: 2 },
  barLegend:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#888', fontSize: 11 },

  recCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  recIcon:    { fontSize: 18 },
  recText:    { flex: 1, fontSize: 14, lineHeight: 20, textAlign: 'right' },

  projCard:   { backgroundColor: '#161616', borderRadius: 12, padding: 16 },
  projRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  projYears:  { color: '#888', fontSize: 14 },
  projFV:     { color: '#27AE60', fontSize: 16, fontWeight: '700' },
  projLabel:  { color: '#888', fontSize: 13, marginTop: 8 },
  projValue:  { color: '#FFF', fontSize: 24, fontWeight: '700', marginTop: 2 },
  projNote:   { color: '#555', fontSize: 11, marginTop: 6, textAlign: 'right' },

  monthRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthNav:   { color: '#C0392B', fontSize: 28, paddingHorizontal: 12 },
  monthLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  addBtn:     { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  emptyText:  { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 15 },

  expRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  expEmoji:   { fontSize: 20 },
  expMid:     { flex: 1 },
  expLabel:   { color: '#FFF', fontSize: 14, textAlign: 'right' },
  expDate:    { color: '#555', fontSize: 11, textAlign: 'right' },
  expAmount:  { fontSize: 15, fontWeight: '700' },
  delBtn:     { padding: 4 },
  delText:    { color: '#555', fontSize: 14 },

  goalCard:   { backgroundColor: '#161616', borderRadius: 16, padding: 16, marginBottom: 16 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalName:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  goalAmounts:{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10, justifyContent: 'flex-end' },
  goalCurrent:{ color: '#27AE60', fontSize: 22, fontWeight: '800' },
  goalSep:    { color: '#555', fontSize: 16 },
  goalTarget: { color: '#888', fontSize: 16 },
  goalBar:    { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#222', marginBottom: 8 },
  goalBarFill:{ borderRadius: 5 },
  goalBarEmpty:{ backgroundColor: '#222' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalPct:    { color: '#888', fontSize: 12 },
  goalMonths: { color: '#27AE60', fontSize: 12 },
  goalUpdateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  goalUpdateLabel: { color: '#555', fontSize: 12, flex: 1, textAlign: 'right' },
  goalUpdateInput: { backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: '#FFF', width: 90 },
  goalUpdateBtn: { backgroundColor: '#27AE60', borderRadius: 8, padding: 8 },
  goalUpdateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#161616', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:   { color: '#FFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  modalSubtitle:{ color: '#888', fontSize: 13, marginBottom: 10, textAlign: 'right' },
  modalInput:   { backgroundColor: '#222', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 16, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, justifyContent: 'flex-end' },
  catChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  catChipEmoji: { fontSize: 14 },
  catChipLabel: { color: '#888', fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn:    { flex: 1, backgroundColor: '#222', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { color: '#888', fontSize: 16 },
  confirmBtn:   { flex: 1, backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
