import { saveFinancialData } from './storage';

const DAY_FOCUS = {
  1: {
    topic: 'היכרות — משפחה ומגורים',
    hint: 'Focus on dependents and living situation. Family status and employment type are already known from registration.',
    keyFields: ['kids', 'housingType', 'housingCost'],
  },
  2: {
    topic: 'עבודה ושגרה',
    hint: 'Explore work routine and income stability. Employment type is known.',
    keyFields: ['incomeStability', 'biggestExpense'],
  },
  3: {
    topic: 'ערכים ופחדים',
    hint: 'The deep "why" — what drives them and what scares them about money.',
    keyFields: ['moneyGoal', 'moneyFear', 'endOfMonthFeeling', 'moneyPersonality'],
  },
  4: {
    topic: 'הכנסות',
    hint: 'Get specific income numbers. Be warm but direct.',
    keyFields: ['netIncome', 'spouseIncome'],
  },
  5: {
    topic: 'הוצאות',
    hint: 'Monthly expense breakdown by category.',
    keyFields: ['housingCost', 'fixedExpenses', 'variableExpenses'],
  },
  6: {
    topic: 'חובות ונכסים',
    hint: 'Full financial balance sheet. Be sensitive — this can be emotional.',
    keyFields: ['creditDebt', 'loans', 'savings', 'assets'],
  },
  7: {
    topic: 'מטרות ותוכנית',
    hint: 'Close the profiling week with goals and retirement planning.',
    keyFields: ['retirementSavings', 'biggestDream'],
  },
};

function formatKnown(c) {
  const p = [];
  if (c.age) p.push(`גיל ${c.age}`);
  if (c.familyStatus) p.push(`מצב משפחתי: ${c.familyStatus}`);
  if (c.employmentType) p.push(`תעסוקה: ${c.employmentType}`);
  if (c.kids != null) p.push(`ילדים: ${c.kids}`);
  if (c.housingType) p.push(`מגורים: ${c.housingType}`);
  if (c.housingCost) p.push(`עלות דיור: ₪${Number(c.housingCost).toLocaleString('he-IL')}/ח׳`);
  if (c.incomeStability) p.push(`הכנסה: ${c.incomeStability}`);
  if (c.netIncome) p.push(`הכנסה נטו: ₪${Number(c.netIncome).toLocaleString('he-IL')}`);
  if (c.spouseIncome) p.push(`הכנסת זוג: ₪${Number(c.spouseIncome).toLocaleString('he-IL')}`);
  if (c.fixedExpenses != null) p.push(`הוצאות קבועות: ₪${Number(c.fixedExpenses).toLocaleString('he-IL')}`);
  if (c.variableExpenses != null) p.push(`הוצאות משתנות: ₪${Number(c.variableExpenses).toLocaleString('he-IL')}`);
  if (c.creditDebt != null) p.push(`חוב אשראי: ₪${Number(c.creditDebt).toLocaleString('he-IL')}`);
  if (c.loans != null) p.push(`הלוואות: ₪${Number(c.loans).toLocaleString('he-IL')}`);
  if (c.savings != null) p.push(`חיסכון: ₪${Number(c.savings).toLocaleString('he-IL')}`);
  if (c.moneyGoal) p.push(`מטרה: ${c.moneyGoal}`);
  if (c.moneyFear) p.push(`פחד: ${c.moneyFear}`);
  return p.length > 0 ? p.join(' | ') : 'מתחילים עכשיו';
}

export function buildProfilingSystemPrompt(day, collected) {
  const focus = DAY_FOCUS[Math.min(day, 7)] || DAY_FOCUS[7];
  const known = formatKnown(collected);
  const missing = focus.keyFields.filter(f => collected[f] === undefined || collected[f] === null);

  return `אתה VerMillion — יועץ פיננסי אישי בתוך אפליקציה. אתה מנהל שיחת היכרות טבעית עם חבר חדש בשבוע הראשון שלו.

מה ידוע לך:
${known}

יום ${day}/7 — ${focus.topic}
${focus.hint}
מידע שחסר: ${missing.length > 0 ? missing.join(', ') : 'כמעט הושלם'}

כללים:
- עברית בלבד
- 2-3 משפטים + שאלה אחת בסוף כל תגובה
- שיחה טבעית — לא טופס. כמו חבר חכם שמכיר פיננסים
- אל תשאל על מה שכבר ידוע לך
- "בממוצע" / "משתנה" ליד מספר הכנסה = אל תשאל על יציבות הכנסה
- טווח "6-8 אלף" = קח את האמצע
- קבל תשובות חלקיות ותמשיך
- אל תשתמש ברשימות, נקודות, כוכביות
- תמיד מכיל ומעודד — הנתונים רגישים`;
}

