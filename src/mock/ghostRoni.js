// Ghost user persona: רוני שפירא
// Freelance graphic designer, divorced, Haifa. Tier 2 (שרידות).
// Used for UX testing, AI prompt calibration, and demo scenarios.
// _ghost: true — never shown in real leaderboard or production data.

function DAY_MS(n) { return n * 86_400_000; }
function HOUR_MS(h) { return h * 3_600_000; }
function MIN_MS(m)  { return m * 60_000; }

// Roni registered 6 days ago (currently on day 7 — last questionnaire day).
// Session peak: 14:00 — midday break when kids are at school / other parent.
const DAYS_AGO = 6;
const reg = new Date('2026-04-19T14:12:33.112Z'); // anchored registration time

export const ghostRoni = {
  id: 'ghost_roni',
  name: 'רוני שפירא',
  phone: '052-3941870',
  email: 'roni.shapira.design@gmail.com',
  registrationDate: reg.toISOString(),

  streak: 6,
  rank: 47,
  score: 61.4,
  avatar_level: 1,

  subscription: 'premium',

  // Age 35, born April 1991
  dob: { dobD: '4', dobM: '4', dobY: '1991' },

  vermillion: {
    name: 'DUNE · THE RESILIENT',
    appearance: { body: 'average', style: 'rugged', colors: 'amber', energy: 'survivor' },
    tone: { advice_style: 'compassionate', personality: 'direct', goal_focus: 'stability' },
  },

  // dailyAnswers — days 1-7, all answered around 14:00–14:30
  dailyAnswers: {
    1: {
      family_status:   'divorced',
      children_count:  '2',
      housing_type:    'renting',
      city_type:       'north',
      _answeredAt: new Date(reg.getTime() + DAY_MS(0) + HOUR_MS(0) + MIN_MS(0)).toISOString(),
      // reg itself is 14:12 — day 1 answer at registration moment
    },
    2: {
      employment_type:     'freelance',
      work_hours_weekly:   '45',
      top_hobby:           'art',
      social_budget:       'low',
      _answeredAt: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(0) + MIN_MS(7)).toISOString(),
    },
    3: {
      money_goal:          'stability',
      money_fear:          'not_enough',
      extra_money_action:  'save',
      _answeredAt: new Date(reg.getTime() + DAY_MS(2) + HOUR_MS(0) + MIN_MS(15)).toISOString(),
    },
    4: {
      net_income:    '6800',
      side_income:   '0',
      num_earners:   '1',
      _answeredAt: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(0) + MIN_MS(4)).toISOString(),
    },
    5: {
      housing_expense:    '3400',
      fixed_expenses:     '8300',
      variable_expenses:  '2100',
      _answeredAt: new Date(reg.getTime() + DAY_MS(4) + HOUR_MS(0) + MIN_MS(18)).toISOString(),
    },
    6: {
      mortgage_balance:    '0',
      loans_total:         '45000',
      credit_debt:         '0',
      liquid_savings:      '4500',
      investments:         '0',
      real_estate_equity:  '0',
      _answeredAt: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(0) + MIN_MS(11)).toISOString(),
    },
    7: {
      retirement_age:       '67',
      financial_target:     '1500000',
      emergency_savings:    '4500',
      _answeredAt: new Date(reg.getTime() + DAY_MS(6) + HOUR_MS(0) + MIN_MS(22)).toISOString(),
    },
  },

  profileSummary: null,
  answerTimestamps: {},

  // --- Ghost-only fields ---
  _ghost: true,

  _persona: {
    // Demographics
    age: 35,
    city: 'חיפה',
    family_status: 'divorced',
    children: {
      count: 2,
      custody: 'shared_alternating_weeks',
      alimony_monthly: 3500,
      child_support_monthly: 2800,
    },

    // Employment
    employment: {
      type: 'freelance',
      profession: 'מעצב גרפי עצמאי',
      income_pattern: 'highly_irregular',
      income_good_month: 9000,
      income_bad_month: 4500,
      income_average: 6800,
      side_income: 0,
      work_hours_weekly: 45,
    },

    // Monthly cash flow (average month at ₪6,800 net)
    cash_flow: {
      net_income_avg: 6800,
      mandatory_fixed: {
        alimony: 3500,
        child_support: 2800,
        car_payment: 1200,
        insurance: 800,
        total: 8300,
      },
      housing: 3400,
      variable: 2100,         // food, basics, very frugal
      total_outflow_avg: 13800,
      monthly_deficit_avg: -7000,
      savings_rate: -0.22,    // -22% — chronic deficit on average month
    },

    // Balance sheet
    balance_sheet: {
      liquid_savings: 4500,
      investments: 0,
      real_estate_equity: 0,
      total_assets: 4500,
      debt_personal_loan_divorce: 45000,  // divorce legal fees + personal loan
      credit_debt: 0,
      total_liabilities: 45000,
      net_worth: -40500,
      emergency_fund_months: 0.3,
    },

    // Financial tier classification
    financial_tier: {
      tier: 2,
      label: 'שרידות',
      reason: 'savings_rate_below_5_percent_and_chronic_deficit',
    },

    // Behavioral / UX profile
    ux: {
      tech_savvy: 'medium',
      financial_literacy: 'medium',
      app_skepticism: 'high',
      skepticism_note: 'ניסה אפליקציות וטיפול — "שום דבר לא עוזר"',
      reading_style: 'careful',
      reading_note: 'יש לו זמן, בדידות, מחפש חיבור אנושי',
      session_peak_hour: 14,
      session_peak_note: 'הפסקת צהריים כשהילדים לא איתו',
    },

    // Content sensitivity
    trigger_words: ['גירושין', 'מזונות', 'חוב', 'הכנסה לא יציבה', 'ילדים'],
    deal_breakers: [
      'advice that assumes stable income',
      'assumes two-parent household',
      'ignores mandatory alimony payments',
      'judgy tone about divorce',
    ],
    motivators: [
      'stability for the kids',
      'getting out of the hole',
      'feeling less alone with the numbers',
      'any positive momentum',
    ],

    // AI coaching calibration notes
    ai_notes: [
      'Never suggest cutting alimony/child support — legally mandatory and emotionally non-negotiable',
      'Always frame advice around irregular income (range, not fixed number)',
      'Acknowledge the divorce context without dwelling — he knows why he is here',
      'Celebrate micro-wins; deficit is structural, not a character flaw',
      'Tier 2 rules apply: no investment advice, focus on debt triage and cash-flow buffer',
      'Build toward Tier 3 by reducing debt exposure and smoothing income volatility',
    ],
  },
};

