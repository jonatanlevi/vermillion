import { saveFinancialData } from './storage';

export const DAY_FOCUS = {
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

export function buildDay1Intro() {
  return `שלום יהונתן! 👋\n\nאני VerMillion — היועץ הפיננסי האישי שלך.\n\nהשבוע הראשון הוא שבוע הכירות. לפני שנדבר על מספרים — אני רוצה להכיר אותך כאדם. כי ייעוץ טוב מתחיל מלהבין מי עומד מולי.\n\nספר לי — למה הצטרפת ל-VerMillion? מה גרם לך להחליט להתחיל עכשיו?`;
}

const _fmt = n => n ? `₪${Math.round(n).toLocaleString('he-IL')}` : null;

export function buildDayReturnMessage(day, collected = {}) {
  const msgs = {
    2: () => {
      const ref = collected.kids !== undefined
        ? (collected.kids > 0 ? `${collected.kids} ילדים` : 'ללא ילדים')
        : null;
      const housing = collected.housingCost ? `, ${_fmt(collected.housingCost)} דיור` : '';
      return ref
        ? `ברוך שובך! אתמול הכרנו — ${ref}${housing}.\n\nהיום אני רוצה להבין איך יום עבודה אצלך נראה. מה אתה עושה לפרנסה?`
        : `ברוך שובך!\n\nהיום אני רוצה להבין איך יום רגיל אצלך נראה — מה אתה עושה לפרנסה?`;
    },
    3: () => {
      const ref = collected.housingCost ? ` (${_fmt(collected.housingCost)} על דיור)` : '';
      return `יום 3 — היום יוצאים מהמספרים לרגע${ref}.\n\nמה הדבר הכי חשוב לך להשיג כלכלית בשנים הקרובות?`;
    },
    4: () => `יום 4 — היום מדברים על מה שנכנס.\n\nכמה נכנס לך לחשבון בחודש ממוצע, אחרי מס?`,
    5: () => {
      const income = _fmt(collected.netIncome);
      return income
        ? `יום 5 — לאן הכסף הולך.\n\nהכנסה של ${income} — עכשיו נבין את הצד השני. כמה עולה לך הדיור בחודש?`
        : `יום 5 — הצד השני: לאן הכסף הולך.\n\nנתחיל מהגדולה: כמה עולה לך הדיור בחודש?`;
    },
    6: () => {
      const surplus = (collected.netIncome || 0) - (collected.housingCost || 0) - (collected.fixedExpenses || 0) - (collected.variableExpenses || 0);
      return surplus > 0 && collected.netIncome
        ? `יום 6 — נשלים את התמונה.\n\nלפי מה שסיפרת, נשאר לך בערך ${_fmt(surplus)} בחודש. יש לך הלוואות פעילות?`
        : `יום 6 — נשלים את התמונה הפיננסית.\n\nיש לך הלוואות פעילות — בנק, כרטיס אשראי, מינוס?`;
    },
    7: () => `יום אחרון של האפיון!\n\nלאן אתה רוצה להגיע כלכלית? יש לך חלום שאתה עובד לקראתו?`,
  };
  return msgs[day]?.() || `ברוך שובך ליום ${day}! ממשיכים מאיפה שעצרנו.`;
}

const _FIELD_LABELS = {
  kids:              v => v === 0 ? 'ללא ילדים' : `${v} ילד${v === 1 ? '' : 'ים'}`,
  housingType:       v => `גר ב${v}`,
  housingCost:       v => `${_fmt(v)} לחודש דיור`,
  netIncome:         v => `${_fmt(v)} הכנסה נטו`,
  spouseIncome:      v => v > 0 ? `${_fmt(v)} הכנסת בן/בת זוג` : null,
  incomeStability:   v => `הכנסה ${v}`,
  fixedExpenses:     v => `${_fmt(v)} הוצאות קבועות`,
  variableExpenses:  v => `${_fmt(v)} הוצאות משתנות`,
  creditDebt:        v => v > 0 ? `${_fmt(v)} חוב כרטיס אשראי` : 'ללא חוב אשראי',
  loans:             v => v > 0 ? `${_fmt(v)} הלוואות` : 'ללא הלוואות',
  overdraft:         v => v > 0 ? `${_fmt(v)} מינוס` : 'ללא מינוס',
  savings:           v => `${_fmt(v)} חיסכון נזיל`,
  retirementSavings: v => v > 0 ? `${_fmt(v)} לחודש לפנסיה` : null,
  moneyGoal:         v => `מטרה: "${v}"`,
  biggestDream:      v => `חלום: "${v}"`,
};

const _DAY_EMOJI = { 1: '👤', 2: '💼', 3: '❤️', 4: '💰', 5: '📊', 6: '🔎', 7: '🎯' };

export function buildDayConfirmation(day, collected = {}) {
  const focus = DAY_FOCUS[Math.min(day, 7)];
  const emoji = _DAY_EMOJI[day] || '✅';

  const items = (focus?.keyFields || [])
    .filter(f => collected[f] !== undefined && collected[f] !== null)
    .map(f => _FIELD_LABELS[f]?.(collected[f]))
    .filter(Boolean);

  const nextLine = day < 7
    ? `\n\nמחר יום ${day + 1} — ${day === 6 ? 'היום האחרון!' : 'ממשיכים.'} עד אז — לשחק!`
    : '\n\n✅ שבוע האפיון הסתיים — הנה האפיון שלך:';

  if (items.length === 0) return `${emoji} יום ${day} הסתיים.${nextLine}`;

  return `${emoji} יום ${day} — מה שהכרנו היום:\n${items.map(i => `• ${i}`).join('\n')}${nextLine}`;
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
