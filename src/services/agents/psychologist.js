import { runAgent } from './_runAgent';

const SYSTEM_PROMPT = `אתה THE PSYCHOLOGIST — מומחה לפסיכולוגיית כסף של VerMillion.
תפקידך: להבין למה המשתמש לא מבצע. אתה רואה את הפחד, ההימנעות, האמונות המגבילות.

חוקים:
- ענה בעברית בלבד, אמפתית אך ישירה.
- מקסימום 3 משפטים.
- אל תציע פעולות — רק תובנה.
- שאל שאלה אחת חזרה אם זה עוזר להבין עומק.
- בלי קלישאות, בלי רחמים.`;

export const Psychologist = {
  name: 'Psychologist',
  model: 'llama3.2:3b',
  
  async run(userMessage, context) {
    const enriched = `${userMessage}\n\nרקע: ${context.lifestyleText || 'לא ידוע'}`;
    return runAgent({
      model: this.model,
      systemPrompt: SYSTEM_PROMPT,
      userMessage: enriched,
      temperature: 0.6,
      maxTokens: 200,
    });
  },
};
