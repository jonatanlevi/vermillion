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

function buildContext(userData) {
  const dailyAnswers = userData?.dailyAnswers || {};
  const metrics    = computeFinancialMetrics(dailyAnswers);
  const completion = calcCompletion(dailyAnswers);
  const tier       = classifyTier(metrics, completion);

  const metricsText  = `הכנסה: ₪${metrics.totalIncome} | הוצאות: ₪${metrics.totalExpenses} | עודף: ₪${metrics.monthlySurplus} | חוב: ₪${metrics.totalDebt} | חיסכון נזיל: ₪${metrics.liquidSavings}`;
  const lifestyleText = `מצב: ${metrics.familyStatus || '?'} | תעסוקה: ${metrics.employmentType || '?'} | פחד: ${metrics.moneyFear || '?'} | מטרה: ${metrics.moneyGoal || '?'}`;

  return { metrics, metricsText, lifestyleText, tier: tier.label, completion };
}

// ─── Post-synthesis validator ─────────────────────────────────────
function validateResponse(response, context) {
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
- טון: סמכותי, אמפתי, ישיר.`;

  const { runAgent } = await import('./_runAgent');
  const synthesized = await runAgent({
    model: CONFIG.AI_MODEL,
    systemPrompt: SYNTH_PROMPT,
    userMessage: `שאלת המשתמש:\n${userMessage}\n\nתובנות הצוות:\n${sections}`,
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
  const finalResponse = validateResponse(synthesized, context);

  return { response: finalResponse, agentsUsed: agentNames, raw: results, context, isCrisis: false };
}
