export const config = { runtime: 'edge' };

import { trackGroqCost } from './_shared/trackCost.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { messages, systemPrompt, taskType } = body || {};
  if (!messages?.length) return new Response(JSON.stringify({ error: 'missing messages' }), { status: 400 });

  // ── Model routing by task type ─────────────────────────────────
  // taskType: 'coaching' | 'quick_ack' | 'profile_reveal'
  // profile_reveal → Claude Opus 4.7 (Anthropic) — TODO
  // quick_ack      → llama-3.1-8b-instant (Groq)
  // coaching       → llama-3.3-70b-versatile (Groq)
  const isQuickAck = taskType === 'quick_ack';
  const groqModel  = isQuickAck ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
  const maxTokens  = isQuickAck ? 120 : 600;

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });

  const groqMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  let groqRes;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: groqModel,
        messages: groqMessages,
        max_tokens: maxTokens,
        temperature: 0.4,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });
  } catch (e) {
    console.error('[groq] network error:', e.message);
    return new Response(JSON.stringify({ error: 'groq_network_error' }), { status: 502 });
  }

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error('[groq] error:', err);
    return new Response(JSON.stringify({ error: 'groq_error' }), { status: 502 });
  }

  // Pipe stream through TransformStream — intercept last usage chunk for cost tracking
  const { readable, writable } = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      // Parse usage from last SSE chunks
      try {
        const text = new TextDecoder().decode(chunk);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          const parsed = JSON.parse(line.slice(6));
          const usage = parsed?.x_groq?.usage || parsed?.usage;
          if (usage?.prompt_tokens) {
            trackGroqCost(SUPABASE_URL, SUPABASE_KEY, groqModel, usage, taskType || 'coaching');
          }
        }
      } catch { /* partial chunk — ignore */ }
    },
  });

  groqRes.body.pipeTo(writable).catch(() => {});

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
