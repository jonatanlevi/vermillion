import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getOrCreateUser, isLocalUserId, clearDeviceLocalIdentity } from './supabase';
import { isHmInChallengeWindow } from '../constants/stampChallenge';
import { getMsUntilActiveTarget } from '../utils/dayScheduleDisplay';
import { getStampWindowStatus, parseGameCompleteError, parseStampInvokeError } from '../utils/stampWindow';

const L = {
  FIN:      '@vermillion/local/financial',
  ONB:      '@vermillion/local/onboarding',
  CHAT:     '@vermillion/local/chat',
  COMMIT:   '@vermillion/local/commitment',
  GAME:     '@vermillion/local/gamelog',
  SESSIONS: '@vermillion/local/gamesessions',
  PROF:     '@vermillion/local/profile',
  VOICE:    '@vermillion/local/voice_unlocked',
};

async function localGet(key, fallback) {
  try {
    let raw;
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(key);
    } else {
      raw = await AsyncStorage.getItem(key);
    }
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function localSet(key, val) {
  const s = JSON.stringify(val);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, s);
    return;
  }
  await AsyncStorage.setItem(key, s);
}

async function localRemoveAll() {
  const keys = Object.values(L);
  for (const k of keys) {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(k);
    } else {
      await AsyncStorage.removeItem(k);
    }
  }
}

/** איפוס נתוני משחק לוקאלי לפני הפעלת רפא — לא מוחק סשן ghost_play */
export async function localRemoveAllForGhost() {
  await localRemoveAll();
}

// ─── helpers ───────────────────────────────────────────────
async function uid() {
  const user = await getOrCreateUser();
  return user.id;
}

/**
 * Remote upsert; returns `{ error }` instead of throwing (mobile browsers / RLS / missing tables).
 */
async function dbUpsert(table, userId, payload) {
  try {
    const { data: existing, error: selErr } = await supabase
      .from(table).select('id').eq('user_id', userId).maybeSingle();
    if (selErr) return { error: selErr };

    if (existing) {
      const { error } = await supabase
        .from(table)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return { error };
    }

    const { error } = await supabase.from(table).insert({
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    });
    return { error };
  } catch (e) {
    return { error: e };
  }
}

// ─── Commitment ─────────────────────────────────────────────
export async function saveCommitmentTime(hour, minute) {
  const userId = await uid();
  const existing = await getCommitmentTime();
  if (existing?.hour != null && existing?.minute != null) {
    return { ok: false, error: 'DNA_LOCKED' };
  }

  const now = new Date();
  const payload = {
    committed_hour:   hour,
    committed_minute: minute,
    committed_at:     now.toISOString(),
    streak_days:      0,
  };
  if (isLocalUserId(userId)) {
    await localSet(L.COMMIT, payload);
    return { ok: true };
  }
  await syncProfileTimezone();
  const { error } = await dbUpsert('commitment', userId, payload);
  if (error) {
    if (error.message?.includes('DNA_LOCKED')) {
      return { ok: false, error: 'DNA_LOCKED' };
    }
    console.warn('[storage] commitment remote failed — device cache', error?.message || error);
    await localSet(L.COMMIT, payload);
  }
  return { ok: true };
}

function mapCommitmentRow(row) {
  if (!row) return null;
  const out = {
    fridayTarget: row.friday_target_hour != null && row.friday_target_minute != null
      ? { hour: row.friday_target_hour, minute: row.friday_target_minute }
      : null,
    saturdayTarget: row.saturday_target_hour != null && row.saturday_target_minute != null
      ? { hour: row.saturday_target_hour, minute: row.saturday_target_minute }
      : null,
  };
  if (row.committed_hour != null && row.committed_minute != null) {
    out.hour = row.committed_hour;
    out.minute = row.committed_minute;
    out.setAt = row.committed_at;
  } else if (row.committed_at) {
    const d = new Date(row.committed_at);
    out.hour = d.getHours();
    out.minute = d.getMinutes();
    out.setAt = row.committed_at;
  }
  if (out.hour == null && !out.fridayTarget && !out.saturdayTarget) return null;
  return out;
}

