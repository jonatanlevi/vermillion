import { computeFinancialMetrics, calcCompletion } from '../../data/dailyQuestions';
import { classifyTier } from '../financialTier';
import { buildSystemPrompt, generatePersonalizedGreeting, buildDynamicContext } from '../aiPrompts';

// ─── Groq streaming call (via Vercel edge function) ──────────────
async function callGroq(userMessage, userData, chatHistory, onToken) {
  const context = buildContext(userData);
  const memorySection = context.memoryText ? `\n\n---\n${context.memoryText}\n---` : '';
  const systemPrompt = buildSystemPrompt(userData) + buildDynamicContext(userMessage, userData, chatHistory) + memorySection;

  const STAGE_RE_LOCAL = /^[🔍🧠✓✨⏳]/;
  const filteredHistory = (chatHistory || [])
    .filter(m => !STAGE_RE_LOCAL.test(m.text || '') && (m.text || '').length <= 500)
    .slice(-12);

  const messages = [
    ...filteredHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text || '',
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${origin}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    });
    if (!res.ok) return '';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            onToken?.(fullText);
          }
        } catch { /* partial chunk */ }
      }
    }
    return fullText;
  } catch {
    return '';
  }
}

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

  const memoryInsights = userData?.profile?.ai_memory?.insights;
  const memoryText = memoryInsights?.length > 0
    ? `זיכרון מצטבר על המשתמש:\n${memoryInsights.slice(-10).join('\n')}`
    : '';

  return { metrics, metricsText, lifestyleText, tier: tier.label, completion, gameText, memoryText };
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

