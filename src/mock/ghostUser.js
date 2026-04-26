/**
 * GHOST USER — "אביב כהן"
 * Simulated persona for UX critique and QA testing.
 * This user is transparent — lives in dev only, deleted before production.
 *
 * PERSONA BRIEF:
 *   31 y/o backend developer at a Series-A startup in Tel Aviv.
 *   Married to Noa (part-time graphic designer). Toddler (age 2).
 *   Smart, analytical, impatient with fluff. Wants data over motivation.
 *   Tried budgeting apps before — they didn't stick. Skeptical but curious.
 *   Opens the app at 10:30pm after the kid sleeps.
 *   Hebrew is native. Reads fast, skips long text.
 *   Financial tier: borderline Tier 2 → Tier 3.
 *   Core fear: startup folds, no safety net.
 *   Core goal: apartment in 5 years + stop the month-end panic.
 */

const GHOST_REG = new Date('2026-04-18T09:00:00');
function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }

export const ghostUser = {
  id: 'ghost_aviv',
  name: 'אביב כהן',
  phone: '052-7733441',
  email: 'aviv.cohen.dev@gmail.com',
  registrationDate: GHOST_REG.toISOString(),
  subscription: 'premium',
  streak: 7,
  rank: 12,
  score: 81.4,
  avatar_level: 1,

  dob: { dobD: '14', dobM: '7', dobY: '1994' }, // age 31

  vermillion: {
    name: 'KOVA · THE EDGE',
    appearance: { body: 'lean', style: 'hacker', colors: 'electric', energy: 'sharp' },
    tone: { advice_style: 'direct', personality: 'analyst', goal_focus: 'money' },
  },

  // ── Lifestyle days 1–3 ──
  // Day 1: family + housing
  // Day 2: work + lifestyle
  // Day 3: money psychology
  // ── Financial days 4–7 ──
  // Day 4: income
  // Day 5: expenses
  // Day 6: debts + savings
  // Day 7: goals + timeline
  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '1',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(GHOST_REG.getTime() + D(0) + H(22) + 30 * 60000).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '50',
      top_hobby: 'tech',
      social_budget: 'low',
      _answeredAt: new Date(GHOST_REG.getTime() + D(1) + H(22) + 45 * 60000).toISOString(),
    },
    3: {
      money_goal: 'apartment',
      money_fear: 'job_loss',
      extra_money_action: 'invest',
      _answeredAt: new Date(GHOST_REG.getTime() + D(2) + H(23) + 10 * 60000).toISOString(),
    },
    4: {
      net_income: '16500',
      side_income: '1500',
      num_earners: '1',
      _answeredAt: new Date(GHOST_REG.getTime() + D(3) + H(22) + 55 * 60000).toISOString(),
    },
    5: {
      housing_expense: '5800',
      fixed_expenses: '3200', // car + insurance + daycare ₪3,200
      variable_expenses: '4100', // food + clothing + misc
      _answeredAt: new Date(GHOST_REG.getTime() + D(4) + H(23) + 5 * 60000).toISOString(),
    },
    6: {
      mortgage_balance: '0',
      loans_total: '38000',   // car loan
      credit_debt: '7500',
      liquid_savings: '8000',
      investments: '0',
      real_estate_equity: '0',
      pension_monthly: '1200',
      _answeredAt: new Date(GHOST_REG.getTime() + D(5) + H(23) + 20 * 60000).toISOString(),
    },
    7: {
      retirement_age: '60',
      financial_target: '3000000',
      emergency_savings: '8000',
      _answeredAt: new Date(GHOST_REG.getTime() + D(6) + H(22) + 40 * 60000).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},

  // ── Ghost-only metadata (not in real user schema) ──
  _ghost: true,
  _persona: {
    age: 31,
    occupation: 'Backend Developer @ Startup',
    city: 'תל אביב',
    familySituation: 'נשוי + ילד בן 2',
    techSavvy: 'high',
    financialLiteracy: 'medium',
    appSkepticism: 'high',        // has tried and abandoned apps before
    sessionTime: '22:30-23:00',   // opens app after kid sleeps
    readingStyle: 'scan',         // skips long text, reads bullets
    triggerWords: ['גירעון', 'דירה', 'פיטורים', 'ריבית', 'חיסכון'],
    dealBreakers: [
      'תוכן גנרי שלא מתייחס לנתונים שלו',
      'עיצוב שמרגיש כמו gamification זול',
      'AI שלא מכיר אותו אחרי שאלון שלם',
      'טעינה איטית בלילה',
    ],
    motivators: [
      'מספרים אמיתיים מחייו',
      'תחושת התקדמות ברורה',
      'תחרותיות עם אחרים בלוח הדירוג',
      'תובנות שהוא לא ידע על עצמו',
    ],
    financialProfile: {
      // Computed from dailyAnswers above
      totalIncome: 18000,        // 16500 + 1500
      totalExpenses: 13100,      // 5800 + 3200 + 4100
      monthlySurplus: 4900,
      savingsRate: 27,           // 4900/18000 — actually decent but feels wrong
      totalDebt: 45500,          // 38000 + 7500
      debtToIncome: 2.5,         // months to pay off at current surplus
      monthsEmergency: 0.6,      // 8000 / 13100 — critical gap
      liquidSavings: 8000,
      investments: 0,
      financialTarget: 3000000,
      retirementAge: 60,
      yearsLeft: 29,
      tier: 3,                   // savingsRate 27% → Tier 3: בנייה
      tierLabel: 'בנייה',
    },
  },
};

/**
 * The ghost user's personal time for the stamping challenge.
 * Set to a specific moment to make scoring interesting.
 */
export const ghostPersonalTime = {
  hour: 22,
  minute: 33,
  second: 41,
  ms: 207,
};

/**
 * Simulated game results for the ghost user.
 * Used to generate realistic critique of each game.
 */
export const ghostGameResults = {
  flappy: [
    { attempt: 1, score: 12, died_at_obstacle: 3, reaction: 'קשה מדי, לא הבנתי את הפיזיקה' },
    { attempt: 2, score: 31, died_at_obstacle: 7, reaction: 'אוקיי עכשיו הבנתי' },
    { attempt: 3, score: 58, died_at_obstacle: 14, reaction: 'יש כאן משהו ממכר' },
  ],
  quiz: [
    { q: 'מה כלל ה-4%?', answered: 'correct', time_ms: 4200, reaction: 'ידעתי' },
    { q: 'מה זה LTV?', answered: 'correct', time_ms: 2800, reaction: 'מושג בסיסי' },
    { q: 'מה מינימום קרן חירום?', answered: 'wrong', time_ms: 8100, reaction: 'חשבתי 2 חודשים, לא 3' },
    { q: 'ריבית דריבית — מחשב', answered: 'correct', time_ms: 12000, reaction: 'לקח לי זמן לחשב' },
  ],
  budget: [
    { card: 'נטפליקס ₪60', swipe: 'cut', correct: true, reaction: 'ברור' },
    { card: 'ביטוח חיים ₪220', swipe: 'keep', correct: true, reaction: 'חייב' },
    { card: 'מנוי ספורטיף ₪79', swipe: 'keep', correct: false, reaction: 'חשבתי שזה שווה' },
    { card: 'קפה בוקר יומי ₪28', swipe: 'keep', correct: false, reaction: 'לא ויתור על זה' },
    { card: 'ביטוח רכב ₪480', swipe: 'keep', correct: true, reaction: 'אין ברירה' },
  ],
};