export async function saveChallengeTarget(mode, hour, minute) {
  if (!isHmInChallengeWindow(mode, hour, minute)) {
    return { ok: false, error: 'OUT_OF_WINDOW' };
  }

  const existing = await getCommitmentTime();
  const prior = mode === 'friday' ? existing?.fridayTarget : existing?.saturdayTarget;
  if (prior) {
    return { ok: false, error: mode === 'friday' ? 'FRIDAY_DNA_LOCKED' : 'SATURDAY_DNA_LOCKED' };
  }

  const userId = await uid();
  const fields = mode === 'friday'
    ? { friday_target_hour: hour, friday_target_minute: minute }
    : { saturday_target_hour: hour, saturday_target_minute: minute };

  if (isLocalUserId(userId)) {
    const prev = (await localGet(L.COMMIT, null)) || {};
    await localSet(L.COMMIT, { ...prev, ...fields });
    return { ok: true };
  }

  await syncProfileTimezone();
  const { error } = await dbUpsert('commitment', userId, fields);
  if (error) {
    const msg = error.message || '';
    if (msg.includes('FRIDAY_DNA_LOCKED') || msg.includes('SATURDAY_DNA_LOCKED')) {
      return { ok: false, error: mode === 'friday' ? 'FRIDAY_DNA_LOCKED' : 'SATURDAY_DNA_LOCKED' };
    }
    console.warn('[storage] challenge target failed — device cache', msg);
    const prev = (await localGet(L.COMMIT, null)) || {};
    await localSet(L.COMMIT, { ...prev, ...fields });
  }
  return { ok: true };
}

export async function getCommitmentTime() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return mapCommitmentRow(await localGet(L.COMMIT, null));
  }
  const { data } = await supabase
    .from('commitment')
    .select(
      'committed_hour, committed_minute, committed_at, friday_target_hour, friday_target_minute, saturday_target_hour, saturday_target_minute',
    )
    .eq('user_id', userId)
    .maybeSingle();
  return mapCommitmentRow(data);
}

export function getMsUntilCommitment(commitment) {
  if (!commitment) return getMsUntilMidnight();

  const win = getStampWindowStatus();
  if (win.mode === 'friday' || win.mode === 'saturday') {
    const ms = getMsUntilActiveTarget(commitment);
    return ms > 0 ? ms : getMsUntilMidnight();
  }

  const now  = new Date();
  const next = new Date(now);
  next.setHours(commitment.hour, commitment.minute, 0, 0);

  const setAt    = commitment.setAt ? new Date(commitment.setAt) : null;
  const setToday = setAt && setAt.toDateString() === now.toDateString();

  if (next <= now || setToday) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// ─── Profile ───────────────────────────────────────────────
// profiles table columns: id, email, name, first_name, last_name, phone, date_of_birth, id_number_last4,
// avatar_style, subscription, lang, onboarding_complete, profile_intake_complete, joined_at, updated_at
const PROFILE_DB_COLUMNS = [
  'name', 'email',
  'first_name', 'last_name', 'phone', 'date_of_birth', 'id_number_last4',
  'avatar_style', 'subscription', 'lang',
  'onboarding_complete', 'profile_intake_complete',
  'terms_accepted_at', 'terms_version',
  'ai_memory',
];

export async function saveProfile(data) {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    const prev = (await localGet(L.PROF, null)) || {};
    await localSet(L.PROF, { ...prev, ...data, updated_at: new Date().toISOString() });
    return;
  }
  const dbPayload = {};
  for (const col of PROFILE_DB_COLUMNS) {
    if (data[col] !== undefined) dbPayload[col] = data[col];
  }
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, ...dbPayload, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

export async function getProfile() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return (await localGet(L.PROF, null)) || null;
  }
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data || null;
}