// ─── Local offline coach (Groq fallback) ─────────────────────────
function buildOfflineResponse(userMessage, context, chatHistory) {
  const { metrics, tier } = context;
  const m = metrics;
  const msg = userMessage.trim();
  const fmt = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;

  if (!m || m.totalIncome === 0) {
    return 'נראה שהפרופיל עדיין לא הושלם. סיים את האפיון ואז תוכל לקבל ייעוץ מותאם.';
  }

  const surplus  = m.monthlySurplus;
  const income   = m.totalIncome;
  const debt     = m.totalDebt   || 0;
  const savings  = m.liquidSavings || 0;

  // ── Check messages / very short ───────────────────────────────
  if (msg.length <= 10 || /^(אתה פה|אתה שם|פה|שם|ok|אוקי|בסדר|כן|לא|תמשיך|ממשיכים|עובד\??|אחד|שתיים)[\s!?.]*$/.test(msg)) {
    const lastCoach = (chatHistory || []).slice().reverse().find(m => m.role !== 'user')?.text || '';
    if (lastCoach.includes('ההוצאה') || lastCoach.includes('כואבת') || lastCoach.includes('הוצאות')) {
      return `ספר לי יותר — מה הסכום בחודש בערך? זה עוזר לחשב כמה אפשר לחסוך.`;
    }
    return `כן, אני כאן.\n\nיש לך ${fmt(Math.max(0, surplus))} עודף חודשי. מה השאלה?`;
  }

  // ── Context: user is answering a question about expenses ──────
  const lastCoachText = (chatHistory || []).slice().reverse().find(m => m.role !== 'user')?.text || '';
  const answeringExpense = lastCoachText.includes('ההוצאה') || lastCoachText.includes('כואבת') || lastCoachText.includes('הוצאה שכ');
  if (answeringExpense && msg.length < 30 && !/תוכנית|חיסכ|חסכ|השקע|חוב/.test(msg)) {
    return `${msg} — זו הוצאה שכדאי לבחון.\n\n${surplus > 0 ? `אם תקצץ בזה — ישר רואים תוצאה בעודף החודשי של ${fmt(surplus)}.` : `כל קיצוץ עוזר לסגור את הגירעון.`}\n\nיש עוד הוצאות שאתה מרגיש שאפשר לקצץ?`;
  }

  // ── Debt ──────────────────────────────────────────────────────
  if (/חוב|הלוואה|אשראי|מינוס|חובות/.test(msg)) {
    if (!debt) return `לפי הפרופיל שלך — אין חובות. זה יתרון גדול.\n\n${savings < income * 3 ? `הצעד הבא: קרן חירום של ${fmt(income * 3)} (3 חודשי הכנסה).` : 'הצעד הבא: להשקיע את העודף.'}\n\nמה מעסיק אותך כלכלית?`;
    const months = surplus > 0 ? Math.ceil(debt / surplus) : null;
    return `יש לך ${fmt(debt)} חוב ו-${fmt(Math.max(0, surplus))} עודף חודשי.\n\n${months ? `בקצב הנוכחי — החוב נגמר תוך **${months} חודשים** אם תפסיק להוסיף עליו.` : 'צריך קודם לייצר עודף חודשי לפני שמכסים חוב.'}\n\nמה ריבית החוב שלך?`;
  }

  // ── Savings / Planning ────────────────────────────────────────
  if (/חיסכ|חסכ|לחסוך|לשמור|קרן חירום|תוכנית|לסדר|לארגן|להתחיל|סדר עדיפויות/.test(msg)) {
    if (surplus <= 0) return `עם גירעון של ${fmt(Math.abs(surplus))} בחודש — הצעד הראשון הוא לעצור את "הדימום".\n\nמה 3 ההוצאות הגדולות שלך שאפשר להקטין?`;
    const target = income * 3;
    const steps = [];
    if (savings < target) steps.push(`**קרן חירום**: יש ${fmt(savings)}, צריך ${fmt(target)} — עוד ${Math.ceil((target - savings) / surplus)} חודשים`);
    if (debt > 0) steps.push(`**סגירת חוב**: ${fmt(debt)} — ${Math.ceil(debt / surplus)} חודשים בקצב הנוכחי`);
    if (steps.length === 0) steps.push(`**השקעה**: ${fmt(surplus)} לחודש לקרן מחקה מדד`);
    return `תוכנית לפי הנתונים שלך:\n\n${steps.join('\n')}\n\nמאיפה רוצה להתחיל?`;
  }

  // ── Investing ─────────────────────────────────────────────────
  if (/השקע|מניות|בורסה|ETF|קריפטו|תיק השקעות/.test(msg)) {
    if (debt > income * 2) return `לפני השקעות — יש ${fmt(debt)} חוב.\n\nריבית של 12-18% על חוב עדיפה על כל תשואה בבורסה. קודם מכבים את השריפה.\n\nכמה מהעודף אפשר להפנות לחוב?`;
    if (surplus <= 0) return `להשקיע — צריך קודם עודף חודשי. עכשיו יש גירעון. בוא נפתור את זה קודם.`;
    return `${fmt(surplus)} לחודש זמינים להשקעה.\n\nכלל ברזל: קרן מחקה מדד (ת"א 125 / S&P500) + דמי ניהול נמוכים (מתחת ל-0.5%) — עדיפה על 80% מהמנהלים הפעילים.\n\nמה שיעור הסיכון שנוח לך?`;
  }

  // ── Real estate ───────────────────────────────────────────────
  if (/משכנתא|דירה|לקנות דירה|רכישת דירה/.test(msg)) {
    if (savings < 200000) return `דירה צריכה הון עצמי של 25% + עלויות עסקה.\n\nכרגע יש לך ${fmt(savings)}. ${surplus > 0 ? `בקצב חיסכון של ${fmt(surplus)} — כ-${Math.ceil((500000 - Math.max(savings, 0)) / surplus)} חודשים לדירה של 2M.` : ''}\n\nמה מחיר הדירה שאתה מסתכל עליה?`;
    return `${fmt(savings)} הון עצמי — כבר יש עם מה לדבר.\n\n(1) כמה ריבית על משכנתא כרגע? (2) האם שכירות + השקעה עדיפה?\n\nיש לך מספרים ספציפיים?`;
  }

  // ── Salary ────────────────────────────────────────────────────
  if (/שכר|משכורת|העלאה|להרוויח יותר|קידום/.test(msg)) {
    return `העלאת שכר היא ה-ROI הכי גבוה שיש — עבודה אחת, תשואה לכל החיים.\n\nהמהלך: בקש פגישה, הצג ערך ספציפי שהבאת, בקש 15-20% מעל מה שאתה מוכן לקבל.\n\nמתי הפעם האחרונה שביקשת העלאה?`;
  }

  // ── Pension ───────────────────────────────────────────────────
  if (/פנסיה|השתלמות|ביטוח מנהלים/.test(msg)) {
    return `קרן השתלמות: פטורה ממס רווחי הון עד ₪20,520 שנתי — כל שכיר חייב למצות.\n\nהמעסיק שלך מפקיד? בדוק שהאחוז תקין (6.5% מינימום).`;
  }

  // ── Budget ────────────────────────────────────────────────────
  if (/תקציב|הוצאות|ניהול|לאן הכסף|לנהל/.test(msg)) {
    return `התמונה שלך:\nהכנסה: ${fmt(income)} | הוצאות: ${fmt(m.totalExpenses)} | עודף: ${fmt(Math.max(0, surplus))}\n\n${surplus < 0 ? `גירעון של ${fmt(Math.abs(surplus))} — המטרה הראשונה.` : surplus < income * 0.1 ? `חיסכון של ${Math.round(surplus/income*100)}% — מתחת ל-10%.` : `תקציב מאוזן.`}\n\nמה ההוצאה שהכי כואבת לך?`;
  }

  // ── Default: vary by financial situation ─────────────────────
  if (surplus < 0) {
    return `גירעון של ${fmt(Math.abs(surplus))} בחודש (${fmt(income)} נכנס, ${fmt(m.totalExpenses)} יוצא).\n\nהצעד הראשון: רשום את 3 ההוצאות הגדולות שבשליטתך.\n\nמה ההוצאה שהכי קשה לך להפחית?`;
  }
  if (debt > income) {
    return `יש לך ${fmt(surplus)} עודף חודשי ו-${fmt(debt)} חוב.\n\nחוב בריבית של 12-18% עדיף לסגור לפני שמשקיעים.\n\nכמה מהעודף אתה מוכן להפנות לחוב?`;
  }
  // Vary by savings state so the same response doesn't repeat
  if (savings < income * 3) {
    return `יש לך ${fmt(surplus)} עודף ו-${fmt(savings)} בצד.\n\nקרן חירום מלאה = 3 חודשי הכנסה (${fmt(income * 3)}). עוד ${fmt(income * 3 - savings)} לסגור.\n\nמה מונע ממך לחסוך יותר כרגע?`;
  }
  return `הכנסה: ${fmt(income)} | עודף: ${fmt(surplus)} | חיסכון: ${fmt(savings)}.\n\nהבסיס יציב. השאלה הבאה: לאן הכסף עובד — קרן מחקה, פנסיה, דירה?\n\nמה מעסיק אותך כלכלית?`;
}

