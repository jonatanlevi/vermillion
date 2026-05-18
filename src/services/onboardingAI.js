import { saveFinancialData, getFinancialData, markDayComplete, saveOnboardingState, getOnboardingState } from './storage';

// 21 שאלות = 3 בדיוק לכל יום × 7 ימים
// age, familyStatus, employmentType נאספים בהרשמה — לא נשאלים שוב
const FIELDS = {
  kids:               null,
  netIncome:          null,
  incomeStability:    null,
  housingType:        null,
  housingCost:        null,
  fixedExpenses:      null,
  variableExpenses:   null,
  biggestExpense:     null,
  creditDebt:         null,
  loans:              null,
  overdraft:          null,
  savings:            null,
  assets:             null,
  moneyGoal:          null,
  moneyFear:          null,
  endOfMonthFeeling:  null,
  moneyPersonality:   null,
  biggestDream:       null,
  spouseIncome:       null,
  retirementSavings:  null,
};

const DAY_PLAN = {
  1: ['kids', 'netIncome', 'incomeStability'],
  2: ['housingType', 'housingCost', 'fixedExpenses'],
  3: ['variableExpenses', 'biggestExpense', 'creditDebt'],
  4: ['loans', 'overdraft', 'savings'],
  5: ['assets', 'moneyGoal', 'moneyFear'],
  6: ['endOfMonthFeeling', 'moneyPersonality', 'biggestDream'],
  7: ['spouseIncome', 'retirementSavings'],
};

const QUESTIONS = {
  kids:              'יש לך ילדים שתלויים בך כלכלית? כמה?',
  netIncome:         'מה ההכנסה החודשית שלך נטו — כמה נכנס לחשבון אחרי מס?',
  incomeStability:   'ההכנסה שלך קבועה כל חודש, או משתנה?',
  housingType:       'איפה אתה גר — שכירות, משכנתא, אצל הורים?',
  housingCost:       'כמה עולה לך הדיור בחודש?',
  fixedExpenses:     'יש הוצאות קבועות נוספות — ביטוחים, מזונות, מנויים?',
  variableExpenses:  'כמה יוצא לך בחודש על אוכל, דלק, בילויים?',
  biggestExpense:    'מה ההוצאה הכי גדולה שלך? (אם לא יודע, אמור "לא בטוח")',
  creditDebt:        'יש חוב בכרטיס אשראי? כמה בערך? (אם זה כרטיס שמתאפס בסוף חודש — אמור אפס)',
  loans:             'יש הלוואות פעילות — בנק, חברים, גמ"ח?',
  overdraft:         'יש מינוס בחשבון? כמה בממוצע?',
  savings:           'כמה כסף נזיל יש לך בצד?',
  assets:            'יש נכסים — דירה, קרן השתלמות, ביטוח מנהלים?',
  moneyGoal:         'מה המטרה הכלכלית הכי חשובה לך כרגע?',
  moneyFear:         'מה הדבר הכלכלי שמעסיק אותך הכי הרבה?',
  endOfMonthFeeling: 'מה קורה לך כשמגיע סוף חודש — עצבני? שקט? לא בודק בכלל?',
  moneyPersonality:  'אתה יותר חוסך, מוציא, או לא מסתכל בכלל?',
  biggestDream:      'אם כסף לא היה בעיה — מה היית עושה?',
  spouseIncome:      'יש הכנסה נוספת בבית — בן/בת זוג, עסק, שכירות?',
  retirementSavings: 'יש חיסכון פנסיוני? כמה מופקד כל חודש?',
};

