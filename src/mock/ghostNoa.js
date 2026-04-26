// Ghost user persona: נועה ברק
// Purpose: simulate a 27-year-old medical student with LOW financial awareness.
// Key trait: she doesn't really know her numbers — days 4-6 answers are incomplete/estimated.
// Use for: QA, AI prompt testing, UX walkthroughs, onboarding flow demos.

// ─── Registration anchor ───────────────────────────────────────────────────
// Noa registered 6 days ago, meaning today is her Day 7 (last onboarding day).
// Adjust GHOST_DAYS_AGO below to simulate other phases.
const GHOST_DAYS_AGO = 6;

const _reg = new Date();
_reg.setDate(_reg.getDate() - GHOST_DAYS_AGO);
_reg.setHours(7, 4, 18, 92); // 07:04:18.092 — before hospital shift

function _dayMs(n) { return n * 86_400_000; }
function _hourMs(h) { return h * 3_600_000; }
function _minMs(m)  { return m * 60_000; }

// ─── Main ghost user object ────────────────────────────────────────────────
export const ghostNoa = {
  id: 'ghost_noa',
  name: 'נועה ברק',
  phone: '052-0000000',
  email: 'noa.barak.ghost@example.com',
  registrationDate: _reg.toISOString(),

  streak: 6,
  rank: 47,
  score: 61.4,
  avatar_level: 1,

  subscription: 'premium',

  // Age 27 — born ~1998
  dob: { dobD: '12', dobM: '8', dobY: '1998' },

  // VerMillion avatar — minimal, hopeful, at the very start of a journey
  vermillion: {
    name: 'NOVA · THE BEGINNING',
    appearance: { body: 'slim', style: 'minimal', colors: 'white/electric', energy: 'curious' },
    tone: { advice_style: 'nurturing', personality: 'educational', goal_focus: 'foundation' },
  },

  // ─── Daily answers ────────────────────────────────────────────────────────
  // Days 1-3: lifestyle — Noa is self-aware here, answers are clear and confident.
  // Days 4-6: financial — LOW awareness, she estimates or skips; numbers are incomplete.
  //   Day 4: she reports her stipend only (forgets parent transfers).
  //   Day 5: housing + fixed OK, but variable is a rough guess.
  //   Day 6: savings are tiny, everything else is 0 — she genuinely doesn't know more.
  // Day 7: future goals — optimistic but vague (she pictures a doctor salary).
  dailyAnswers: {
    1: {
      family_status: 'single',
      children_count: '0',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(_reg.getTime() + _dayMs(0) + _hourMs(7) + _minMs(5)).toISOString(),
    },
    2: {
      employment_type: 'student',
      work_hours_weekly: '70',
      top_hobby: 'reading',
      social_budget: 'low',
      _answeredAt: new Date(_reg.getTime() + _dayMs(1) + _hourMs(7) + _minMs(8)).toISOString(),
    },
    3: {
      money_goal: 'independence',
      money_fear: 'not_enough',
      extra_money_action: 'save',
      _answeredAt: new Date(_reg.getTime() + _dayMs(2) + _hourMs(7) + _minMs(12)).toISOString(),
    },

    // Day 4 — INCOMPLETE: she enters her stipend (₪3,200) but forgets the ₪1,800 parents transfer.
    // No side income — she has no time for gigs.
    // num_earners is '1' because she counts only herself; the parental support is invisible to her.
    4: {
      net_income: '3200',
      side_income: '0',
      num_earners: '1',
      _answeredAt: new Date(_reg.getTime() + _dayMs(3) + _hourMs(7) + _minMs(9)).toISOString(),
      _incomplete: true,
      _note: 'הכנסה ממשית ₪5,000 (כולל הורים ₪1,800) — נועה שכחה לכלול תמיכת הורים',
    },

    // Day 5 — ESTIMATED: rent & phone known precisely; variable expenses are a rough guess.
    // She rounds ₪2,400 for "everything else" without itemising.
    5: {
      housing_expense: '1400',
      fixed_expenses: '800',
      variable_expenses: '2400',
      _answeredAt: new Date(_reg.getTime() + _dayMs(4) + _hourMs(7) + _minMs(14)).toISOString(),
      _incomplete: true,
      _note: 'הוצאות משתנות הן הערכה גסה — נועה לא עוקבת אחרי הוצאות',
    },

    // Day 6 — INCOMPLETE: debts are genuinely 0 (parents helped).
    // liquid_savings = ₪800 is accurate — basically one month's rent.
    // She doesn't track investments because she has none.
    // Emergency fund = 0.16 months (₪800 / ₪5,000) — she doesn't know this term.
    6: {
      mortgage_balance: '0',
      loans_total: '0',
      credit_debt: '0',
      liquid_savings: '800',
      investments: '0',
      real_estate_equity: '0',
      _answeredAt: new Date(_reg.getTime() + _dayMs(5) + _hourMs(7) + _minMs(11)).toISOString(),
      _incomplete: true,
      _note: 'חיסכון ₪800 בלבד — פחות מחודשיים מחיה. אין השקעות, אין חובות.',
    },

    // Day 7 — OPTIMISTIC: she is thinking about her doctor future, not today.
    // ₪4,000,000 target = a nice apartment + financial security; she doesn't know if realistic.
    // retirement_age: 65 is a default answer — she has never thought about it.
    7: {
      retirement_age: '65',
      financial_target: '4000000',
      emergency_savings: '800',
      _answeredAt: new Date(_reg.getTime() + _dayMs(6) + _hourMs(7) + _minMs(16)).toISOString(),
    },
  },

  // AI-generated profile (Day 8 reveal — not yet generated)
  profileSummary: null,

  // ─── Computed financial snapshot ──────────────────────────────────────────
  // These reflect REAL numbers (including parental support) for backend/AI use.
  // The dailyAnswers above reflect what she *reported* (lower, less accurate).
  _financials: {
    incomeStipend:      3200,
    incomeParents:      1800,
    incomeSide:         0,
    incomeTotal:        5000,    // effective monthly income
    housingExpense:     1400,
    fixedExpenses:      800,
    variableExpenses:   2400,
    totalExpenses:      4600,
    monthlySurplus:     400,     // only ₪400 left after everything
    liquidSavings:      800,
    investments:        0,
    debtTotal:          0,
    emergencyFundMonths: 0.16,   // 800 / 5000
    savingsRate:        0.08,    // 8% — only possible because parents absorb some costs
    financialTier:      0,       // עיוור — she reported incomplete numbers, completion < 40%
  },

  answerTimestamps: {
    1: new Date(_reg.getTime() + _dayMs(0) + _hourMs(7) + _minMs(5)).toISOString(),
    2: new Date(_reg.getTime() + _dayMs(1) + _hourMs(7) + _minMs(8)).toISOString(),
    3: new Date(_reg.getTime() + _dayMs(2) + _hourMs(7) + _minMs(12)).toISOString(),
    4: new Date(_reg.getTime() + _dayMs(3) + _hourMs(7) + _minMs(9)).toISOString(),
    5: new Date(_reg.getTime() + _dayMs(4) + _hourMs(7) + _minMs(14)).toISOString(),
    6: new Date(_reg.getTime() + _dayMs(5) + _hourMs(7) + _minMs(11)).toISOString(),
    7: new Date(_reg.getTime() + _dayMs(6) + _hourMs(7) + _minMs(16)).toISOString(),
  },

  // Ghost marker — never show in real UI
  _ghost: true,

  // ─── Persona metadata ─────────────────────────────────────────────────────
  _persona: {
    age:          27,
    status:       'single',
    occupation:   'medical_student_year5_internship',
    city:         'jerusalem',
    housing:      'student_dorm_cheap_rental',

    techSavvy:         'high',
    financialLiteracy: 'very_low',
    appSkepticism:     'low',

    sessionTime: '07:00',
    readingStyle: 'careful',   // studious — reads every word

    triggerWords:  ['עצמאות', 'עתיד', 'רופאה', 'שכר', 'דירה'],

    dealBreakers: [
      'assumes she has disposable income',
      'talks about debt she does not have',
      'overwhelms with complexity before basics',
    ],

    motivators: [
      'first time taking control of her own money',
      'doctor salary in 2 years (₪25K+)',
      'building a solid financial foundation now',
      'independence from parents',
    ],

    // What she brings: discipline (med school), curiosity, zero bad habits yet.
    // What she lacks: any financial vocabulary or tracking habit.
    strengths:   ['discipline', 'curiosity', 'debt_free_start', 'high_income_trajectory'],
    weaknesses:  ['no_financial_vocabulary', 'no_tracking_habit', 'income_underreported', 'tiny_safety_net'],

    coachingNotes: [
      'Start with definitions — do not assume she knows terms like "emergency fund" or "savings rate".',
      'Celebrate: zero debt is rare and valuable.',
      'Anchor to her near future: in 2 years income jumps 5×. Build habits now.',
      'Do NOT suggest investments yet — Tier 0 → build emergency fund first.',
      'She underreported income (forgot parents). Gently surface the real ₪5,000 figure.',
    ],
  },
};

