// Ghost user: מוחמד עמאר — Tier 2 (שרידות)
// 41, מהנדס אזרחי עירייה, נוף הגליל. נשוי + 4 ילדים. מפרנס להורים.
// Covers: Arab-Israeli, extended family obligations, pension blindspot, homemaker spouse.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-19T18:05:00.000Z'); // אחרי עבודה, לפני ארוחת ערב משפחתית

export const ghostMohammad = {
  id: 'ghost_mohammad',
  name: 'מוחמד עמאר',
  phone: '052-7742819',
  email: 'mohammad.ammar.eng@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 6,
  rank: 38,
  score: 64.2,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '17', dobM: '3', dobY: '1985' }, // age 41

  vermillion: {
    name: 'BASALT · THE PILLAR',
    appearance: { body: 'strong', style: 'rugged', colors: 'slate', energy: 'grounded' },
    tone: { advice_style: 'direct', personality: 'analyst', goal_focus: 'stability' },
  },

  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '4',         // 15, 12, 8, 4 — כולם תלויים
      housing_type: 'owner',
      city_type: 'north',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(11)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '46',
      top_hobby: 'family',
      social_budget: 'medium',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(8)).toISOString(),
    },
    3: {
      money_goal: 'education_kids',
      money_fear: 'not_enough',
      extra_money_action: 'save',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(14)).toISOString(),
    },
    4: {
      net_income: '22000',
      side_income: '0',
      num_earners: '1',             // אמאל לא עובדת
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(6)).toISOString(),
    },
    5: {
      housing_expense: '4200',      // משכנתא
      fixed_expenses: '9800',       // רכב + ביטוחים + תמיכת הורים ₪2,500 + אוכל בסיסי גדול
      variable_expenses: '5400',    // ילדים (חוגים, בגדים, רפואה) + דלק + שונות
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(10)).toISOString(),
      _note: 'הוצאות קבועות כוללות ₪2,500/חודש תמיכת הורים — לא ניתנות לוויתור',
    },
    6: {
      mortgage_balance: '420000',
      loans_total: '35000',         // הלוואת רכב
      credit_debt: '0',
      liquid_savings: '28000',
      investments: '0',
      real_estate_equity: '280000',
      pension_monthly: '1800',      // הפרשה לפנסיה — נמוכה, לא בדק מתי
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(12)).toISOString(),
      _note: 'הפנסיה נפתחה ב-2008, לא עדכן מאז. לא יודע מה צבור.',
    },
    7: {
      retirement_age: '67',
      financial_target: '2000000',
      emergency_savings: '28000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(9)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 41,
    occupation: 'מהנדס אזרחי בכיר — עיריית נוף הגליל (שכיר ציבורי ותק 14 שנה)',
    city: 'נוף הגליל (נצרת עילית)',
    familySituation: 'נשוי לאמאל (עקרת בית), 4 ילדים: 15, 12, 8, 4',
    techSavvy: 'medium',
    financialLiteracy: 'low_to_medium',
    appSkepticism: 'medium',
    sessionTime: '18:05',           // חלון קצר לפני ארוחת ערב משפחתית
    readingStyle: 'careful',

    cash_flow: {
      net_income: 22000,
      mortgage: 4200,
      car_loan: 1500,               // חלק מהוצאות קבועות
      parents_support: 2500,        // חובה תרבותית ומוסרית — לא אופציונלי
      food_family: 3800,            // משפחה של 6
      kids_expenses: 2200,          // חינוך, חוגים, רפואה
      fuel_transport: 800,
      insurance: 1200,
      variable_misc: 1600,
      total_expenses: 17800,        // לא כולל עוד הוצאות לא צפויות
      monthly_surplus: 4200,
      savings_rate: 19,             // כמעט Tier 3 — מרגיש בצמצום אבל מצבו לא רע
    },

    balance_sheet: {
      property_value: 700000,       // בית בנוף הגליל
      mortgage_balance: 420000,
      equity: 280000,
      car_loan: 35000,
      liquid_savings: 28000,        // ~1.6 חודשי מחיה
      investments: 0,
      pension_estimated: null,      // לא ידוע — לא בדק מאז 2008
      net_worth: 273000,
    },

    extended_family_obligations: {
      parents_support_monthly: 2500,
      context: 'אב מוחמד בן 72, אמו בת 68 — גרים בכפר מוצא. לא עובדים. מוחמד הבן הבכור.',
      cultural_note: 'בחברה הערבית-ישראלית תמיכה בהורים = חובה חברתית, לא אופציה. לא ניתן "לייעץ" על קיצוץ.',
    },

    pension_blindspot: {
      opened: 2008,
      last_checked: 'never',
      contribution_rate_employer: 6.5,
      contribution_rate_employee: 6,
      estimated_balance: 180000,    // גסה — לא ידוע לו
      awareness: 'יודע שיש, לא יודע כמה, לא בדק מתי יקבל',
    },

    financial_tier: { tier: 2, label: 'שרידות', reason: 'savings_rate_below_5pct_some_months_due_to_irregular_expenses' },

    triggerWords: ['ילדים', 'חינוך', 'הורים', 'בית', 'עתיד'],
    dealBreakers: [
      'להציע לקצץ את תמיכת ההורים — קו אדום תרבותי ואישי',
      'להניח שאמאל יכולה לעבוד — בחירה משפחתית מכוונת',
      'ז׳רגון מורכב — הוא מהנדס, לא כלכלן',
      'תוכן שמתייחס לאסלאם כאילו זה מגבלה — הוא לא מחויב להלכות שריעה פיננסיות',
    ],
    motivators: [
      'ילד בכור נכנס לאוניברסיטה בעוד 3 שנים — עלויות ₪30K+/שנה',
      'הפנסיה — "מה יש שם?" — לגלות את הסכום הצבור',
      'לצמצם את הלוואת הרכב',
      'לבנות ₪50K חיסכון לחינוך ילדים',
    ],

    ai_coaching_notes: [
      'לעולם לא לנגוע בתמיכת ההורים — לתאר אותה כ"הוצאה קבועה" ולהמשיך הלאה',
      'אנגל לפנסיה: "כמה צבור לך — בוא נגלה יחד" — זה ה-hook הגדול ביותר',
      'surplus ₪4,200/חודש — Tier 3 בהישג יד אם יפעל נכון',
      'להדגיש: ₪28K חיסכון = רק 1.6 חודשים. קרן חירום מינימום = 3 חודשים (₪54K)',
      'ילד בכור לאוניברסיטה: 3 שנים × ₪8,333/שנה = ₪25K צריך לחסוך',
      'אין השקעות כלל — אחרי בניית קרן חירום, Tier 3 מתאים לפיזור ראשוני',
      'שפה: ישירה, מכבדת, ללא patronizing. הוא חכם ומתפקד — רק חסרה מסגרת.',
    ],
  },
};

