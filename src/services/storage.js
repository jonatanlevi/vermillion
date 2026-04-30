import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getOrCreateUser, isLocalUserId, clearDeviceLocalIdentity } from './supabase';

const L = {
  FIN:    '@vermillion/local/financial',
  ONB:    '@vermillion/local/onboarding',
  CHAT:   '@vermillion/local/chat',
  COMMIT: '@vermillion/local/commitment',
  GAME:   '@vermillion/local/gamelog',
  PROF:   '@vermillion/local/profile',
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
  const now = new Date();
  if (hour !== undefined && minute !== undefined) {
    now.setHours(hour, minute, 0, 0);
  }
  const payload = {
    committed_at: now.toISOString(),
    streak_days: 0,
  };
  if (isLocalUserId(userId)) {
    await localSet(L.COMMIT, payload);
    return;
  }
  const { error } = await dbUpsert('commitment', userId, payload);
  if (error) {
    console.warn('[storage] commitment remote failed — device cache', error?.message || error);
    await localSet(L.COMMIT, payload);
  }
}

export async function getCommitmentTime() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    const row = await localGet(L.COMMIT, null);
    if (!row?.committed_at) return null;
    const d = new Date(row.committed_at);
    return { hour: d.getHours(), minute: d.getMinutes(), setAt: row.committed_at };
  }
  const { data } = await supabase
    .from('commitment').select('committed_at').eq('user_id', userId).maybeSingle();
  if (!data?.committed_at) return null;
  const d = new Date(data.committed_at);
  return { hour: d.getHours(), minute: d.getMinutes(), setAt: data.committed_at };
}

export function getMsUntilCommitment(commitment) {
  if (!commitment) return getMsUntilMidnight();
  const now = new Date();
  const next = new Date(now);
  next.setHours(commitment.hour, commitment.minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// ─── Profile ───────────────────────────────────────────────
// profiles table columns: id, email, name, avatar_style, subscription, lang, onboarding_complete, joined_at, updated_at
const PROFILE_DB_COLUMNS = ['name', 'email', 'avatar_style', 'subscription', 'lang', 'onboarding_complete'];

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
  await supabase.from('profiles').upsert(
    { id: userId, ...dbPayload, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
}

export async function getProfile() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return (await localGet(L.PROF, null)) || null;
  }
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data || null;
}

// ─── Financial data ─────────────────────────────────────────
export async function saveFinancialData(patch) {
  const userId = await uid();
  const existing = await getFinancialData();
  const merged = { ...existing, ...patch };
  if (isLocalUserId(userId)) {
    await localSet(L.FIN, merged);
    return;
  }
  const { error } = await dbUpsert('financial_data', userId, { data: merged });
  if (error) {
    console.warn('[storage] financial_data remote save failed — device cache', error?.message || error);
    await localSet(L.FIN, merged);
  }
}

export async function getFinancialData() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return (await localGet(L.FIN, {})) || {};
  }
  try {
    const { data, error } = await supabase
      .from('financial_data').select('data').eq('user_id', userId).maybeSingle();
    if (!error && data?.data !== undefined && data?.data !== null) {
      return data.data;
    }
    if (error) {
      console.warn('[storage] financial_data remote read:', error?.message || error);
    }
  } catch (e) {
    console.warn('[storage] financial_data read threw:', e?.message || e);
  }
  const local = await localGet(L.FIN, {});
  return local || {};
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
  const raw = await localGet(L.ONB, null);
  if (!raw) return { startDate: null, daysCompleted: [], profileGenerated: false, profileText: '' };
  return raw;
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
  return (state.daysCompleted || []).length >= 7;
}

// ─── Chat history ────────────────────────────────────────────
export async function saveChatHistory(messages) {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    await localSet(L.CHAT, messages);
    return;
  }
  const { error } = await dbUpsert('chat_history', userId, { messages });
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
export async function saveGameStamp(day, accuracyMs) {
  const userId = await uid();
  const existing = await getGameLog();
  existing[day] = { accuracyMs, stampedAt: new Date().toISOString() };
  if (isLocalUserId(userId)) {
    await localSet(L.GAME, existing);
    return;
  }
  const { error } = await dbUpsert('game_log', userId, { entries: existing });
  if (error) {
    console.warn('[storage] game_log remote failed — device cache', error?.message || error);
    await localSet(L.GAME, existing);
  }
}

export async function getGameLog() {
  const userId = await uid();
  if (isLocalUserId(userId)) {
    return (await localGet(L.GAME, {})) || {};
  }
  const { data } = await supabase
    .from('game_log').select('entries').eq('user_id', userId).maybeSingle();
  return data?.entries || {};
}

// ─── Clear all (re-register) ──────────────────────────────────
export async function clearAllData() {
  const { data: { session } } = await supabase.auth.getSession();
  const remoteId = session?.user?.id;

  await localRemoveAll();
  await clearDeviceLocalIdentity();

  if (remoteId && !isLocalUserId(remoteId)) {
    try {
      await Promise.all([
        supabase.from('financial_data').delete().eq('user_id', remoteId),
        supabase.from('onboarding_state').delete().eq('user_id', remoteId),
        supabase.from('chat_history').delete().eq('user_id', remoteId),
        supabase.from('commitment').delete().eq('user_id', remoteId),
        supabase.from('game_log').delete().eq('user_id', remoteId),
      ]);
      await supabase.from('profiles').delete().eq('id', remoteId);
    } catch (_) { /* ignore */ }
  }

  await supabase.auth.signOut();
}
