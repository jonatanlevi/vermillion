/**
 * Core agent runner — calls the Vercel /api/agent edge function (Groq backend)
 * Returns full response string (no streaming; agents complete before synthesis)
 */
const AGENT_TIMEOUT_MS = 15000;

export async function runAgent({ model, systemPrompt, userMessage, temperature = 0.4, maxTokens = 350 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${origin}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        systemPrompt,
        userMessage,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) throw new Error(`Agent error: ${response.status}`);

    const data = await response.json();
    return data.content || '';
  } catch (err) {
    if (err.name !== 'AbortError') console.error(`[Agent ${model}] failed:`, err.message);
    return '';
  } finally {
    clearTimeout(timer);
  }
}
