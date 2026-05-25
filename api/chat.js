export const config = { runtime: 'edge' };

import { trackGroqCost } from './_shared/trackCost.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const GROQ_API_KEY       = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TOGETHER_API_KEY   = process.env.TOGETHER_API_KEY;

// ── Model selection per provider ──────────────────────────────────────────
const MODELS_QUICK = {
  groq:       'llama-3.1-8b-instant',
  openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
  together:   'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
};
const MODELS_COACHING = {
  groq:       'llama-3.3-70b-versatile',
  openrouter: 'google/gemini-2.0-flash-exp:free',   // smart + free on OR
  together:   'meta-llama/Llama-3.3-70B-Instruct-Turbo',
};

function buildProviderList(isQuickAck) {
  const models = isQuickAck ? MODELS_QUICK : MODELS_COACHING;
  const maxTokens = isQuickAck ? 120 : 600;
  const list = [];

  const groqEntry = GROQ_API_KEY ? {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: GROQ_API_KEY,
    model: models.groq,
    maxTokens,
    isGroq: true,
  } : null;

  const orEntry = OPENROUTER_API_KEY ? {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: OPENROUTER_API_KEY,
    model: models.openrouter,
    maxTokens,
    extraHeaders: {
      'HTTP-Referer': 'https://vermillion-ashen.vercel.app',
      'X-Title': 'VerMillion',
    },
  } : null;

  const togetherEntry = TOGETHER_API_KEY ? {
    name: 'together',
    url: 'https://api.together.xyz/v1/chat/completions',
    key: TOGETHER_API_KEY,
    model: models.together,
    maxTokens,
  } : null;

  if (isQuickAck) {
    // quick_ack: Groq first (fastest for short replies)
    if (groqEntry)   list.push(groqEntry);
    if (orEntry)     list.push(orEntry);
    if (togetherEntry) list.push(togetherEntry);
  } else {
    // coaching: OpenRouter Gemini first (best quality free), Groq fallback
    if (orEntry)     list.push(orEntry);
    if (groqEntry)   list.push(groqEntry);
    if (togetherEntry) list.push(togetherEntry);
  }

  return list;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { messages, systemPrompt, taskType } = body || {};
  if (!messages?.length) return new Response(JSON.stringify({ error: 'missing messages' }), { status: 400 });

  const isQuickAck = taskType === 'quick_ack';
  const providers  = buildProviderList(isQuickAck);

  if (!providers.length) return new Response(JSON.stringify({ error: 'no API keys configured' }), { status: 500 });

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  for (const provider of providers) {
    let res;
    try {
      res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.extraHeaders || {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: allMessages,
          max_tokens: provider.maxTokens,
          temperature: 0.4,
          stream: true,
          ...(provider.isGroq ? { stream_options: { include_usage: true } } : {}),
        }),
      });
    } catch (e) {
      console.error(`[${provider.name}] network error:`, e.message);
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`[${provider.name}] ${res.status}:`, err.slice(0, 200));
      continue;
    }

    // Pass stream through — intercept Groq usage chunks for cost tracking
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        if (provider.isGroq) {
          try {
            const text = new TextDecoder().decode(chunk);
            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
              const parsed = JSON.parse(line.slice(6));
              const usage = parsed?.x_groq?.usage || parsed?.usage;
              if (usage?.prompt_tokens) {
                trackGroqCost(SUPABASE_URL, SUPABASE_KEY, provider.model, usage, taskType || 'coaching');
              }
            }
          } catch { /* partial chunk */ }
        }
      },
    });

    res.body.pipeTo(writable).catch(() => {});

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-Provider': provider.name,
      },
    });
  }

  return new Response(JSON.stringify({ error: 'all_providers_failed' }), { status: 502 });
}