export async function saveAiMemory(newInsights) {
  if (!newInsights?.length) return;
  const userId = await uid();
  try {
    if (isLocalUserId(userId)) {
      const prev = (await localGet(L.PROF, null)) || {};
      const existing = prev.ai_memory?.insights || [];
      const merged = [...existing, ...newInsights].slice(-20);
      await localSet(L.PROF, { ...prev, ai_memory: { insights: merged, sessionCount: (prev.ai_memory?.sessionCount || 0) + 1 } });
      return;
    }
    const { data } = await supabase.from('profiles').select('ai_memory').eq('id', userId).maybeSingle();
    const existing = data?.ai_memory?.insights || [];
    const merged = [...existing, ...newInsights].slice(-20);
    await supabase.from('profiles').update({
      ai_memory: { insights: merged, sessionCount: (data?.ai_memory?.sessionCount || 0) + 1 },
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch { /* non-critical — memory update is best-effort */ }
}

// ─── Financial data ─────────────────────────────────────────
let _finCache = null;

export async function saveFinancialData(patch) {
  const userId = await uid();
  const existing = await getFinancialData();
  const merged = { ...existing, ...patch };
  _finCache = merged;
  await localSet(L.FIN, merged);
  if (isLocalUserId(userId)) return;
  const { error } = await dbUpsert('financial_data', userId, { data: merged });
  if (error) {
    console.warn('[storage] financial_data remote save failed — device cache', error?.message || error);
  }
}

export async function getFinancialData() {
  if (_finCache !== null) return _finCache;
  const userId = await uid();
  if (isLocalUserId(userId)) {
    const local = (await localGet(L.FIN, {})) || {};
    _finCache = local;
    return local;
  }
  try {
    const { data, error } = await supabase
      .from('financial_data').select('data').eq('user_id', userId).maybeSingle();
    if (!error && data?.data !== undefined && data?.data !== null) {
      const local = (await localGet(L.FIN, {})) || {};
      const merged = { ...data.data, ...local };
      _finCache = merged;
      return merged;
    }
    if (error) {
      console.warn('[storage] financial_data remote read:', error?.message || error);
    }
  } catch (e) {
    console.warn('[storage] financial_data read threw:', e?.message || e);
  }
  const local = (await localGet(L.FIN, {})) || {};
  _finCache = local;
  return local;
}

// ─── Onboarding state ────────────────────────────────────────
export async function saveOnboardingState(patch) {
  const userId = await uid();
  const existing = await getOnboardingState();
  const merged = { ...existing, ...patch };
  if (isLocalUserId(userId)) {
    await localSet(L.ONB, merged);
    return;
  }
  const { error } = await dbUpsert('onboarding_state', userId, {
    days_completed: merged.daysCompleted || [],
    daily_answers: merged,
  });
  if (error) {
    console.warn('[storage] onboarding_state remote save failed — device cache', error?.message || error);
    await localSet(L.ONB, merged);
  }
}

export async function getOnboardingState() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    const data = await localGet(L.ONB, null);
    if (!data) return { startDate: null, daysCompleted: [], profileGenerated: false, profileText: '' };
    return data;
  }
  try {
    const { data, error } = await supabase
      .from('onboarding_state').select('*').eq('user_id', userId).maybeSingle();
    if (!error && data) {
      return data.daily_answers || {
        startDate: null,
        daysCompleted: data.days_completed || [],
        profileGenerated: false,
        profileText: '',
      };
    }
    if (error) console.warn('[storage] onboarding_state remote read:', error?.message || error);
  } catch (e) {
    console.warn('[storage] onboarding_state read threw:', e?.message || e);
  }
  // Real Supabase users: never fall back to localStorage — stale local data from a
  // previous account would show wrong day progress for a freshly registered user.
  return { startDate: null, daysCompleted: [], profileGenerated: false, profileText: '' };
}

export async function markDayComplete(day) {
  const userId = await uid();
  const state = await getOnboardingState();
  if (!state.daysCompleted) state.daysCompleted = [];
  if (!state.daysCompleted.includes(day)) state.daysCompleted.push(day);
  if (!state.startDate) state.startDate = new Date().toISOString();
  if (isLocalUserId(userId)) {
    await localSet(L.ONB, state);
    return;
  }
  const { error } = await dbUpsert('onboarding_state', userId, {
    days_completed: state.daysCompleted,
    daily_answers: state,
  });
  if (error) {
    console.warn('[storage] markDayComplete remote failed — device cache', error?.message || error);
    await localSet(L.ONB, state);
  }
}

export async function isOnboardingComplete() {
  const state = await getOnboardingState();
  return (state.daysCompleted || []).length >= 7 || state.profileGenerated === true;
}

// ─── Chat history ────────────────────────────────────────────
export async function saveChatHistory(messages) {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    await localSet(L.CHAT, messages);
    return;
  }
  const { error } = await supabase.from('chat_history').upsert(
    { user_id: userId, messages, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) {
    console.warn('[storage] chat_history remote failed — device cache', error?.message || error);
    await localSet(L.CHAT, messages);
  }
}

export async function getChatHistory() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return (await localGet(L.CHAT, [])) || [];
  }
  const { data } = await supabase
    .from('chat_history').select('messages').eq('user_id', userId).maybeSingle();
  return data?.messages || [];
}

export async function appendChatMessage(message) {
  const history = await getChatHistory();
  history.push(message);
  if (history.length > 200) history.splice(0, history.length - 200);
  await saveChatHistory(history);
}

// ─── Daily log ────────────────────────────────────────────────
export async function saveDailyLog(day, logData) {
  const state = await getOnboardingState();
  if (!state.dailyLog) state.dailyLog = {};
  state.dailyLog[day] = { ...state.dailyLog[day], ...logData, savedAt: new Date().toISOString() };
  await saveOnboardingState(state);
}

export async function getDailyLog() {
  const state = await getOnboardingState();
  return state.dailyLog || {};
}

// ─── Game log ─────────────────────────────────────────────────

