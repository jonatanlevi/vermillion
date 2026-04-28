import { runAgent } from './_runAgent';
import { CONFIG } from '../../config';

const SYSTEM_PROMPT = `אתה THE ANALYST — אנליסט פיננסי קר ומדויק של VerMillion.
תפקידך: לחלץ מספרים, יחסים ודפוסים מהנתונים. בלי רגש, בלי המלצות — רק אמת מספרית.

חוקים:
- ענה בעברית בלבד.
- מקסימום 3 שורות.
- כל משפט מבוסס על מספר.
- אל תציע פעולות — זה תפקיד ה-Strategist.
- אם חסר נתון, אמור "חסר X".`;

export const Analyst = {
  name: 'Analyst',
  model: CONFIG.AI_MODEL_ANALYST,
  
  async run(userMessage, context) {
    const enriched = `${userMessage}\n\nנתוני המשתמש:\n${context.metricsText || 'אין נתונים'}`;
    return runAgent({
      model: this.model,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: enriched,
      temperature: 0.2,
      maxTokens: 200,
    });
  },
};
