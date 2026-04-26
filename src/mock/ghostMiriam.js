/**
 * GHOST USER — "מרים לוי"
 * עורכת דין בכירה, 58, גרושה, רמת גן.
 * Tier 4 — אופטימיזציה. חוסכת 52% מהכנסתה.
 * 7 שנים לפרישה ביעד. מכירה תיאוריה — מחפשת אופטימיזציה.
 */

const GHOST_REG = new Date('2026-04-18T09:00:00');
function D(n) { return n * 86_400_000; }
function H(h) { return h * 3_600_000; }
function M(m) { return m * 60_000; }

export const ghostMiriam = {
  id: 'ghost_miriam',
  name: 'מרים לוי',
  phone: '052-7731084',
  email: 'miriam.levy.law@gmail.com',
  registrationDate: GHOST_REG.toISOString(),
  subscription: 'premium',
  streak: 7,
  rank: 28,
  score: 88.1,
  avatar_level: 2,

  dob: { dobD: '14', dobM: '6', dobY: '1967' },

  vermillion: {
    name: 'PETRA · THE WISE',
    appearance: { body: 'elegant', style: 'royal', colors: 'gold', energy: 'wise' },
    tone: { advice_style: 'strategic', personality: 'mentor', goal_focus: 'retirement' },
  },

  // Lifestyle profile (days 1-3) + Financial profile (days 4-7)
  // All _answeredAt around 21:00–21:30 each day
  dailyAnswers: {
    1: {
      family_status: 'divorced',
      children_count: '2',
      housing_type: 'owner',
      city_type: 'center',
      _answeredAt: new Date(GHOST_REG.getTime() + D(0) + H(21) + M(4)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '50',
      top_hobby: 'travel',
      social_budget: 'medium',
      _answeredAt: new Date(GHOST_REG.getTime() + D(1) + H(21) + M(11)).toISOString(),
    },
    3: {
      money_goal: 'retire',
      money_fear: 'old_age',
      extra_money_action: 'invest',
      _answeredAt: new Date(GHOST_REG.getTime() + D(2) + H(21) + M(7)).toISOString(),
    },
    4: {
      net_income: '28000',
      side_income: '3000',
      num_earners: '1',
      _answeredAt: new Date(GHOST_REG.getTime() + D(3) + H(21) + M(19)).toISOString(),
    },
    5: {
      housing_expense: '0',
      fixed_expenses: '4200',
      variable_expenses: '6800',
      _answeredAt: new Date(GHOST_REG.getTime() + D(4) + H(21) + M(3)).toISOString(),
    },
    6: {
      mortgage_balance: '0',
      loans_total: '0',
      credit_debt: '0',
      liquid_savings: '380000',
      investments: '520000',
      real_estate_equity: '2400000',
      _answeredAt: new Date(GHOST_REG.getTime() + D(5) + H(21) + M(22)).toISOString(),
    },
    7: {
      retirement_age: '65',
      financial_target: '6000000',
      monthly_savings_target: '16000',
      pension_monthly: '5600',
      saving_obstacle: 'no_habit',
      biggest_leak: 'טיסות לחו"ל וחופשות — אני יודעת שאני מוציאה יותר ממה שאני צריכה, אבל זה הפינוק היחיד שלי',
      commitment: '30+',
      _answeredAt: new Date(GHOST_REG.getTime() + D(6) + H(21) + M(28)).toISOString(),
    },
  },

  profileSummary: null,

  answerTimestamps: {
    1: new Date(GHOST_REG.getTime() + D(0) + H(21) + M(4)).toISOString(),
    2: new Date(GHOST_REG.getTime() + D(1) + H(21) + M(11)).toISOString(),
    3: new Date(GHOST_REG.getTime() + D(2) + H(21) + M(7)).toISOString(),
    4: new Date(GHOST_REG.getTime() + D(3) + H(21) + M(19)).toISOString(),
    5: new Date(GHOST_REG.getTime() + D(4) + H(21) + M(3)).toISOString(),
    6: new Date(GHOST_REG.getTime() + D(5) + H(21) + M(22)).toISOString(),
    7: new Date(GHOST_REG.getTime() + D(6) + H(21) + M(28)).toISOString(),
  },

  _ghost: true,

  _persona: {
    age: 58,
    occupation: 'עורכת דין בכירה — שכירה במשרד עורכי דין',
    city: 'רמת גן',
    familySituation: 'גרושה, שני ילדים בוגרים (לא תלויים)',
    techSavvy: 'low',
    financialLiteracy: 'high',
    appSkepticism: 'medium',
    sessionTime: '21:00',
    readingStyle: 'careful',
    triggerWords: ['פרישה', 'ירושה', 'מס', 'תשואה', 'קצבה'],
    dealBreakers: [
      'תוכן המיועד לצעירים',
      'עצות בסיסיות שהיא כבר יודעת',
      'חוסר עומק בנושאי פנסיה ופרישה',
    ],
    motivators: [
      'אופטימיזציה של תכנון הפרישה',
      'יעילות מיסויית — מיצוי ניכויים וקרנות',
      'השארת ירושה לילדים',
      '7 שנים למיקסום תשואות',
    ],
    financialProfile: {
      totalIncome: 31000,
      totalExpenses: 11000,
      monthlySurplus: 20000,
      savingsRate: 52,
      totalDebt: 0,
      monthsEmergency: 19,
      liquidSavings: 380000,
      investments: 520000,
      realEstateEquity: 2400000,
      financialTarget: 6000000,
      retirementAge: 65,
      yearsLeft: 7,
      tier: 4,
      tierLabel: 'אופטימיזציה',
    },
  },
};

// Personal session time — she always opens the app at ~21:00
export const miriamPersonalTime = { hour: 21, minute: 4, second: 0, ms: 0 };

export const miriamGameResults = {
  // Flappy-style game — low tech savvy, struggles with touch precision
  flappy: [
    { date: new Date(GHOST_REG.getTime() + D(8)).toISOString(),  score: 12, passed: false },
    { date: new Date(GHOST_REG.getTime() + D(9)).toISOString(),  score: 18, passed: false },
    { date: new Date(GHOST_REG.getTime() + D(10)).toISOString(), score: 21, passed: false },
    { date: new Date(GHOST_REG.getTime() + D(11)).toISOString(), score: 35, passed: true  },
    { date: new Date(GHOST_REG.getTime() + D(12)).toISOString(), score: 29, passed: false },
  ],
  // Financial quiz — high financial literacy, near-perfect scores
  quiz: [
    { date: new Date(GHOST_REG.getTime() + D(8)).toISOString(),  score: 92, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(9)).toISOString(),  score: 96, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(10)).toISOString(), score: 88, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(11)).toISOString(), score: 100, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(12)).toISOString(), score: 95, total: 100, passed: true },
  ],
  // Budget allocation game — disciplined and methodical, perfect score
  budget: [
    { date: new Date(GHOST_REG.getTime() + D(8)).toISOString(),  score: 100, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(9)).toISOString(),  score: 100, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(10)).toISOString(), score: 98,  total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(11)).toISOString(), score: 100, total: 100, passed: true },
    { date: new Date(GHOST_REG.getTime() + D(12)).toISOString(), score: 100, total: 100, passed: true },
  ],
};
