import { saveFinancialData, getFinancialData, markDayComplete, saveOnboardingState, getOnboardingState } from './storage';

// מה צריך לאסוף לאפיון מלא
const FIELDS = {
  age:            null,
  familyStatus:   null, // רווק/נשוי/גרוש/אלמן
  kids:           null, // מספר ילדים
  employmentType: null, // שכיר/עצמאי/מובטל/פנסיונר
  netIncome:      null, // הכנסה חודשית נטו
  housingType:    null, // שכירות/משכנתא/הורים/בעלות
  housingCost:    null, // עלות חודשית
  fixedExpenses:  null, // הוצאות קבועות אחרות (מזונות, ביטוחים)
  variableExpenses: null, // הוצאות משתנות ממוצע
  creditDebt:     null, // חוב כרטיס אשראי
  loans:          null, // הלוואות
  overdraft:      null, // מינוס בחשבון
  savings:        null, // חיסכון נזיל
  assets:         null, // נכסים (דירה, קרן השתלמות וכו')
  moneyGoal:      null, // מטרה עיקרית
  moneyFear:      null, // מה מפחיד הכי הרבה
};

// איזה שדות נאספים באיזה יום
const DAY_PLAN = {
  1: ['age', 'familyStatus', 'kids'],
  2: ['employmentType', 'netIncome'],
  3: ['housingType', 'housingCost'],
  4: ['fixedExpenses', 'variableExpenses'],
  5: ['creditDebt', 'loans', 'overdraft'],
  6: ['savings', 'assets'],
  7: ['moneyGoal', 'moneyFear'],
};

const QUESTIONS = {
  age:              'כמה אתה בן?',
  familyStatus:     'מה המצב המשפחתי שלך — רווק, נשוי, גרוש?',
  kids:             'יש לך ילדים? כמה?',
  employmentType:   'איך אתה עובד — שכיר, עצמאי, משהו אחר?',
  netIncome:        'מה ההכנסה החודשית שלך נטו — אחרי מיסים?',
  housingType:      'איפה אתה גר — שכירות, משכנתא, אצל הורים?',
  housingCost:      'כמה זה עולה לך בחודש?',
  fixedExpenses:    'יש הוצאות קבועות חוץ מדיור — מזונות, ביטוחים, מנויים?',
  variableExpenses: 'בממוצע כמה יוצא לך בחודש על אוכל, בילויים, דלק — כל מה שמשתנה?',
  creditDebt:       'יש חוב בכרטיס אשראי? כמה?',
  loans:            'יש הלוואות — בנק, חברים, גמ"ח?',
  overdraft:        'יש מינוס בחשבון? כמה בממוצע?',
  savings:          'כמה כסף נזיל יש לך בצד — חיסכון, פיקדון, כל דבר?',
  assets:           'יש נכסים — דירה, קרן השתלמות, ביטוח מנהלים?',
  moneyGoal:        'מה המטרה הכלכלית הכי חשובה לך עכשיו?',
  moneyFear:        'מה הדבר הכלכלי שהכי מפחיד אותך?',
};

// חילוץ מספר מטקסט עברי
function extractNumber(text) {
  const t = text.replace(/,/g, '');
  const heMap = { 'אלף': 1000, 'אלפים': 2000, 'מיליון': 1000000 };
  for (const [word, mult] of Object.entries(heMap)) {
    const m = t.match(new RegExp(`([\\d.]+)?\\s*${word}`));
    if (m) return Math.round((parseFloat(m[1]) || 1) * mult);
  }
  const direct = t.match(/\d[\d.]*/);
  return direct ? parseFloat(direct[0]) : null;
}

// פרשנות תשובה לפי שדה
function parseAnswer(field, text) {
  const t = text.trim().toLowerCase();

  if (field === 'familyStatus') {
    if (/נשו|נשוי|נשואה|מנוי/.test(t)) return 'נשוי';
    if (/גרו|גרוש|גרושה|פרוד/.test(t)) return 'גרוש';
    if (/אלמ/.test(t)) return 'אלמן';
    if (/רוו|רווק|פנוי|לבד|solo/.test(t)) return 'רווק';
    return t;
  }
  if (field === 'employmentType') {
    if (/שכיר|עובד|משכורת/.test(t)) return 'שכיר';
    if (/עצמאי|עוסק|עסק/.test(t)) return 'עצמאי';
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
  if (['kids', 'age', 'netIncome', 'housingCost', 'fixedExpenses',
    'variableExpenses', 'creditDebt', 'loans', 'overdraft',
    'savings', 'assets'].includes(field)) {
    if (/אין|לא|אפס|0/.test(t) && !/\d{4,}/.test(t)) return 0;
    return extractNumber(text) ?? text;
  }
  return text;
}

// ─── API ציבורי ──────────────────────────────────────────────

export async function getTodayOnboardingPrompt(day) {
  const financial = await getFinancialData();
  const todayFields = DAY_PLAN[day] || [];
  const missing = todayFields.filter(f => financial[f] === undefined || financial[f] === null);

  if (missing.length === 0) return null; // יום זה הושלם

  const field = missing[0];
  return { field, question: QUESTIONS[field] };
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
  const state = await getOnboardingState();

  const fmt = (n) => typeof n === 'number' && n > 0 ? `₪${n.toLocaleString('he-IL')}` : n || '—';

  const surplus = (financial.netIncome || 0) -
    (financial.housingCost || 0) -
    (financial.fixedExpenses || 0) -
    (financial.variableExpenses || 0);

  const totalDebt = (financial.creditDebt || 0) + (financial.loans || 0) + (financial.overdraft || 0);
  const savingsRate = financial.netIncome > 0 ? Math.round((surplus / financial.netIncome) * 100) : 0;

  const profile = {
    ...financial,
    surplus,
    totalDebt,
    savingsRate,
    generatedAt: new Date().toISOString(),
  };

  const profileText =
    `VerMillion מכיר אותך עכשיו: ` +
    `${financial.familyStatus || ''}, ${financial.employmentType || ''}, בן/ת ${financial.age || '?'}. ` +
    `הכנסה חודשית ${fmt(financial.netIncome)}, הוצאות קבועות ${fmt((financial.housingCost || 0) + (financial.fixedExpenses || 0))}, ` +
    `הוצאות משתנות ${fmt(financial.variableExpenses)}. ` +
    `עודף חודשי: ${fmt(surplus)} (${savingsRate}%). ` +
    `חובות: ${fmt(totalDebt)}. חיסכון נזיל: ${fmt(financial.savings)}. ` +
    `המטרה שלך: ${financial.moneyGoal || '—'}.`;

  await saveOnboardingState({ profileGenerated: true, profileText, profile });
  return { profileText, profile };
}

export { DAY_PLAN, QUESTIONS };
