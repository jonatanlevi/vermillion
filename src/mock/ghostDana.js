// Ghost user: דנה ביטון — Tier 3 (בנייה)
// 38, רואת חשבון בכירה, נשואה (עמי מרוויח פחות), 2 ילדים, באר שבע, משכנתא.
// Covers: two-income household, mortgage, periphery, gender income gap, optimization path.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-18T12:30:00.000Z'); // lunch break registration

export const ghostDana = {
  id: 'ghost_dana',
  name: 'דנה ביטון',
  phone: '052-4412987',
  email: 'dana.biton.cpa@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 7,
  rank: 19,
  score: 77.3,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '3', dobM: '11', dobY: '1987' }, // age 38

  vermillion: {
    name: 'ATLAS · THE BUILDER',
    appearance: { body: 'strong', style: 'professional', colors: 'teal', energy: 'steady' },
    tone: { advice_style: 'strategic', personality: 'analyst', goal_focus: 'growth' },
  },

  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '2',
      housing_type: 'owner',
      city_type: 'south',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(8)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '45',
      top_hobby: 'fitness',
      social_budget: 'medium',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(12)).toISOString(),
    },
    3: {
      money_goal: 'education_fund',
      money_fear: 'not_enough_retirement',
      extra_money_action: 'invest',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(5)).toISOString(),
    },
    4: {
      net_income: '18000',
      side_income: '0',
      num_earners: '2',          // עמי ₪11,000 — entered combined later
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(9)).toISOString(),
      _note: 'דנה דיווחה על ההכנסה שלה בלבד. הכנסה משולבת: ₪29,000.',
    },
    5: {
      housing_expense: '6800',   // משכנתא
      fixed_expenses: '7200',    // 2 רכבים + ביטוחים + גני ילדים + חוגים
      variable_expenses: '8600', // אוכל + קניות + בילויים + שונות
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(14)).toISOString(),
    },
    6: {
      mortgage_balance: '780000',
      loans_total: '0',
      credit_debt: '0',
      liquid_savings: '85000',
      investments: '120000',
      real_estate_equity: '420000',
      pension_monthly: '4200',   // דנה בלבד
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(7)).toISOString(),
    },
    7: {
      retirement_age: '55',
      financial_target: '5000000',
      emergency_savings: '85000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(11)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 38,
    occupation: 'רואת חשבון בכירה — שכירה בחברת ייצור',
    city: 'באר שבע',
    familySituation: 'נשואה לעמי (מורה, ₪11K נטו), 2 ילדים (7, 4)',
    techSavvy: 'high',
    financialLiteracy: 'very_high',  // רואת חשבון — יודעת תיאוריה, לא תמיד מיישמת
    appSkepticism: 'medium',
    sessionTime: '12:30', // הפסקת צהריים
    readingStyle: 'scan_then_deep', // סורקת כותרות, קוראת לעומק אם מעניין

    joint_finances: {
      danaIncome: 18000,
      amiIncome: 11000,
      combinedIncome: 29000,
      mortgageMonthly: 6800,
      mortgageBalance: 780000,
      propertyValue: 1200000,
      equity: 420000,
      yearsRemaining: 18,
    },

    cash_flow: {
      combined_income: 29000,
      mortgage: 6800,
      fixed: 7200,
      variable: 8600,
      total_expenses: 22600,
      monthly_surplus: 6400,
      savings_rate: 22,   // Tier 3
    },

    balance_sheet: {
      liquid_savings: 85000,
      investments: 120000,
      real_estate_equity: 420000,
      total_assets: 625000,
      total_debt: 780000,       // משכנתא בלבד
      net_worth: -155000,       // שלילי בגלל משכנתא — נורמלי
    },

    financial_tier: { tier: 3, label: 'בנייה', reason: 'savings_rate_22pct' },

    triggerWords: ['פנסיה', 'ילדים', 'דירה', 'השקעות', 'עצמאות'],
    dealBreakers: [
      'מייעצת לה על בסיסים — היא יודעת תיאוריה',
      'מתעלם מעמי כחלק מהמשוואה',
      'טיפים גנריים ללא התייחסות לפריפריה',
      'מסגרת של "אישה שמרוויחה פחות מבעלה" — ההיפך נכון',
    ],
    motivators: [
      'קרן חינוך לילדים (מטרה ₪200K עד גיל 18)',
      'עצמאות פיננסית בגיל 55',
      'אופטימיזציה מיסויית — יודעת שמשאירה כסף על השולחן',
      'השוואה ביצועים של קרן הפנסיה שלה vs. קרן עמי',
    ],

    ai_coaching_notes: [
      'תמיד לדבר על הכנסה משולבת (₪29K) — לא רק שלה',
      'משכנתא = בניית הון, לא הוצאה — לקחת בחשבון בחישוב חיסכון',
      'היא יודעת יותר מרוב המשתמשים — AI צריך להתאמץ לתת ערך ב-Tier 3+',
      'קרן השתלמות — בדוק אם מנצלת את המקסימום (שכירה מטעם מעסיק)',
      'גאפ גיל פרישה: רוצה 55, המשכנתא מסתיימת ב-56 — לזהות את הקונפליקט',
      'פריפריה: יש לה דירה ב-₪1.2M שב-ת"א שווה ₪3M — לא להגיד לה "תעברי"',
    ],
  },
};

export const danaPersonalTime = { hour: 12, minute: 31, second: 44, ms: 207 };

export const danaGameResults = {
  flappy: [
    { session: 1, score: 48, note: 'מיקוד גבוה, ישבה 10 דקות בלי לזוז' },
    { session: 2, score: 67, note: 'שיפור מהיר — לומדת מהר' },
    { session: 3, score: 82, note: 'מנסה למקסם — אופייני לה' },
  ],
  quiz: [
    { session: 1, score: 9, total: 10, missed: ['מה כלל ה-25X?'], note: 'כמעט מושלם, פספסה FIRE formula' },
    { session: 2, score: 10, total: 10, note: 'מושלם — ידעה הכל כולל FIRE' },
    { session: 3, score: 10, total: 10, note: 'חיזרה על הכל מבעוד מועד' },
  ],
  budget: [
    { session: 1, score: 91, note: 'כמעט מושלם, ויתרה על נטפליקס בהיסוס' },
    { session: 2, score: 97, note: 'קיצצה חוגים — "ניסוי" אמרה' },
    { session: 3, score: 100, note: 'מושלם. ביקשה גרסה "קשה יותר"' },
  ],
};
