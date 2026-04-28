// Ghost user: גלית שרון — Tier 2→3 (שרידות → בנייה)
// 33, עולה מצרפת (5 שנים), מעצבת גרפית עצמאית, תל אביב. רווקה.
// Covers: olah hadasha, Israeli financial system blindspot, savings abroad (€22K idle),
//         freelance income instability, olim tax benefits not utilized, identity in flux.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-19T20:45:00.000Z'); // אחרי ארוחת ערב

export const ghostGalit = {
  id: 'ghost_galit',
  name: 'גלית שרון',
  phone: '052-8812447',
  email: 'galit.sharon.design@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 7,
  rank: 29,
  score: 68.1,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '22', dobM: '6', dobY: '1992' }, // age 33

  vermillion: {
    name: 'SOLEIL · THE EXPLORER',
    appearance: { body: 'slim', style: 'artistic', colors: 'amber_white', energy: 'curious' },
    tone: { advice_style: 'nurturing', personality: 'educational', goal_focus: 'independence' },
  },

  dailyAnswers: {
    1: {
      family_status: 'single',
      children_count: '0',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(9)).toISOString(),
    },
    2: {
      employment_type: 'freelance',
      work_hours_weekly: '40',
      top_hobby: 'art',
      social_budget: 'medium',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(13)).toISOString(),
    },
    3: {
      money_goal: 'independence',
      money_fear: 'not_stable',
      extra_money_action: 'save',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(7)).toISOString(),
    },
    4: {
      net_income: '11000',           // חודש ממוצע — לפעמים ₪7K, לפעמים ₪17K
      side_income: '0',
      num_earners: '1',
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(11)).toISOString(),
      _note: 'הכנסה עצמאית: טווח ₪7,000–₪17,000. לא ידועה לה כרגע הטבת מס עולים.',
    },
    5: {
      housing_expense: '4200',       // שכ"ד תל אביב
      fixed_expenses: '2100',        // טלפון, ביטוח בריאות, מנויים
      variable_expenses: '4800',     // אוכל, בגדים, יציאות, כרטיסי טיסה לצרפת (₪800/חודש ממוצע)
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(8)).toISOString(),
      _note: '₪800/חודש ממוצע = כרטיסי טיסה צרפת (4 פעמים בשנה, ₪2,400/כרטיס).',
    },
    6: {
      mortgage_balance: '0',
      loans_total: '0',
      credit_debt: '4800',           // כרטיס אשראי — חשבון שנצבר
      liquid_savings: '18000',       // חיסכון ישראלי
      investments: '0',
      real_estate_equity: '0',
      pension_monthly: '800',        // הפרשה עצמאית — לא יודעת אם מספיק
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(14)).toISOString(),
      _note: '₪22,000 יורו (≈₪88,000) בבנק צרפתי — לא דיווחה, לא יודעת מה לעשות איתם.',
    },
    7: {
      retirement_age: '65',
      financial_target: '3000000',
      emergency_savings: '18000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(10)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 33,
    occupation: 'מעצבת גרפית עצמאית — בעיקר לקוחות ישראלים + לקוח גדול בצרפת',
    city: 'תל אביב (דיזנגוף)',
    familySituation: 'רווקה. עלתה ב-2021 מפריז. חברים רבים בארץ, משפחה בצרפת.',
    techSavvy: 'high',
    financialLiteracy: 'medium',      // מבינה בסיס, לא מכירה מערכת ישראלית
    appSkepticism: 'low',
    sessionTime: '20:45',
    readingStyle: 'scan',

    aliya_context: {
      year: 2021,
      country: 'France',
      years_in_israel: 5,
      olim_tax_benefits_remaining: 5, // 10 שנות פטור מס — עוד 5 שנים
      benefits_utilized: 'none',       // לא ידעה שיש
      french_bank_account: {
        balance_eur: 22000,
        balance_ils_approx: 88000,
        status: 'idle — משאירה שם "ליתר ביטחון"',
        cost_of_inaction: 'ריבית 0, אבל אינפלציה אוכלת ₪3,500/שנה לפחות',
      },
      sends_to_france_monthly: 0,       // לא שולחת — הפסיקה לאחרונה
    },

    income_pattern: {
      avg_monthly: 11000,
      good_month: 17000,
      bad_month: 7000,
      income_type: 'project-based',
      biggest_client: 'חברת סטארטאפ ישראלי — ₪5,000/חודש קבוע (עד סוף 2026)',
    },

    cash_flow: {
      avg_net_income: 11000,
      rent: 4200,
      fixed: 2100,
      variable: 4800,
      total_expenses: 11100,
      avg_surplus: -100,               // בחודש ממוצע — בחודש טוב ₪5,900 עודף!
      savings_rate_good_month: 35,
      savings_rate_bad_month: -43,
      savings_rate_avg: 4,             // Tier 2 בחודש ממוצע
    },

    balance_sheet: {
      liquid_savings_israel: 18000,
      savings_france_eur: 22000,
      savings_france_ils: 88000,       // משאבים שלא "בחשבון"
      total_liquid_real: 106000,
      credit_debt: 4800,
      investments: 0,
      pension_estimate: null,          // ₪800/חודש × 5 שנים — לא ידוע לה
      net_worth_real: 101200,          // גבוה ממה שהיא חושבת
    },

    israeli_system_blindspots: [
      'לא יודעת על הטבות מס לעולים — עוד 5 שנות פטור',
      'לא פתחה קרן השתלמות לעצמאית — מפסידה ₪20,520/שנה פטור מס',
      'ביטוח לאומי — משלמת מינימום, לא מבינה מה מגיע לה',
      'הכסף הצרפתי — לא ידעה שמדינת ישראל מטפלת בנכסי חוץ בצורה מסוימת',
      'כרטיס אשראי — לא יודעת שריבית ישראלית גבוהה מצרפת (6-12% vs 2-3%)',
    ],

    financial_tier: {
      tier: 2,
      label: 'שרידות',
      reason: 'avg_savings_rate_4pct_high_income_variance',
      note: 'בפועל, אם תממש את הכסף הצרפתי — היא Tier 3 מיד',
    },

    triggerWords: ['עצמאות', 'עתיד', 'ישראל', 'צרפת', 'דירה'],
    dealBreakers: [
      'להניח שצרפת = עשירה — היא עלתה לבחירה, לא בגלל כסף',
      'לדבר על "לחזור לצרפת" כאפשרות — היא מחויבת לישראל',
      'ז׳רגון ישראלי כבד — לא מכירה קרן השתלמות, ביטוח מנהלים',
      'להניח שיש לה רשת ביטחון משפחתית — הוריה בצרפת, לא יכולים לעזור בזמן משבר',
    ],
    motivators: [
      '₪88K בבנק צרפתי — "מה עושים עם זה?" — זה ה-hook הגדול ביותר',
      'הטבות מס עולים — 5 שנים שנותרו. "מה מגיע לי שלא לקחתי?"',
      'קרן השתלמות לעצמאית — מיידי, ברור, חוסך ₪6K/שנה מס',
      'דירה בתל אביב — לגמרי לא ריאלי לבד. שותפות? פריפריה? קרן לדירה צרפתית?',
    ],

    ai_coaching_notes: [
      'ה-HOOK הראשון: "₪88K יש לך בצרפת. זה יושב ב-0%. בואנו נמצא לו מקום טוב."',
      'הטבות עולים: לחשב את מה שמפסידה — ₪22K מס בשנה שלא חלה עליה',
      'קרן השתלמות לעצמאית: פותחת ב-₪1,000/חודש → ₪12K/שנה → ₪6K פטור מס מיידי',
      'הכנסה משתנה: לחשב ממוצע, לבנות "חשבון חיץ" → מביטחון של חודש טוב לחודש רע',
      'כרטיס אשראי ₪4,800 → לסגור ראשון — ריבית ~15% בשנה = ₪720 נבזבז',
      'שפה: עברית ברורה. אפשר להסביר במינוח השוואתי: "קרן השתלמות = PEA ישראלי"',
      'לא ללחוץ על נדל"ן — תל אביב לבד לא ריאלי. להכיר בכך.',
    ],
  },
};

