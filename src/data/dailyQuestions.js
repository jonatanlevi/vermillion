/**
 * dailyQuestions.js
 * Days 1-3: Lifestyle profiling (who you are)
 * Days 4-7: Financial profiling (the numbers)
 */

export const DAY_META = {
  // Lifestyle phase
  1: { topic: 'מי אתה',          icon: '🧬', color: '#9B59B6', phase: 'lifestyle' },
  2: { topic: 'עבודה ושגרה',     icon: '💼', color: '#2980B9', phase: 'lifestyle' },
  3: { topic: 'ערכים ופחדים',    icon: '🧭', color: '#1ABC9C', phase: 'lifestyle' },
  // Financial phase
  4: { topic: 'הכנסות',          icon: '💰', color: '#C0392B', phase: 'financial' },
  5: { topic: 'הוצאות',          icon: '📊', color: '#E67E22', phase: 'financial' },
  6: { topic: 'חובות ונכסים',    icon: '⚖️', color: '#27AE60', phase: 'financial' },
  7: { topic: 'מטרות ותוכנית',   icon: '🎯', color: '#F1C40F', phase: 'financial' },
};

export const DAY_QUESTIONS = {

  /* ── יום 1: מי אתה — משפחה, מגורים, מצב ── */
  1: {
    intro: 'לפני שנדבר על כסף — VerMillion רוצה להכיר אותך. מי עומד מולי?',
    questions: [
      {
        key: 'family_status',
        type: 'choice',
        question: 'מה המצב המשפחתי שלך?',
        blindSpot: 'מצב משפחתי',
        options: [
          { value: 'single',   label: 'רווק/ה',          sub: 'לבד' },
          { value: 'partner',  label: 'בזוגיות',          sub: 'בלי נישואין רשמיים' },
          { value: 'married',  label: 'נשוי/אה',          sub: 'עם תעודה' },
          { value: 'divorced', label: 'גרוש/ה',           sub: 'עצמאי/ת שוב' },
          { value: 'widowed',  label: 'אלמן/אלמנה',      sub: 'לאחר אובדן' },
        ],
      },
      {
        key: 'life_event_recency',
        type: 'choice',
        question: 'מתי זה קרה?',
        blindSpot: 'מועד האירוע המשפחתי',
        showIf: { key: 'family_status', values: ['divorced', 'widowed'] },
        options: [
          { value: 'recent',   label: 'פחות משנה',    sub: 'עוד בתהליך' },
          { value: 'mid',      label: '1–5 שנים',     sub: 'מתייצב/ת' },
          { value: 'long_ago', label: 'מעל 5 שנים',   sub: 'פרק זה מאחוריי' },
        ],
      },
      {
        key: 'children_count',
        type: 'choice',
        question: 'כמה ילדים תלויים בך כלכלית?',
        blindSpot: 'תלויים כלכלית',
        options: [
          { value: '0',  label: 'אין ילדים',  sub: '' },
          { value: '1',  label: 'ילד אחד',    sub: '' },
          { value: '2',  label: 'שני ילדים',  sub: '' },
          { value: '3+', label: 'שלושה+',     sub: 'גדול ביותר' },
        ],
      },
      {
        key: 'housing_type',
        type: 'choice',
        question: 'איפה אתה גר?',
        blindSpot: 'סטטוס דיור',
        options: [
          { value: 'renting',  label: 'שוכר',         sub: 'לא בעלים' },
          { value: 'owner',    label: 'בעלים',         sub: 'עם/בלי משכנתא' },
          { value: 'parents',  label: 'אצל ההורים',   sub: 'ללא תשלום' },
          { value: 'other',    label: 'אחר',           sub: '' },
        ],
      },
      {
        key: 'city_type',
        type: 'choice',
        question: 'איפה אתה גר?',
        blindSpot: 'אזור מגורים',
        options: [
          { value: 'center',    label: 'מרכז',           sub: 'ת"א, גוש דן, שפלה' },
          { value: 'jerusalem', label: 'ירושלים',        sub: '' },
          { value: 'north',     label: 'צפון',            sub: 'חיפה, גליל' },
          { value: 'south',     label: 'דרום',            sub: 'באר שבע, נגב' },
          { value: 'abroad',    label: 'חו"ל',            sub: '' },
        ],
      },
    ],
  },

  /* ── יום 2: עבודה ושגרה ── */
  2: {
    intro: 'VerMillion מכיר אנשים, לא רק מספרים. ספר לי על השגרה שלך.',
    questions: [
      {
        key: 'employment_type',
        type: 'choice',
        question: 'איך אתה מתפרנס?',
        blindSpot: 'סוג תעסוקה',
        options: [
          { value: 'employee',     label: 'שכיר',             sub: 'תלוש שכר, מעסיק' },
          { value: 'self_employed',label: 'עצמאי',            sub: 'חשבוניות, תיק מס' },
          { value: 'business',     label: 'בעל עסק',          sub: 'חברה, שותפות' },
          { value: 'freelance',    label: 'פרילנסר',          sub: 'פרויקטים, ח.פ' },
          { value: 'unemployed',   label: 'לא עובד כרגע',    sub: 'דמי אבטלה / הפסקה' },
        ],
      },
      {
        key: 'work_hours_weekly',
        type: 'number',
        question: 'כמה שעות בשבוע אתה עובד?',
        placeholder: '45',
        prefix: '',
        suffix: 'שעות',
        hint: 'ממוצע — כולל שעות נוספות',
        blindSpot: 'עומס עבודה שבועי',
      },
      {
        key: 'top_hobby',
        type: 'choice',
        question: 'מה התחביב/פעילות שאתה הכי מוציא עליו כסף?',
        blindSpot: 'הוצאת פנאי עיקרית',
        options: [
          { value: 'sports',      label: 'ספורט / כושר',      sub: 'חדר כושר, ספורט' },
          { value: 'food',        label: 'אוכל / מסעדות',      sub: 'בילויים קולינריים' },
          { value: 'travel',      label: 'טיולים / נסיעות',    sub: 'תיירות' },
          { value: 'tech',        label: 'טכנולוגיה / גאדג\'טים', sub: '' },
          { value: 'social',      label: 'חברים / בר / מועדון', sub: 'חיי לילה, בילויים' },
          { value: 'family',      label: 'משפחה / ילדים',      sub: 'פעילויות, חינוך' },
        ],
      },
      {
        key: 'social_budget',
        type: 'choice',
        question: 'כמה אתה מוציא על חיי חברה בחודש בערך?',
        blindSpot: 'תקציב חברתי חודשי',
        options: [
          { value: 'low',    label: 'עד ₪500',      sub: 'מינימלי' },
          { value: 'medium', label: '₪500–₪1,500', sub: 'מאוזן' },
          { value: 'high',   label: '₪1,500–₪3,000', sub: 'פעיל חברתית' },
          { value: 'very_high', label: '₪3,000+',  sub: 'הרבה מאוד' },
        ],
      },
    ],
  },

  /* ── יום 3: ערכים, פחדים, שאיפות ── */
  3: {
    intro: 'השאלות האחרונות שאינן על כסף. מה מניע אותך — ומה עוצר אותך?',
    questions: [
      {
        key: 'money_goal',
        type: 'choice',
        question: 'מה היעד שמניע אותך להיכנס לאפליקציה הזו?',
        blindSpot: 'מניע עיקרי לשינוי',
        options: [
          { value: 'freedom',   label: 'חופש כלכלי',         sub: 'לא להיות תלוי בעבודה' },
          { value: 'security',  label: 'ביטחון',              sub: 'לישון בשקט' },
          { value: 'wealth',    label: 'לבנות עושר',          sub: 'להיות עשיר' },
          { value: 'debt_free', label: 'יציאה מחובות',        sub: 'ניקיון הדף' },
          { value: 'business',  label: 'להקים עסק',           sub: 'להיות עצמאי' },
          { value: 'retire',    label: 'פרישה מוקדמת',        sub: 'FIRE' },
        ],
      },
      {
        key: 'money_fear',
        type: 'choice',
        question: 'מה הפחד הכי גדול שלך לגבי כסף?',
        blindSpot: 'פחד פיננסי עיקרי',
        options: [
          { value: 'not_enough',  label: 'לא יהיה מספיק',     sub: 'להישאר חסר' },
          { value: 'lose_it',     label: 'לאבד מה שיש',        sub: 'השקעה שנכשלת' },
          { value: 'old_age',     label: 'זקנה בלי כסף',       sub: 'פנסיה לא מספיקה' },
          { value: 'surprise',    label: 'הפתעה רעה',          sub: 'מחלה, פיטורין, אסון' },
          { value: 'no_fear',     label: 'לא ממש פוחד',        sub: 'יש לי ביטחון' },
        ],
      },
      {
        key: 'extra_money_action',
        type: 'choice',
        question: 'אם היה לך ₪10,000 פנויים — מה היית עושה ראשון?',
        blindSpot: 'נטיית השקעה טבעית',
        options: [
          { value: 'save',     label: 'שם בפיקדון',           sub: 'ביטחון קודם' },
          { value: 'invest',   label: 'משקיע בבורסה',         sub: 'צמיחה לטווח ארוך' },
          { value: 'pay_debt', label: 'משלם חובות',           sub: 'ניקיון ראשוני' },
          { value: 'buy',      label: 'קונה משהו שרציתי',     sub: 'פינוק / שדרוג' },
          { value: 'business', label: 'משקיע בעסק שלי',       sub: 'מגדיל הכנסה' },
          { value: 'realestate', label: 'מחפש נדל"ן להשקעה', sub: 'אבן דרך' },
        ],
      },
    ],
  },

  /* ── יום 4: הכנסות ── */
  4: {
    intro: 'המודיעין הכספי מתחיל. לא הערכות — מספרים מדויקים. כמה כסף נכנס?',
    questions: [
      {
        key: 'net_income',
        type: 'number',
        question: 'הכנסה חודשית נטו (אחרי מס)',
        placeholder: '12,000',
        prefix: '₪',
        hint: 'שכיר: תסתכל על "נטו לתשלום" בתלוש. עצמאי: ממוצע 3 חודשים',
        blindSpot: 'הכנסה חודשית נטו',
      },
      {
        key: 'side_income',
        type: 'number',
        question: 'הכנסות נוספות (פרילנס, שכירות, דיבידנד)',
        placeholder: '0',
        prefix: '₪',
        hint: 'אם אין — הכנס 0',
        blindSpot: 'הכנסות משניות',
      },
      {
        key: 'num_earners',
        type: 'choice',
        question: 'כמה מרוויחים בבית?',
        blindSpot: 'מספר מפרנסים',
        options: [
          { value: '1',  label: 'רק אני',   sub: 'הכנסה יחידה' },
          { value: '2',  label: 'שניים',    sub: 'בן/בת זוג עם הכנסה כלשהי — גם חלקית' },
          { value: '3+', label: 'שלושה+',   sub: 'מספר מקורות הכנסה' },
        ],
      },
      {
        key: 'partner_income',
        type: 'number',
        question: 'מה ההכנסה החודשית נטו של בן/בת הזוג?',
        placeholder: '0',
        prefix: '₪',
        hint: 'נטו לאחר מס — ניתן לעגל',
        blindSpot: 'הכנסת בן/בת זוג',
        showIf: { key: 'num_earners', value: '2' },
      },
    ],
  },

  /* ── יום 5: הוצאות ── */
  5: {
    intro: 'כמה "אש" יוצאת מהמחסן כל חודש? בלי לדעת את זה — אי אפשר לתכנן.',
    questions: [
      {
        key: 'housing_expense',
        type: 'number',
        question: 'שכירות / החזר משכנתא חודשי',
        placeholder: '4,500',
        prefix: '₪',
        blindSpot: 'הוצאת דיור חודשית',
        equityHint: true,
      },
      {
        key: 'fixed_expenses',
        type: 'number',
        question: 'הוצאות קבועות (רכב, ביטוחים, מנויים, ארנונה, ילדים)',
        placeholder: '3,000',
        prefix: '₪',
        hint: 'כל מה שיוצא קבוע כל חודש — לא כולל דיור',
        blindSpot: 'הוצאות קבועות חודשיות',
      },
      {
        key: 'variable_expenses',
        type: 'number',
        question: 'הוצאות משתנות (אוכל, בילויים, קניות, בגדים)',
        placeholder: '3,500',
        prefix: '₪',
        hint: 'ממוצע 3 חודשים אחרונים',
        blindSpot: 'הוצאות משתנות חודשיות',
      },
    ],
  },

  /* ── יום 6: חובות ונכסים ── */
  6: {
    intro: 'שני צדי המאזן: כמה חבות — וכמה בנית. הצילום הפיננסי המלא.',
    questions: [
      {
        key: 'mortgage_balance',
        type: 'number',
        question: 'יתרת משכנתא (אם אין — הכנס 0)',
        placeholder: '0',
        prefix: '₪',
        blindSpot: 'חוב משכנתא',
      },
      {
        key: 'loans_total',
        type: 'number',
        question: 'סך הלוואות (רכב, אישי, בנקאי — לא משכנתא)',
        placeholder: '0',
        prefix: '₪',
        hint: 'סכום כל היתרות לסגירה',
        blindSpot: 'חוב הלוואות צרכניות',
      },
      {
        key: 'credit_debt',
        type: 'number',
        question: 'חוב כרטיסי אשראי / מינוס בחשבון',
        placeholder: '0',
        prefix: '₪',
        hint: 'הסכום שלא שולם — לא ההוצאה החודשית',
        blindSpot: 'חוב אשראי שוטף',
      },
      {
        key: 'liquid_savings',
        type: 'number',
        question: 'חיסכון נזיל (עו"ש, פיקדונות, קרן חירום)',
        placeholder: '20,000',
        prefix: '₪',
        hint: 'כסף שניתן למשוך תוך שבוע',
        blindSpot: 'רזרבות נזילות',
      },
      {
        key: 'investments',
        type: 'number',
        question: 'תיק השקעות + קרן השתלמות + קופ"ג',
        placeholder: '0',
        prefix: '₪',
        hint: 'ניתן לראות בפורטל גמל-נט',
        blindSpot: 'נכסים פיננסיים',
      },
      {
        key: 'real_estate_equity',
        type: 'number',
        question: 'הון עצמי בנדל"ן (שווי שוק פחות משכנתא)',
        placeholder: '0',
        prefix: '₪',
        hint: 'אם שוכר — הכנס 0',
        blindSpot: 'הון עצמי בנדל"ן',
      },
    ],
  },

  /* ── יום 7: מטרות, כוח חיסכון, תוכנית ── */
  7: {
    intro: 'המשימה האחרונה. מטרות, כוח חיסכון, ותוכנית פעולה. המודיעין מתקרב להשלמה.',
    questions: [
      {
        key: 'retirement_age',
        type: 'number',
        question: 'באיזה גיל אתה רוצה לעצמאות כלכלית?',
        placeholder: '55',
        prefix: '',
        suffix: 'שנים',
        hint: 'לא בהכרח פרישה — הרגע שכסף לא יכריח אותך',
        blindSpot: 'גיל יעד לעצמאות כלכלית',
      },
      {
        key: 'financial_target',
        type: 'number',
        question: 'כמה כסף היה גורם לך להרגיש "בטוח לגמרי"?',
        placeholder: '500,000',
        prefix: '₪',
        hint: 'לא חייב להיות מיליון — תהיה כנה',
        blindSpot: 'יעד ביטחון פיננסי אישי',
      },
      {
        key: 'monthly_savings_target',
        type: 'number',
        question: 'כמה אתה חוסך בפועל כל חודש?',
        placeholder: '0',
        prefix: '₪',
        hint: 'לא מה שאתה רוצה — מה שקורה בפועל. גם 0 זה תשובה',
        blindSpot: 'כוח חיסכון חודשי בפועל',
      },
      {
        key: 'pension_monthly',
        type: 'number',
        question: 'כמה עובר לפנסיה / קרן השתלמות כל חודש?',
        placeholder: '0',
        prefix: '₪',
        hint: 'חלק המעסיק + שלך. שכיר — בדוק בתלוש',
        blindSpot: 'הפקדה פנסיונית חודשית',
      },
      {
        key: 'saving_obstacle',
        type: 'choice',
        question: 'מה המכשול הכי גדול שמונע ממך לחסוך יותר?',
        blindSpot: 'חסם חיסכון עיקרי',
        options: [
          { value: 'income_low',    label: 'ההכנסה לא מספיקה',   sub: 'אין מה לחסוך' },
          { value: 'expenses_high', label: 'ההוצאות גבוהות מדי', sub: 'הכסף נגמר לפני סוף החודש' },
          { value: 'no_habit',      label: 'אין הרגל',            sub: 'יודע שצריך, לא עושה' },
          { value: 'dont_know',     label: 'לא יודע מאיפה להתחיל', sub: 'חסר כיוון' },
        ],
      },
      {
        key: 'biggest_leak',
        type: 'open',
        question: 'מה ה"חור" הכי גדול בכיס שלך שאתה יכול לסגור?',
        placeholder: 'מנוי שלא מגיע, אוכל מחוץ לבית כל יום...',
        blindSpot: 'פוטנציאל התייעלות מיידי',
      },
      {
        key: 'commitment',
        type: 'choice',
        question: 'כמה דקות ביום אתה מוכן להקדיש לניהול הכסף?',
        blindSpot: 'מחויבות לתהליך',
        options: [
          { value: '5',   label: '5 דקות',   sub: 'בדיקה יומית מהירה' },
          { value: '15',  label: '15 דקות',  sub: 'מעקב שבועי' },
          { value: '30+', label: 'חצי שעה+', sub: 'ניהול פעיל' },
        ],
      },
    ],
  },
};