// ─── Personal clock ────────────────────────────────────────────────────────
// Noa opens the app at 07:04 sharp, before her hospital shift starts.
export const noaPersonalTime = {
  hour:   7,
  minute: 4,
  second: 18,
  ms:     92,
};

// ─── Game results ──────────────────────────────────────────────────────────
// flappy: excellent — quick reflexes from years of on-call hospital alertness.
// quiz:   very poor — zero financial vocabulary; guesses most answers.
// budget: perfect — she is naturally frugal out of necessity.

export const noaGameResults = {
  flappy: [
    { sessionId: 'noa_flappy_1', score: 74,  duration_s: 38, date: new Date(_reg.getTime() + _dayMs(0) + _hourMs(7) + _minMs(20)).toISOString() },
    { sessionId: 'noa_flappy_2', score: 91,  duration_s: 55, date: new Date(_reg.getTime() + _dayMs(1) + _hourMs(7) + _minMs(18)).toISOString() },
    { sessionId: 'noa_flappy_3', score: 103, duration_s: 61, date: new Date(_reg.getTime() + _dayMs(2) + _hourMs(7) + _minMs(22)).toISOString() },
    { sessionId: 'noa_flappy_4', score: 118, duration_s: 68, date: new Date(_reg.getTime() + _dayMs(3) + _hourMs(7) + _minMs(17)).toISOString() },
  ],

  quiz: [
    // Doesn't know financial terms — guesses randomly, 2/10 most rounds.
    { sessionId: 'noa_quiz_1', correct: 2, total: 10, score_pct: 20, date: new Date(_reg.getTime() + _dayMs(1) + _hourMs(7) + _minMs(25)).toISOString(), failedTerms: ['ריבית דריבית', 'תשואה', 'קרן פנסיה', 'דיבידנד', 'ETF', 'מדד', 'נזילות', 'ריבית פריים'] },
    { sessionId: 'noa_quiz_2', correct: 3, total: 10, score_pct: 30, date: new Date(_reg.getTime() + _dayMs(3) + _hourMs(7) + _minMs(27)).toISOString(), failedTerms: ['תשואה', 'קרן פנסיה', 'ETF', 'מדד S&P500', 'הון עצמי', 'מינוף', 'אג"ח'] },
    { sessionId: 'noa_quiz_3', correct: 3, total: 10, score_pct: 30, date: new Date(_reg.getTime() + _dayMs(5) + _hourMs(7) + _minMs(21)).toISOString(), failedTerms: ['ריבית דריבית', 'קרן חירום', 'הלוואת בלון', 'פיקדון', 'מט"ח', 'מגן מס', 'נכס'] },
  ],

  budget: [
    // Perfect — every challenge she nails because she lives lean by default.
    { sessionId: 'noa_budget_1', result: 'perfect', score_pct: 100, surplus: 400,  date: new Date(_reg.getTime() + _dayMs(2) + _hourMs(7) + _minMs(19)).toISOString() },
    { sessionId: 'noa_budget_2', result: 'perfect', score_pct: 100, surplus: 400,  date: new Date(_reg.getTime() + _dayMs(4) + _hourMs(7) + _minMs(16)).toISOString() },
    { sessionId: 'noa_budget_3', result: 'perfect', score_pct: 100, surplus: 400,  date: new Date(_reg.getTime() + _dayMs(6) + _hourMs(7) + _minMs(18)).toISOString() },
  ],
};
