import { runAgent } from './_runAgent';
import { CONFIG } from '../../config';

const CRISIS_KEYWORDS = [
  // שורש ע.ק.ל — כל ההטיות
  'עיקול', 'עיקלו', 'עיקלו לי', 'עוקל', 'מעקלים', 'מעקל',
  // הוצאה לפועל
  'הוצאה לפועל', 'להוציא לפועל', 'מוציאים לפועל', 'הוציאו לפועל',
  // פשיטת רגל / חדלות פירעון
  'פשיטת רגל', 'פשט רגל', 'חדלות פירעון', 'כינוס נכסים', 'כונס נכסים',
  // מצוקה קשה
  'אין לי מה לאכול', 'אין כסף לאוכל', 'אין לי אוכל',
  'חוסר אונים', 'חוסר תקווה', 'אין תקווה',
  'לא רואה מוצא', 'אין מוצא', 'אין לי ברירה',
  'הכל אבוד', 'לא יכול יותר', 'נואש', 'נואשת',
  'לא רוצה להמשיך', 'לא שווה להמשיך',
];

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

function detectCrisis(message) {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

export async function route(userMessage) {
  // Crisis detection — pure JS, no LLM needed, no latency
  if (detectCrisis(userMessage)) {
    return ['CRISIS'];
  }

  const raw = await runAgent({
    model: CONFIG.AI_MODEL,
    systemPrompt: ROUTER_PROMPT,
    userMessage,
    temperature: 0.1,
    maxTokens: 30,
  });

  const validAgents = ['ANALYST', 'STRATEGIST', 'PSYCHOLOGIST', 'COACH'];
  const matched = validAgents.filter(name => raw.toUpperCase().includes(name));

  if (matched.length === 0) return ['ANALYST', 'STRATEGIST'];
  return matched;
}
