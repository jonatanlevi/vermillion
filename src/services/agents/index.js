import { Analyst }     from './analyst';
import { Strategist }  from './strategist';
import { Psychologist } from './psychologist';
import { Coach }       from './coach';
import { Crisis }      from './crisis';
import { route }       from './orchestrator';
import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../financialTier';
import { CONFIG } from '../../config';

const AGENTS = {
  ANALYST:      Analyst,
  STRATEGIST:   Strategist,
  PSYCHOLOGIST: Psychologist,
  COACH:        Coach,
  CRISIS:       Crisis,
};

const LOW_TIERS        = ['עיוור', 'ייצוב'];
const INVEST_KEYWORDS  = ['מניות', 'קריפטו', 'בורסה', 'ETF', 'תיק השקעות', 'קרן נאמנות', 'אג"ח'];

const CAMEL_TO_SNAKE = {
  netIncome:        'net_income',
  spouseIncome:     'partner_income',
  housingCost:      'housing_expense',
  fixedExpenses:    'fixed_expenses',
  variableExpenses: 'variable_expenses',
  creditDebt:       'credit_debt',
  loans:            'loans_total',
  savings:          'liquid_savings',
  moneyGoal:        'money_goal',
  moneyFear:        'money_fear',
  assets:           'investments',
};

function buildContext(userData) {
  const dailyAnswers = userData?.dailyAnswers || {};
  const finData      = userData?.financialData || {};

  // Map flat camelCase keys (onboardingAI path) → snake_case so computeFinancialMetrics can read them
  const snakeFin = {};
  for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
    if (finData[camel] != null) snakeFin[snake] = finData[camel];
  }
  const mergedAnswers = Object.keys(snakeFin).length > 0
    ? { _fin: snakeFin, ...dailyAnswers }
    : dailyAnswers;

  const metrics    = computeFinancialMetrics(mergedAnswers);
  const completion = calcCompletion(dailyAnswers) ||
    (Object.values(finData).filter(v => v != null && v !== '').length >= 10 ? 80 : 0);
  const tier       = classifyTier(metrics, completion);

  const metricsText  = `הכנסה: ₪${metrics.totalIncome} | הוצאות: ₪${metrics.totalExpenses} | עודף: ₪${metrics.monthlySurplus} | חוב: ₪${metrics.totalDebt} | חיסכון נזיל: ₪${metrics.liquidSavings}`;
  const lifestyleText = `מצב: ${metrics.familyStatus || finData.familyStatus || '?'} | תעסוקה: ${metrics.employmentType || finData.employmentType || '?'} | פחד: ${metrics.moneyFear || finData.moneyFear || '?'} | מטרה: ${metrics.moneyGoal || finData.moneyGoal || '?'}`;

  const sessions = userData?.gameSessions || [];
  let gameText = '';
  if (sessions.length > 0) {
    const last7 = sessions.slice(-7);
    const byGame = {};
    last7.forEach(s => {
      if (!byGame[s.gameKey]) byGame[s.gameKey] = { count: 0, totalScore: 0, category: s.category };
      byGame[s.gameKey].count++;
      byGame[s.gameKey].totalScore += s.score;
    });
    const parts = Object.entries(byGame).map(([key, d]) =>
      `${key}×${d.count}(avg ${Math.round(d.totalScore / d.count)})`
    );
    gameText = `משחקים אחרונים: ${parts.join(', ')}`;
  }

  return { metrics, metricsText, lifestyleText, tier: tier.label, completion, gameText };
}

// ─── Post-synthesis validator ─────────────────────────────────────
const ONBOARDING_HALLUCINATION = [
  'מה ההכנסה החודשית', 'מה ההכנסה שלך', 'כמה נכנס לחשבון',
  'צריך מספרים', 'בשביל לעזור לך באמת', 'לא מאמין בשיחות חולין',
];

function validateResponse(response, context) {
  // Block onboarding-question hallucinations when we already have financial data
  if (context.metrics?.totalIncome > 0) {
    const lower = response.toLowerCase();
    if (ONBOARDING_HALLUCINATION.some(p => lower.includes(p.toLowerCase()))) {
      return offlineFallback(context);
    }
  }
  if (!LOW_TIERS.includes(context.tier)) return response;
  const hasInvestmentAdvice = INVEST_KEYWORDS.some(k => response.includes(k));
  if (!hasInvestmentAdvice) return response;
  // Strip and redirect — don't let dangerous advice reach the user
  return response
    .split('\n')
    .filter(line => !INVEST_KEYWORDS.some(k => line.includes(k)))
    .join('\n')
    .trim()
    + '\n\n⚠️ בשלב הנוכחי ("' + context.tier + '"), הצעד הנכון הוא סגירת חובות לפני כל השקעה.';
}

