// Ghost user: דוד בן-דוד — Tier 1→2 (ייצוב → שרידות)
// 49, בעל מסעדת שניצל קטנה בנתניה. מערבב עסק ופרטי. מרוויח טוב — מרגיש כמו שאין.
// Covers: small business owner, business/personal finance blur, loan for renovation,
//         irregular cash flow, no accounting, accountant for taxes only.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-20T14:30:00.000Z'); // הפסקת פנאי בשקט לפני ערב העסוק

export const ghostDavid = {
  id: 'ghost_david',
  name: 'דוד בן-דוד',
  phone: '052-5533129',
  email: 'david.bendavid.rest@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 4,
  rank: 44,
  score: 57.3,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '8', dobM: '1', dobY: '1977' }, // age 49

  vermillion: {
    name: 'IRON · THE GRINDER',
    appearance: { body: 'solid', style: 'rugged', colors: 'copper', energy: 'relentless' },
    tone: { advice_style: 'direct', personality: 'coach', goal_focus: 'stability' },
  },

  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '2',           // 17, 14
      housing_type: 'owner',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(8)).toISOString(),
    },
    2: {
      employment_type: 'self_employed',
      work_hours_weekly: '70',        // מסעדה: 6 ימים × 12 שעות
      top_hobby: 'football',
      social_budget: 'low',          // אין זמן
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(6)).toISOString(),
    },
    3: {
      money_goal: 'security',
      money_fear: 'business_fails',
      extra_money_action: 'invest_business',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(11)).toISOString(),
    },
    4: {
      net_income: '14000',            // מה שמוציא לעצמו — בפועל מה שהמסעדה "משאירה"
      side_income: '0',
      num_earners: '2',              // סיגל עובדת במסעדה part-time — אבל כשכירה בחברה בנפרד
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(9)).toISOString(),
      _note: 'דוד מבלבל בין הכנסה עסקית לאישית. ₪14K = מה שמושך מהעסק. סיגל ₪8K לא נכלל.',
    },
    5: {
      housing_expense: '5200',        // משכנתא
      fixed_expenses: '11000',        // כולל הוצאות עסקיות שמשלם מהחשבון הפרטי: חשמל מסעדה, ספקים דחופים
      variable_expenses: '6500',
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(13)).toISOString(),
      _note: 'הוצאות קבועות מנופחות: ₪4K+ מהן הוצאות עסקיות שמשלם מכרטיס אישי.',
    },
    6: {
      mortgage_balance: '380000',
      loans_total: '90000',           // הלוואת בנק לשיפוץ המסעדה (₪120K לפני שנה)
      credit_debt: '22000',           // כרטיס עסקי שדוד משלם מהחשבון האישי
      liquid_savings: '12000',
      investments: '0',
      real_estate_equity: '320000',
      pension_monthly: '2800',        // לא סדיר — מפריש "כשיש"
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(7)).toISOString(),
      _note: 'חוב כרטיס אשראי ₪22K = חצי עסקי, חצי אישי. לא יודע בדיוק.',
    },
    7: {
      retirement_age: '65',
      financial_target: '2500000',
      emergency_savings: '12000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(14)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 49,
    occupation: 'בעל מסעדת שניצל — "הבשרייה של דוד", נתניה (21 שנה פעיל)',
    city: 'נתניה',
    familySituation: 'נשוי לסיגל (47, עוזרת במסעדה + עבודת אחה"צ עצמאית ₪8K). ילדים: נועם (17), ליאור (14).',
    techSavvy: 'low_to_medium',
    financialLiteracy: 'low',         // מנהל עסק 21 שנה בלי חשבונאות ברורה
    appSkepticism: 'high',             // "כל אחד מוכר לי ייעוץ"
    sessionTime: '14:30',             // הפסקת ה"שקט" — לפני ערב
    readingStyle: 'scan',             // עייף, אין לו סבלנות

    business_profile: {
      name: 'הבשרייה של דוד',
      type: 'מסעדת שניצלים ובשר — 40 מקומות ישיבה + משלוחים',
      monthly_revenue_avg: 82000,     // ברוטו
      cogs_avg: 28000,                // חומרי גלם (34%)
      labor_avg: 18000,               // 4 עובדים + שני עצמאיים
      rent: 9500,
      utilities: 4200,
      loan_repayment: 4500,           // ₪90K / 20 חודשים נותרים
      misc_business: 3800,
      total_business_costs: 68000,
      operating_profit_avg: 14000,   // מה שמגיע לדוד
      accounting_status: 'accountant_for_taxes_only',
    },

    personal_finance_chaos: {
      mixing_accounts: true,
      credit_card_split: { business: 11000, personal: 11000 }, // מנחש
      cash_withdrawals: 'frequent',   // מושך מזומן מהקופה "לצרכי בית" — לא מתועד
      knows_monthly_profit: false,    // לא יודע בדיוק כמה הרוויח כל חודש
    },

    cash_flow_personal: {
      draws_from_business: 14000,
      sigal_income: 8000,
      combined_income: 22000,
      mortgage: 5200,
      personal_fixed: 7000,           // ספקים עסקיים ששילם מכרטיס פרטי
      personal_variable: 6500,
      loan_personal_share: 2200,      // חלק שמשלם מהחשבון הפרטי
      total_expenses: 20900,
      surplus: 1100,
      savings_rate: 5,                // Tier 2 — אבל לא יודע את זה
    },

    balance_sheet: {
      property_value: 700000,
      mortgage: 380000,
      equity: 320000,
      business_loan: 90000,
      credit_card: 22000,
      liquid_savings: 12000,          // רק 0.5 חודשי מחיה
      pension_estimate: 'irregular', // הפרשה לא סדירה — לא ידוע כמה
      net_worth_approx: 220000,       // בעיקר נדל"ן
    },

    big_picture: {
      business_value_estimate: 350000, // EBITDA × 3 — דוד לא יודע שיש לו נכס כזה
      pension_for_self_employed_missing: true,
      last_tax_return: '2025',
      knows_his_profit: false,
    },

    financial_tier: {
      tier: 2,
      label: 'שרידות',
      reason: 'low_savings_rate_high_debt_no_clear_visibility',
      note: 'בפועל הוא יכול להיות Tier 3 — הבעיה היא ערפל, לא מצב',
    },

    triggerWords: ['עסק', 'ילדים', 'פנסיה', 'הלוואה', 'לפרוש'],
    dealBreakers: [
      'לא לשאול "כמה המסעדה מרוויחה" — הוא לא יודע בדיוק ומתבייש',
      'להציע "לסגור" או "למכור" — זה הזהות שלו',
      'ז׳רגון כלכלי — P/E, ETF, FIRE — כאילו מדברים עברית',
      'להגיד "אתה צריך רואה חשבון" — הוא יודע, לא רוצה לשמוע',
      'להתייחס לחוב כ"אסון" — הוא חי עם חוב 21 שנה',
    ],
    motivators: [
      '"כמה המסעדה שווה?" — לגלות שיש לו נכס של ₪350K שלא ידע',
      'פנסיה לעצמאי — "כמה אני מפסיד בכל שנה שאני לא מפריש?"',
      'להפריד חשבון עסקי מאישי — "כדי שתבין מה יש לך"',
      'נועם (17) נכנס לצבא — ₪2 שנה. הוצאות גדולות יורדות בקרוב.',
    ],

    ai_coaching_notes: [
      'שלב 0 לפני הכל: לבקש להפריד חשבון עסקי מאישי — זו לא הנחיה, זו הצלה',
      'ה-HOOK: "המסעדה שווה בערך ₪350K. יש לך נכס שלא ידעת." — זה הפותח',
      'חוב ₪90K × ריבית עסקית = ₪18K/שנה ריבית. להציג זאת כמספר ברור.',
      'פנסיה לעצמאי: מדמה ₪3K/חודש × 12 שנה עד 65 → בלי פנסיה יש לו רק ₪12K חיסכון',
      'כרטיס אשראי ₪22K → לחלק: עסקי vs. אישי. להתחיל לחסל את הפרטי.',
      'שפה: קצרה, ישירה, כמו שמדברים בשוק. ₪ ספציפי > אחוזים. "לחסוך ₪3K" > "20%"',
      'לא לדבר על "אופטימיזציה" עד שיש visibility. שלב 1 = לדעת מה יש.',
    ],
  },
};

