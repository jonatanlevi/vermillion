/**
 * משחק רפאים — 14 יום מדומים: שבוע אתגר (1–7) + שבוע אמיתי (8–14).
 * נתונים לוקאליים בלבד; לא נכתב ל-Supabase.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { writeLocalUserId, isGhostUserId } from './supabase';
import { getGhostById } from '../mock/ghostRegistry';
import { REGULATIONS_VERSION } from '../constants/regulationsHe';
import {
  markLocalOnboardingComplete, markLocalTermsAccepted, markLocalProfileIntakeComplete,
} from '../utils/registrationGate';
import { setAppClockOverride, clearAppClockOverride } from '../utils/appClock';
import {
  saveProfile, saveOnboardingState, saveFinancialData, localRemoveAllForGhost,
} from './storage';

const SESSION_KEY = '@vermillion/ghost_play_session';
export const GHOST_PLAY_CHALLENGE_DAYS = 7;
export const GHOST_PLAY_REAL_DAYS = 7;
export const GHOST_PLAY_TOTAL_DAYS = GHOST_PLAY_CHALLENGE_DAYS + GHOST_PLAY_REAL_DAYS;

async function readRaw(key) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeRaw(key, val) {
  const s = JSON.stringify(val);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, s);
    return;
  }
  await AsyncStorage.setItem(key, s);
}

async function removeRaw(key) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

/** זמן "עכשיו" למשחק רפאים — יום מדומה + שעה אמיתית מהמכשיר */
export function getEffectiveNow() {
  const session = _sessionCache;
  if (!session) return new Date();
  const d = new Date(session.startedAt);
  d.setDate(d.getDate() + (session.dayOffset || 0));
  const real = new Date();
  d.setHours(real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
  return d;
}

let _sessionCache = null;

export async function getGhostPlaySession() {
  if (_sessionCache) return _sessionCache;
  _sessionCache = await readRaw(SESSION_KEY);
  if (_sessionCache) setAppClockOverride(() => getEffectiveNow());
  return _sessionCache;
}

export function isGhostPlayActive() {
  return !!_sessionCache?.ghostId;
}

export function getGhostPlayMeta(session = _sessionCache) {
  if (!session) return null;
  const dayIndex = Math.min(session.dayOffset || 0, GHOST_PLAY_TOTAL_DAYS - 1);
  const programDay = dayIndex + 1;
  const isRealWeek = programDay > GHOST_PLAY_CHALLENGE_DAYS;
  const weekDay = isRealWeek
    ? programDay - GHOST_PLAY_CHALLENGE_DAYS
    : programDay;
  return {
    ghostId: session.ghostId,
    ghostName: session.ghostName,
    dayOffset: dayIndex,
    programDay,
    week: isRealWeek ? 'real' : 'challenge',
    weekLabelHe: isRealWeek ? 'שבוע אמיתי' : 'שבוע אתגר',
    weekDay,
    weekDayLabel: `יום ${weekDay}/${isRealWeek ? GHOST_PLAY_REAL_DAYS : GHOST_PLAY_CHALLENGE_DAYS}`,
    registrationDate: session.startedAt,
  };
}

function flattenGhostAnswers(dailyAnswers) {
  const out = {};
  if (!dailyAnswers) return out;
  for (const day of Object.keys(dailyAnswers)) {
    const block = dailyAnswers[day];
    if (!block || typeof block !== 'object') continue;
    for (const [k, v] of Object.entries(block)) {
      if (k.startsWith('_')) continue;
      out[k] = v;
    }
  }
  return out;
}

export async function activateGhostPlay(ghostId) {
  const ghost = getGhostById(ghostId);
  if (!ghost) throw new Error(`Ghost not found: ${ghostId}`);

  await localRemoveAllForGhost();
  await writeLocalUserId(ghost.id);

  const startedAt = new Date();
  startedAt.setHours(0, 0, 0, 0);

  const session = {
    ghostId: ghost.id,
    ghostName: ghost.name,
    email: ghost.email || '',
    startedAt: startedAt.toISOString(),
    dayOffset: 0,
  };
  await writeRaw(SESSION_KEY, session);
  _sessionCache = session;
  setAppClockOverride(() => getEffectiveNow());

  const avatarStyle = ghost.vermillion?.appearance
    ? { seed: ghost.id, ...ghost.vermillion.appearance, tone: ghost.vermillion.tone }
    : { seed: ghost.id };

  const nowIso = new Date().toISOString();
  await saveProfile({
    id: ghost.id,
    name: ghost.name,
    email: ghost.email,
    subscription: 'premium',
    profile_intake_complete: true,
    onboarding_complete: true,
    terms_accepted_at: nowIso,
    terms_version: REGULATIONS_VERSION,
    avatar_style: avatarStyle,
    v_coins: 200,
  });
  markLocalProfileIntakeComplete(ghost.id);
  markLocalTermsAccepted(ghost.id);
  markLocalOnboardingComplete(ghost.id);

  await saveOnboardingState({
    startDate: startedAt.toISOString(),
    daysCompleted: [],
    profileGenerated: false,
    profileText: '',
    registrationDate: startedAt.toISOString(),
    _ghostPlay: true,
  });

  await saveFinancialData(flattenGhostAnswers(ghost.dailyAnswers));

  return getGhostPlayMeta(session);
}

async function persistSession(patch) {
  const session = { ...(_sessionCache || {}), ...patch };
  await writeRaw(SESSION_KEY, session);
  _sessionCache = session;
  return session;
}

export async function advanceGhostPlayDay(steps = 1) {
  const session = await getGhostPlaySession();
  if (!session) return null;
  const next = Math.min((session.dayOffset || 0) + steps, GHOST_PLAY_TOTAL_DAYS - 1);
  await persistSession({ dayOffset: next });
  return getGhostPlayMeta();
}

export async function setGhostPlayDayOffset(offset) {
  const session = await getGhostPlaySession();
  if (!session) return null;
  const clamped = Math.max(0, Math.min(offset, GHOST_PLAY_TOTAL_DAYS - 1));
  await persistSession({ dayOffset: clamped });
  return getGhostPlayMeta();
}

/** קפיצה ליום בשבוע (0=א׳ … 5=שישי, 6=שבת) בטווח 14 הימים */
export async function jumpGhostPlayToWeekday(targetDow) {
  const session = await getGhostPlaySession();
  if (!session) return null;
  const start = new Date(session.startedAt);
  for (let off = 0; off < GHOST_PLAY_TOTAL_DAYS + 7; off++) {
    const d = new Date(start);
    d.setDate(d.getDate() + off);
    if (d.getDay() === targetDow) {
      await persistSession({ dayOffset: Math.min(off, GHOST_PLAY_TOTAL_DAYS - 1) });
      return getGhostPlayMeta();
    }
  }
  return getGhostPlayMeta();
}

/** יום 8 — תחילת שבוע אמיתי */
export async function skipToRealWeek() {
  return setGhostPlayDayOffset(GHOST_PLAY_CHALLENGE_DAYS);
}

export async function endGhostPlay() {
  await removeRaw(SESSION_KEY);
  _sessionCache = null;
  clearAppClockOverride();
}

export function isGhostPlayUserId(id) {
  return isGhostUserId(id) && isGhostPlayActive();
}
