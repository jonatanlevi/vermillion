// Ghost user: עומר גולן — Tier 2 (שרידות) — LIFESTYLE INFLATION TRAP
// 44, Product Manager @ BigTech, גרוש שנה. מרוויח ₪36K — חוסך ₪1,300.
// Covers: high-earner paradox, post-divorce reset, lifestyle creep, no shame coaching.

function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

const reg = new Date('2026-04-18T08:45:00.000Z'); // לפני פגישה ראשונה

export const ghostOmer = {
  id: 'ghost_omer',
  name: 'עומר גולן',
  phone: '052-9918374',
  email: 'omer.golan.pm@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 5,
  rank: 33,
  score: 58.9,
  avatar_level: 1,
  subscription: 'premium',

  dob: { dobD: '22', dobM: '5', dobY: '1981' }, // age 44

  vermillion: {
    name: 'FLUX · THE RESET',
    appearance: { body: 'athletic', style: 'urban', colors: 'indigo', energy: 'restless' },
    tone: { advice_style: 'direct', personality: 'challenger', goal_focus: 'discipline' },
  },

  dailyAnswers: {
    1: {
      family_status: 'divorced',
      children_count: '0',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + D(0) + H(0) + M(12)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '55',
      top_hobby: 'travel',
      social_budget: 'high',
      _answeredAt: new Date(reg.getTime() + D(1) + H(0) + M(8)).toISOString(),
    },
    3: {
      money_goal: 'apartment',
      money_fear: 'missing_out',
      extra_money_action: 'spend_enjoy',
      _answeredAt: new Date(reg.getTime() + D(2) + H(0) + M(5)).toISOString(),
    },
    4: {
      net_income: '36000',
      side_income: '0',
      num_earners: '1',
      _answeredAt: new Date(reg.getTime() + D(3) + H(0) + M(7)).toISOString(),
    },
    5: {
      housing_expense: '9500',   // דירה לבד בת"א — יכול להרשות אבל לא חייב
      fixed_expenses: '8200',    // ליסינג רכב, ביטוחים, חדר כושר, מנויים ₪800
      variable_expenses: '17000', // מסעדות, נסיעות, קניות, חיי לילה, מתנות
      _answeredAt: new Date(reg.getTime() + D(4) + H(0) + M(11)).toISOString(),
    },
    6: {
      mortgage_balance: '0',
      loans_total: '0',
      credit_debt: '0',
      liquid_savings: '45000',
      investments: '180000',      // מה שנשאר אחרי גירושין (היה ₪360K)
      real_estate_equity: '0',
      pension_monthly: '7800',    // גבוה — הפריש 15 שנה
      _answeredAt: new Date(reg.getTime() + D(5) + H(0) + M(9)).toISOString(),
    },
    7: {
      retirement_age: '60',
      financial_target: '8000000',
      emergency_savings: '45000',
      _answeredAt: new Date(reg.getTime() + D(6) + H(0) + M(14)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},
  _ghost: true,

  _persona: {
    age: 44,
    occupation: 'Senior Product Manager @ BigTech (NASDAQ)',
    city: 'תל אביב',
    familySituation: 'גרוש (שנה), אין ילדים, גר לבד בדירת 3 חד׳ ברמת אביב',
    techSavvy: 'very_high',
    financialLiteracy: 'medium',  // יודע מושגים, לא מיישם
    appSkepticism: 'low',          // מאמין בכלים, אוהב products טובים
    sessionTime: '08:45',          // לפני standup
    readingStyle: 'scan',          // PM — רגיל ל-TL;DR

    cash_flow: {
      net_income: 36000,
      housing: 9500,
      fixed: 8200,
      variable: 17000,
      total_expenses: 34700,
      monthly_surplus: 1300,
      savings_rate: 3.6,          // Tier 2 — הלם לו לגלות
    },

    balance_sheet: {
      liquid_savings: 45000,       // רק 1.3 חודשי מחיה
      investments: 180000,         // ירד מ-₪360K בגירושין
      pension_value_estimated: 680000, // ~15 שנות הפרשה
      total_assets: 905000,
      total_debt: 0,
      net_worth: 905000,
    },

    divorce_impact: {
      assets_before: 1850000,      // דירה + השקעות
      assets_lost_divorce: 945000, // 50/50 פלוס עו"ד
      emotional_context: 'מנסה "לפצות" על עצמו אחרי גירושין — "מגיע לי"',
    },

    spending_breakdown: {
      restaurants_month: 4500,
      travel_year: 36000,       // 3 טיסות גדולות / שנה
      clothing_month: 1500,
      subscriptions: 800,       // Spotify, Netflix, NYT, ChatGPT+, gym, Apple One...
      car_lease: 3200,          // פורשה קיין — "החלפתי אחרי הגירושין"
    },

    financial_tier: { tier: 2, label: 'שרידות', reason: 'savings_rate_3.6pct_despite_high_income' },

    triggerWords: ['דירה', 'גירושין', 'חיסכון', 'פרישה', 'lifestyle'],
    dealBreakers: [
      'שיפוטיות על ההוצאות — הוא יודע שהוא מוציא הרבה',
      'להגיד לו "תוריד רמת חיים" בלי אלטרנטיבה ספציפית',
      'להשוות אותו לאנשים עם ילדים/משכנתא — מצבו שונה',
      'עצה גנרית כמו "חסוך 20%" בלי פירוט איך',
    ],
    motivators: [
      'להבין שבגיל 44 עם ₪0 משכנתא — יש לו הזדמנות ייחודית',
      'הלם: "אני מרוויח ₪36K וחוסך ₪1,300?" — להפוך את זה למנוף',
      'דירה בת"א = ₪4M → צריך ₪1M הון עצמי → 10 שנות חיסכון ב-₪8K/חודש',
      'פנסיה טובה = נכס — AI ידגיש שיש לו בסיס חזק',
    ],

    ai_coaching_notes: [
      'אל תבייש — הוא PM, הוא מבין data. תן לו את המספרים עצמם.',
      'הצג את ה-GAP הספציפי: ₪34,700 הוצאות על ₪36,000 הכנסה — זה ה-hook',
      'מלכודת Lifestyle Inflation: post-divorce spending כ"פיצוי" — לזהות, לא לשפוט',
      'יש לו פנסיה חזקה (₪680K estimated) — זה נכס שלרוב לא מחשבים',
      'מטרת דירה: ₪4M, 25% הון עצמי = ₪1M → אם יחסוך ₪8K/חודש → 10.4 שנים',
      'קיצוץ כירורגי, לא גורף: ליסינג → רכב פחות יקר = ₪1,500/חודש. מסעדות → ₪2,500 → חוסך ₪2,000.',
      'Tier 2 → Tier 3 מהיר אפשרי: הכנסה גבוהה = leverage גדול לשינוי',
    ],
  },
};

export const omerPersonalTime = { hour: 8, minute: 47, second: 22, ms: 551 };

export const omerGameResults = {
  flappy: [
    { session: 1, score: 134, note: 'מיידי — PM reflexes חזקים' },
    { session: 2, score: 178, note: 'גייימר — לומד מהר, ממוקד' },
    { session: 3, score: 201, note: 'מנסה לשבור שיא — תחרותי' },
  ],
  quiz: [
    { session: 1, score: 7, total: 10, missed: ['מה זה יחס P/E?', 'איך מחשבים LTV?', 'כלל ה-4%?'], note: 'יודע מושגים בסיסיים, נפל על פרטים' },
    { session: 2, score: 8, total: 10, missed: ['כלל ה-4%?', 'חוק ה-72?'], note: 'שיפור — גגל בין סשנים' },
    { session: 3, score: 9, total: 10, missed: ['הסבר מדוייק על ביטוח מנהלים'], note: 'כמעט מושלם' },
  ],
  budget: [
    { session: 1, score: 44, note: 'נפל — לא היה מוכן לקצץ בליסינג. "אני צריך רכב טוב"' },
    { session: 2, score: 61, note: 'קיצץ מנויים, מסעדות קצת. עדיין מתנגד לרכב' },
    { session: 3, score: 73, note: 'הסכים להוריד מסעדות ב-50%. לא נגע ברכב' },
  ],
};
