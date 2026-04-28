// Ghost user: שמחה (שימי) כהן — Tier 0→1 (עיוור → ייצוב)
// 45, לומד כולל + אשתו מורה, בני ברק, 7 ילדים. מחשב לצאת לעבוד.
// Covers: ultra-orthodox, kollel income, child allowances, near-zero financial vocabulary,
//         large family subsidy structure, first-time financial self-awareness.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-20T19:30:00.000Z'); // אחרי שיעור ערב, לפני תפילת ערבית

export const ghostShimi = {
  id: 'ghost_shimi',
  name: 'שמחה כהן',
  phone: '052-3318847',
  email: 'shimmy.cohen.bb@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 5,
  rank: 62,
  score: 41.8,
  avatar_level: 1,
  subscription: 'premium',  // שילמה דבורה עבורו

  dob: { dobD: '12', dobM: '9', dobY: '1980' }, // age 45

  vermillion: {
    name: 'EMET · THE FOUNDATION',
    appearance: { body: 'average', style: 'minimal', colors: 'white_gold', energy: 'grounded' },
    tone: { advice_style: 'nurturing', personality: 'educational', goal_focus: 'foundation' },
  },

  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '7',          // 24 (נשוי), 22 (ישיבה), 19 (ישיבה), 16, 13, 10, 7
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(17)).toISOString(),
    },
    2: {
      employment_type: 'student',   // כולל — הגדיר עצמו "לומד"
      work_hours_weekly: '50',      // שעות לימוד בכולל
      top_hobby: 'learning',
      social_budget: 'low',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(11)).toISOString(),
    },
    3: {
      money_goal: 'stability',
      money_fear: 'not_enough',
      extra_money_action: 'save',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(14)).toISOString(),
    },
    4: {
      net_income: '11300',          // כולל ₪3,500 כולל + ₪7,800 דבורה
      side_income: '2800',          // קצבאות ילדים — דיווח כ"הכנסה נוספת"
      num_earners: '2',
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(9)).toISOString(),
      _note: 'ההכנסה כוללת: כולל ₪3,500 + הוראה ₪7,800 + קצבאות ₪2,800. ₪800 סבסוד שכ"ד לא דווח.',
    },
    5: {
      housing_expense: '3000',      // שכר דירה ₪3,800 פחות סבסוד ₪800
      fixed_expenses: '2800',       // אוכל בסיסי, ביטוח בריאות
      variable_expenses: '5200',    // ילדים (לבוש, ספרים, הסעות לישיבה, חתונת הבן הבכור)
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(12)).toISOString(),
      _note: 'הוצאות משפחה של 9 (+ 2 בנים בישיבה שמגיעים לשבתות). חתונת הבן הגדול = ₪60K בעוד שנה.',
    },
    6: {
      mortgage_balance: '0',
      loans_total: '12000',         // הלוואת גמח — ריבית 0 אבל צריך להחזיר
      credit_debt: '0',
      liquid_savings: '4200',       // "גניזה" — כסף בצד לחתונות
      investments: '0',
      real_estate_equity: '0',
      pension_monthly: '1400',      // פנסיה של דבורה בלבד. שימי — אין כלל.
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(16)).toISOString(),
      _note: 'שימי לא מכיר את המינוח "פנסיה". ענה "אין לי" אבל לדבורה יש קרן גמל בסיסית.',
    },
    7: {
      retirement_age: '70',         // "לא חשבתי על זה"
      financial_target: '200000',   // "מספיק לחתונות"
      emergency_savings: '4200',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(8)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 45,
    occupation: 'לומד כולל — ישיבת בני ברק (₪3,500/חודש מלגת כולל)',
    spouseOccupation: 'מורה — בית ספר בנות חרדי (₪7,800/חודש נטו)',
    city: 'בני ברק',
    familySituation: 'נשוי לדבורה (45). ילדים: שמעון (24, נשוי), ישראל (22, ישיבה גדולה), יעקב (19, ישיבה), שרה (16), רחל (13), לאה (10), דניאל (7)',
    techSavvy: 'low',                // סמארטפון בסיסי, ווצאפ, לא יודע אקסל
    financialLiteracy: 'very_low',
    appSkepticism: 'medium',         // חבר המליץ, "ננסה"
    sessionTime: '19:30',
    readingStyle: 'careful',

    income_breakdown: {
      kollel_stipend: 3500,
      wife_salary: 7800,
      child_allowances: 2800,        // 5 ילדים × ₪560/חודש (ממוצע)
      rent_subsidy_bnei_brak: 800,   // עיריית בני ברק
      total_effective: 14900,
    },

    cash_flow: {
      gross_income_declared: 11300,  // מה שדיווח (בלי קצבאות וסבסוד)
      effective_income: 14900,
      rent_net: 3000,                // אחרי סבסוד
      food_large_family: 2800,       // צמצום מירבי
      kids_expenses: 3200,           // לבוש, ספרים, הסעות
      shabbat_yom_tov: 800,          // הוצאות שבת וחג
      gemach_repayment: 600,         // ₪12K / 20 חודשים
      misc: 400,
      total_expenses: 10800,
      monthly_surplus: 4100,         // בחודש רגיל — אבל חתונות הורסות
      savings_rate: 27,              // גבוה יחסית! אבל כל חיסכון הולך לחתונות
    },

    upcoming_liabilities: {
      wedding_shmulik: 60000,        // שמעון הגדול — חתונה בעוד שנה
      weddings_future: 4,            // עוד 4 ילדים שצריכים חתונות
      estimated_total_weddings: 240000, // ₪60K × 4 (גסה)
    },

    balance_sheet: {
      liquid_savings: 4200,          // "גניזה לחתונות"
      gemach_debt: 12000,
      investments: 0,
      pension_devorah: null,         // קיים, לא ידוע כמה
      pension_shimi: 0,              // כולל לא מפריש לפנסיה
      net_worth: -7800,
    },

    transition_context: {
      considering_work: true,
      skill: 'מחשבות לעסק קטן בצד — מתוקף, תיקוני ספרים, הצגת שיעורים',
      obstacle: 'קהילה — יציאה לעבוד נתפסת כ"ירידה". דבורה תומכת בסתר.',
      timeline: 'מחשב ברצינות כשהבן הקטן (7) יגיע לגיל 10',
    },

    financial_tier: {
      tier: 1,
      label: 'ייצוב',
      reason: 'no_savings_large_liabilities_coming_no_pension_for_husband',
      note: 'על פניו surplus חיובי, אבל חתונות קרובות = מחסור חמור',
    },

    triggerWords: ['חתונה', 'ילדים', 'ביטחון', 'עתיד', 'פרנסה'],
    dealBreakers: [
      'כל עצה שמרמזת שהכולל הוא הבעיה — לא יסכים לשמוע',
      'ז׳רגון השקעות: ETF, מניות, מינוף — לא רלוונטי ולא מקובל',
      'ביקורת על גודל המשפחה',
      'לדבר על "לפרוש" — הוא לא מתכנן לפרוש, ידגיש זאת',
    ],
    motivators: [
      'חתונת שמעון — ₪60K בעוד שנה. "איך אספנה?"',
      'לא להיות עול על הילדים הנשואים',
      'לדבורה יש פנסיה — "מה יש שם?" — גילוי ה-upside',
      'הלוואת גמ"ח — לסגור מהר ולפנות תזרים',
    ],

    ai_coaching_notes: [
      'לא לנגוע בבחירת הכולל — לעבוד בתוך המציאות, לא נגדה',
      'קצבאות ילדים = ₪2,800/חודש — לוודא שמנצל את מלוא הזכאות',
      'חתונה בעוד שנה = ₪60K — זה ה-HOOK הגדול ביותר. חיסכון חרדי = "לחתונות"',
      'פנסיה של דבורה: לבדוק יתרה, לוודא שמפרישה מקסימום מול המעסיק',
      'שימי — אין פנסיה בכלל. לשקול קרן גמל לעצמאי אם יתחיל לעבוד',
      'שפה: חמה, מכבדת, בלי מינוח זר. "כסף" לא "capital". "חיסכון" לא "portfolio"',
      'Tier 1: לא לדבר על השקעות. שלב 1 = גמ"ח → סגור. שלב 2 = קרן חתונה ₪5K/חודש',
    ],
  },
};

