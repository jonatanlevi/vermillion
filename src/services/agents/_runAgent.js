import { CONFIG } from '../../config';

/**
 * Core agent runner — calls Ollama with given model + system prompt
 * Returns full response string (no streaming, agents complete before next)
 */
export async function runAgent({ model, systemPrompt, userMessage, temperature = 0.4, maxTokens = 250 }) {
  try {
    const response = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error(`[Agent ${model}] failed:`, err.message);
    return '';
  }
}
