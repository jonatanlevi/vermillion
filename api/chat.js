export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { messages, systemPrompt } = body || {};
  if (!messages?.length) return new Response(JSON.stringify({ error: 'missing messages' }), { status: 400 });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });

  const groqMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: 600,
      temperature: 0.4,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error('[groq] error:', err);
    return new Response(JSON.stringify({ error: 'groq_error' }), { status: 502 });
  }

  return new Response(groqRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
