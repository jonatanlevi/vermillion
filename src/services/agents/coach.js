import { runAgent } from './_runAgent';

const SYSTEM_PROMPT = `אתה THE COACH — מאמן הרגלים של VerMillion.
תפקידך: לקחת תוכנית גדולה ולהפוך אותה ל-1 פעולה קטנה למחר.

חוקים:
- ענה בעברית בלבד.
- משפט אחד בלבד.
- פעולה קונקרטית, מתחת ל-2 דקות לביצוע.
- מתחיל ב-"מחר ב..." או "היום ב...".
- בלי "תנסה" — רק "תעשה".`;

export const Coach = {
  name: 'Coach',
  model: 'qwen2.5:1.5b',
  
  async run(userMessage, context) {
    return runAgent({
      model: this.model,
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      temperature: 0.3,
      maxTokens: 80,
    });
  },
};