/* ─── % השלמה ─── */
export function calcCompletion(dailyAnswers = {}) {
  let total = 0, answered = 0;
  Object.entries(DAY_QUESTIONS).forEach(([day, { questions }]) => {
    questions.forEach(q => {
      total++;
      const ans = dailyAnswers[day]?.[q.key];
      if (ans !== undefined && ans !== '' && ans !== '__skipped__') answered++;
    });
  });
  return total === 0 ? 0 : Math.round((answered / total) * 100);
}

/* ─── Blind spots ─── */
export function getBlindSpots(dailyAnswers = {}) {
  const spots = [];
  Object.entries(DAY_QUESTIONS).forEach(([day, { questions }]) => {
    questions.forEach(q => {
      const ans = dailyAnswers[day]?.[q.key];
      if (ans === undefined || ans === '' || ans === '__skipped__') {
        spots.push({ day: Number(day), key: q.key, blindSpot: q.blindSpot });
      }
    });
  });
  return spots;
}

/* ─── מדדים פיננסיים ─── */
export function computeFinancialMetrics(dailyAnswers = {}) {
  const flat = {};
  Object.values(dailyAnswers).forEach(dayAnswers => {
    if (dayAnswers && typeof dayAnswers === 'object') {
      Object.assign(flat, dayAnswers);
    }
  });

  const n = (key) => parseFloat((flat[key] || '0').toString().replace(/,/g, '')) || 0;

  const netIncome        = n('net_income');
  const sideIncome       = n('side_income');
  const partnerIncome    = n('partner_income');
  const totalIncome      = netIncome + sideIncome + partnerIncome;

  const housingExpense   = n('housing_expense');
  const fixedExpenses    = n('fixed_expenses');
  const variableExpenses = n('variable_expenses');
  const totalExpenses    = housingExpense + fixedExpenses + variableExpenses;
  const monthlySurplus   = totalIncome - totalExpenses;
  const savingsRate      = totalIncome > 0 ? Math.round(monthlySurplus / totalIncome * 100) : 0;

  const mortgageBalance  = n('mortgage_balance');
  const loansTotal       = n('loans_total');
  const creditDebt       = n('credit_debt');
  const totalDebt        = mortgageBalance + loansTotal + creditDebt;

  const liquidSavings    = n('liquid_savings');
  const investments      = n('investments');
  const realEstateEquity = n('real_estate_equity');
  const totalAssets      = liquidSavings + investments + realEstateEquity;
  const netWorth         = totalAssets - totalDebt;

  const currentAge       = n('_computed_age');
  const retirementAge    = n('retirement_age');
  const financialTarget  = n('financial_target');
  const yearsLeft        = retirementAge > currentAge ? retirementAge - currentAge : null;

  const monthlySavings   = n('monthly_savings_target');
  const pensionMonthly   = n('pension_monthly');

  const monthsEmergency  = totalExpenses > 0 ? +(liquidSavings / totalExpenses).toFixed(1) : null;
  const debtToIncome     = totalIncome > 0 ? Math.round((loansTotal + creditDebt) / totalIncome * 100) : null;

  // Lifestyle fields for AI context
  const familyStatus     = flat['family_status']   || null;
  const employmentType   = flat['employment_type'] || null;
  const moneyGoal        = flat['money_goal']       || null;
  const moneyFear        = flat['money_fear']       || null;
  const savingObstacle   = flat['saving_obstacle']  || null;

  return {
    totalIncome, partnerIncome, totalExpenses, monthlySurplus, savingsRate,
    totalDebt, totalAssets, netWorth,
    currentAge, retirementAge, yearsLeft, financialTarget,
    monthlySavings, pensionMonthly,
    monthsEmergency, debtToIncome,
    liquidSavings, housingExpense,
    familyStatus, employmentType, moneyGoal, moneyFear, savingObstacle,
  };
}

export function detectCashFlowAlert(dailyAnswers = {}) {
  const m = computeFinancialMetrics(dailyAnswers);
  if (m.totalIncome === 0 || m.monthlySurplus >= 0) return null;
  return {
    deficit: Math.abs(m.monthlySurplus),
    totalIncome: m.totalIncome,
    totalExpenses: m.totalExpenses,
  };
}
