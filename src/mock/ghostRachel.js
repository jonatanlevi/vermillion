// Ghost user: רחל אברהם — Tier 1 (ייצוב) — PRE-RETIREMENT CRISIS
// 52, אלמנה (3 שנים), מנהלת קניות, חיפה. גירעון ₪2,300/חודש. 27 חודשים עד ריק.
// Covers: widowhood, adult child dependency, pre-retirement Tier 1, emotional coaching.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-18T20:00:00.000Z'); // אחרי ארוחת ערב

export const ghostRachel = {
  id: 'ghost_rachel',
  name: 'רחל אברהם',
  phone: '052-6612039',
  email: 'rachel.avraham52@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 6,
  rank: 55,
  score: 52.1,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '9', dobM: '2', dobY: '1974' }, // age 52

  vermillion: {
    name: 'CEDAR · THE STRONG',
    appearance: { body: 'solid', style: 'classic', colors: 'deep_red', energy: 'resilient' },
    tone: { advice_style: 'compassionate', personality: 'mentor', goal_focus: 'security' },
  },

  dailyAnswers: {
    1: {
      family_status: 'widowed',
      children_count: '3',       // בוגרים: 28, 25, 22
      housing_type: 'renting',
      city_type: 'north',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(14)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '42',
      top_hobby: 'cooking',
      social_budget: 'low',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(9)).toISOString(),
    },
    3: {
      money_goal: 'security',
      money_fear: 'old_age',
      extra_money_action: 'save',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(11)).toISOString(),
    },
    4: {
      net_income: '13500',
      side_income: '0',
      num_earners: '1',
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(6)).toISOString(),
    },
    5: {
      housing_expense: '3600',
      fixed_expenses: '4200',    // ביטוחים, רכב, טלפון, קר"ח
      variable_expenses: '8000', // כולל ₪2,500 עזרה לבן + הוצאות אישיות
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(8)).toISOString(),
      _note: 'הוצאות כוללות ₪2,500/חודש עזרה לבן הגדול (28, מובטל)',
    },
    6: {
      mortgage_balance: '0',
      loans_total: '0',
      credit_debt: '18000',
      liquid_savings: '62000',   // מה שנשאר מפוליסת ביטוח חיים
      investments: '0',
      real_estate_equity: '0',
      pension_monthly: '4200',   // צפוי בגיל 67
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(13)).toISOString(),
      _note: 'פוליסת ביטוח חיים ₪220K — כבר הוציאה ₪158K על הלוויה, עזרה לילדים, ריפוד חשבון',
    },
    7: {
      retirement_age: '67',
      financial_target: '1200000',
      emergency_savings: '62000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(7)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 52,
    occupation: 'מנהלת קניות — חברת ייצור בחיפה (שכירה, ותק 14 שנה)',
    city: 'חיפה',
    familySituation: 'אלמנה (בעל נפטר 2023, גיל 54, אירוע לב). 3 ילדים בוגרים: אייל 28, ליאת 25, יונתן 22.',
    techSavvy: 'low',
    financialLiteracy: 'low_to_medium',  // ניהלה את הבית תמיד, אבל הבעל עשה פיננסים
    appSkepticism: 'high',
    sessionTime: '20:00',                // אחרי ארוחת ערב, לפני סדרה
    readingStyle: 'careful',             // קוראת כל מילה, לא מדלגת

    cash_flow: {
      net_income: 13500,
      rent: 3600,
      fixed: 4200,
      variable_personal: 5500,
      son_support: 2500,       // עזרה לאייל — EMOTIONAL LANDMINE
      total_expenses: 15800,
      monthly_deficit: -2300,
      savings_rate: -17,       // Tier 1
    },

    runway: {
      liquid_savings: 62000,
      monthly_burn: 2300,
      months_until_zero: 26.9,  // ~27 חודשים — URGENT
      zero_date_approx: '2028-07',
    },

    balance_sheet: {
      liquid_savings: 62000,
      credit_debt: 18000,
      net_liquid: 44000,
      pension_estimated_at_67: 4200 * 12 * 20, // גסה — 20 שנות קצבה
      total_net_worth_estimated: 44000,
    },

    widowhood_context: {
      years_since: 3,
      insurance_payout: 220000,
      insurance_spent: 158000,   // הלוויה, ריפוד, עזרה לילדים, שיפוץ קטן
      remaining: 62000,
      emotional_note: 'המספרים מרגישים כמו כסף של בעלה — קשה לה "לגעת" בהם',
    },

    financial_tier: { tier: 1, label: 'ייצוב', reason: 'deficit_and_debt' },

    triggerWords: ['פרישה', 'ביטחון', 'ילדים', 'עתיד', 'בדידות'],
    dealBreakers: [
      'להזכיר את הבעל יותר מפעם אחת',
      'לייעץ לה "לעצור לעזור לאייל" — היא לא תוכל לשמוע את זה',
      'ז׳רגון פיננסי — היא לא מכירה ETF, FIRE, LTV',
      'להמעיט בדאגה שלה — המצב אכן קשה',
      'תוכנית רחוקה מדי — היא צריכה מה עושים MONTH 1',
    ],
    motivators: [
      'לא להיות "עול" על הילדים בגיל 70',
      'קצבת פנסיה = ₪4,200 — גרעין יציב בעוד 15 שנה',
      'לחסל חוב כרטיס אשראי = ₪400/חודש פחות ריבית מיידית',
      '27 חודשים זה מספיק זמן לתקן — אם מתחילים עכשיו',
    ],

    ai_coaching_notes: [
      'פתח באמפתיה — לא בנתונים. "המצב שלך קשה, ואפשר לצאת ממנו."',
      'אסור לדבר על אייל (הבן) בגוף שני — להציג כ"הוצאה" ואז לבנות גשר',
      'URGENT: runway 27 חודשים — AI חייב לציין את זה בפגישה הראשונה',
      'שלב 1: לחסל כרטיס אשראי (₪18K) — ₪400/חודש ריבית = ₪4,800/שנה נחסך',
      'שלב 2: הוריד גירעון → ₪0 → הוסף ₪500 חיסכון. לא לקפוץ לשלב 2 לפני 1',
      'פנסיה = נכס אמיתי — ₪4,200/חודש ב-67 = ₪50K/שנה. זה לא מעט.',
      'לא לדבר על השקעות עד שהגירעון הופך לעודף — Tier 1 rules קדושות',
      'שפה: פשוטה, ישירה, חמה. לא ז׳רגון. לא גרפים. שאלה אחת בסוף.',
    ],
  },
};