export const davidPersonalTime = { hour: 14, minute: 33, second: 17, ms: 882 };

export const davidGameResults = {
  flappy: [
    { session: 1, score: 39, note: '"מה זה המשחק הזה?" — ניסה בין הזמנה לתשלום' },
    { session: 2, score: 54, note: 'שיחק עם נועם שלצידו. "הבן שלי גרם לי לנסות שוב"' },
    { session: 3, score: 71, note: 'מרוצה. "כמו כדורגל — צריך פוקוס"' },
  ],
  quiz: [
    { session: 1, score: 4, total: 10, missed: ['ETF', 'תשואה', 'מינוף', 'LTV', 'FIRE', 'קרן נאמנות'], note: 'ידע: ריבית, חיסכון, חוב, מדד — בסיסי מחיי יום-יום' },
    { session: 2, score: 5, total: 10, note: 'הוסיף ריבית דריבית. "כמו ריבית שלוקחים ממני בהלוואה"' },
    { session: 3, score: 6, total: 10, note: 'מתמיד. "בין ארוחות אני שם"' },
  ],
  budget: [
    { session: 1, score: 48, note: 'בלבל הוצאות עסקיות ואישיות בתרחיש. "אי אפשר להפריד"' },
    { session: 2, score: 59, note: 'שיפור קל. קיצץ "בילויים" — אין לו ממילא' },
    { session: 3, score: 67, note: 'הבין שמשלם יותר מדי בכרטיס אשראי. "אה, כן, נכון"' },
  ],
};
