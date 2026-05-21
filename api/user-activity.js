export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { secret, userId } = body || {};

  const APP_SECRET = process.env.APP_SECRET;
  if (secret !== APP_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!userId) return new Response(JSON.stringify({ error: 'missing userId' }), { status: 400 });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_KEY) return new Response(JSON.stringify({ error: 'no service key' }), { status: 500 });

  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  async function query(table, filter, order = '') {
    const orderStr = order ? `&order=${encodeURIComponent(order)}` : '';
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}${orderStr}&limit=50`;
    const res = await fetch(url, { headers });
    if (!res.ok) return { error: await res.text() };
    return res.json();
  }

  const safeId = encodeURIComponent(userId);
  const [profile, commitment, stamps, chats, games] = await Promise.all([
    query('profiles', `id=eq.${safeId}&select=*`),
    query('commitment', `user_id=eq.${safeId}&select=*`, 'committed_at.desc'),
    query('daily_stamps', `user_id=eq.${safeId}&select=*`, 'stamped_at.desc'),
    query('chat_history', `user_id=eq.${safeId}&select=*`, 'id.desc'),
    query('game_sessions', `user_id=eq.${safeId}&select=*`, 'started_at.desc'),
  ]);

  const profileData = Array.isArray(profile) ? profile[0] : profile;
  const commitmentData = Array.isArray(commitment) ? commitment[0] : commitment;
  const chatMessages = Array.isArray(chats) ? (chats[0]?.messages || []) : [];

  const chatStats = chatMessages.length > 0 ? {
    total: chatMessages.length,
    byUser: chatMessages.filter(m => m.role === 'user').length,
    byAI: chatMessages.filter(m => m.role === 'assistant').length,
    avgResponseMs: Math.round(
      chatMessages.filter(m => m.responseMs).reduce((s, m) => s + m.responseMs, 0) /
      (chatMessages.filter(m => m.responseMs).length || 1)
    ),
    avgTypingMs: Math.round(
      chatMessages.filter(m => m.typingMs).reduce((s, m) => s + m.typingMs, 0) /
      (chatMessages.filter(m => m.typingMs).length || 1)
    ),
    avgCharsPerSec: Math.round(
      chatMessages.filter(m => m.charsPerSec).reduce((s, m) => s + m.charsPerSec, 0) /
      (chatMessages.filter(m => m.charsPerSec).length || 1)
    ),
  } : null;

  return new Response(JSON.stringify({
    profile: profileData,
    commitment: commitmentData,
    stamps,
    chatMessages,
    chatStats,
    gameSessions: games,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
