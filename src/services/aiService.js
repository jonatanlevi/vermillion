import { mockChatWithAI, resetMockConversation } from './mockAI';
import { buildSystemPrompt } from './aiPrompts';
import { CONFIG } from '../config';

let chatHistory = [];
let _ollamaAvailable = null;

async function checkOllama() {
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    const res = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    });
    _ollamaAvailable = res.ok;
  } catch {
    _ollamaAvailable = false;
  }
  return _ollamaAvailable;
}

export async function getAIStatus() {
  _ollamaAvailable = null;
  return checkOllama();
}

export function resetConversation() {
  chatHistory = [];
  resetMockConversation();
}

export async function chatWithAI(userMessage, userData, onPartial) {
  const systemPrompt = buildSystemPrompt(userData);

  chatHistory.push({ role: 'user', content: userMessage });
  if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);

  const ollamaUp = await checkOllama();
  if (!ollamaUp) {
    const result = await mockChatWithAI(userMessage, userData, onPartial);
    if (result) chatHistory.push({ role: 'assistant', content: result });
    return result;
  }

  const response = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    signal: AbortSignal.timeout(90000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
      ],
      options: {
        num_ctx:     CONFIG.AI_NUM_CTX,
        num_predict: CONFIG.AI_MAX_TOKENS,
        temperature: CONFIG.AI_TEMPERATURE,
        stop: ['User:', 'Human:', '用户:', '请', '您'],
      },
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

  let fullResponse = '';

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          const token = obj.message?.content || '';
          if (token) {
            fullResponse += token;
            onPartial?.(fullResponse);
          }
        } catch { /* partial JSON line — skip */ }
      }
    }
  } else {
    const data = await response.json();
    fullResponse = data.message?.content || data.response || 'שגיאה בתשובה';
    onPartial?.(fullResponse);
  }

  // Chinese hallucination guard → fallback to mock
  if (fullResponse && /[一-鿿]/.test(fullResponse)) {
    chatHistory.pop();
    const fallback = await mockChatWithAI(userMessage, userData, onPartial);
    if (fallback) chatHistory.push({ role: 'user', content: userMessage });
    if (fallback) chatHistory.push({ role: 'assistant', content: fallback });
    return fallback;
  }

  if (fullResponse) chatHistory.push({ role: 'assistant', content: fullResponse });
  return fullResponse;
}
