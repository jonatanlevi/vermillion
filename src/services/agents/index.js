import { Analyst }      from './analyst';
import { Strategist }   from './strategist';
import { Psychologist } from './psychologist';
import { Coach }        from './coach';
import { Crisis }       from './crisis';
import { route }        from './orchestrator';
import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../financialTier';
import { CONFIG }       from '../../config';

// ─── Ollama health check ──────────────────────────────────────────
async function isOllamaOnline() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const r = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return r.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

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

// ─── Local offline coach (no Ollama needed) ──────────────────────
function buildOfflineResponse(userMessage, context) {
  const { metrics, tier } = context;
  const m = metrics;
  const msg = userMessage;
  const fmt = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;

  if (!m || m.totalIncome === 0) {
    return 'נראה שהפרופיל עדיין לא הושלם. סיים את האפיון ואז תוכל לקבל ייעוץ מותאם.';
  }

  const surplus  = m.monthlySurplus;
  const income   = m.totalIncome;
  const debt     = m.totalDebt   || 0;
  const savings  = m.liquidSavings || 0;

  if (/חוב|הלוואה|אשראי|מינוס|חובות/.test(msg)) {
    if (!debt) return `לפי הפרופיל שלך — אין חובות. זה יתרון גדול.\n\n${savings < income * 3 ? `הצעד הבא: בנה קרן חירום של ${fmt(income * 3)} (3 חודשי הכנסה).` : 'הצעד הבא: תתחיל להשקיע את העודף.'}\n\nמה מעסיק אותך כלכלית?`;
    const months = surplus > 0 ? Math.ceil(debt / surplus) : null;
    return `יש לך ${fmt(debt)} חוב ו-${fmt(Math.max(0, surplus))} עודף חודשי.\n\n${months ? `בקצב הנוכחי — החוב נגמר תוך **${months} חודשים** אם תפסיק להוסיף עליו.` : 'צריך קודם לייצר עודף חודשי לפני שמכסים חוב.'}\n\nמה ריבית החוב שלך?`;
  }

  if (/חסכ|לחסוך|לשמור|קרן חירום/.test(msg)) {
    if (surplus <= 0) return `עם גירעון של ${fmt(Math.abs(surplus))} בחודש — הצעד הראשון הוא לעצור את "הדימום".\n\nמה 3 ההוצאות הגדולות שלך שאפשר להקטין?`;
    const target = income * 3;
    return `יש לך ${fmt(surplus)} עודף חודשי.\n\n${savings < target ? `קרן חירום: יש לך ${fmt(savings)}, היעד ${fmt(target)} (3 חודשי הכנסה). עוד ${fmt(target - savings)} לסגור — בקצב הנוכחי כ-${Math.ceil((target - savings) / surplus)} חודשים.` : `קרן חירום מלאה! הצעד הבא — הכסף צריך לעבוד.`}\n\nמה מונע ממך לחסוך עכשיו?`;
  }

  if (/השקע|מניות|בורסה|ETF|קריפטו|תיק השקעות/.test(msg)) {
    if (debt > income * 2) return `לפני השקעות — יש ${fmt(debt)} חוב.\n\nריבית של 12-18% על חוב עדיפה על כל תשואה בבורסה. קודם מכבים את השריפה, אחר כך בונים.\n\nכמה מהעודף אפשר להפנות לחוב?`;
    if (surplus <= 0) return `להשקיע — צריך קודם עודף חודשי. עכשיו יש גירעון. בוא נפתור את זה קודם.\n\nמאיפה הגירעון מגיע?`;
    return `${fmt(surplus)} לחודש זמינים להשקעה.\n\nכלל ברזל: קרן מחקה מדד (ת"א 125 / S&P500) + דמי ניהול נמוכים (מתחת ל-0.5%) — עדיפה על 80% מהמנהלים הפעילים.\n\nמה שיעור הסיכון שנוח לך?`;
  }

  if (/משכנתא|דירה|לקנות דירה|רכישת דירה/.test(msg)) {
    if (savings < 200000) return `דירה צריכה הון עצמי של 25% + עלויות עסקה.\n\nכרגע יש לך ${fmt(savings)}. ${surplus > 0 ? `בקצב חיסכון של ${fmt(surplus)} — כ-${Math.ceil((500000 - Math.max(savings, 0)) / surplus)} חודשים לדירה של 2M.` : ''}\n\nמה טווח המחיר שאתה מסתכל עליו?`;
    return `${fmt(savings)} הון עצמי — כבר יש עם מה לדבר.\n\nהשאלות החשובות: (1) כמה ריבית על משכנתא כרגע? (2) האם שכירות + השקעה עדיפה?\n\nיש לך מספרים ספציפיים?`;
  }

  if (/שכר|משכורת|העלאה|להרוויח יותר|קידום/.test(msg)) {
    return `העלאת שכר היא ה-ROI הכי גבוה שיש — עבודה אחת, תשואה לכל החיים.\n\nהמהלך: אל תחכה לסקירה שנתית. בקש פגישה, הצג ערך ספציפי שהבאת, בקש 15-20% מעל מה שאתה מוכן לקבל.\n\nמתי הפעם האחרונה שביקשת העלאה?`;
  }

  if (/פנסיה|השתלמות|ביטוח מנהלים/.test(msg)) {
    return `פנסיה וקרן השתלמות — כסף פטור ממס שאתה משאיר על הרצפה אם לא מנצל.\n\nקרן השתלמות: פטורה ממס רווחי הון עד ₪20,520 שנתי — כל שכיר חייב למצות.\n\nהמעסיק שלך מפקיד קרן השתלמות? בדוק שהאחוז תקין.`;
  }

  if (/תקציב|הוצאות|ניהול|לאן הכסף/.test(msg)) {
    return `התמונה שלך:\nהכנסה: ${fmt(income)} | הוצאות: ${fmt(m.totalExpenses)} | עודף: ${fmt(Math.max(0, surplus))}\n\n${surplus < 0 ? `גירעון של ${fmt(Math.abs(surplus))} — המטרה הראשונה.` : surplus < income * 0.1 ? `חיסכון של ${Math.round(surplus/income*100)}% — מתחת ל-10%, יש מקום לשיפור.` : `תקציב מאוזן.`}\n\nמה ההוצאה שהכי כואבת לך?`;
  }

  // Default: status-based coaching
  if (surplus < 0) {
    return `המצב: גירעון של ${fmt(Math.abs(surplus))} בחודש (${fmt(income)} נכנס, ${fmt(m.totalExpenses)} יוצא).\n\nהצעד הראשון: רשום את 3 ההוצאות הגדולות שבשליטתך ובדוק מה ניתן לקצץ.\n\nמה ההוצאה שהכי קשה לך להפחית?`;
  }
  if (debt > income) {
    return `יש לך ${fmt(surplus)} עודף חודשי ו-${fmt(debt)} חוב.\n\nהמהלך החכם: חוב בריבית של 12-18% עדיף לסגור לפני שמשקיעים ב-8%.\n\nכמה מהעודף אתה מוכן להפנות לחוב?`;
  }
  return `יש לך ${fmt(surplus)} עודף חודשי — ${Math.round(surplus/income*100)}% מהכנסה. ${savings > 0 ? `ו-${fmt(savings)} בצד.` : ''}\n\nמה המטרה הכלכלית הבאה שלך?`;
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

  // Fast Ollama check — if offline, skip 36s of timeouts, use local coach
  const ollamaOnline = await isOllamaOnline();
  if (!ollamaOnline) {
    onProgress?.({ stage: 'synthesizing' });
    return {
      response:    buildOfflineResponse(userMessage, context),
      agentsUsed:  [],
      raw:         [],
      context,
      isCrisis:    false,
    };
  }

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
