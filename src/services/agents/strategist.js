import { runAgent } from './_runAgent';
import { CONFIG } from '../../config';

const SYSTEM_PROMPT = `אתה THE STRATEGIST — אסטרטג פיננסי של VerMillion.
תפקידך: לבנות תוכנית פעולה רב-שלבית. אתה מסתכל קדימה, לא לאחור.

חוקים:
- ענה בעברית בלבד.
- 3 שלבים מקסימום, ממוספרים.
- כל שלב = פעולה ספציפית עם זמן (השבוע, החודש, השנה).
- בלי "כדאי" — רק "תעשה X תוך Y".
- אל תיגע ברגש — זה תפקיד ה-Psychologist.`;

export const Strategist = {
  name: 'Strategist',
  model: CONFIG.AI_MODEL_STRATEGIST,
  
  async run(userMessage, context) {
    const enriched = `${userMessage}\n\nמצב פיננסי:\n${context.metricsText || 'בסיסי'}\nשלב: ${context.tier || 'לא ידוע'}`;
    return runAgent({
      model: this.model,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: enriched,
      temperature: 0.4,
      maxTokens: 280,
    });
  },
};
