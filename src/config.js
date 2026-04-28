/**
 * Runtime configuration for the AI agents.
 *
 * OLLAMA_BASE_URL: where the Ollama server lives.
 *   - Local dev (web/desktop): http://localhost:11434
 *   - Phone on same WiFi:      http://<your-PC-IPv4>:11434
 *   - Anywhere (production):   https://<your-tunnel>.trycloudflare.com
 *
 * The value is read from EXPO_PUBLIC_OLLAMA_BASE_URL at build time so each
 * environment (dev/preview/production) can have a different endpoint without
 * changing code.
 *
 * To update the tunnel URL, edit `.env` (not this file) then restart `expo start`.
 *
 * Team: 4 Ollama models (pull on the server: `ollama pull <name>` for each).
 */
export const CONFIG = {
  OLLAMA_BASE_URL:
    process.env.EXPO_PUBLIC_OLLAMA_BASE_URL ||
    'https://observed-allowed-olympic-punch.trycloudflare.com',

  /** Main in-app chat, router, synthesis, Coach — עברית כללית */
  AI_MODEL: 'qwen2.5:3b',

  /** Analyst — מספרים ולוגיקה (כמו סוכן ה-coder בתיעוד) */
  AI_MODEL_ANALYST: 'qwen2.5-coder:7b',

  /** Strategist — תוכניות רב-שלביות */
  AI_MODEL_STRATEGIST: 'qwen2.5:7b',

  /** Psychologist — רגש וכסף */
  AI_MODEL_PSYCHOLOGIST: 'llama3.2:3b',

  AI_TEMPERATURE:  0.3,
  AI_MAX_TOKENS:   350,
  AI_NUM_CTX:      4096,
};

/** ארבעת המודלים הייחודיים (לתצוגה / בדיקות) */
export const OLLAMA_TEAM_MODEL_IDS = [
  CONFIG.AI_MODEL,
  CONFIG.AI_MODEL_ANALYST,
  CONFIG.AI_MODEL_STRATEGIST,
  CONFIG.AI_MODEL_PSYCHOLOGIST,
];
