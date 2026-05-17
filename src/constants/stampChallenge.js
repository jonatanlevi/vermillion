/**
 * ימי שישי + שבת — ליבת המוצר ("הסוד").
 *
 * לא משתמשים ב-DNA בימים האלה. רק חלונות אתגר לפי שעון המכשיר ברגע החתימה.
 * שינוי שעות/לוגיקה = אישור מוצרי בלבד.
 *
 * שרת: supabase/functions/_shared/windows.ts (חייב להישאר זהה)
 */

export const CHALLENGE_WINDOWS = {
  FRIDAY: {
    localDay: 5,
    openMins: 1,
    closeMins: 15 * 60 + 30,
    labelHe: 'שישי',
    openLabel: '00:01',
    closeLabel: '15:30',
  },
  SATURDAY: {
    localDay: 6,
    openMins: 21 * 60,
    closeMins: 23 * 60 + 59,
    labelHe: 'שבת',
    openLabel: '21:00',
    closeLabel: '23:59',
  },
};

export function isChallengeLocalDay(day) {
  return day === CHALLENGE_WINDOWS.FRIDAY.localDay || day === CHALLENGE_WINDOWS.SATURDAY.localDay;
}

export function hmToMins(hour, minute) {
  return hour * 60 + minute;
}

export function minsToHM(mins) {
  return { hour: Math.floor(mins / 60), minute: mins % 60 };
}

export function getChallengeConfig(mode) {
  return mode === 'friday' ? CHALLENGE_WINDOWS.FRIDAY : CHALLENGE_WINDOWS.SATURDAY;
}

/** האם שעה:דקות בתוך טווח האתגר (שישי/שבת) */
export function isHmInChallengeWindow(mode, hour, minute) {
  const w = getChallengeConfig(mode);
  const mins = hmToMins(hour, minute);
  return mins >= w.openMins && mins <= w.closeMins;
}

/** האם עדיין אפשר לקבוע יעד ליום האתגר (לפני סגירת החלון) */
export function canSetChallengeTarget(localDay, mins) {
  if (localDay === CHALLENGE_WINDOWS.FRIDAY.localDay) {
    return mins <= CHALLENGE_WINDOWS.FRIDAY.closeMins;
  }
  if (localDay === CHALLENGE_WINDOWS.SATURDAY.localDay) {
    return mins <= CHALLENGE_WINDOWS.SATURDAY.closeMins;
  }
  return false;
}

export function getDefaultChallengeHM(mode) {
  if (mode === 'friday') return { hour: 10, minute: 0 };
  return { hour: 21, minute: 30 };
}

export function clampChallengeHM(mode, hour, minute) {
  const w = getChallengeConfig(mode);
  let mins = hmToMins(hour, minute);
  if (mins < w.openMins) mins = w.openMins;
  if (mins > w.closeMins) mins = w.closeMins;
  return minsToHM(mins);
}

/** מצב חלון אתגר לפי יום+דקות מקומיים (0=א׳ … 6=ש׳) */
export function evaluateChallengeWindow(localDay, mins) {
  if (localDay === CHALLENGE_WINDOWS.FRIDAY.localDay) {
    const { openMins, closeMins } = CHALLENGE_WINDOWS.FRIDAY;
    if (mins < openMins || mins > closeMins) {
      return {
        open: false,
        mode: 'friday',
        message: mins > closeMins
          ? 'אתגר שישי: החלון נסגר ב-15:30 (לפי השעון המקומי שלך). הבא: שבת 21:00'
          : 'אתגר שישי: החלון נפתח מחצות (לפי השעון המקומי שלך)',
      };
    }
    return { open: true, mode: 'friday', message: 'אתגר שישי פתוח — חתום עד 15:30 (שעון מקומי)' };
  }

  if (localDay === CHALLENGE_WINDOWS.SATURDAY.localDay) {
    const { openMins, closeMins } = CHALLENGE_WINDOWS.SATURDAY;
    if (mins < openMins) {
      return { open: false, mode: 'saturday', message: 'אתגר שבת: החלון נפתח ב-21:00 (שעון מקומי)' };
    }
    if (mins > closeMins) {
      return { open: false, mode: 'saturday', message: 'אתגר שבת: החלון נסגר (שעון מקומי)' };
    }
    return { open: true, mode: 'saturday', message: 'אתגר שבת פתוח — חתום עד חצות (שעון מקומי)' };
  }

  return null;
}