export function buildDay1Intro() {
  return `שלום! 👋 אני VerMillion — היועץ הפיננסי האישי שלך.\n\nהשבוע הראשון הוא שבוע הכירות. לפני שנדבר על מספרים — אני רוצה להכיר אותך כאדם. כי ייעוץ טוב מתחיל מלהבין מי עומד מולי.\n\nספר לי — למה הצטרפת ל-VerMillion? מה גרם לך להחליט להתחיל עכשיו?`;
}

export function buildDayReturnMessage(day) {
  const msgs = {
    2: `ברוך שובך! אתמול הכרנו אחד את השני.\n\nהיום נדבר על העבודה והשגרה שלך — מה יום רגיל אצלך נראה כמו?`,
    3: `יום 3 — היום נדבר על מה שמניע אותך. לא מספרים, אלא ערכים.\n\nמה הדבר הכי חשוב לך להשיג כלכלית?`,
    4: `יום 4 — הגענו למספרים. הכנסות.\n\nכמה נכנס לך לחשבון כל חודש בממוצע, אחרי מס?`,
    5: `יום 5 — הצד השני של המטבע: הוצאות.\n\nנתחיל מהגדולה ביותר — כמה עולה לך הדיור בחודש?`,
    6: `יום 6 — נשלים את התמונה הפיננסית עם חובות ונכסים.\n\nיש לך הלוואות פעילות כרגע — בנק, כרטיס אשראי, מינוס?`,
    7: `יום אחרון! היום סוגרים את האפיון עם מטרות ותוכנית.\n\nלאן אתה רוצה להגיע כלכלית? תוך כמה שנים?`,
  };
  return msgs[day] || `ברוך שובך ליום ${day}! ממשיכים מאיפה שעצרנו.`;
}

export async function extractAndSaveProfiling(recentMessages) {
  try {
    const conversation = recentMessages
      .filter(m => m.text?.trim() && !m.text.startsWith('🔍') && !m.text.startsWith('🧠'))
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'משתמש' : 'VerMillion'}: ${m.text}`)
      .join('\n');

    if (!conversation) return;

    const prompt = `Extract financial profiling data from this Hebrew conversation.
Return ONLY a JSON object. Include only fields explicitly mentioned. Omit fields not mentioned.

Fields:
- kids: number
- housingType: "שכירות" | "משכנתא" | "הורים" | "אחר"
- housingCost: number (monthly ₪)
- incomeStability: "קבועה" | "משתנה"
- netIncome: number (monthly net ₪)
- spouseIncome: number (₪)
- fixedExpenses: number (monthly ₪)
- variableExpenses: number (monthly ₪)
- creditDebt: number (₪)
- loans: number (₪)
- overdraft: number (₪)
- savings: number (₪)
- assets: number (₪)
- retirementSavings: number (monthly ₪)
- moneyGoal: string (Hebrew)
- moneyFear: string (Hebrew)
- endOfMonthFeeling: string (Hebrew)
- moneyPersonality: "חוסך" | "מוציא" | "מתעלם"
- biggestDream: string (Hebrew)
- biggestExpense: string (Hebrew)

Rules:
- "בממוצע"/"משתנה" near income → also set incomeStability: "משתנה"
- Range "5-7 אלף" → midpoint (6000)
- "אין"/"לא" → 0
- Only include fields with clear evidence

Conversation:
${conversation}`;

    const origin = typeof window !== 'undefined' ? (window.location?.origin ?? '') : '';
    const res = await fetch(`${origin}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'Return ONLY valid JSON. No markdown, no explanation.',
      }),
    });
    if (!res.ok || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content || '';
          if (token) fullText += token;
        } catch { /* partial chunk */ }
      }
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const extracted = JSON.parse(jsonMatch[0]);

    const toSave = {};
    for (const [k, v] of Object.entries(extracted)) {
      if (v !== null && v !== undefined && v !== '') toSave[k] = v;
    }
    if (Object.keys(toSave).length > 0) await saveFinancialData(toSave);
  } catch { /* non-critical, silent */ }
}