export const galitPersonalTime = { hour: 20, minute: 48, second: 11, ms: 330 };

export const galitGameResults = {
  flappy: [
    { session: 1, score: 88,  note: 'מיידית — חוש אסתטי, reflexes חדים' },
    { session: 2, score: 107, note: 'שיפור מהיר — גיימר לא מקצועי אבל טוב' },
    { session: 3, score: 124, note: 'מנסה לשבור שיא. תחרותית עם עצמה.' },
  ],
  quiz: [
    { session: 1, score: 5, total: 10, missed: ['קרן השתלמות', 'ביטוח מנהלים', 'כלל ה-4%', 'LTV', 'ETF'], note: 'ידעה: ריבית, חיסכון, תשואה, מדד, מינוף' },
    { session: 2, score: 7, total: 10, missed: ['ביטוח מנהלים', 'כלל ה-4%', 'LTV'], note: 'הבינה ETF מהר — "כמו OPCVM צרפתי"' },
    { session: 3, score: 8, total: 10, note: 'שיפור יפה — עדיין מתבלבלת ב-BI ישראלי ספציפי' },
  ],
  budget: [
    { session: 1, score: 72, note: 'לא ויתרה על כרטיסי הטיסה. "צריכה לראות אמא"' },
    { session: 2, score: 79, note: 'קיצצה נסיעות. "אולי 2 פעמים בשנה במקום 4"' },
    { session: 3, score: 85, note: 'מצוין — מבינה שההכנסה הלא-יציבה = הבעיה המרכזית' },
  ],
};
