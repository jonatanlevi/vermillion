import { supabase, getOrCreateUser } from './supabase';

// ─── helpers ───────────────────────────────────────────────
async function uid() {
  const user = await getOrCreateUser();
  return user.id;
}

async function dbUpsert(table, userId, payload) {
  const { data: existing } = await supabase
    .from(table).select('id').eq('user_id', userId).maybeSingle();
  if (existing) {
    return supabase.from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
  return supabase.from(table)
    .insert({ user_id: userId, ...payload, updated_at: new Date().toISOString() });
}

// ─── Commitment ─────────────────────────────────────────────
export async function saveCommitmentTime() {
  const userId = await uid();
  const now = new Date();
  await dbUpsert('commitment', userId, {
    committed_at: now.toISOString(),
    streak_days: 0,
  });
}

export async function getCommitmentTime() {
  const userId = await uid();
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
export async function saveProfile(data) {
  const userId = await uid();
  await supabase.from('profiles').upsert(
    { id: userId, ...data, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
}

export async function getProfile() {
  const userId = await uid();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data || null;
}

// ─── Financial data ─────────────────────────────────────────
export async function saveFinancialData(patch) {
  const userId = await uid();
  const existing = await getFinancialData();
  await dbUpsert('financial_data', userId, { data: { ...existing, ...patch } });
}

export async function getFinancialData() {
  const userId = await uid();
  const { data } = await supabase
    .from('financial_data').select('data').eq('user_id', userId).maybeSingle();
  return data?.data || {};
}

// ─── Onboarding state ────────────────────────────────────────
export async function saveOnboardingState(patch) {
  const userId = await uid();
  const existing = await getOnboardingState();
  const merged = { ...existing, ...patch };
  await dbUpsert('onboarding_state', userId, {
    days_completed: merged.daysCompleted || [],
    daily_answers: merged,
  });
}

export async function getOnboardingState() {
  const userId = await uid();
  const { data } = await supabase
    .from('onboarding_state').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return { startDate: null, daysCompleted: [], profileGenerated: false, profileText: '' };
  return data.daily_answers || {
    startDate: null,
    daysCompleted: data.days_completed || [],
    profileGenerated: false,
    profileText: '',
  };
}

export async function markDayComplete(day) {
  const userId = await uid();
  const state = await getOnboardingState();
  if (!state.daysCompleted.includes(day)) state.daysCompleted.push(day);
  if (!state.startDate) state.startDate = new Date().toISOString();
  await dbUpsert('onboarding_state', userId, {
    days_completed: state.daysCompleted,
    daily_answers: state,
  });
}

export async function isOnboardingComplete() {
  const state = await getOnboardingState();
  return (state.daysCompleted || []).length >= 7;
}

// ─── Chat history ────────────────────────────────────────────
export async function saveChatHistory(messages) {
  const userId = await uid();
  await dbUpsert('chat_history', userId, { messages });
}

export async function getChatHistory() {
  const userId = await uid();
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
  await dbUpsert('game_log', userId, { entries: existing });
}

export async function getGameLog() {
  const userId = await uid();
  const { data } = await supabase
    .from('game_log').select('entries').eq('user_id', userId).maybeSingle();
  return data?.entries || {};
}

// ─── Clear all (re-register) ──────────────────────────────────
export async function clearAllData() {
  try {
    const userId = await uid();
    await Promise.all([
      supabase.from('financial_data').delete().eq('user_id', userId),
      supabase.from('onboarding_state').delete().eq('user_id', userId),
      supabase.from('chat_history').delete().eq('user_id', userId),
      supabase.from('commitment').delete().eq('user_id', userId),
      supabase.from('game_log').delete().eq('user_id', userId),
    ]);
    await supabase.from('profiles').delete().eq('id', userId);
  } catch (_) { /* ignore if no user yet */ }
  await supabase.auth.signOut();
}