const HE_N = {
  'אפס':0,
  'אחד':1,'אחת':1,
  'שניים':2,'שתיים':2,'שני':2,'שתי':2,
  'שלושה':3,'שלוש':3,'שלשה':3,'שלש':3,'שלשת':3,'שלושת':3,
  'ארבעה':4,'ארבע':4,'ארבעת':4,
  'חמישה':5,'חמש':5,'חמשה':5,'חמשת':5,'חמישת':5,
  'שישה':6,'שש':6,'ששה':6,'ששת':6,'שישת':6,
  'שבעה':7,'שבע':7,'שבעת':7,
  'שמונה':8,'שמונת':8,
  'תשעה':9,'תשע':9,'תשעת':9,
  'עשרה':10,'עשר':10,'עשרת':10,
  'עשרים':20,'שלושים':30,'שלשים':30,'ארבעים':40,'חמישים':50,
  'שישים':60,'שבעים':70,'שמונים':80,'תשעים':90,
};
const HE_PAT = Object.keys(HE_N).sort((a,b) => b.length-a.length).join('|');

const MULTS = [
  ['מיליון',  1000000, false],
  ['אלפיים',  2000,    true],
  ['אלפים',   1000,    false],
  ['אלף',     1000,    false],
  ['מאתיים',  200,     true],
  ['מאות',    100,     false],
  ['מאה',     100,     true],
];

function extractNumber(text) {
  const t = text.replace(/[,،]/g, '').trim();

  let total = 0;
  let found = false;
  let work = t;

  for (const [word, base, standalone] of MULTS) {
    const re = new RegExp(`(${HE_PAT}|\\d+(?:\\.\\d+)?)?\\s*ו?\\s*${word}(?!\\S)`, 'u');
    const m = work.match(re);
    if (!m) continue;
    const raw = m[1];
    if (standalone && raw) {
      const coeff = HE_N[raw] ?? parseFloat(raw);
      total += Math.round((coeff || 1) * base);
    } else if (standalone) {
      total += base;
    } else if (raw) {
      const coeff = HE_N[raw] ?? parseFloat(raw);
      total += Math.round((coeff || 1) * base);
    } else {
      total += base;
    }
    work = work.replace(m[0], ' ');
    found = true;
  }

  // remaining standalone unit (e.g. "וחמש" after removing thousands)
  const rem = work.match(new RegExp(`(?:ו\\s*)?(${HE_PAT})(?!\\S)`, 'u'));
  if (rem && HE_N[rem[1]] !== undefined && HE_N[rem[1]] > 0) {
    total += HE_N[rem[1]];
    found = true;
  }

  if (found && total > 0) {
    // accumulate "עוד <num>" additions
    for (const m of work.matchAll(/(?:עוד|גם|ועוד)\s+(\d[\d.]*)/g)) {
      total += parseFloat(m[1]);
    }
    return total;
  }

  // digit fallback — collect all numbers in text
  const allNums = [...t.matchAll(/\d[\d.]*/g)].map(m => parseFloat(m[0]));
  if (allNums.length === 0) return null;
  if (allNums.length === 1) return allNums[0];

  const maxN = Math.max(...allNums);
  const minN = Math.min(...allNums);

  // range pattern — "5000-6000" or "בין 5000 ל-6000" → take first number, not sum
  const isRange = /\d[\d.]*\s*[-–]\s*\d[\d.]*/.test(t) || /(?:בין|עד)\s+\d/.test(t);
  if (isRange) return allNums[0];

  // list pattern — number adjacent to a Hebrew content word (category label)
  // e.g. "3500 מזונות 1000 ביטוח" or "ביטוח 300 מנויים 200"
  const labeledPairs = [...t.matchAll(/(?:\d[\d.]*\s+[א-ת]{2,}|[א-ת]{2,}\s+\d[\d.]*)/g)];
  const hasConnector = /(?:עוד|גם|ועוד|פלוס|\+)/.test(t);
  const isList = labeledPairs.length >= 2 || hasConnector;

  if (isList && maxN / minN < 100) {
    return allNums.reduce((a, b) => a + b, 0);
  }
  return allNums[0];
}

