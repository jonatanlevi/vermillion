/**
 * Vercel Edge Function — Agent runner
 * Handles non-streaming calls from the 4 AI agents (Analyst, Strategist, Psychologist, Coach, Router)
 * Mirrors api/chat.js but returns a single JSON response instead of streaming.
 */
export const config = { runtime: 'edge' };

// Map internal agent model IDs → actual Groq model names
const MODEL_MAP = {
  // Router + Coach (fast, light)
  'groq-fast':       'llama-3.3-70b-versatile',
  // Analyst (logic & numbers)
  'groq-analyst':    'llama-3.3-70b-versatile',
  // Strategist (planning)
  'groq-strategist': 'llama-3.3-70b-versatile',
  // Psychologist (empathy)
  'groq-psychologist': 'llama-3.3-70b-versatile',
};

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Bad JSON' }), { status: 400 });
  }

  const { systemPrompt, userMessage, model, temperature = 0.4, maxTokens = 350 } = body || {};

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'missing userMessage' }), { status: 400 });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });
  }

  const groqModel = MODEL_MAP[model] || DEFAULT_MODEL;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('[agent] groq error:', err);
      return new Response(JSON.stringify({ error: 'groq_error', detail: err }), { status: 502 });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[agent] fetch error:', err.message);
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 500 });
  }
}
