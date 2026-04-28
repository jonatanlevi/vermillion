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
 */
export const CONFIG = {
  OLLAMA_BASE_URL:
    process.env.EXPO_PUBLIC_OLLAMA_BASE_URL ||
    'https://observed-allowed-olympic-punch.trycloudflare.com',

  AI_MODEL:        'qwen2.5:3b',
  AI_TEMPERATURE:  0.3,
  AI_MAX_TOKENS:   350,
  AI_NUM_CTX:      4096,
};
