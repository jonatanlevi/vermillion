/**
 * תצוגת חלונות (לקוח) — השרת קובע סופית.
 * ימי שישי/שבת: stampChallenge.js (הסוד — לא לגעת בלי אישור מוצרי).
 */

import { evaluateChallengeWindow } from '../constants/stampChallenge';
import { getAppNow } from './appClock';

export function getLocalTimeParts(now, timezone) {
  const clock = now ?? getAppNow();
  const tz = timezone || getDeviceTimezone();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(clock);
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[weekday];
    if (day === undefined) throw new Error(`unknown weekday: ${weekday}`);
    return { day, hour, minute, mins: hour * 60 + minute, timezone: tz };
  } catch {
    return {
      day: clock.getDay(),
      hour: clock.getHours(),
      minute: clock.getMinutes(),
      mins: clock.getHours() * 60 + clock.getMinutes(),
      timezone: tz,
    };
  }
}

/** חלון חתימה לפי שעון המכשיר עכשיו — לא profile.timezone ישן/שגוי */
export function getStampWindowStatus(timezone = getDeviceTimezone()) {
  const { day, mins } = getLocalTimeParts(getAppNow(), timezone);
  const challenge = evaluateChallengeWindow(day, mins);
  if (challenge) return challenge;
  return { open: true, mode: 'weekday', message: null };
}

export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const STAMP_ERROR_HE = {
  GAME_TOKEN_REQUIRED: 'סיים משחק לפני החתימה',
  INVALID_TOKEN:       'המשחק פג תוקף — שחק שוב ואז חתום',
  TOKEN_ALREADY_USED:  'כבר חתמת היום',
  TOKEN_USER_MISMATCH: 'שגיאת אימות — התחבר מחדש',
  TOKEN_DAY_MISMATCH:  'יום לא תואם — רענן את המסך',
  WINDOW_CLOSED:           'חלון החתימה סגור כרגע',
  CHALLENGE_TIME_REQUIRED: 'קבע שעת חתימה בתוך הטווח לפני שאתה חותם',
  OUT_OF_WINDOW:           'השעה שבחרת מחוץ לטווח המותר',
  DNA_LOCKED:              'שעת ה-DNA ננעלה בהרשמה ולא ניתנת לשינוי',
  FRIDAY_DNA_LOCKED:       'שעת שישי ננעלה ולא ניתנת לשינוי',
  SATURDAY_DNA_LOCKED:     'שעת שבת ננעלה ולא ניתנת לשינוי',
  GAME_TOO_FAST:       'המשחק הסתיים מהר מדי — שחק שוב',
  SESSION_EXPIRED:     'עבר יותר מדי זמן מאז תחילת המשחק — שחק שוב',
  DURATION_MISMATCH:   'זמן המשחק לא תואם — שחק שוב',
  DURATION_TOO_LONG:   'משחק ארוך מדי — שחק שוב',
  INVALID_DURATION:    'נתוני משחק לא תקינים',
  NO_TOKEN:            'לא התקבל אישור משחק — נסה שוב',
  Forbidden:           'שגיאת אימות אפליקציה',
  SERVER_MISCONFIGURED:'שרת לא מוגדר — פנה לתמיכה',
};

export function stampErrorMessage(code, serverMessage) {
  if (serverMessage) return serverMessage;
  return STAMP_ERROR_HE[code] || 'לא ניתן לחתום כרגע. נסה שוב';
}

function parseInvokePayload(err, data) {
  if (data?.error) return { code: data.error, message: data.message || null };
  const ctx = err?.context;
  if (ctx?.body) {
    try {
      const parsed = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
      if (parsed?.error) return { code: parsed.error, message: parsed.message || null };
    } catch { /* ignore */ }
  }
  return { code: err?.message || 'UNKNOWN', message: null };
}

export function parseStampInvokeError(err, data) {
  return parseInvokePayload(err, data);
}

export function parseGameCompleteError(err, data) {
  return parseInvokePayload(err, data);
}

/** אזהרה מראש על חלון שישי/שבת — מוצג יום לפני (ביום ה) ובשבת לפני 21:00 */
export function getWindowWarning(timezone = getDeviceTimezone()) {
  const { day, mins } = getLocalTimeParts(getAppNow(), timezone);

  if (day === 4 && mins >= 18 * 60) {
    return {
      type: 'upcoming_friday',
      icon: '📌',
      title: 'מחר שישי — חלון מיוחד',
      body: 'VerMillion פתוח רק עד 15:30. שחק לפני הצהריים!',
      color: '#D4AF37',
      bg: '#1A1208',
    };
  }
  if (day === 6 && mins < 21 * 60) {
    const minsUntil = 21 * 60 - mins;
    const h = Math.floor(minsUntil / 60);
    const m = minsUntil % 60;
    const timeStr = h > 0 ? `${h}:${String(m).padStart(2, '0')} שעות` : `${m} דקות`;
    return {
      type: 'upcoming_saturday',
      icon: '⏳',
      title: 'חלון שבת נפתח ב-21:00',
      body: `עוד ${timeStr} — חתום בשעה מדויקת לניקוד מקסימלי.`,
      color: '#8E44AD',
      bg: '#160A1A',
    };
  }
  return null;
}
