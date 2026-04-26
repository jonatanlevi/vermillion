const DAY_MS = 86_400_000;

// Day 1-30 from registration date
export function getCurrentDay(registrationDate) {
  const start = new Date(registrationDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / DAY_MS);
  return Math.min(Math.max(diff + 1, 1), 30);
}

// What phase is the user in?
// lifestyle (1-3) → financial (4-7) → reveal (8) → coaching (9-30) → complete (31+)
export function getPhase(currentDay) {
  if (currentDay <= 3) return 'lifestyle';
  if (currentDay <= 7) return 'financial';
  if (currentDay === 8) return 'reveal';
  if (currentDay <= 30) return 'coaching';
  return 'complete';
}

// How many hours past the expected 9:00am answer window?
export function getDeviationHours(registrationDate, currentDay, lastAnswerTimestamp) {
  if (lastAnswerTimestamp) return 0;
  const regDate = new Date(registrationDate);
  const expected = new Date(
    regDate.getFullYear(),
    regDate.getMonth(),
    regDate.getDate() + currentDay - 1,
    9, 0, 0, 0
  );
  const now = new Date();
  const hours = Math.floor((now - expected) / 3_600_000);
  return Math.max(0, hours);
}

// Score multiplier based on how late the user answered
export function getScoreMultiplier(deviationHours) {
  if (deviationHours <= 0) return 1.2;   // Early bonus +20%
  if (deviationHours <= 3) return 1.0;   // On time
  if (deviationHours <= 24) return 0.9;  // Same day, late
  if (deviationHours <= 48) return 0.7;  // 1 day late
  if (deviationHours <= 72) return 0.5;  // 2 days late
  return 0.3;                            // Very late — still counted
}

// Consecutive days answered streak
export function calcStreak(dailyAnswers, registrationDate) {
  const today = getCurrentDay(registrationDate);
  let streak = 0;
  for (let d = today; d >= 1; d--) {
    if (dailyAnswers?.[d]) streak++;
    else break;
  }
  return streak;
}

// Has the user answered today's question?
export function isTodayDone(dailyAnswers, currentDay) {
  return !!dailyAnswers?.[currentDay];
}

// Days remaining in the 30-day challenge
export function getDaysLeft(currentDay) {
  return Math.max(0, 30 - currentDay);
}

// Human-readable date in Hebrew
export function getHebrewDate() {
  return new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Score delta for answering on day D at given deviation
export function calcDayScore(deviationHours, basePoints = 100) {
  return Math.round(basePoints * getScoreMultiplier(deviationHours));
}

// Returns a summary object for easy consumption in screens
export function getUserTimeStatus(userData) {
  const regDate = userData?.registrationDate || new Date().toISOString();
  const currentDay = getCurrentDay(regDate);
  const phase = getPhase(currentDay);
  const streak = calcStreak(userData?.dailyAnswers, regDate);
  const todayDone = isTodayDone(userData?.dailyAnswers, currentDay);
  const deviation = getDeviationHours(regDate, currentDay, todayDone ? Date.now() : null);
  const multiplier = getScoreMultiplier(deviation);
  const daysLeft = getDaysLeft(currentDay);

  return {
    currentDay,
    phase,
    streak,
    todayDone,
    deviation,         // hours late (0 = on time or done)
    multiplier,        // score multiplier
    daysLeft,
    isLate: deviation > 3,
    hebrewDate: getHebrewDate(),
  };
}
