import { CONFIG } from '../../config';

/**
 * Core agent runner — calls Ollama with given model + system prompt
 * Returns full response string (no streaming, agents complete before next)
 */
const AGENT_TIMEOUT_MS = 12000;

export async function runAgent({ model, systemPrompt, userMessage, temperature = 0.4, maxTokens = 250 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const response = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        options: {
          num_ctx: 2048,
          num_predict: maxTokens,
          temperature,
          stop: ['User:', 'Human:', '用户:'],
        },
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Agent error: ${response.status}`);

    const data = await response.json();
    return data.message?.content || '';
  } catch (err) {
    if (err.name !== 'AbortError') console.error(`[Agent ${model}] failed:`, err.message);
    return '';
  } finally {
    clearTimeout(timer);
  }
}
