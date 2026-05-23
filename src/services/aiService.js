import { mockChatWithAI, resetMockConversation } from './mockAI';
import { buildSystemPrompt, buildDynamicContext } from './aiPrompts';
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

async function callGroqService(messages, systemPrompt, onPartial) {
  const origin = typeof window !== 'undefined' ? (window.location?.origin ?? '') : '';
  const res = await fetch(`${origin}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  });
  if (!res.ok || !res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
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
        if (token) { fullText += token; onPartial?.(fullText); }
      } catch { /* partial chunk */ }
    }
  }
  return fullText;
}

async function callGeminiService(messages, systemPrompt, onPartial) {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) return '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
        }),
      }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) onPartial?.(text);
    return text;
  } catch { return ''; }
}

async function callOpenAIService(messages, systemPrompt, onPartial) {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) return '';
  const msgsWithSystem = [{ role: 'system', content: systemPrompt }, ...messages.filter(m => m.role !== 'system')];
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: msgsWithSystem, max_tokens: 400, temperature: 0.3, stream: true }),
    });
    if (!res.ok || !res.body) return '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const token = JSON.parse(payload).choices?.[0]?.delta?.content || '';
          if (token) { fullText += token; onPartial?.(fullText); }
        } catch { /* partial chunk */ }
      }
    }
    return fullText;
  } catch { return ''; }
}

export async function chatWithProfilingPrompt(messages, systemPrompt, onPartial) {
  const providers = [
    () => callGroqService(messages, systemPrompt, onPartial),
    () => callGeminiService(messages, systemPrompt, onPartial),
    () => callOpenAIService(messages, systemPrompt, onPartial),
  ];
  for (const callProvider of providers) {
    try {
      const response = await callProvider();
      if (response) return response;
    } catch { /* try next */ }
  }
  return null;
}

export async function chatWithAI(userMessage, userData, onPartial, coachingDay) {
  const basePrompt = buildSystemPrompt(userData);
  const personalization = coachingDay ? buildPersonalizedCoachingContext(userData, coachingDay) : '';
  const dynamicCtx = buildDynamicContext(userMessage, userData, chatHistory);
  const systemPrompt = basePrompt + personalization + dynamicCtx;

  chatHistory.push({ role: 'user', content: userMessage });
  if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);

  // Groq → Gemini → OpenAI → offline
  const providers = [
    () => callGroqService(chatHistory, systemPrompt, onPartial),
    () => callGeminiService(chatHistory, systemPrompt, onPartial),
    () => callOpenAIService(chatHistory, systemPrompt, onPartial),
  ];

  for (const callProvider of providers) {
    try {
      const response = await callProvider();
      if (!response) continue;

      const validation = validateResponse(response, userData);
      if (shouldFallback(validation)) continue;

      chatHistory.push({ role: 'assistant', content: response });
      return response;
    } catch { /* try next provider */ }
  }

  // All cloud providers failed — offline fallback
  chatHistory.pop();
  const result = await mockChatWithAI(userMessage, userData, onPartial);
  if (result) {
    chatHistory.push({ role: 'user', content: userMessage });
    chatHistory.push({ role: 'assistant', content: result });
  }
  return result;
}
