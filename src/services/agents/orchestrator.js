import { runAgent } from './_runAgent';

const ROUTER_PROMPT = `אתה ה-ROUTER של מערכת AI פיננסית.
המשימה שלך: לסווג שאלת משתמש ולהחליט אילו סוכנים צריכים להגיב.

הסוכנים הזמינים:
- ANALYST: מספרים, יחסים, נתונים פיננסיים.
- STRATEGIST: תוכנית פעולה, מהלכים עתידיים.
- PSYCHOLOGIST: רגש, פחד, חרדה, הימנעות, מוטיבציה.
- COACH: הרגלים יומיים, פעולה ספציפית למחר.

חוקי ניתוב:
- שאלה על מספרים/מצב → ANALYST.
- שאלה על "מה לעשות" → STRATEGIST + COACH.
- שאלה רגשית/חששות → PSYCHOLOGIST + COACH.
- שאלה מורכבת → 3 סוכנים.

ענה בפורמט מדויק, רק שמות מופרדים בפסיק. דוגמאות:
"איך לחסוך?" → STRATEGIST,COACH
"אני מפחד מחובות" → PSYCHOLOGIST,COACH
"כמה אני מוציא?" → ANALYST
"אני רוצה דירה אבל אין לי כסף" → ANALYST,PSYCHOLOGIST,STRATEGIST`;

export async function route(userMessage) {
  const raw = await runAgent({
    model: 'qwen2.5:3b',
    systemPrompt: ROUTER_PROMPT,
    userMessage,
    temperature: 0.1,
    maxTokens: 30,
  });

  const validAgents = ['ANALYST', 'STRATEGIST', 'PSYCHOLOGIST', 'COACH'];
  const matched = validAgents.filter(name => raw.toUpperCase().includes(name));

  // Fallback: if router failed, use sensible default
  if (matched.length === 0) {
    return ['ANALYST', 'STRATEGIST'];
  }

  return matched;
}
