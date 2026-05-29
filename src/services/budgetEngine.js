const fmt = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;
const pct  = (n, income) => income > 0 ? Math.round((n / income) * 100) : 0;

export const EXPENSE_CATEGORIES = [
  { key: 'food',      label: 'אוכל',       emoji: '🍔', color: '#E67E22' },
  { key: 'transport', label: 'תחבורה',     emoji: '🚗', color: '#3498DB' },
  { key: 'housing',   label: 'דיור',       emoji: '🏠', color: '#C0392B' },
  { key: 'health',    label: 'בריאות',     emoji: '❤️', color: '#E74C3C' },
  { key: 'clothing',  label: 'ביגוד',      emoji: '👕', color: '#9B59B6' },
  { key: 'fun',       label: 'בילויים',    emoji: '🎭', color: '#1ABC9C' },
  { key: 'education', label: 'חינוך',      emoji: '📚', color: '#27AE60' },
  { key: 'other',     label: 'שונות',      emoji: '🔧', color: '#7F8C8D' },
];

export function buildBudget(financial) {
  const income  = financial.netIncome  || 0;
  const housing = financial.housingCost || 0;
  const fixed   = financial.fixedExpenses   || 0;
  const variable= financial.variableExpenses || 0;

  // הערכת תשלום חוב חודשי: 3% אשראי, פריסה 36 על הלוואות, 5% מינוס
  const debtPayment = Math.round(
    (financial.creditDebt || 0) * 0.03 +
    (financial.loans      || 0) / 36   +
    (financial.overdraft  || 0) * 0.05
  );

  const totalExpenses = housing + fixed + variable + debtPayment;
  const surplus       = income - totalExpenses;
  const savingsRate   = pct(Math.max(0, surplus), income);
  const targetSavings = Math.round(income * 0.2);
  const gapToTarget   = targetSavings - surplus;
  const totalDebt     = (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0);

  return {
    income,
    totalExpenses,
    surplus,
    savingsRate,
    targetSavings,
    gapToTarget,
    totalDebt,
    debtPaymentEstimate: debtPayment,
    categories: [
      { key: 'housing',  label: 'דיור',         emoji: '🏠', color: '#C0392B', amount: housing,      pct: pct(housing, income) },
      { key: 'fixed',    label: 'הוצאות קבועות', emoji: '🔄', color: '#8E44AD', amount: fixed,        pct: pct(fixed, income) },
      { key: 'variable', label: 'הוצאות משתנות', emoji: '💸', color: '#E67E22', amount: variable,     pct: pct(variable, income) },
      { key: 'debt',     label: 'חובות',         emoji: '💳', color: '#E74C3C', amount: debtPayment,  pct: pct(debtPayment, income) },
      { key: 'savings',  label: 'עודף / חיסכון', emoji: '💰', color: '#27AE60', amount: Math.max(0, surplus), pct: savingsRate },
    ],
    recommendations: _recommendations(income, surplus, savingsRate, gapToTarget, financial, totalDebt),
  };
}

function _recommendations(income, surplus, savingsRate, gapToTarget, fin, totalDebt) {
  const recs = [];

  if (surplus < 0) {
    recs.push({ type: 'danger',  icon: '🚨', text: `גירעון חודשי של ${fmt(surplus)} — עצור את הדימום לפני הכל` });
  } else if (savingsRate < 10) {
    recs.push({ type: 'warning', icon: '⚠️', text: `חיסכון ${savingsRate}% בלבד — מתחת ל-10%. יעד: 20%` });
    if (gapToTarget > 0)
      recs.push({ type: 'action', icon: '🎯', text: `להגיע ל-20% — צמצם ${fmt(gapToTarget)} בהוצאות משתנות` });
  } else if (savingsRate < 20) {
    recs.push({ type: 'info',    icon: '📈', text: `חיסכון ${savingsRate}% — טוב. עוד ${fmt(gapToTarget)} ל-20%` });
  } else {
    recs.push({ type: 'success', icon: '✅', text: `חיסכון ${savingsRate}% — מצוין! בין 10% הטובים בישראל` });
  }

  if (income > 0 && (fin.housingCost || 0) / income > 0.35)
    recs.push({ type: 'warning', icon: '🏠', text: `דיור לוקח ${pct(fin.housingCost, income)}% מההכנסה — מעל 35%` });

  if (totalDebt > income * 6)
    recs.push({ type: 'danger',  icon: '💳', text: `חוב גבוה (${fmt(totalDebt)}) — שלב ייצוב לפני השקעות` });

  if ((fin.savings || 0) < income * 3 && income > 0)
    recs.push({ type: 'action',  icon: '🛡️', text: `קרן חירום: יש ${fmt(fin.savings || 0)}, יעד ${fmt(income * 3)} (3 חודשים)` });

  return recs;
}

export function buildDebtPayoff(financial, extraMonthly = 0) {
  const totalDebt  = (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0);
  const income     = financial.netIncome || 0;
  const budget     = buildBudget(financial);
  const available  = Math.max(0, budget.surplus) + extraMonthly;

  if (totalDebt === 0) return { totalDebt: 0, months: 0, date: null };
  if (available <= 0)  return { totalDebt, months: null, date: null };

  const avgRate   = 0.015; // ריבית חודשית ממוצעת ~18% שנתי
  let balance     = totalDebt;
  let months      = 0;
  while (balance > 0 && months < 360) {
    balance = balance * (1 + avgRate) - available;
    months++;
  }

  const date = new Date();
  date.setMonth(date.getMonth() + months);

  return { totalDebt, months, date: date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) };
}

export function buildSavingsProjection(monthly, years = 10, annualRate = 0.07) {
  const months = years * 12;
  const r      = annualRate / 12;
  const fv     = r > 0 ? monthly * ((Math.pow(1 + r, months) - 1) / r) : monthly * months;
  return Math.round(fv);
}