export const shimiPersonalTime = { hour: 19, minute: 33, second: 54, ms: 0 };

export const shimiGameResults = {
  flappy: [
    { session: 1, score: 6,  note: '"מה זה הציפור הזו?" — לא הבין את הקונספט' },
    { session: 2, score: 14, note: 'ניסה שוב, שיפור קל' },
    { session: 3, score: 22, note: 'הבין שצריך סבלנות. "כמו תורה — מתמיד"' },
  ],
  quiz: [
    { session: 1, score: 2, total: 10, missed: ['ETF', 'תשואה', 'ריבית דריבית', 'מינוף', 'LTV', 'מדד', 'FIRE', 'קרן נאמנות'], note: 'ידע: "ריבית" ו"חיסכון" — זהו' },
    { session: 2, score: 3, total: 10, missed: ['ETF', 'תשואה', 'מינוף', 'LTV', 'FIRE', 'קרן נאמנות', 'מדד'], note: 'הוסיף: ריבית דריבית. "כמו ריבית שמרוויחה ריבית — זה חכם"' },
    { session: 3, score: 4, total: 10, note: 'מתאמץ. לומד מהר כשמוסבר בשפה פשוטה.' },
  ],
  budget: [
    { session: 1, score: 71, note: 'מצוין! חי בצמצום — יודע בדיוק מה הכרחי ומה לא' },
    { session: 2, score: 78, note: 'הפיל נסיעות מיותרות. שמח על כל שקל שנחסך.' },
    { session: 3, score: 81, note: 'הצביע על "שבת ויום טוב" כ"לא ניתן לקצץ". מוקד לדיון.' },
  ],
};