const CRISIS_RE = /אין לי סיבה לחיות|לא רוצה לחיות|אין טעם|להתאבד|לסיים את החיים/;

// ─── Public API ───────────────────────────────────────────────────
export async function askTeam(userMessage, userData, onProgress, chatHistory, onToken) {
  const context = buildContext(userData);

  // Greeting shortcut — instant, no API call
  if (GREETING_RE.test(userMessage.trim())) {
    onProgress?.({ stage: 'synthesizing' });
    return { response: generatePersonalizedGreeting(userData), agentsUsed: [], raw: [], context, isCrisis: false };
  }

  // Crisis detection
  if (CRISIS_RE.test(userMessage)) {
    onProgress?.({ stage: 'synthesizing' });
    return {
      response: 'אני שומע אותך. זה נשמע קשה מאוד.\n\nחייגו עכשיו ל-**עזר נפשי**: 1201 (בחינם, 24/7). הם שם בשבילך.',
      agentsUsed: ['CRISIS'], raw: [], context, isCrisis: true,
    };
  }

  onProgress?.({ stage: 'synthesizing' });

  // Groq streaming call
  const groqResponse = await callGroq(userMessage, userData, chatHistory, onToken);

  if (groqResponse) {
    return {
      response:   validateResponse(groqResponse, context),
      agentsUsed: ['GROQ'],
      raw:        [],
      context,
      isCrisis:   false,
    };
  }

  // Fallback if Groq fails
  return {
    response:   buildOfflineResponse(userMessage, context, chatHistory),
    agentsUsed: [],
    raw:        [],
    context,
    isCrisis:   false,
  };
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
