import { saveFinancialData } from './storage';

const DAY_FOCUS = {
  1: {
    topic: 'היכרות — משפחה, מגורים, ומה הביא אותך לכאן',
    curiosity: ['כמה ילדים תלויים בך', 'איך נראה הסידור הדיור שלך', 'כמה עולה לך הדיור בחודש'],
    keyFields: ['kids', 'housingType', 'housingCost'],
  },
  2: {
    topic: 'עבודה ושגרה — מה יום רגיל אצלך נראה כמו',
    curiosity: ['כמה היא יציבה מחודש לחודש', 'מה ההוצאה הגדולה ביותר שלך'],
    keyFields: ['incomeStability', 'biggestExpense'],
  },
  3: {
    topic: 'ערכים ופחדים — מה מניע אותך ומה מדאיג אותך בכסף',
    curiosity: ['מה הדבר הכי חשוב לך להשיג כלכלית', 'מה מעסיק אותך הכי הרבה בנושא כסף', 'איך אתה מרגיש בסוף חודש'],
    keyFields: ['moneyGoal', 'moneyFear', 'endOfMonthFeeling', 'moneyPersonality'],
  },
  4: {
    topic: 'הכנסות — נבנה תמונה של מה נכנס',
    curiosity: ['כמה נכנס לחשבון בממוצע אחרי מס', 'האם יש הכנסה נוספת מזוג או שותף'],
    keyFields: ['netIncome', 'spouseIncome'],
  },
  5: {
    topic: 'הוצאות — נבין לאן הכסף הולך',
    curiosity: ['כמה עולה הדיור', 'מה ההוצאות הקבועות החודשיות', 'כמה הולך על דברים לא מתוכננים'],
    keyFields: ['housingCost', 'fixedExpenses', 'variableExpenses'],
  },
  6: {
    topic: 'חובות ונכסים — התמונה הפיננסית המלאה',
    curiosity: ['יש הלוואות פעילות', 'מינוס בחשבון', 'כמה נחסך עד היום'],
    keyFields: ['creditDebt', 'loans', 'savings', 'assets'],
  },
  7: {
    topic: 'מטרות ופנסיה — לאן אתה רוצה להגיע',
    curiosity: ['מה החלום הכלכלי שלך', 'מה קורה עם הפנסיה שלך'],
    keyFields: ['retirementSavings', 'biggestDream'],
  },
};

export function buildProfilingSystemPrompt(day, collected) {
  const focus = DAY_FOCUS[Math.min(day, 7)] || DAY_FOCUS[7];
  const missing = focus.keyFields.filter(f => collected[f] === undefined || collected[f] === null);
  const collectedCount = focus.keyFields.length - missing.length;
  const nextQuestion = missing.length > 0
    ? `Your next question to ask (naturally, in Hebrew): "${focus.curiosity[collectedCount] || focus.curiosity[0]}"`
    : `All data for today is collected. Close warmly in 1-2 sentences — no question needed.`;

  return `CRITICAL: You MUST respond ONLY in Hebrew (עברית). Never use English or any other language.

You are VerMillion — a warm Israeli personal finance advisor, like a smart friend who also understands money.

Today is Day ${day}. Theme: ${focus.topic}

YOUR SINGLE GOAL: Collect today's information naturally. Topics to cover:
${focus.curiosity.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}

STRICT RULES:
1. Write 1 SHORT acknowledgment sentence (max 8 words), then immediately ask the next question. That is the ENTIRE response.
2. "חופש כלכלי" / "מיליונר" / "חלומות" → say "יפה!" and immediately pivot to the next concrete question. Do NOT elaborate.
3. End EVERY message with exactly ONE specific question.
4. ${nextQuestion}
5. "אין"/"לא"/"0"/"בחינם"/"אצל ההורים"/"לא יודע" → "בסדר!" + next question immediately.
6. If user says "מה?" or seems confused → rephrase the same question more simply in 1 short sentence.
7. FORBIDDEN at start: echoing the user's answer back ("2 ילדים" / "7,000" / any number or word they just said).
8. FORBIDDEN anywhere: "רשמתי" / "נרשם" / "הבנתי" / "מעולה שסיפרת" / "שאל שוב".

EXAMPLES (follow exactly):
✗ BAD: "2 ילדים, כמה נחמד! איך נראה..."
✓ GOOD: "נחמד! איך נראה הסידור הדיור שלך?"

✗ BAD: "חופש כלכלי זו מטרה נהדרת, ספר לי עוד..."
✓ GOOD: "יפה! כמה ילדים תלויים בך?"

✗ BAD: "הבנתי. אז..."
✓ GOOD: "כמה עולה לך הדיור בחודש?"`;
}
}

export function buildDay1Intro() {
  return `שלום יהונתן! 👋\n\nאני VerMillion — היועץ הפיננסי האישי שלך.\n\nהשבוע הראשון הוא שבוע הכירות. לפני שנדבר על מספרים — אני רוצה להכיר אותך כאדם. כי ייעוץ טוב מתחיל מלהבין מי עומד מולי.\n\nספר לי — למה הצטרפת ל-VerMillion? מה גרם לך להחליט להתחיל עכשיו?`;
}

export function buildDayReturnMessage(day) {
  const msgs = {
    2: `ברוך שובך!\n\nאתמול הכרנו קצת. היום אני רוצה להבין איך נראה יום רגיל אצלך — מה אתה עושה לפרנסה ואיך ההכנסה שלך עובדת?`,
    3: `יום 3 — היום נצא מהמספרים לרגע.\n\nאני רוצה להבין מה מניע אותך. מה הדבר הכי חשוב לך להשיג כלכלית בשנים הקרובות?`,
    4: `יום 4 — היום מדברים על הצד של ה"נכנס".\n\nכמה נכנס לך לחשבון בחודש ממוצע, אחרי מס?`,
    5: `יום 5 — הצד השני: לאן הכסף הולך.\n\nנתחיל מהגדולה ביותר — כמה עולה לך הדיור בחודש?`,
    6: `יום 6 — נשלים את התמונה הפיננסית.\n\nיש לך הלוואות פעילות כרגע — בנק, כרטיס אשראי, מינוס?`,
    7: `יום אחרון של האפיון!\n\nלאן אתה רוצה להגיע כלכלית? יש לך חלום שאתה עובד לקראתו?`,
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
- incomeStability: "משתנה" ONLY when user explicitly says income varies ("משתנה"/"לא קבועה"/"תלוי חודש"/"פעמים יותר פעמים פחות"). "בממוצע" alone does NOT mean variable — it means the user gave an average figure.
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
