/**
 * ימי שישי + שבת — ליבת המוצר ("הסוד"). חייב להתאים ל-src/constants/stampChallenge.js
 */

export const CHALLENGE_WINDOWS = {
  FRIDAY:   { open: 1,           close: 15 * 60 + 30 },
  SATURDAY: { open: 21 * 60,     close: 23 * 60 + 59 },
} as const;

export function isChallengeLocalDay(day: number): boolean {
  return day === 5 || day === 6;
}

export function calcWindowScore(mins: number, windowOpen: number, windowClose: number): number {
  const duration = windowClose - windowOpen;
  const elapsed  = mins - windowOpen;
  return Math.max(1, Math.round(1000 * (1 - elapsed / duration)));
}

export function hmToMins(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function isHmInChallengeWindow(localDay: number, hour: number, minute: number): boolean {
  const win = localDay === 5 ? CHALLENGE_WINDOWS.FRIDAY : localDay === 6 ? CHALLENGE_WINDOWS.SATURDAY : null;
  if (!win) return false;
  const mins = hmToMins(hour, minute);
  return mins >= win.open && mins <= win.close;
}
