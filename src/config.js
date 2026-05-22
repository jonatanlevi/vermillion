/**
 * Runtime configuration for the AI agents.
 *
 * All AI calls go through Vercel Edge Functions (/api/chat, /api/agent)
 * which hold the GROQ_API_KEY securely server-side.
 *
 * Model IDs here are internal identifiers mapped to real Groq models
 * inside api/agent.js — so swapping models requires no client code changes.
 *
 * Future: Claude + OpenAI can be added to api/agent.js and mapped here.
 */
export const CONFIG = {
  /** Main in-app chat, router, synthesis, Coach */
  AI_MODEL: 'groq-fast',

  /** Analyst — מספרים ולוגיקה */
  AI_MODEL_ANALYST: 'groq-analyst',

  /** Strategist — תוכניות רב-שלביות */
  AI_MODEL_STRATEGIST: 'groq-strategist',

  /** Psychologist — רגש וכסף */
  AI_MODEL_PSYCHOLOGIST: 'groq-psychologist',

  AI_TEMPERATURE: 0.3,
  AI_MAX_TOKENS:  350,

  DEV_MODE: true,
  AI_COACHING_MAX_TOKENS: 600,
};

/** שמות המודלים לתצוגה / בדיקות */
export const GROQ_TEAM_MODEL_IDS = [
  CONFIG.AI_MODEL,
  CONFIG.AI_MODEL_ANALYST,
  CONFIG.AI_MODEL_STRATEGIST,
  CONFIG.AI_MODEL_PSYCHOLOGIST,
];

// backward compat — components that still import OLLAMA_TEAM_MODEL_IDS
export const OLLAMA_TEAM_MODEL_IDS = GROQ_TEAM_MODEL_IDS;
