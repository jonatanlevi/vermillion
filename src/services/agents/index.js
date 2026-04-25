import { Analyst }     from './analyst';
import { Strategist }  from './strategist';
import { Psychologist } from './psychologist';
import { Coach }       from './coach';
import { route }       from './orchestrator';
import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../financialTier';

const AGENTS = {
  ANALYST: Analyst,
  STRATEGIST: Strategist,
  PSYCHOLOGIST: Psychologist,
  COACH: Coach,
};

/**
 * Build context once per question — passed to all agents
 */
function buildContext(userData) {
  const dailyAnswers = userData?.dailyAnswers || {};
  const metrics = computeFinancialMetrics(dailyAnswers);
  const completion = calcCompletion(dailyAnswers);
  const tier = classifyTier(metrics, completion);

  const metricsText = `הכנסה: ₪${metrics.totalIncome} | הוצאות: ₪${metrics.totalExpenses} | עודף: ₪${metrics.monthlySurplus} | חוב: ₪${metrics.totalDebt} | חיסכון נזיל: ₪${metrics.liquidSavings}`;

  const lifestyleText = `מצב: ${metrics.familyStatus || '?'} | תעסוקה: ${metrics.employmentType || '?'} | פחד: ${metrics.moneyFear || '?'} | מטרה: ${metrics.moneyGoal || '?'}`;

  return {
    metrics,
    metricsText,
    lifestyleText,
    tier: tier.label,
    completion,
  };
}

/**
 * Synthesize multiple agent responses into one cohesive answer.
 * Uses the same lightweight model as orchestrator.
 */
async function synthesize(userMessage, agentResults, context) {
  const sections = agentResults
    .filter(r => r.response?.trim())
    .map(r => `[${r.agent}]: ${r.response}`)
    .join('\n\n');

  if (!sections) return '';

  // If only one agent ran, return its answer directly (no synthesis needed)
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
    model: 'qwen2.5:3b',
    systemPrompt: SYNTH_PROMPT,
    userMessage: `שאלת המשתמש:\n${userMessage}\n\nתובנות הצוות:\n${sections}`,
    temperature: 0.4,
    maxTokens: 300,
  });

  return synthesized || sections; // fallback to raw sections if synth fails
}

/**
 * Main entry point — ask the team a question
 * @param {string} userMessage - what the user said
 * @param {object} userData - mockUser or real user data
 * @param {function} onProgress - optional callback for streaming agent updates
 * @returns {Promise<{ response, agentsUsed, raw }>}
 */
export async function askTeam(userMessage, userData, onProgress) {
  const context = buildContext(userData);

  // 1. Orchestrator decides which agents to call
  onProgress?.({ stage: 'routing', message: 'מנתב לסוכנים מומחים...' });
  const agentNames = await route(userMessage);

  // 2. Run agents in parallel
  onProgress?.({ stage: 'thinking', message: `${agentNames.length} סוכנים חושבים...`, agents: agentNames });
  const promises = agentNames.map(async (name) => {
    const agent = AGENTS[name];
    if (!agent) return null;
    const response = await agent.run(userMessage, context);
    onProgress?.({ stage: 'agent_done', agent: name, response });
    return { agent: name, response };
  });

  const results = (await Promise.all(promises)).filter(Boolean);

  // 3. Synthesize all responses into one
  onProgress?.({ stage: 'synthesizing', message: 'מאחד את התובנות...' });
  const finalResponse = await synthesize(userMessage, results, context);

  return {
    response: finalResponse,
    agentsUsed: agentNames,
    raw: results,
    context,
  };
}