export const rachelPersonalTime = { hour: 20, minute: 3, second: 17, ms: 88 };

export const rachelGameResults = {
  flappy: [
    { session: 1, score: 8,  note: 'לא הבינה את הפיזיקה — הפסיקה אחרי דקה' },
    { session: 2, score: 14, note: 'ניסתה שוב, שיפור קל' },
    { session: 3, score: 11, note: 'לא מתחברת למשחק הזה. "מה זה קשור לכסף?"' },
  ],
  quiz: [
    { session: 1, score: 4, total: 10, missed: ['ETF', 'תשואה', 'מינוף', 'FIRE', 'P/E', 'LTV'], note: 'יודעת: ריבית, חיסכון, פנסיה, ביטוח חיים' },
    { session: 2, score: 5, total: 10, note: 'שיפור — גגלה ריבית דריבית בלילה' },
    { session: 3, score: 6, total: 10, note: 'מתאמצת. "כשיהיה לי כסף ניסה גם השקעות"' },
  ],
  budget: [
    { session: 1, score: 52, note: 'כמעט כל הוצאה "חובה" בעיניה — כולל עזרה לאייל' },
    { session: 2, score: 61, note: 'קיצצה נסיעות. לא נגעה בתמיכה לאייל' },
    { session: 3, score: 69, note: 'הורידה ₪500 מהוצאות אישיות. "זה הכי שאפשר"' },
  ],
};
