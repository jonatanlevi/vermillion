// validatorAgent.js
// Post-generation validator: ensures AI responses follow tier rules and legal guardrails.
// Run before showing response to user — or batch-run via multiGhostAgent for QA.

import { classifyTier } from './financialTier';
import { calcCompletion, computeFinancialMetrics } from '../data/dailyQuestions';

const RULES = [
  {
    id: 'no_specific_security',
    severity: 'critical',
    label: 'ניירות ערך ספציפיים — הפרת חוק ייעוץ השקעות',
    test: (r) => /\b(Apple|Tesla|Amazon|Google|AMZN|AAPL|TSLA|GOOGL|SPY|QQQ)\b/i.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'no_guaranteed_return',
    severity: 'critical',
    label: 'הבטחת תשואה — הפרת guardrail',
    test: (r) => /מובטח|ללא סיכון|100% תשואה|אין סיכון|בטוח לתת רווח/.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'no_specific_tax_advice',
    severity: 'high',
    label: 'ייעוץ מס ספציפי — יש להפנות לרו"ח',
    test: (r) => /תדווח ל-מס הכנסה|תשלם מס של \d|לא לשלם מס/.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'no_invest_advice_tier01',
    severity: 'critical',
    label: 'ייעוץ השקעות ל-Tier 0/1 — מסוכן, יש גירעון/חוב',
    test: (r) => /קנה מניות|קנה ETF|פתח תיק השקעות|השקע ב-/.test(r),
    tierRange: [0, 1],
  },
  {
    id: 'chinese_hallucination',
    severity: 'critical',
    label: 'תוכן סיני — hallucination',
    test: (r) => /[一-鿿]/.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'long_english_block',
    severity: 'high',
    label: 'בלוק אנגלי ארוך — תשובה שגויה',
    test: (r) => /[a-zA-Z]{25,}/.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'no_closing_question',
    severity: 'low',
    label: 'חסרה שאלה בסוף התשובה',
    test: (r) => !/[?？]/.test(r),
    tierRange: [0, 4],
  },
  {
    id: 'too_long',
    severity: 'low',
    label: 'תשובה ארוכה מדי (מעל 1500 תווים)',
    test: (r) => r.length > 1500,
    tierRange: [0, 4],
  },
  {
    id: 'empty_response',
    severity: 'critical',
    label: 'תשובה ריקה',
    test: (r) => r.trim().length < 20,
    tierRange: [0, 4],
  },
];

export function validateResponse(response, userData) {
  const text = response || '';
  const completion = calcCompletion(userData?.dailyAnswers || {});
  const metrics = computeFinancialMetrics(userData?.dailyAnswers || {});
  const tier = classifyTier(metrics, completion);
  const tierNum = tier.tier;

  const violations = RULES
    .filter((r) => tierNum >= r.tierRange[0] && tierNum <= r.tierRange[1])
    .filter((r) => r.test(text))
    .map((r) => ({ id: r.id, severity: r.severity, label: r.label }));

  const critical = violations.filter((v) => v.severity === 'critical');
  const valid = critical.length === 0;

  return {
    valid,
    violations,
    criticalCount: critical.length,
    tier: tierNum,
    tierLabel: tier.label,
  };
}

// Returns true when the response should be swapped for a mockAI fallback.
export function shouldFallback(validationResult) {
  return !validationResult.valid;
}

// Convenience: validate and return a sanitized label for logging.
export function getValidationSummary(validationResult) {
  const { valid, criticalCount, violations, tierLabel } = validationResult;
  if (valid) return `✅ תקין [Tier: ${tierLabel}]`;
  return `🚨 ${criticalCount} הפרות קריטיות [Tier: ${tierLabel}]: ${violations
    .filter((v) => v.severity === 'critical')
    .map((v) => v.label)
    .join(' | ')}`;
}
