// Ghost user persona: יוסף מזרחי
// Financial Tier 1 (ייצוב) — irregular income, credit debt, family loan, near-zero savings
// Used for UX testing, AI response calibration, and persona-driven QA sessions

function DAY_MS(n) { return n * 86_400_000; }
function HOUR_MS(h) { return h * 3_600_000; }
function MIN_MS(m)  { return m * 60_000; }

// Yosef registered 6 days ago (currently on day 7 — last onboarding question)
const DAYS_AGO = 6;
const reg = new Date('2026-04-19T20:15:00.000Z'); // registered ~23:15 IL time

export const ghostYosef = {
  id: 'ghost_yosef',
  name: 'יוסף מזרחי',
  phone: '052-3847291',
  email: 'yosef.mizrahi92@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 7,
  rank: 41,
  score: 61.4,
  avatar_level: 1,

  subscription: 'premium',

  // DOB: born 1 March 2002 → age 24
  dob: { dobD: '1', dobM: '3', dobY: '2002' },

  // VerMillion avatar — street/hacker archetype, electric blue
  vermillion: {
    name: 'REX · THE STREET',
    appearance: { body: 'lean', style: 'hacker', colors: 'electric_blue', energy: 'raw' },
    tone: { advice_style: 'direct', personality: 'coach', goal_focus: 'stability' },
  },

  // Days 1-7 answers, all answered late night (~23:30–23:55)
  dailyAnswers: {
    1: {
      family_status: 'single',
      children_count: '0',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + DAY_MS(0) + HOUR_MS(0) + MIN_MS(17)).toISOString(),
      // 23:32 on registration night
    },
    2: {
      employment_type: 'self_employed',
      work_hours_weekly: '60',
      top_hobby: 'friends',
      social_budget: 'high',
      _answeredAt: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(0) + MIN_MS(8)).toISOString(),
      // ~23:23 next night
    },
    3: {
      money_goal: 'stability',
      money_fear: 'debt',
      extra_money_action: 'save',
      _answeredAt: new Date(reg.getTime() + DAY_MS(2) + HOUR_MS(0) + MIN_MS(41)).toISOString(),
      // ~23:56
    },
    4: {
      net_income: '7500',
      side_income: '1500',
      num_earners: '1',
      _answeredAt: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(0) + MIN_MS(19)).toISOString(),
      // ~23:34
    },
    5: {
      housing_expense: '2200',
      fixed_expenses: '1800',
      variable_expenses: '3200',
      _answeredAt: new Date(reg.getTime() + DAY_MS(4) + HOUR_MS(0) + MIN_MS(26)).toISOString(),
      // ~23:41
    },
    6: {
      mortgage_balance: '0',
      loans_total: '8000',
      credit_debt: '12000',
      liquid_savings: '1200',
      investments: '0',
      real_estate_equity: '0',
      _answeredAt: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(0) + MIN_MS(33)).toISOString(),
      // ~23:48
    },
    7: {
      retirement_age: '67',
      financial_target: '500000',
      emergency_savings: '1200',
      _answeredAt: new Date(reg.getTime() + DAY_MS(6) + HOUR_MS(0) + MIN_MS(16)).toISOString(),
      // ~23:31 tonight
    },
  },

  profileSummary: null,
  answerTimestamps: {},

  // Ghost-only flags — never used in production app logic
  _ghost: true,
  _persona: {
    // --- Demographics ---
    age: 24,
    gender: 'male',
    marital_status: 'single',
    city: 'תל אביב',
    housing: 'שכירות עם 2 שותפים',

    // --- Income & Expenses ---
    income: {
      primary_min: 5000,
      primary_max: 11000,
      primary_avg: 7500,
      primary_type: 'irregular',         // market vendor — daily cash
      side_avg: 1500,
      side_type: 'weekend_moving_jobs',
      total_avg: 9000,
    },
    expenses: {
      housing: 2200,
      fixed: 1800,                       // phone, basic food, public transport
      variable: 3200,                    // social, clothing, eating out
      total_avg: 7200,
    },
    monthly_surplus_avg: 1800,           // on good months; negative on bad months

    // --- Assets & Debts ---
    savings: 1200,
    investments: 0,
    real_estate_equity: 0,
    emergency_fund_months: 0.17,         // CRITICAL — less than 1 week
    debts: {
      credit_card: 12000,
      family_loan: 8000,
      total: 20000,
    },
    debt_to_income_ratio: 2.67,          // total_debt / primary_avg — above 6× = severe

    // --- Financial Metrics ---
    savings_rate: -0.18,                 // -18% on bad months, ~+13% on good months
    financial_tier: 1,
    financial_tier_label: 'ייצוב',
    retirement_planned: false,

    // --- UX / Behavioral Profile ---
    tech_savvy: 'high',
    financial_literacy: 'low',
    app_skepticism: 'low',
    session_time: '23:30',              // after exhausting market + moving day
    reading_style: 'scan',             // very short attention span, tired
    preferred_message_length: 'short', // max 3 sentences per AI response
    trigger_words: ['חוב', 'מינוס', 'חסכון', 'להתחיל', 'כסף'],
    deal_breakers: [
      'too complex',
      'assumes stable income',
      'talks about investments before he has savings',
      'long text',
    ],
    motivators: [
      'getting out of minus',
      'first time feeling in control',
      'simple steps',
      'visible progress',
    ],

    // --- Persona Narrative ---
    background: [
      'גדל בדרום תל אביב, משפחה ממוצא תימני',
      'לא סיים תיכון — יצא לשוק הכרמל בגיל 17',
      'מוכר תבלינים וירקות, משתכר בין ₪250 ל-₪550 ביום',
      'עושה הובלות בסופי שבוע עם חבר — מזומן ישיר לכיס',
      'חי עם 2 שותפים בדירת 3 חדרים בפלורנטין',
      'אין לו חסכון, אין לו ביטוח, אין לו פנסיה',
      'הלוואה ממשפחה — מרגיש לחץ אישי, לא רק פיננסי',
      'מעולם לא פתח אפליקציית תקציב — אבל חיפש "איך לצאת מהמינוס" בגוגל השבוע',
    ],
    voice: 'ישיר, קצר, סלנג תל אביבי קל. לא מתלונן — רק רוצה להבין מה עושים.',
    ai_coaching_notes: [
      'לא להזכיר השקעות בשלב ייצוב — מרגיש לא רלוונטי',
      'לדבר על המזומן היומי שמגיע מהשוק — זה העולם שלו',
      'להדגיש ניצחונות קטנים: ₪200 שנחסכו = הצלחה',
      'לא להשתמש במונחים: "תיק השקעות", "קרן נאמנות", "תשואה"',
      'לשאול שאלה אחת בסוף — לא יותר',
      'מקסימום 3 משפטים לתגובה — הוא גולל מהיר בלילה',
    ],
  },
};