export const mohammadPersonalTime = { hour: 18, minute: 7, second: 33, ms: 204 };

export const mohammadGameResults = {
  flappy: [
    { session: 1, score: 52, note: 'בסיסי — רפלקסים טובים אבל לא גיימר' },
    { session: 2, score: 68, note: 'שיפור — הבין את הפיזיקה' },
    { session: 3, score: 71, note: 'יציב — לא מנסה לשבור שיאים' },
  ],
  quiz: [
    { session: 1, score: 5, total: 10, missed: ['ETF', 'תשואה', 'FIRE', 'מינוף', 'LTV'], note: 'יודע: פנסיה, ביטוח, ריבית פשוטה, חיסכון' },
    { session: 2, score: 6, total: 10, note: 'גגל ריבית דריבית — מבין מהר' },
    { session: 3, score: 7, total: 10, note: 'שיפור עקבי — ישב ולמד' },
  ],
  budget: [
    { session: 1, score: 58, note: 'כמה הוצאות הוא לא מוכן לגעת בהן — תמיכת הורים, אוכל' },
    { session: 2, score: 67, note: 'הסכים לקצץ בילויים קצת' },
    { session: 3, score: 74, note: 'מצא חיסכון ברכב (השיב על ה-lease scenario)' },
  ],
};
