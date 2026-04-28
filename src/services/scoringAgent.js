// scoringAgent.js
// Fair leaderboard scoring: 70% financial health + 30% game performance.
// Fixes: game reflexes (יוסף) outranking financial wisdom (מרים) on the leaderboard.

import { calcCompletion, computeFinancialMetrics } from '../data/dailyQuestions';
import { classifyTier } from './financialTier';

const FINANCIAL_WEIGHT = 0.70;
const GAME_WEIGHT = 0.30;

// ─── Financial Score (0–100) ─────────────────────────────────────────────────

function computeFinancialScore(userData) {
  if (!userData?.dailyAnswers) return 0;

  const completion = calcCompletion(userData.dailyAnswers);
  if (completion < 20) return Math.round(completion * 0.4);

  const metrics = computeFinancialMetrics(userData.dailyAnswers);
  const tier = classifyTier(metrics, completion);

  let score = 0;

  // Tier base: 0–40 pts (10 per tier level)
  score += tier.tier * 10;

  // Savings rate: 0–25 pts (linear up to 20% target)
  score += Math.min(25, (Math.max(0, metrics.savingsRate) / 20) * 25);

  // Net worth: 0–15 pts (log scale up to ₪1M)
  if (metrics.netWorth > 0) {
    score += Math.min(15, (Math.log10(metrics.netWorth + 1) / Math.log10(1_000_000)) * 15);
  }

  // No credit card debt: 0–10 pts
  const creditDebt = parseFloat(userData.dailyAnswers['6']?.credit_debt || 0);
  score += creditDebt === 0 ? 10 : Math.max(0, 10 - (creditDebt / 5000) * 10);

  // Profile completion bonus: 0–10 pts
  score += (completion / 100) * 10;

  return Math.min(100, Math.round(score));
}

// ─── Game Score (already 0–100 in userData.score) ────────────────────────────

function normalizeGameScore(userData) {
  return Math.min(100, Math.max(0, userData?.score || 0));
}

// ─── Composite ───────────────────────────────────────────────────────────────

export function computeCompositeScore(userData) {
  const financialScore = computeFinancialScore(userData);
  const gameScore = normalizeGameScore(userData);
  const composite = Math.round(financialScore * FINANCIAL_WEIGHT + gameScore * GAME_WEIGHT);

  return {
    composite,
    financialScore,
    gameScore,
    breakdown: {
      financial: `${financialScore} × 70% = ${Math.round(financialScore * FINANCIAL_WEIGHT)} נק׳`,
      game: `${gameScore} × 30% = ${Math.round(gameScore * GAME_WEIGHT)} נק׳`,
    },
  };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function rankLeaderboard(users) {
  return users
    .map((u) => ({ ...u, _scoring: computeCompositeScore(u) }))
    .sort((a, b) => b._scoring.composite - a._scoring.composite)
    .map((u, idx) => ({ ...u, rank: idx + 1 }));
}

// ─── Streak bonus (optional add-on for display) ───────────────────────────────

export function applyStreakBonus(composite, streak) {
  if (streak <= 0) return composite;
  const bonus = Math.min(5, Math.floor(streak / 7)); // +1 pt per week, max +5
  return Math.min(100, composite + bonus);
}