// Exact clock moment Yosef typically opens the app
// Used for time-of-day UX experiments and AI prompt personalization
export const yosefPersonalTime = {
  hour: 23,
  minute: 31,
  second: 8,
  ms: 445,
};

// Mini-game performance history (3 sessions each)
// flappy: excellent — high reflexes, used to fast physical work
// quiz:   struggles — low financial literacy baseline
// budget: moderate — understands money intuitively but no formal framework
export const yosefGameResults = {
  flappy: [
    { session: 1, score: 312, pipes_cleared: 18, lives_used: 1, date: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(0) + MIN_MS(45)).toISOString() },
    { session: 2, score: 487, pipes_cleared: 27, lives_used: 1, date: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(0) + MIN_MS(52)).toISOString() },
    { session: 3, score: 561, pipes_cleared: 31, lives_used: 0, date: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(0) + MIN_MS(38)).toISOString() },
  ],
  quiz: [
    {
      session: 1,
      score: 3,
      total_questions: 10,
      correct: 3,
      wrong: 7,
      hardest_miss: 'מהי ריבית דריבית?',
      date: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(1) + MIN_MS(2)).toISOString(),
    },
    {
      session: 2,
      score: 4,
      total_questions: 10,
      correct: 4,
      wrong: 6,
      hardest_miss: 'מה זה קרן חירום?',
      date: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(1) + MIN_MS(9)).toISOString(),
    },
    {
      session: 3,
      score: 5,
      total_questions: 10,
      correct: 5,
      wrong: 5,
      hardest_miss: 'מה ההבדל בין נכס להתחייבות?',
      date: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(1) + MIN_MS(4)).toISOString(),
    },
  ],
  budget: [
    {
      session: 1,
      score: 620,
      decisions_correct: 7,
      decisions_wrong: 3,
      hardest_decision: 'האם לשלם חוב או לחסוך קרן חירום קודם?',
      date: new Date(reg.getTime() + DAY_MS(2) + HOUR_MS(0) + MIN_MS(55)).toISOString(),
    },
    {
      session: 2,
      score: 710,
      decisions_correct: 8,
      decisions_wrong: 2,
      hardest_decision: 'ניהול חודש עם הכנסה נמוכה במיוחד (₪5,000)',
      date: new Date(reg.getTime() + DAY_MS(4) + HOUR_MS(0) + MIN_MS(47)).toISOString(),
    },
    {
      session: 3,
      score: 755,
      decisions_correct: 9,
      decisions_wrong: 1,
      hardest_decision: 'האם להחזיר לאבא או לפתוח חיסכון?',
      date: new Date(reg.getTime() + DAY_MS(6) + HOUR_MS(0) + MIN_MS(42)).toISOString(),
    },
  ],
};