// Called when a game genuinely finishes — returns a single-use token
export async function completeGame({ day, gameKey, gameScore, startedAt, durationMs }) {
  const userId = await uid();
  if (isLocalUserId(userId)) return { token: 'local', ok: true };

  const monthKey = new Date().toISOString().slice(0, 7);
  const secret   = process.env.EXPO_PUBLIC_APP_SECRET || '';

  try {
    const { data, error } = await supabase.functions.invoke('game-complete', {
      body: { day, month_key: monthKey, game_key: gameKey, game_score: gameScore, started_at: startedAt, duration_ms: durationMs },
      headers: { 'x-vermillion-secret': secret },
    });
    if (data?.error) {
      return { token: null, ok: false, error: data.error, message: data.message, minMs: data.minMs };
    }
    if (error) throw error;
    if (!data?.token) return { token: null, ok: false, error: 'NO_TOKEN' };
    return { token: data.token, ok: true };
  } catch (e) {
    const parsed = parseGameCompleteError(e, null);
    console.warn('[storage] game-complete failed:', parsed.code, parsed.message || '');
    return { token: null, ok: false, error: parsed.code, message: parsed.message };
  }
}

export async function saveGameStamp(day, gameToken) {
  const userId   = await uid();
  const monthKey = new Date().toISOString().slice(0, 7);

  if (isLocalUserId(userId)) {
    const existing = await getGameLog();
    existing[day] = { msDiff: 0, score: 1, stampedAt: new Date().toISOString() };
    await localSet(L.GAME, existing);
    return { score: 1, ms_diff: 0, ok: true };
  }

  if (!gameToken) {
    console.warn('[storage] saveGameStamp: no game token — stamp blocked');
    return { score: 0, ms_diff: 0, ok: false, error: 'GAME_TOKEN_REQUIRED' };
  }

  try {
    const clientTimezone = await syncProfileTimezone();
    const { data, error } = await supabase.functions.invoke('stamp', {
      body: {
        day,
        month_key: monthKey,
        game_token: gameToken,
        client_timezone: clientTimezone,
      },
      headers: { 'x-vermillion-secret': process.env.EXPO_PUBLIC_APP_SECRET || '' },
    });

    if (data?.error) {
      return { score: 0, ms_diff: 0, ok: false, error: data.error, message: data.message, next_open: data.next_open };
    }
    if (error) throw error;

    const stampedAt = new Date().toISOString();
    const existing = await getGameLog();
    existing[day] = { msDiff: data.ms_diff, score: data.score, stampedAt };
    await localSet(L.GAME, existing);

    return { score: data.score, ms_diff: data.ms_diff, ok: true, window_mode: data.window_mode };
  } catch (e) {
    const parsed = parseStampInvokeError(e, null);
    console.warn('[storage] stamp edge function failed:', parsed.code, parsed.message || '');
    return { score: 0, ms_diff: 0, ok: false, error: parsed.code, message: parsed.message };
  }
}

/** Sync IANA timezone to profile for Fri/Sat window checks on server */
export async function syncProfileTimezone() {
  const userId = await uid();
  if (isLocalUserId(userId)) return;
  let tz = 'UTC';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch { /* keep UTC */ }
  const { error } = await supabase.from('profiles').update({ timezone: tz }).eq('id', userId);
  if (error) console.warn('[storage] syncProfileTimezone:', error.message);
  return tz;
}

export async function getLeaderboard(monthKey) {
  const key = monthKey || new Date().toISOString().slice(0, 7);
  try {
    const { data, error } = await supabase
      .from('daily_stamps')
      .select('user_id, score, ms_diff, profiles(name, avatar_style)')
      .eq('month_key', key);
    if (error || !data) return [];

    const grouped = {};
    for (const row of data) {
      const uid = row.user_id;
      if (!grouped[uid]) {
        const rawStyle = row.profiles?.avatar_style;
        const avatarStyle = typeof rawStyle === 'string' ? (() => { try { return JSON.parse(rawStyle); } catch { return {}; } })() : (rawStyle || {});
        grouped[uid] = { user_id: uid, name: row.profiles?.name || 'אנונימי', avatar_style: avatarStyle, total_score: 0, total_ms_diff: 0, days: 0 };
      }
      grouped[uid].total_score    += row.score;
      grouped[uid].total_ms_diff  += row.ms_diff;
      grouped[uid].days++;
    }
    return Object.values(grouped)
      .sort((a, b) => b.total_score - a.total_score || a.total_ms_diff - b.total_ms_diff)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  } catch (e) {
    console.warn('[storage] getLeaderboard:', e?.message || e);
    return [];
  }
}