// Precise session timestamp for deterministic test runs
export const roniPersonalTime = {
  hour:   14,
  minute: 12,
  second: 33,
  ms:     112,
};

// Game performance results — three sessions each, mirroring his financial reality
export const roniGameResults = {
  // Flappy Bird variant: moderate performance — good reflexes but inconsistent
  flappy: [
    { session: 1, score: 31, duration_s: 42, date: new Date(reg.getTime() + DAY_MS(0) + HOUR_MS(0) + MIN_MS(30)).toISOString() },
    { session: 2, score: 28, duration_s: 38, date: new Date(reg.getTime() + DAY_MS(2) + HOUR_MS(0) + MIN_MS(25)).toISOString() },
    { session: 3, score: 35, duration_s: 47, date: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(0) + MIN_MS(20)).toISOString() },
  ],

  // Financial quiz: moderate — knows concepts, stumbles on investment/tax questions
  quiz: [
    {
      session: 1,
      score: 6,
      total: 10,
      correct: ['emergency_fund', 'debt_to_income', 'compound_interest', 'budget_50_30_20', 'credit_score', 'inflation_basics'],
      incorrect: ['etf_definition', 'pension_contribution_rules', 'capital_gains_tax', 'real_estate_leverage'],
      date: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(0) + MIN_MS(35)).toISOString(),
    },
    {
      session: 2,
      score: 7,
      total: 10,
      correct: ['emergency_fund', 'debt_to_income', 'compound_interest', 'budget_50_30_20', 'credit_score', 'inflation_basics', 'etf_definition'],
      incorrect: ['pension_contribution_rules', 'capital_gains_tax', 'real_estate_leverage'],
      date: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(0) + MIN_MS(40)).toISOString(),
    },
    {
      session: 3,
      score: 7,
      total: 10,
      correct: ['emergency_fund', 'debt_to_income', 'compound_interest', 'budget_50_30_20', 'credit_score', 'inflation_basics', 'etf_definition'],
      incorrect: ['pension_contribution_rules', 'capital_gains_tax', 'real_estate_leverage'],
      date: new Date(reg.getTime() + DAY_MS(6) + HOUR_MS(0) + MIN_MS(38)).toISOString(),
    },
  ],

  // Budget Battle: struggles — almost every line feels mandatory, no slack to allocate
  budget: [
    {
      session: 1,
      score: 38,
      total: 100,
      completed: false,
      failure_reason: 'mandatory_expenses_exceed_income',
      note: 'הפסיק באמצע — לא היה מה לחתוך',
      date: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(0) + MIN_MS(50)).toISOString(),
    },
    {
      session: 2,
      score: 44,
      total: 100,
      completed: false,
      failure_reason: 'mandatory_expenses_exceed_income',
      note: 'ניסה לדחוף חיסכון, נפל כשהכנסה החודשית ירדה לתרחיש רע',
      date: new Date(reg.getTime() + DAY_MS(4) + HOUR_MS(0) + MIN_MS(55)).toISOString(),
    },
    {
      session: 3,
      score: 51,
      total: 100,
      completed: false,
      failure_reason: 'cash_flow_negative_in_bad_month_scenario',
      note: 'שיפור קל — הבין שצריך לסמן הוצאות חובה בנפרד',
      date: new Date(reg.getTime() + DAY_MS(6) + HOUR_MS(0) + MIN_MS(52)).toISOString(),
    },
  ],
};