function parseAnswer(field, text) {
  const t = text.trim().toLowerCase();

  if (field === 'familyStatus') {
    if (/נשו|נשוי|נשואה/.test(t)) return 'נשוי';
    if (/גרו|גרוש|גרושה|פרוד/.test(t)) return 'גרוש';
    if (/אלמ/.test(t)) return 'אלמן';
    return 'רווק';
  }
  if (field === 'employmentType') {
    if (/שכיר|עובד|משכורת/.test(t)) return 'שכיר';
    if (/עצמאי|עוסק|עסק|יזם|בונה|סטארטאפ|פרילנס/.test(t)) return 'עצמאי';
    if (/מובטל|לא עובד/.test(t)) return 'מובטל';
    if (/פנסי/.test(t)) return 'פנסיונר';
    return t;
  }
  if (field === 'housingType') {
    if (/שכיר|שכירות|שוכר/.test(t)) return 'שכירות';
    if (/משכנתא|בבעלות|שלי|קניתי/.test(t)) return 'משכנתא';
    if (/הורים|אמא|אבא/.test(t)) return 'הורים';
    return t;
  }
  if (field === 'incomeStability') {
    if (/קבוע|קבועה|תמיד/.test(t)) return 'קבועה';
    if (/משתנ|לא קבוע|פריל/.test(t)) return 'משתנה';
    return t;
  }
  if (field === 'moneyPersonality') {
    if (/חוסך|חיסכון|שומר/.test(t)) return 'חוסך';
    if (/מוציא|מבזבז|קונה/.test(t)) return 'מוציא';
    if (/לא מסתכל|מתעלם|לא יודע/.test(t)) return 'מתעלם';
    return t;
  }
  if (['kids', 'age', 'netIncome', 'housingCost', 'fixedExpenses',
    'variableExpenses', 'creditDebt', 'loans', 'overdraft',
    'savings', 'assets', 'financialStress', 'spouseIncome',
    'retirementSavings', 'financialGoalYears'].includes(field)) {
    if (/אין|לא|אפס|0/.test(t) && !/\d{4,}/.test(t)) return 0;
    return extractNumber(text) ?? text;
  }
  return text;
}

// ─── API ציבורי ──────────────────────────────────────────────

const FAMILY_STATUS_LABELS = {
  גרוש: 'גרוש/ה', נשוי: 'נשוי/אה', רווק: 'רווק/ה', שותף: 'בזוגיות', אלמן: 'אלמן/ה',
};

function personalizeQuestion(field, financial) {
  if (field !== 'kids') return QUESTIONS[field];
  const status = financial.familyStatus;
  if (!status) return QUESTIONS.kids;
  const label = FAMILY_STATUS_LABELS[status] || status;
  if (/גרוש/.test(status)) return `אתה ${label} — יש לך ילדים שתלויים בך כלכלית? כמה?`;
  if (/נשוי|שותף/.test(status)) return `אתה ${label} — יש לכם ילדים? כמה?`;
  return `יש לך ילדים שתלויים בך כלכלית? כמה?`;
}

export async function getTodayOnboardingPrompt(day) {
  const financial = await getFinancialData();
  const todayFields = DAY_PLAN[day] || [];
  const missing = todayFields.filter(f => financial[f] === undefined || financial[f] === null);
  if (missing.length === 0) return null;
  const field = missing[0];
  return { field, question: personalizeQuestion(field, financial), remaining: missing.length };
}

export async function processOnboardingAnswer(field, userText) {
  const value = parseAnswer(field, userText);
  await saveFinancialData({ [field]: value });
  return value;
}

export async function getDayProgress(day) {
  const financial = await getFinancialData();
  const todayFields = DAY_PLAN[day] || [];
  const done = todayFields.filter(f => financial[f] !== undefined && financial[f] !== null);
  return { total: todayFields.length, done: done.length, complete: done.length >= todayFields.length };
}

export async function completeDay(day) {
  await markDayComplete(day);
}