export async function getLeaderboardWeekly() {
  const now = new Date();
  // ISO week: Monday = day 0
  const dayOfWeek = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const monthKey = now.toISOString().slice(0, 7);

  try {
    const { data, error } = await supabase
      .from('daily_stamps')
      .select('user_id, score, ms_diff, stamped_at, profiles(name, avatar_style)')
      .eq('month_key', monthKey);
    if (error || !data) return [];

    // Count total month stamps per user (minimum participation check)
    const monthDays = {};
    for (const row of data) monthDays[row.user_id] = (monthDays[row.user_id] || 0) + 1;

    // Filter to current week's stamps only
    const weekRows = data.filter(row => {
      if (!row.stamped_at) return false;
      const ts = new Date(row.stamped_at);
      return ts >= weekStart && ts < weekEnd;
    });

    // Group by user — require ≥7 stamps this month (past the intro week)
    const grouped = {};
    for (const row of weekRows) {
      const uid = row.user_id;
      if ((monthDays[uid] || 0) < 7) continue;
      if (!grouped[uid]) {
        const raw = row.profiles?.avatar_style;
        const avatarStyle = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : (raw || {});
        grouped[uid] = {
          user_id: uid,
          name: row.profiles?.name || 'אנונימי',
          avatar_style: avatarStyle,
          week_score: 0,
          week_days: 0,
          month_days: monthDays[uid],
        };
      }
      grouped[uid].week_score += row.score;
      grouped[uid].week_days++;
    }

    // Sort: week_score weighted by month participation ratio
    return Object.values(grouped)
      .sort((a, b) => {
        const wA = a.week_score * (1 + a.month_days / 30);
        const wB = b.week_score * (1 + b.month_days / 30);
        return wB - wA;
      })
      .slice(0, 5)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  } catch (e) {
    console.warn('[storage] getLeaderboardWeekly:', e?.message || e);
    return [];
  }
}

export async function getGameLog() {
  return (await localGet(L.GAME, {})) || {};
}

export async function saveGameSession(gameKey, category, score) {
  const sessions = await getGameSessions();
  sessions.push({ gameKey, category, score, playedAt: new Date().toISOString() });
  if (sessions.length > 50) sessions.splice(0, sessions.length - 50);
  await localSet(L.SESSIONS, sessions);
}

export async function getGameSessions() {
  return (await localGet(L.SESSIONS, [])) || [];
}

// ─── Voice unlock ─────────────────────────────────────────────
export async function getVoiceUnlocked() {
  return localGet(L.VOICE, false);
}

export async function setVoiceUnlocked() {
  await localSet(L.VOICE, true);
}

// ─── Avatar style (localStorage backup — web only) ────────────
const AVATAR_STYLE_KEY = '@vermillion/avatar_style';

export function saveLocalAvatarStyle(userId, avatarStyle) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${AVATAR_STYLE_KEY}/${userId}`, JSON.stringify(avatarStyle));
  } catch {}
}

export function getLocalAvatarStyle(userId) {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${AVATAR_STYLE_KEY}/${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Clear all (re-register) ──────────────────────────────────
export async function clearAllData(knownUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const remoteId = knownUserId || session?.user?.id;

  _finCache = null;
  await localRemoveAll();

  // Clear ALL user-specific registration flags — iterate keys so we don't depend on remoteId
  // (delete_user() may kill the session before we get here, making remoteId null)
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (
          k.startsWith('@vermillion/intake_complete/') ||
          k.startsWith('@vermillion/onboarding_complete/') ||
          k.startsWith('@vermillion/terms_accepted/') ||
          k.startsWith(`${AVATAR_STYLE_KEY}/`)
        )) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  await clearDeviceLocalIdentity();

  if (remoteId && !isLocalUserId(remoteId)) {
    // Reset registration flags FIRST — so if the row deletion fails, re-login still routes to CompleteProfile
    try {
      await supabase.from('profiles').update({
        profile_intake_complete: false,
        onboarding_complete: false,
      }).eq('id', remoteId);
    } catch (_) {}

    try {
      await Promise.all([
        supabase.from('financial_data').delete().eq('user_id', remoteId),
        supabase.from('onboarding_state').delete().eq('user_id', remoteId),
        supabase.from('chat_history').delete().eq('user_id', remoteId),
        supabase.from('commitment').delete().eq('user_id', remoteId),
        supabase.from('game_log').delete().eq('user_id', remoteId),
        supabase.from('daily_stamps').delete().eq('user_id', remoteId),
      ]);
      await supabase.from('profiles').delete().eq('id', remoteId);
    } catch (_) { /* ignore */ }
  }

  await supabase.auth.signOut();
}
