/**
 * Claude Bridge — endpoint פנימי שמאפשר ל-Claude Code לדבר עם VerMillion AI.
 * לא מוצג למשתמשים. מאובטח עם APP_SECRET.
 */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { message, secret, systemPrompt } = body || {};

  const APP_SECRET = process.env.APP_SECRET;
  if (!APP_SECRET || secret !== APP_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!message) return new Response(JSON.stringify({ error: 'missing message' }), { status: 400 });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'GROQ_API_KEY missing' }), { status: 500 });

  const sys = systemPrompt || `אתה VerMillion — יועץ פיננסי אישי לישראלים.
אתה מדבר עברית בלבד. אתה חם, ישיר, ומעשי.
אתה עוזר לאנשים לנהל כסף טוב יותר — תקציב, חובות, חיסכון, השקעות.
אתה לא נותן ייעוץ פיננסי מורשה. אתה מאמן אישי לכסף.`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: sys },
        { role: 'user',   content: message },
      ],
      max_tokens: 600,
      temperature: 0.4,
      stream: false,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(JSON.stringify({ error: 'groq_error', detail: err }), { status: 502 });
  }

  const data = await groqRes.json();
  const reply = data.choices?.[0]?.message?.content ?? '';

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