export async function generateProfile() {
  const financial = await getFinancialData();

  const fmt = (n) => typeof n === 'number' && n > 0 ? `₪${n.toLocaleString('he-IL')}` : n || '—';

  const surplus = (financial.netIncome || 0)
    - (financial.housingCost || 0)
    - (financial.fixedExpenses || 0)
    - (financial.variableExpenses || 0);

  const totalDebt = (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0);
  const savingsRate = financial.netIncome > 0 ? Math.round((surplus / financial.netIncome) * 100) : 0;

  const skills = computeSkills(financial, surplus, totalDebt, savingsRate);

  const kidsNum = typeof financial.kids === 'number' ? financial.kids : (parseInt(financial.kids) || null);

  const profileText =
    `VerMillion מכיר אותך עכשיו: ` +
    `${financial.familyStatus || ''}, ${financial.employmentType || ''}, בן/ת ${financial.age || '?'}, ${kidsNum ? `${kidsNum} ילדים` : 'ללא ילדים'}. ` +
    `הכנסה חודשית ${fmt(financial.netIncome)}, הוצאות ${fmt((financial.housingCost || 0) + (financial.fixedExpenses || 0) + (financial.variableExpenses || 0))}. ` +
    `עודף: ${fmt(surplus)} (${savingsRate}%). חובות: ${fmt(totalDebt)}. ` +
    `המטרה שלך: ${financial.moneyGoal || '—'}. ` +
    `תחושת סוף חודש: ${financial.endOfMonthFeeling || '—'}.`;

  const profile = { ...financial, surplus, totalDebt, savingsRate, skills, generatedAt: new Date().toISOString() };

  await saveOnboardingState({ profileGenerated: true, profileText, profile });
  return { profileText, profile, skills };
}

export function computeSkills(financial, surplus, totalDebt, savingsRate) {
  const income = financial.netIncome || 0;

  const saving = Math.min(100, Math.max(0,
    savingsRate >= 20 ? 100 :
    savingsRate >= 10 ? 70 :
    savingsRate >= 5  ? 40 : 15
  ));

  const debtMgmt = Math.min(100, Math.max(0,
    totalDebt === 0 ? 100 :
    income > 0 ? Math.max(0, 100 - Math.round((totalDebt / income) * 10)) : 20
  ));

  const planning = Math.min(100, Math.max(0,
    financial.moneyGoal && financial.biggestDream ? 80 :
    financial.moneyGoal ? 50 : 20
  ));

  const feeling = (financial.endOfMonthFeeling || '').toLowerCase();
  const mindset = Math.min(100, Math.max(0,
    /שקט|בסדר|טוב/.test(feeling) ? 80 :
    /לא בודק|לא מסתכל/.test(feeling) ? 40 :
    /עצבני|לחוץ|מפחד|מתח/.test(feeling) ? 20 : 50
  ));

  const investment = Math.min(100, Math.max(0,
    (financial.assets || 0) > 0 ? 70 : 20
  ));

  return { saving, debtMgmt, planning, mindset, investment };
}

