// personalizationAgent.js
// Builds rich, numbered financial snapshots for AI coaching personalization.
// Fixes the critical gap: coaching content used tier only, not user's actual ₪ figures.

import { computeFinancialMetrics, calcCompletion } from '../data/dailyQuestions';
import { classifyTier } from './financialTier';

const fmt = (n) => `₪${Math.round(n).toLocaleString('he-IL')}`;

export function buildFinancialSnapshot(userData) {
  if (!userData?.dailyAnswers) return null;

  const answers = userData.dailyAnswers;
  const completion = calcCompletion(answers);

  let computedAge = 0;
  if (userData?.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      computedAge = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) computedAge--;
    }
  }

  const metrics = computeFinancialMetrics({ ...answers, _age: { _computed_age: computedAge } });
  const tier = classifyTier(metrics, completion);
  const { totalIncome, totalExpenses, monthlySurplus, savingsRate, totalDebt, netWorth, yearsLeft } = metrics;

  return {
    tier: tier.tier,
    tierLabel: tier.label,
    age: computedAge,
    completion,
    income: { monthly: totalIncome, formatted: fmt(totalIncome) },
    expenses: { monthly: totalExpenses, formatted: fmt(totalExpenses) },
    surplus: {
      monthly: monthlySurplus,
      formatted: fmt(Math.abs(monthlySurplus)),
      isDeficit: monthlySurplus < 0,
    },
    savings: {
      rate: savingsRate,
      gapToTarget: Math.max(0, Math.round(totalIncome * 0.2) - Math.max(0, monthlySurplus)),
      gapFormatted: fmt(Math.max(0, Math.round(totalIncome * 0.2) - Math.max(0, monthlySurplus))),
    },
    debt: {
      total: totalDebt,
      formatted: fmt(totalDebt),
      monthsOfIncome: totalIncome > 0 ? Math.round(totalDebt / totalIncome) : 0,
      hasDebt: totalDebt > 0,
    },
    wealth: { netWorth, formatted: fmt(netWorth), yearsToGoal: yearsLeft },
    urgencies: _buildUrgencies(metrics, tier.tier, answers, computedAge),
    opportunities: _buildOpportunities(metrics, tier.tier, answers),
  };
}

function _buildUrgencies(metrics, tier, answers, age) {
  const { monthlySurplus, totalDebt, totalIncome } = metrics;
  const urgencies = [];

  if (monthlySurplus < 0) {
    urgencies.push({
      type: 'deficit',
      severity: 'critical',
      message: `גירעון חודשי של ${fmt(Math.abs(monthlySurplus))} — כל חודש החוב גדל`,
    });
  }

  if (totalDebt > totalIncome * 3) {
    urgencies.push({
      type: 'debt',
      severity: 'high',
      message: `חוב כולל ${fmt(totalDebt)} = ${Math.round(totalDebt / totalIncome)} חודשי הכנסה`,
    });
  }

  if (tier <= 2 && answers['6']?.liquid_savings) {
    const liquid = parseFloat(answers['6'].liquid_savings) || 0;
    const emergencyTarget =
      (parseFloat(answers['5']?.housing_expense || 0) +
        parseFloat(answers['5']?.fixed_expenses || 0) +
        parseFloat(answers['5']?.variable_expenses || 0)) *
      3;
    if (liquid < emergencyTarget) {
      urgencies.push({
        type: 'emergency_fund',
        severity: 'medium',
        message: `קרן חירום: ${fmt(liquid)} מתוך ${fmt(emergencyTarget)} מינימום (3 חודשים)`,
      });
    }
  }

  if (age >= 45 && (!answers['6']?.pension_monthly || parseFloat(answers['6'].pension_monthly) < 1000)) {
    urgencies.push({
      type: 'pension',
      severity: 'high',
      message: `גיל ${age} ופנסיה נמוכה — כל שנה שעוברת = ${fmt(3600)} פחות בפרישה`,
    });
  }

  return urgencies;
}

function _buildOpportunities(metrics, tier, answers) {
  const { monthlySurplus } = metrics;
  const opportunities = [];

  if (tier >= 2 && monthlySurplus > 0) {
    opportunities.push({
      type: 'auto_save',
      message: `הגדר העברה אוטומטית של ${fmt(Math.min(500, monthlySurplus * 0.5))} ביום המשכורת`,
      impact: 'ראשון',
    });
  }

  const creditDebt = parseFloat(answers['6']?.credit_debt || 0);
  if (creditDebt > 0) {
    opportunities.push({
      type: 'credit_payoff',
      message: `כרטיס אשראי ${fmt(creditDebt)} — ריבית ~15%/שנה. לסגור ראשון.`,
      impact: 'מיידי',
    });
  }

  if (tier >= 3 && (!answers['6']?.investments || answers['6'].investments === '0')) {
    opportunities.push({
      type: 'investment',
      message: 'פתח קרן השתלמות — ₪1,000/חודש → ₪6,000 פטור מס בשנה',
      impact: 'גבוה',
    });
  }

  return opportunities;
}

// Generates a personalized coaching context block for injection into system prompt.
export function buildPersonalizedCoachingContext(userData, day) {
  const snapshot = buildFinancialSnapshot(userData);
  if (!snapshot) return '';

  const name = userData?.name?.split(' ')[0] || '';

  let ctx = `\n═══ נתונים אישיים של ${name} (יום ${day}) ═══\n`;
  ctx += `💰 הכנסה: ${snapshot.income.formatted}/חודש\n`;
  ctx += `📊 הוצאות: ${snapshot.expenses.formatted}/חודש\n`;
  ctx += snapshot.surplus.isDeficit
    ? `🔴 גירעון: ${snapshot.surplus.formatted}/חודש\n`
    : `✅ עודף: ${snapshot.surplus.formatted}/חודש (חיסכון ${snapshot.savings.rate}%)\n`;

  if (snapshot.debt.hasDebt) ctx += `⚠️ חוב כולל: ${snapshot.debt.formatted}\n`;

  if (snapshot.urgencies.length > 0) {
    ctx += '\n🚨 בעיות דחופות:\n';
    snapshot.urgencies.forEach((u) => { ctx += `  • ${u.message}\n`; });
  }

  if (snapshot.opportunities.length > 0) {
    ctx += '\n💡 הזדמנויות מיידיות:\n';
    snapshot.opportunities.forEach((o) => { ctx += `  • ${o.message}\n`; });
  }

  ctx += `═══════════════════════════════════\n`;
  ctx += `השתמש ב-₪ ספציפיים מהנתונים האמיתיים האלה. אל תמציא מספרים.\n`;

  return ctx;
}