async function synthesize(userMessage, agentResults, context) {
  const sections = agentResults
    .filter(r => r.response?.trim())
    .map(r => `[${r.agent}]: ${r.response}`)
    .join('\n\n');

  if (!sections) return '';
  if (agentResults.length === 1) return agentResults[0].response;

  const SYNTH_PROMPT = `אתה THE VOICE של VerMillion — היועץ הפיננסי האישי.
קיבלת תובנות מ-${agentResults.length} סוכנים מומחים. תפקידך: לאחד אותם לתשובה אחת חכמה ואלגנטית למשתמש.

חוקים:
- ענה בעברית בלבד.
- מקסימום 6 שורות.
- אל תזכיר את הסוכנים — דבר בקול אחד.
- שמור על מבנה: אבחנה → תוכנית → צעד מחר.
- טון: סמכותי, אמפתי, ישיר.
- הפרופיל הפיננסי כבר נאסף — אסור לשאול שאלות איסוף מידע כמו "מה ההכנסה שלך".`;

  const gameContext = context.gameText ? `\n\nאימון קוגניטיבי: ${context.gameText}` : '';
  const { runAgent } = await import('./_runAgent');
  const synthesized = await runAgent({
    model: CONFIG.AI_MODEL,
    systemPrompt: SYNTH_PROMPT,
    userMessage: `שאלת המשתמש:\n${userMessage}\n\nתובנות הצוות:\n${sections}${gameContext}`,
    temperature: 0.4,
    maxTokens: 300,
  });

  return synthesized || sections;
}

export async function askTeam(userMessage, userData, onProgress) {
  const context = buildContext(userData);

  // 1. Route — crisis detection happens here (pure JS, instant)
  onProgress?.({ stage: 'routing', message: 'מנתב לסוכנים מומחים...' });
  const agentNames = await route(userMessage);

  // 2. Crisis shortcut — skip synthesis, return immediately with isCrisis flag
  if (agentNames[0] === 'CRISIS') {
    onProgress?.({ stage: 'thinking', message: 'מפעיל תמיכת חירום...', agents: ['CRISIS'] });
    const crisisResponse = await Crisis.run(userMessage, context);
    return { response: crisisResponse, agentsUsed: ['CRISIS'], raw: [], context, isCrisis: true };
  }

  // 3. Run agents in parallel
  onProgress?.({ stage: 'thinking', message: `${agentNames.length} סוכנים חושבים...`, agents: agentNames });
  const promises = agentNames.map(async (name) => {
    const agent = AGENTS[name];
    if (!agent) return null;
    const response = await agent.run(userMessage, context);
    onProgress?.({ stage: 'agent_done', agent: name, response });
    return { agent: name, response };
  });

  const results = (await Promise.all(promises)).filter(Boolean);

  // 4. Synthesize
  onProgress?.({ stage: 'synthesizing', message: 'מאחד את התובנות...' });
  const synthesized = await synthesize(userMessage, results, context);

  // 5. Validate — block investment advice for low tiers
  const finalResponse = validateResponse(synthesized || offlineFallback(context), context);

  return { response: finalResponse, agentsUsed: agentNames, raw: results, context, isCrisis: false };
}

function offlineFallback(context) {
  const { tier, metrics } = context;
  if (!metrics || metrics.totalIncome === 0) {
    return 'היועץ לא זמין כרגע. בדוק שה-Ollama tunnel פעיל ונסה שנית.';
  }
  const surplus = metrics.monthlySurplus;
  if (surplus < 0) {
    return `עפ"י הנתונים שלך יש גירעון חודשי של ₪${Math.abs(Math.round(surplus))}. הצעד הראשון: רשום את 3 ההוצאות הגדולות שלך ובדוק מה ניתן לקצץ.`;
  }
  if (tier === 'עיוור' || tier === 'ייצוב') {
    return `שלב "${tier}" — המטרה שלך היא לייצב את הבסיס. התחל: פתח אקסל / נייר, רשום הכנסות מול הוצאות לחודש האחרון.`;
  }
  return `שלב "${tier}" — יש לך עודף חודשי של ₪${Math.round(surplus)}. שאל אותי על הצעד הבא — השקעה, חיסכון, או סגירת חוב.`;
}
