/**
 * תצוגת שעות ללקוח — לפי יום מקומי (שישי / שבת / ימי חול).
 */

import { CHALLENGE_WINDOWS } from '../constants/stampChallenge';
import { getDeviceTimezone, getLocalTimeParts, getStampWindowStatus } from './stampWindow';

export const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function formatHM(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getActiveTarget(commitTime, mode) {
  if (!commitTime) return null;
  if (mode === 'friday') {
    return commitTime.fridayTarget
      ? { hour: commitTime.fridayTarget.hour, minute: commitTime.fridayTarget.minute }
      : null;
  }
  if (mode === 'saturday') {
    return commitTime.saturdayTarget
      ? { hour: commitTime.saturdayTarget.hour, minute: commitTime.saturdayTarget.minute }
      : null;
  }
  if (commitTime.hour != null && commitTime.minute != null) {
    return { hour: commitTime.hour, minute: commitTime.minute };
  }
  return null;
}

/** תצוגה מלאה לפי היום עכשיו על השעון המקומי */
export function getDayScheduleView(commitTime, now = new Date(), timezone = getDeviceTimezone()) {
  const { day, hour, minute } = getLocalTimeParts(now, timezone);
  const stampWindow = getStampWindowStatus(timezone);
  const nowStr = formatHM(hour, minute);
  const dayName = DAY_NAMES_HE[day];
  const target = getActiveTarget(commitTime, stampWindow.mode);

  const base = {
    day,
    mins,
    dayName,
    mode: stampWindow.mode,
    nowStr,
    nowLine: `עכשיו (שעון מקומי): ${nowStr}`,
    open: stampWindow.open,
    statusLine: stampWindow.message,
    target,
    targetStr: target ? formatHM(target.hour, target.minute) : null,
  };

  if (stampWindow.mode === 'friday') {
    const cfg = CHALLENGE_WINDOWS.FRIDAY;
    return {
      ...base,
      headline: 'יום שישי — אתגר',
      kindLabel: 'אתגר שישי',
      windowLine: `חלון חתימה היום: ${cfg.openLabel} – ${cfg.closeLabel}`,
      targetLine: target
        ? `שעת החתימה שלך (שישי): ${formatHM(target.hour, target.minute)}`
        : `קבע שעה בטווח ${cfg.openLabel}–${cfg.closeLabel}`,
      clockHint: target
        ? `השעון מציג את שעת השישי שלך — ${formatHM(target.hour, target.minute)}`
        : 'השעון מציג שעון מקומי — קבע שעת שישי',
    };
  }

  if (stampWindow.mode === 'saturday') {
    const cfg = CHALLENGE_WINDOWS.SATURDAY;
    return {
      ...base,
      headline: 'יום שבת — סיום האתגר',
      kindLabel: 'אתגר שבת',
      windowLine: `חלון חתימה היום: ${cfg.openLabel} – ${cfg.closeLabel}`,
      targetLine: target
        ? `שעת החתימה שלך (שבת): ${formatHM(target.hour, target.minute)}`
        : `קבע שעה בטווח ${cfg.openLabel}–${cfg.closeLabel}`,
      clockHint: target
        ? `השעון מציג את שעת השבת שלך — ${formatHM(target.hour, target.minute)}`
        : 'השעון מציג שעון מקומי — קבע שעת שבת',
    };
  }

  return {
    ...base,
    headline: `יום ${dayName} — תחרות`,
    kindLabel: 'DNA יומי',
    windowLine: null,
    targetLine: target
      ? `שעת DNA שלך (ימי חול): ${formatHM(target.hour, target.minute)}`
      : 'שעת DNA — נקבעת בהרשמה',
    clockHint: target
      ? `השעון מציג את שעת ה-DNA שלך — ${formatHM(target.hour, target.minute)}`
      : 'השעון מציג שעון מקומי',
  };
}

/** מילישניות עד שעת היעד הפעילה היום (לספירה לאחור) */
export function getMsUntilActiveTarget(commitTime, now = new Date(), timezone = getDeviceTimezone()) {
  const view = getDayScheduleView(commitTime, now, timezone);
  if (!view.target) {
    if (view.mode === 'saturday' && !view.open) {
      const cfg = CHALLENGE_WINDOWS.SATURDAY;
      const gate = new Date(now);
      const { hour, minute } = { hour: Math.floor(cfg.openMins / 60), minute: cfg.openMins % 60 };
      gate.setHours(hour, minute, 0, 0);
      if (gate > now) return gate.getTime() - now.getTime();
    }
    return 0;
  }
  const gate = new Date(now);
  gate.setHours(view.target.hour, view.target.minute, 0, 0);
  if (gate <= now) return 0;
  return gate.getTime() - now.getTime();
}
