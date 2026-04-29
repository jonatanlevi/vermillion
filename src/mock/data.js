// Simulate registration offset — drives “which program day” in mocks/tests.
// Change DAYS_AGO to test different scenarios:
//   0 = brand new user (day 1)
//   6 = last onboarding questionnaire day (day 7)
//   7 = profile reveal day (day 8) ← Cursor Task 01
//   15 = mid-challenge coaching phase
//   29 = last day of challenge
const DAYS_AGO = 7;
const reg = new Date();
reg.setDate(reg.getDate() - DAYS_AGO);
reg.setHours(9, 0, 0, 0);

export const mockUser = {
  id: '1',
  name: 'ישראל ישראלי',
  phone: '050-0000000',
  email: 'israel@example.com',
  registrationDate: reg.toISOString(),

  streak: 6,
  rank: 3,
  score: 94.2,
  avatar_level: 2,

  // Subscription: 'free' | 'premium'
  // Set to 'premium' to test full paid experience (demo mode)
  subscription: 'premium',

  // DOB for age calculation (set during CompleteProfileScreen)
  dob: { dobD: '15', dobM: '3', dobY: '1990' },

  // VerMillion avatar (set during onboarding)
  vermillion: {
    name: 'ARIEL · THE DEEP',
    appearance: { body: 'athletic', style: 'royal', colors: 'fire', energy: 'wise' },
    tone: { advice_style: 'direct', personality: 'mentor', goal_focus: 'money' },
  },

  // Lifestyle profile (days 1-3) + Financial profile (days 4-7)
  // Format: { [day]: { [questionKey]: value, _answeredAt: ISO } }
  dailyAnswers: {
    1: {
      family_status: 'married',
      children_count: '2',
      housing_type: 'renting',
      city_type: 'center',
      _answeredAt: new Date(reg.getTime() + DAY_MS(0) + HOUR_MS(8)).toISOString(),
    },
    2: {
      employment_type: 'employee',
      work_hours_weekly: '45',
      top_hobby: 'sports',
      social_budget: 'medium',
      _answeredAt: new Date(reg.getTime() + DAY_MS(1) + HOUR_MS(9)).toISOString(),
    },
    3: {
      money_goal: 'freedom',
      money_fear: 'not_enough',
      extra_money_action: 'invest',
      _answeredAt: new Date(reg.getTime() + DAY_MS(2) + HOUR_MS(10)).toISOString(),
    },
    4: {
      net_income: '14000',
      side_income: '2000',
      num_earners: '2',
      _answeredAt: new Date(reg.getTime() + DAY_MS(3) + HOUR_MS(9)).toISOString(),
    },
    5: {
      housing_expense: '4500',
      fixed_expenses: '3200',
      variable_expenses: '2800',
      _answeredAt: new Date(reg.getTime() + DAY_MS(4) + HOUR_MS(11)).toISOString(),
    },
    6: {
      mortgage_balance: '0',
      loans_total: '25000',
      credit_debt: '4000',
      liquid_savings: '15000',
      investments: '0',
      real_estate_equity: '0',
      _answeredAt: new Date(reg.getTime() + DAY_MS(5) + HOUR_MS(9)).toISOString(),
    },
  },

  // AI-generated profile (created on Day 8 reveal)
  profileSummary: null,

  // Per-day answer timestamps for deviation tracking
  answerTimestamps: {},
};

function DAY_MS(n) { return n * 86_400_000; }
function HOUR_MS(h) { return h * 3_600_000; }

export const mockLeaderboard = [
  { id: '1', name: 'דניאל כהן',      score: 99.1, streak: 30, rank: 1, daysLeft: 2 },
  { id: '2', name: 'מיכל לוי',       score: 98.4, streak: 28, rank: 2, daysLeft: 4 },
  { id: '3', name: 'ישראל ישראלי',   score: 94.2, streak: 6,  rank: 3, daysLeft: 24 },
  { id: '4', name: 'רועי אברהם',     score: 91.7, streak: 22, rank: 4, daysLeft: 10 },
  { id: '5', name: 'שירה מזרחי',     score: 89.3, streak: 15, rank: 5, daysLeft: 17 },
  { id: '6', name: 'עמיר פרץ',       score: 85.0, streak: 19, rank: 6, daysLeft: 13 },
  { id: '7', name: 'נועה בן דוד',    score: 82.6, streak: 11, rank: 7, daysLeft: 21 },
];

export const mockPrizePool = {
  total: 45000,
  currency: '₪',
  month: new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
  distribution: [
    { rank: 1, amount: 15000 },
    { rank: 2, amount: 10000 },
    { rank: 3, amount: 8000 },
    { rank: 4, amount: 7000 },
    { rank: 5, amount: 5000 },
  ],
};

export const mockTodayChallenge = {
  game_type: 'לחץ בזמן',
  attempts_left: 3,
  best_score: null,
};

// Premium features gate
// Core rule: questionnaire + challenge week + leaderboard = premium only
export const PREMIUM_FEATURES = {
  weekChallenge:    { free: false, premium: true },   // 30-day challenge + leaderboard
  dailyQuestionnaire: { free: false, premium: true }, // 7-day profiling questionnaire
  aiCoach:          { free: false, premium: true },   // full AI coaching
  aiPreview:        { free: 3, premium: Infinity },   // free users get 3 demo messages
  profileReport:    { free: false, premium: true },   // AI-generated profile summary
  weeklyInsight:    { free: false, premium: true },   // weekly financial insight
  gamesUnlocked:    { free: 0, premium: 4 },          // free = no games, premium = all
};

export function canUseFeature(user, feature) {
  const tier = user?.subscription === 'premium' ? 'premium' : 'free';
  const limit = PREMIUM_FEATURES[feature]?.[tier];
  if (limit === undefined) return true;
  if (limit === false) return false;
  if (limit === Infinity) return true;
  return limit;
}
