export const CONFIG = {
  // Same machine (web/desktop): localhost works directly
  // Phone on same WiFi: replace with your PC's IP (run `ipconfig` → IPv4 Address)
  OLLAMA_BASE_URL: 'http://192.168.1.191:11434',

  AI_MODEL: 'qwen2.5:3b',

  AI_TEMPERATURE: 0.3,
  AI_MAX_TOKENS: 350,
  AI_NUM_CTX: 4096,
};
