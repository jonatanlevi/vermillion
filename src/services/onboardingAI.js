import { saveFinancialData, getFinancialData, markDayComplete, saveOnboardingState, getOnboardingState } from './storage';

// 21 שאלות = 3 בדיוק לכל יום × 7 ימים
const FIELDS = {
  age:              null,
  familyStatus:     null,
  kids:             null,
  employmentType:   null,
  netIncome:        null,
  incomeStability:  null,
  housingType:      null,
  housingCost:      null,
  fixedExpenses:    null,
  variableExpenses: null,
  biggestExpense:   null,
  creditDebt:       null,
  loans:            null,
  overdraft:        null,
  savings:          null,
  assets:           null,
  moneyGoal:        null,
  moneyFear:        null,
  financialStress:  null,
  moneyPersonality: null,
  biggestDream:     null,
};

const DAY_PLAN = {
  1: ['age', 'familyStatus', 'kids'],
  2: ['employmentType', 'netIncome', 'incomeStability'],
  3: ['housingType', 'housingCost', 'fixedExpenses'],
  4: ['variableExpenses', 'biggestExpense', 'creditDebt'],
  5: ['loans', 'overdraft', 'savings'],
  6: ['assets', 'moneyGoal', 'moneyFear'],
  7: ['financialStress', 'moneyPersonality', 'biggestDream'],
};

const QUESTIONS = {
  age:              'כמה אתה בן?',
  familyStatus:     'מה המצב המשפחתי שלך — רווק, נשוי, גרוש?',
  kids:             'יש לך ילדים? כמה?',
  employmentType:   'איך אתה עובד — שכיר, עצמאי, משהו אחר?',
  netIncome:        'מה ההכנסה החודשית שלך נטו?',
  incomeStability:  'ההכנסה שלך קבועה כל חודש, או משתנה?',
  housingType:      'איפה אתה גר — שכירות, משכנתא, אצל הורים?',
  housingCost:      'כמה זה עולה לך בחודש?',
  fixedExpenses:    'יש הוצאות קבועות נוספות — ביטוחים, מזונות, מנויים?',
  variableExpenses: 'כמה יוצא לך בחודש על אוכל, דלק, בילויים?',
  biggestExpense:   'מה ההוצאה הכי גדולה שלך שאפשר היה להפחית?',
  creditDebt:       'יש חוב בכרטיס אשראי? כמה בערך?',
  loans:            'יש הלוואות פעילות — בנק, חברים, גמ"ח?',
  overdraft:        'יש מינוס בחשבון? כמה בממוצע?',
  savings:          'כמה כסף נזיל יש לך בצד?',
  assets:           'יש נכסים — דירה, קרן השתלמות, ביטוח מנהלים?',
  moneyGoal:        'מה המטרה הכלכלית הכי חשובה לך כרגע?',
  moneyFear:        'מה הדבר הכלכלי שהכי מפחיד אותך?',
  financialStress:  'בסקלה 1-10, כמה הכסף לוחץ עליך כרגע?',
  moneyPersonality: 'אתה יותר חוסך, מוציא, או לא מסתכל בכלל?',
  biggestDream:     'אם הכסף לא היה בעיה — מה היית עושה?',
};

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
    'savings', 'assets', 'financialStress'].includes(field)) {
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
  if (missing.length === 0) return null;
  const field = missing[0];
  return { field, question: QUESTIONS[field], remaining: missing.length };
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

  const profileText =
    `VerMillion מכיר אותך עכשיו: ` +
    `${financial.familyStatus || ''}, ${financial.employmentType || ''}, בן/ת ${financial.age || '?'}. ` +
    `הכנסה חודשית ${fmt(financial.netIncome)}, הוצאות ${fmt((financial.housingCost || 0) + (financial.fixedExpenses || 0) + (financial.variableExpenses || 0))}. ` +
    `עודף: ${fmt(surplus)} (${savingsRate}%). חובות: ${fmt(totalDebt)}. ` +
    `המטרה שלך: ${financial.moneyGoal || '—'}.`;

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

  const stress = financial.financialStress;
  const mindset = Math.min(100, Math.max(0,
    stress !== null && stress !== undefined
      ? Math.round((10 - Number(stress)) * 10)
      : 50
  ));

  const investment = Math.min(100, Math.max(0,
    (financial.assets || 0) > 0 ? 70 : 20
  ));

  return { saving, debtMgmt, planning, mindset, investment };
}

export { DAY_PLAN, QUESTIONS };
