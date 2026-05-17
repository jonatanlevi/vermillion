import { mockChatWithAI, resetMockConversation } from './mockAI';
import { buildSystemPrompt } from './aiPrompts';
import { buildPersonalizedCoachingContext } from './personalizationAgent';
import { validateResponse, shouldFallback } from './validatorAgent';

let chatHistory = [];

/** Always returns true — Groq is cloud-based, no local check needed */
export async function getAIStatus() {
  return true;
}

export function resetConversation() {
  chatHistory = [];
  resetMockConversation();
}

export async function chatWithAI(userMessage, userData, onPartial, coachingDay) {
  const basePrompt = buildSystemPrompt(userData);
  const personalization = coachingDay ? buildPersonalizedCoachingContext(userData, coachingDay) : '';
  const systemPrompt = basePrompt + personalization;

  chatHistory.push({ role: 'user', content: userMessage });
  if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${origin}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        systemPrompt,
      }),
    });

    if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

    let fullResponse = '';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content || '';
          if (token) {
            fullResponse += token;
            onPartial?.(fullResponse);
          }
        } catch { /* partial chunk */ }
      }
    }

    // Validate response — guardrails + tier rules
    if (fullResponse) {
      const validation = validateResponse(fullResponse, userData);
      if (shouldFallback(validation)) {
        chatHistory.pop();
        const fallback = await mockChatWithAI(userMessage, userData, onPartial);
        if (fallback) chatHistory.push({ role: 'user', content: userMessage });
        if (fallback) chatHistory.push({ role: 'assistant', content: fallback });
        return fallback;
      }
    }

    if (fullResponse) chatHistory.push({ role: 'assistant', content: fullResponse });
    return fullResponse;

  } catch (err) {
    console.error('[aiService] chatWithAI failed:', err.message);
    // Fallback to mock if API is unreachable
    const result = await mockChatWithAI(userMessage, userData, onPartial);
    if (result) chatHistory.push({ role: 'assistant', content: result });
    return result;
  }
}
