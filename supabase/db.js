import { supabase } from '../src/services/supabase';

// ─── Onboarding answers ────────────────────────────────────
export async function saveAnswer(userId, day, questionKey, answer) {
  const { error } = await supabase
    .from('onboarding_answers')
    .upsert({ user_id: userId, day, question_key: questionKey, answer },
             { onConflict: 'user_id,day,question_key' });
  if (error) throw error;
}

export async function getAnswers(userId) {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true });
  if (error) throw error;
  return data;
}

// ─── Game scores ───────────────────────────────────────────
export async function saveGameScore(userId, gameType, { score, stamps, accuracyMs }) {
  const { error } = await supabase
    .from('game_scores')
    .insert({ user_id: userId, game_type: gameType, score, stamps, accuracy_ms: accuracyMs });
  if (error) throw error;
}

export async function getMyScores(userId) {
  const { data, error } = await supabase
    .from('game_scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeaderboard(gameType, limit = 20) {
  const { data, error } = await supabase
    .from('game_scores')
    .select('user_id, score, stamps, played_at, profiles(name)')
    .eq('game_type', gameType)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ─── Daily log ─────────────────────────────────────────────
export async function saveDailyLog(userId, day, { coachingAnswer, challengeDone, multiplier }) {
  const { error } = await supabase
    .from('daily_logs')
    .upsert({
      user_id: userId, day,
      coaching_answer: coachingAnswer,
      challenge_done:  challengeDone,
      multiplier,
    }, { onConflict: 'user_id,day' });
  if (error) throw error;
}

export async function getDailyLogs(userId) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('day', { ascending: true });
  if (error) throw error;
  return data;
}
