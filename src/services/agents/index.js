import { Analyst }      from './analyst';
import { Strategist }   from './strategist';
import { Psychologist } from './psychologist';
import { Coach }        from './coach';
import { Crisis }       from './crisis';
import { route }        from './orchestrator';
import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../financialTier';
import { CONFIG }       from '../../config';

const AGENTS = {
  ANALYST:      Analyst,
  STRATEGIST:   Strategist,
  PSYCHOLOGIST: Psychologist,
  COACH:        Coach,
  CRISIS:       Crisis,
};

const LOW_TIERS       = ['עיוור', 'ייצוב'];
const INVEST_KEYWORDS = ['מניות', 'קריפטו', 'בורסה', 'ETF', 'תיק השקעות', 'קרן נאמנות', 'אג"ח'];

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

// ─── Greeting detector ───────────────────────────────────────────
const GREETING_RE = /^(שלום|היי|הי|hello|hi|yo|בוקר טוב|ערב טוב|לילה טוב|מה שלומך|מה קורה|מה נשמע|בוא נתחיל|בא נתחיל|ממשיכים|נמשיך|אפשר להתחיל|אנחנו ממשיכים)[\s!.?,]*$/i;

function buildGreetingResponse(context) {
  const { metrics, tier } = context;
  const fmt = n => (typeof n === 'number' && n > 0) ? `₪${Math.round(n).toLocaleString('he-IL')}` : null;

  if (!metrics || metrics.totalIncome === 0) {
    return 'שלום! הפרופיל שלך מוכן. מה תרצה לשאול?';
  }

  const income      = metrics.totalIncome;
  const expenses    = metrics.totalExpenses;
  const surplus     = metrics.monthlySurplus;
  const savingsRate = metrics.savingsRate || 0;
  const totalDebt   = metrics.totalDebt || 0;
  const goal        = metrics.moneyGoal || '';

  if (surplus < 0) {
    return `שלום 👋\n\nהמצב: הכנסה ${fmt(income)}, הוצאות ${fmt(expenses)} — גירעון של ${fmt(Math.abs(surplus))} בחודש.\n\nמאיפה רוצה להתחיל — לצמצם הוצאות, להגדיל הכנסה, או לסדר סדרי עדיפויות?`;
  }

  if (surplus === 0 || savingsRate < 2) {
    return `שלום 👋\n\nמה שנכנס יוצא — ${fmt(income)} פנימה, ${fmt(expenses)} החוצה, כמעט לא נשאר.\n\nהצעד הראשון: למצוא לאן הכסף הולך. מה ההוצאה שהכי מפתיעה אותך?`;
  }

  if (totalDebt > income * 3) {
    return `שלום 👋\n\nיש לך עודף של ${fmt(surplus)} בחודש, אבל גם חוב של ${fmt(totalDebt)}.\n\nנכון לדון בתכנית לסגור את החוב בצורה חכמה?`;
  }

  if (goal) {
    return `שלום 👋\n\nאתה חוסך ${savingsRate}% — ${fmt(surplus)} בחודש. המטרה שלך: "${goal}".\n\nמה הצעד הבא שרוצה לקדם?`;
  }

  return `שלום 👋\n\nאתה חוסך ${savingsRate}% — ${fmt(surplus)} בחודש. זה טוב.\n\nמה תרצה לעבוד עליו היום?`;
}