export function generateCoachingOpener(profile = {}) {
  const income     = profile.netIncome || 0;
  const totalDebt  = profile.totalDebt  ?? ((profile.creditDebt || 0) + (profile.loans || 0) + (profile.overdraft || 0));
  const surplus    = profile.surplus    ?? (income - (profile.housingCost || 0) - (profile.fixedExpenses || 0) - (profile.variableExpenses || 0));
  const savingsRate = profile.savingsRate ?? (income > 0 ? Math.round((surplus / income) * 100) : 0);
  const fmt = n => n > 0 ? `₪${Number(n).toLocaleString('he-IL')}` : '0';

  if (totalDebt > income * 6 || surplus < 0) {
    return {
      opener: surplus < 0
        ? `ראיתי שיש גירעון חודשי של ${fmt(Math.abs(surplus))}${totalDebt > 0 ? ` וחובות של ${fmt(totalDebt)}` : ''}.\n\nלפני שנדבר על מטרות עתיד — בואו נייצב את הבסיס. זה השלב הכי חשוב עכשיו.`
        : `ראיתי שיש חובות של ${fmt(totalDebt)} מול הכנסה של ${fmt(income)}.\n\nהיחס הזה לוחץ. הצעד הראשון הוא תכנית פירעון חכמה — בואו נבנה אותה.`,
      topics: ['מה לעשות עכשיו', 'איך לצמצם הוצאות', 'סדר עדיפויות לחובות', 'מאיפה מתחילים?'],
    };
  }
  if (savingsRate < 5) {
    return {
      opener: `הכנסה ${fmt(income)}, עודף ${fmt(Math.max(0, surplus))} בחודש — ${savingsRate < 1 ? 'כמעט ולא נשאר כלום' : `${savingsRate}% חיסכון`}.\n\nהמטרה הראשונה שלנו: לבנות כרית ביטחון. מנסים ביחד?`,
      topics: ['בנה קרן חירום', 'מאיפה לחסוך כסף', 'הגדל הכנסה', 'מה המטרה הראשונה שלי?'],
    };
  }
  if (savingsRate < 20) {
    return {
      opener: `אתה חוסך ${savingsRate}% מההכנסה — הממוצע בישראל פחות מ-5%, אז אתה כבר טוב.\n\nהשלב הבא: להגיע ל-20% ולגרום לכסף לעבוד בשבילך.`,
      topics: ['הגדל חיסכון', 'איפה כדאי לחסוך?', 'מתי נכון להשקיע?', 'תכנון 5 שנים'],
    };
  }
  return {
    opener: `אתה חוסך ${savingsRate}% — אתה בין ה-10% הטובים בישראל. עכשיו השאלה היא איך לגרום לכסף לעבוד קשה יותר.`,
    topics: ['אופטימיזציה', 'נכסים מניבים', 'תכנון פרישה', 'השקעות'],
  };
}

// ─── Archetype engine ────────────────────────────────────────────
export const ARCHETYPES = {
  warrior: { label: 'הלוחם',    emoji: '⚔️',  desc: 'בונה עצמאות בכוח ובנייה עצמית.',          color: '#C0392B', hoodie: 'c0392b', extras: { beard: 'beardMedium' } },
  sage:    { label: 'החכם',     emoji: '📚',  desc: 'מקבל החלטות מתוך ידע ואסטרטגיה.',         color: '#8E44AD', hoodie: null,     extras: { glasses: 'prescription01' } },
  royal:   { label: 'הרויאל',   emoji: '👑',  desc: 'מייעל נכסים וצומח לרמה הבאה.',             color: '#D4AF37', hoodie: 'f5c518', extras: { sunglasses: 'sunglasses' } },
  grinder: { label: 'הגריינדר', emoji: '💪',  desc: 'עובד קשה ולוחם לשנות את המצב.',           color: '#E67E22', hoodie: '1a1a1a', extras: {} },
  builder: { label: 'הבונה',    emoji: '🏗️', desc: 'בונה עתיד יציב — צעד אחרי צעד.',          color: '#27AE60', hoodie: '2c3e50', extras: { hat: 'hat' } },
};

export function computeArchetype(financial) {
  const income     = financial.netIncome || 0;
  const totalDebt  = (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0);
  const surplus    = income
    - (financial.housingCost || 0)
    - (financial.fixedExpenses || 0)
    - (financial.variableExpenses || 0);
  const savingsRate = income > 0 ? surplus / income : 0;
  const employ     = (financial.employmentType || '').toLowerCase();
  const goal       = (financial.moneyGoal || '').toLowerCase();

  if (/עצמאי|עסק|יזם|פרילנס/.test(employ)) return 'warrior';
  if (income > 20000 || (financial.assets || 0) > 300000) return 'royal';
  if (surplus < -300 || totalDebt > income * 4) return 'grinder';
  if (/שכיר/.test(employ) && savingsRate >= 0.1 && /פנסי|השקע|חופש|retire/.test(goal)) return 'sage';
  if (savingsRate >= 0.05 && goal) return 'builder';
  return 'grinder';
}

export { DAY_PLAN, QUESTIONS };