// ─── Context builder ─────────────────────────────────────────────
function buildContext(userData) {
  const dailyAnswers = userData?.dailyAnswers || {};
  const finData      = userData?.financialData || {};

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

  const metricsText   = `הכנסה: ₪${metrics.totalIncome} | הוצאות: ₪${metrics.totalExpenses} | עודף: ₪${metrics.monthlySurplus} | חוב: ₪${metrics.totalDebt} | חיסכון נזיל: ₪${metrics.liquidSavings}`;
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

// ─── Post-synthesis validator ────────────────────────────────────
const ONBOARDING_HALLUCINATION = [
  'מה ההכנסה החודשית', 'מה ההכנסה שלך', 'כמה נכנס לחשבון',
  'צריך מספרים', 'בשביל לעזור לך באמת', 'לא מאמין בשיחות חולין',
  'מה הכנסתך', 'בשביל לעזור', 'כמה אתה מרוויח',
];

function validateResponse(response, context) {
  if (context.metrics?.totalIncome > 0) {
    const lower = response.toLowerCase();
    if (ONBOARDING_HALLUCINATION.some(p => lower.includes(p.toLowerCase()))) {
      return offlineFallback(context);
    }
  }
  if (!LOW_TIERS.includes(context.tier)) return response;
  const hasInvestmentAdvice = INVEST_KEYWORDS.some(k => response.includes(k));
  if (!hasInvestmentAdvice) return response;
  return response
    .split('\n')
    .filter(line => !INVEST_KEYWORDS.some(k => line.includes(k)))
    .join('\n')
    .trim()
    + '\n\n⚠️ בשלב הנוכחי ("' + context.tier + '"), הצעד הנכון הוא סגירת חובות לפני כל השקעה.';
}

// ─── Synthesizer ─────────────────────────────────────────────────
async function synthesize(userMessage, agentResults, context, chatHistory) {
  const sections = agentResults
    .filter(r => r.response?.trim())
    .map(r => `[${r.agent}]: ${r.response}`)
    .join('\n\n');

  if (!sections) return '';
  if (agentResults.length === 1) return agentResults[0].response;

  const SYNTH_PROMPT = `אתה THE VOICE של VerMillion — היועץ הפיננסי האישי.
קיבלת תובנות מסוכנים מומחים. תפקידך: לאחד אותם לתשובה אחת חכמה ואלגנטית.

חוקים:
- ענה בעברית בלבד.
- מקסימום 6 שורות.
- אל תזכיר את הסוכנים — דבר בקול אחד.
- שמור על מבנה: אבחנה → תוכנית → צעד מחר.
- טון: סמכותי, אמפתי, ישיר.
- הפרופיל הפיננסי כבר נאסף — אסור לשאול שאלות איסוף מידע.
- אתה בהמשך שיחה — אל תתחיל מחדש, אל תבקש נתונים שכבר יש.`;

  const historyLines = (chatHistory || [])
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.text?.slice(0, 120)}`)
    .join('\n');
  const historyBlock = historyLines ? `\nהיסטוריית שיחה אחרונה:\n${historyLines}\n` : '';

  const gameContext = context.gameText ? `\n\nאימון קוגניטיבי: ${context.gameText}` : '';
  const { runAgent } = await import('./_runAgent');
  const synthesized = await runAgent({
    model: CONFIG.AI_MODEL,
    systemPrompt: SYNTH_PROMPT,
    userMessage: `${historyBlock}\nשאלת המשתמש:\n${userMessage}\n\nתובנות הצוות:\n${sections}${gameContext}`,
    temperature: 0.4,
    maxTokens: 300,
  });

  return synthesized || sections;
}

// ─── Public API ───────────────────────────────────────────────────
export async function askTeam(userMessage, userData, onProgress, chatHistory) {
  const context = buildContext(userData);

  // Greeting shortcut — answer from profile data, skip Ollama entirely
  if (GREETING_RE.test(userMessage.trim())) {
    onProgress?.({ stage: 'synthesizing' });
    return { response: buildGreetingResponse(context), agentsUsed: [], raw: [], context, isCrisis: false };
  }

  // Crisis detection (pure JS, instant)
  onProgress?.({ stage: 'routing' });
  const agentNames = await route(userMessage);

  if (agentNames[0] === 'CRISIS') {
    onProgress?.({ stage: 'thinking', agents: ['CRISIS'] });
    const crisisResponse = await Crisis.run(userMessage, context);
    return { response: crisisResponse, agentsUsed: ['CRISIS'], raw: [], context, isCrisis: true };
  }

  onProgress?.({ stage: 'thinking', agents: agentNames });
  const promises = agentNames.map(async (name) => {
    const agent = AGENTS[name];
    if (!agent) return null;
    const response = await agent.run(userMessage, context);
    onProgress?.({ stage: 'agent_done', agent: name, response });
    return { agent: name, response };
  });

  const results = (await Promise.all(promises)).filter(Boolean);

  onProgress?.({ stage: 'synthesizing' });
  const synthesized = await synthesize(userMessage, results, context, chatHistory);

  const finalResponse = validateResponse(synthesized || offlineFallback(context), context);
  return { response: finalResponse, agentsUsed: agentNames, raw: results, context, isCrisis: false };
}

function offlineFallback(context) {
  const { tier, metrics } = context;
  if (!metrics || metrics.totalIncome === 0) {
    return 'היועץ לא זמין כרגע. בדוק שה-Ollama tunnel פעיל ונסה שנית.';
  }
  const surplus  = metrics.monthlySurplus;
  const income   = metrics.totalIncome;
  const fmt      = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;
  if (surplus < 0) {
    return `יש גירעון חודשי של ${fmt(surplus)}. הצעד הראשון: רשום את 3 ההוצאות הגדולות שלך ובדוק מה ניתן לקצץ.`;
  }
  if (surplus === 0) {
    return `כל מה שנכנס יוצא — ${fmt(income)} פנימה, ${fmt(metrics.totalExpenses)} החוצה. בואו נחפש לאן הכסף הולך.`;
  }
  if (tier === 'עיוור' || tier === 'ייצוב') {
    return `שלב "${tier}" — המטרה: לייצב את הבסיס. התחל: פתח אקסל / נייר, רשום הכנסות מול הוצאות לחודש האחרון.`;
  }
  return `יש לך עודף חודשי של ${fmt(surplus)}. שאל אותי על הצעד הבא — השקעה, חיסכון, או סגירת חוב.`;
}
