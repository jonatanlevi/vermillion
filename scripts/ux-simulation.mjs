// scripts/ux-simulation.mjs
// UX simulation — 5 personas × 7 days of onboarding week

import { writeFileSync } from 'fs';

const API_URL = 'https://vermillion-ashen.vercel.app/api/chat';
const DELAY_MS = 1800;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── System prompt (ported from profilingAgent.js) ──────────────
const DAY_FOCUS = {
  1: { topic: 'היכרות — משפחה ומגורים', keyFields: ['kids', 'housingType', 'housingCost'] },
  2: { topic: 'עבודה ושגרה',             keyFields: ['incomeStability', 'biggestExpense'] },
  3: { topic: 'ערכים ופחדים',            keyFields: ['moneyGoal', 'moneyFear', 'endOfMonthFeeling', 'moneyPersonality'] },
  4: { topic: 'הכנסות',                  keyFields: ['netIncome', 'spouseIncome'] },
  5: { topic: 'הוצאות',                  keyFields: ['housingCost', 'fixedExpenses', 'variableExpenses'] },
  6: { topic: 'חובות ונכסים',            keyFields: ['creditDebt', 'loans', 'savings', 'assets'] },
  7: { topic: 'מטרות ותוכנית',           keyFields: ['retirementSavings', 'biggestDream'] },
};

function formatKnown(c) {
  const p = [];
  if (c.age)            p.push(`גיל ${c.age}`);
  if (c.familyStatus)   p.push(`מצב משפחתי: ${c.familyStatus}`);
  if (c.employmentType) p.push(`תעסוקה: ${c.employmentType}`);
  if (c.kids != null)   p.push(`ילדים: ${c.kids}`);
  if (c.housingType)    p.push(`מגורים: ${c.housingType}`);
  if (c.housingCost != null) p.push(`עלות דיור: ₪${c.housingCost}/ח׳`);
  if (c.incomeStability)     p.push(`הכנסה: ${c.incomeStability}`);
  if (c.netIncome)           p.push(`נטו: ₪${c.netIncome}`);
  if (c.spouseIncome != null) p.push(`הכנסת זוג: ₪${c.spouseIncome}`);
  if (c.fixedExpenses != null)    p.push(`קבועות: ₪${c.fixedExpenses}`);
  if (c.variableExpenses != null) p.push(`משתנות: ₪${c.variableExpenses}`);
  if (c.creditDebt != null) p.push(`אשראי: ₪${c.creditDebt}`);
  if (c.loans != null)      p.push(`הלוואות: ₪${c.loans}`);
  if (c.savings != null)    p.push(`חיסכון: ₪${c.savings}`);
  if (c.moneyGoal)  p.push(`מטרה: ${c.moneyGoal}`);
  if (c.moneyFear)  p.push(`פחד: ${c.moneyFear}`);
  return p.length > 0 ? p.join(' | ') : 'מתחילים עכשיו';
}

function buildProfilingSystemPrompt(day, collected) {
  const focus   = DAY_FOCUS[Math.min(day, 7)] || DAY_FOCUS[7];
  const missing = focus.keyFields.filter(f => collected[f] === undefined || collected[f] === null);
  const known   = formatKnown(collected);

  return `You are VerMillion, a personal financial coach. Respond ONLY in Hebrew.

FORBIDDEN PHRASES — never write these, not even paraphrased:
"רשמתי" / "נרשם" / "הבסיס שנעבוד ממנו" / "יתרון ממשי" / "פוטנציאל גדול" / "נראה כמה נשאר" / "חוסך בהוצאות" / "תוקן" / "הבנתי" (as acknowledgment)

ZERO/NO ANSWERS: When user says "0", "לא עולה", "בחינם", "אין", "לא" — accept immediately, move on.

TODAY'S FOCUS: ${focus.topic}
NEXT GOAL: ask about ${missing.length > 0 ? missing.join(' or ') : 'weekly summary and wrap-up'}.
KNOWN: ${known}

RULES:
1. End every message with exactly ONE question
2. React to emotion/story, not just the number
3. 2-3 short sentences + one question. No lists, no bullet points.
4. Never repeat a question the user already answered`;
}

// ── API ─────────────────────────────────────────────────────────
async function chatAPI(messages, systemPrompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, taskType: 'coaching' }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 80)}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content || '';
        if (token) full += token;
      } catch { /* partial chunk */ }
    }
  }
  return full.trim();
}

// ── Issue detection ─────────────────────────────────────────────
const FORBIDDEN_PHRASES = [
  'רשמתי', 'נרשם', 'הבנתי', 'פוטנציאל גדול', 'יתרון ממשי',
  'הבסיס שנעבוד', 'חוסך בהוצאות', 'נראה כמה נשאר', 'תוקן',
];

function detectIssues(vmText, apiHistory, personaAge, day, turn, alreadyAsked) {
  const issues = [];

  for (const f of FORBIDDEN_PHRASES) {
    if (vmText.includes(f)) {
      issues.push({ type: 'forbidden_phrase', detail: `"${f}"`, snippet: vmText.slice(0, 100) });
    }
  }

  if (personaAge <= 20 && day > 1 && /ילדים שתלויים בך|יש לך ילדים\?/.test(vmText)) {
    issues.push({ type: 'age_context', detail: 'שואל שוב על ילדים לבן 19 לאחר שכבר ענה', snippet: vmText.slice(0, 100) });
  }

  if (!vmText.includes('?') && vmText.length > 25 && !vmText.startsWith('[')) {
    issues.push({ type: 'no_question', detail: 'תגובה ללא שאלה', snippet: vmText.slice(0, 100) });
  }

  const userMsgs = apiHistory.filter(m => m.role === 'user').map(m => m.content);
  if (userMsgs.length > 0) {
    const lastUser  = userMsgs[userMsgs.length - 1];
    const heWords   = lastUser.split(/\s+/).filter(w => /^[א-ת]{4,}$/.test(w));
    if (heWords.length >= 3) {
      const echoCount = heWords.filter(w => vmText.includes(w)).length;
      if (echoCount / heWords.length > 0.65) {
        issues.push({ type: 'echo_parrot', detail: 'משקף חזרה מה שהמשתמש אמר במקום להתקדם', snippet: vmText.slice(0, 100) });
      }
    }
  }

  for (const q of alreadyAsked) {
    if (vmText.includes(q.slice(0, 15)) && q.length > 8) {
      issues.push({ type: 'repeated_question', detail: `חוזר על שאלה שנשאלה: "${q.slice(0, 40)}"`, snippet: vmText.slice(0, 100) });
    }
  }

  return issues;
}

// ── Personas ────────────────────────────────────────────────────
const DAY_OPENS = {
  1: 'שלום! 👋 אני VerMillion — היועץ הפיננסי האישי שלך.\n\nהשבוע הראשון הוא שבוע היכרות — לפני מספרים אני רוצה להכיר אותך כאדם.\n\nספר לי — מה גרם לך להצטרף ל-VerMillion דווקא עכשיו?',
  2: 'ברוך שובך! אתמול הכרנו קצת. היום נדבר על העבודה והשגרה שלך — מה יום רגיל אצלך נראה כמו?',
  3: 'יום 3 — היום נדבר על מה שמניע אותך. לא מספרים, אלא ערכים.\n\nמה הדבר הכי חשוב לך להשיג כלכלית?',
  4: 'יום 4 — הגענו למספרים. הכנסות.\n\nכמה נכנס לך לחשבון כל חודש בממוצע, אחרי מס?',
  5: 'יום 5 — הצד השני של המטבע: הוצאות.\n\nנתחיל מהגדולה ביותר — כמה עולה לך הדיור בחודש?',
  6: 'יום 6 — נשלים את התמונה הפיננסית עם חובות ונכסים.\n\nיש לך הלוואות פעילות כרגע — בנק, כרטיס אשראי, מינוס?',
  7: 'יום אחרון! היום סוגרים את האפיון עם מטרות ותוכנית.\n\nלאן אתה רוצה להגיע כלכלית? תוך כמה שנים?',
};

const PERSONAS = [
  {
    name: 'תמיר', age: 19,
    desc: 'סטודנט לחשמל שנה א, עצמאי 3-4 שעות שבוע (300-600₪), גר אצל הורים',
    initial: { age: 19, familyStatus: 'רווק', employmentType: 'עצמאי' },
    days: {
      1: ['כי אמרו לי שזה טוב', 'אין לי, אני בן 19 בכלל', 'אצל הורים, חינם', '0 שקל על דיור'],
      2: ['משתנה, לפעמים 300 לפעמים 600 תלוי כמה עבדתי', 'הכי גדול? אוכל בחוץ בערך 400 בחודש', 'לא יודע בדיוק', 'כן בערך'],
      3: ['לחסוך לדירה, תוך 6 שנים', 'לסיים את הצבא ולהיות תקוע בלי כסף', 'בסדר, לא בודק הרבה', 'לא יודע, קצת משני הצדדים'],
      4: ['4-500 שקל בממוצע, תלוי', 'אין, אני רווק', 'זה הכל', 'אוקי'],
      5: ['0 שקל, גר אצל הורים', 'אין הוצאות קבועות אחרות', '600 בערך על אוכל ובילויים', 'כן בערך'],
      6: ['אין לי כרטיס אשראי', 'אין הלוואות', '2,000 שקל חסכתי', 'אין לי נכסים, אני בן 19'],
      7: ['אין פנסיה, 19 שנה', 'לנסוע לדרום אמריקה ואחר כך לקנות דירה', 'תודה', 'נשמע טוב'],
    },
  },
  {
    name: 'נועה', age: 28,
    desc: 'מפתחת Full Stack שכירה 18,000₪ נטו, שכירות 3,500₪ ת"א, חיסכון 15,000₪, אין חובות',
    initial: { age: 28, familyStatus: 'רווקה', employmentType: 'שכירה' },
    days: {
      1: ['ראיתי פרסום, ניסיתי כמה דברים ולא הצלחתי להתמיד', 'אין ילדים, רווקה', 'שכירות בת"א, 3,500 לחודש', '3,500 שקל'],
      2: ['קבועה, 18,000 בדיוק כל חודש', 'השכירות — 3,500', 'כן', 'אחרי זה מה?'],
      3: ['קרן חירום 6 משכורות ואז להתחיל ETF', 'שלא יהיה לי מספיק כשאצטרך', 'שקטה, יש לי סדר בחשבון', 'חוסכת'],
      4: ['18,000 שקל נטו, בדיוק', 'אין בן זוג, גרה לבד', 'זה הכל', 'כמה שאלות נשארו?'],
      5: ['3,500 שכירות', 'ביטוח רכב 450, סלולר 80 — 530 בסה"כ', 'אוכל 1,500, בילויים 800 — 2,300', 'כן, מדויק'],
      6: ['אין חוב, כרטיס מתאפס', 'אין הלוואות', '15,000 שקל נזיל', 'אין נכסים עדיין'],
      7: ['אין פנסיה, חדשה בחברה', 'חופש כלכלי עד גיל 45', 'מה הצעד הראשון שאני צריכה לעשות?', 'מעניין'],
    },
  },
  {
    name: 'דני', age: 38,
    desc: 'מנהל אזורי 14,000₪ + אשה מורה 8,000₪, משכנתא 4,800₪, 2 ילדות, הלוואת רכב',
    initial: { age: 38, familyStatus: 'נשוי', employmentType: 'שכיר' },
    days: {
      1: ['כדי להתארגן קצת, הכל מבולגן', 'שני ילדים, בנות 4 ו-7', 'משכנתא בפתח תקווה', '4,800 לחודש, 15 שנה נשארו'],
      2: ['קבועה, 14,000 תמיד', 'המשכנתא, ואחריה החזר רכב', 'גם גן 1,200 — לא זול', 'הכל עולה, לא נשאר הרבה'],
      3: ['ייצוב ואז חיסכון לחינוך הבנות', 'שלא יהיה מינוס, שנוכל לשלם הכל', 'לחוץ, תמיד מחשב כמה נשאר', 'מסתכל אבל מפחד לראות'],
      4: ['14,000 אני, 8,000 האשה — ביחד 22,000', 'זה הכל, אין עוד הכנסות', 'לפעמים שעות נוספות שלה', 'בממוצע 22,000'],
      5: ['4,800 משכנתא', 'ביטוח חיים 400, רכב 800, גן 1,200 — 2,400', 'אוכל 3,000, דלק 600, חוגים 800 — 4,400', 'אולי שכחתי משהו'],
      6: ['אשראי בערך 3,000', 'הלוואת רכב 800 לחודש, עוד שנה וחצי', '8,000 שקל כרית', 'אין נכסים מלבד הבית'],
      7: ['פנסיה, 1,200 לחודש מופקד', 'לחנך את הבנות בלי דאגות כסף', 'תודה, זה מאיר עיניים', 'כן'],
    },
  },
  {
    name: 'מיכל', age: 45,
    desc: 'גרפיקאית עצמאית הכנסה 7K-12K משתנה, גרושה, ילד 12, מזונות 1,800₪, פנסיה הפסיקה 3 שנים',
    initial: { age: 45, familyStatus: 'גרושה', employmentType: 'עצמאית' },
    days: {
      1: ['כי אני מרגישה שאני לא שולטת בכסף', 'ילד אחד, בן 12, גר איתי', 'שכירות ברחובות, 2,800', 'למה צריך לדעת? 2,800 בחודש'],
      2: ['משתנה, בין 7,000 ל-12,000, תלוי בחודש', 'השכירות והאוכל', 'ומה עושים עם המידע הזה?', '3,000 על אוכל ודברים לבית'],
      3: ['ביטחון פיננסי, לא לסמוך על אף אחד', 'לישאר לבד עם ילד בלי כסף', 'עצבנית, מפחדת לבדוק', 'מוציאה, לא טובה בחיסכון'],
      4: ['בממוצע 9,000, תלוי בחודש', 'בועז משלם מזונות 1,800 — אז 10,800 בסה"כ', 'זה הכל', 'למה חשוב?'],
      5: ['2,800 שכירות', 'ביטוח 300, סלולר 100 — 400', 'אוכל 2,500, דלק 400, חוגים 600 — 3,500', 'בערך כן'],
      6: ['אשראי 2,000 שקל', 'אין הלוואות', '8,000 שקל, לא נוגעת בהם', 'אין נכסים, הבית לא שלי'],
      7: ['הפסקתי לשלם פנסיה לפני 3 שנים', 'שהבן שלי יהיה בסדר ושלא אהיה עול', 'אני יודעת שצריך לחזור לפנסיה', 'כן'],
    },
  },
  {
    name: 'יוסי', age: 57,
    desc: 'סמנכ"ל כספים 22,000₪ נטו, בית בבעלות, 180K פנסיה + 90K נזיל, פרישה בגיל 65',
    initial: { age: 57, familyStatus: 'נשוי', employmentType: 'שכיר' },
    days: {
      1: ['כדי לוודא שאני על המסלול הנכון לפרישה', 'שלושה ילדים, כולם בוגרים ועצמאים', 'בבעלות, שילמנו את המשכנתא לפני 5 שנים', '0, הבית שלנו'],
      2: ['קבועה, 22,000 כל חודש', 'ביטוחים ופנסיה', 'אשתי לא עובדת 20 שנה', 'מה השאלה הבאה?'],
      3: ['פרישה בגיל 65, עוד 8 שנים', 'לא לחסוך מספיק', 'שקט, יש לי סדר', 'חוסך, תמיד'],
      4: ['22,000 שקל נטו', 'אשתי לא עובדת', 'אין הכנסות נוספות', 'זה הכל'],
      5: ['0, הבית שלנו', 'ביטוח בריאות 800, רכב 600, חיים 400 — 1,800', 'אוכל 3,000, בגדים 500, טיולים 1,000 — 4,500', 'בערך כן'],
      6: ['אין חוב בכלל', 'אין הלוואות', '90,000 שקל נזיל', 'דירה בבעלות + קרן השתלמות 280,000'],
      7: ['4,800 לחודש מופקד, 180,000 מצטבר', 'פרישה בכבוד ולא לעבוד', 'תגיד לי מה לעשות עם 90K הנזיל', 'בוא נדבר ישר'],
    },
  },
];

// ── Update collected data (basic extraction) ────────────────────
function updateCollected(collected, userText, day, turnIdx) {
  const dayFields = {
    1: ['kids', 'housingType', 'housingCost'],
    2: ['incomeStability', 'biggestExpense'],
    3: ['moneyGoal', 'moneyFear', 'endOfMonthFeeling', 'moneyPersonality'],
    4: ['netIncome', 'spouseIncome'],
    5: ['housingCost', 'fixedExpenses', 'variableExpenses'],
    6: ['creditDebt', 'loans', 'savings', 'assets'],
    7: ['retirementSavings', 'biggestDream'],
  };
  const field = dayFields[day]?.[turnIdx];
  if (!field) return;

  const t = userText.toLowerCase();
  const nums = [...userText.matchAll(/[\d,]+/g)].map(m => parseInt(m[0].replace(/,/g, '')));
  const firstNum = nums[0];

  if (/^(אין|לא|0|אפס)/.test(t) && firstNum === undefined) {
    collected[field] = 0;
  } else if (firstNum !== undefined) {
    collected[field] = firstNum;
  } else {
    collected[field] = userText;
  }
}

// ── Run one persona ─────────────────────────────────────────────
async function runPersona(persona) {
  console.log(`\n${'━'.repeat(55)}`);
  console.log(`▶ פרסונה: ${persona.name}, גיל ${persona.age}`);
  console.log(`  ${persona.desc}`);
  console.log('━'.repeat(55));

  const result = { name: persona.name, age: persona.age, desc: persona.desc, days: [], allIssues: [] };
  const collected = { ...persona.initial };

  for (let day = 1; day <= 7; day++) {
    process.stdout.write(`  יום ${day}: `);
    const dayRes = { day, messages: [], issues: [] };
    const openingText = DAY_OPENS[day];
    dayRes.messages.push({ speaker: 'VerMillion', text: openingText });

    const systemPrompt = buildProfilingSystemPrompt(day, collected);
    const apiHistory = [{ role: 'assistant', content: openingText }];
    const askedQuestions = [];

    const personaTurns = persona.days[day] || [];
    for (let t = 0; t < personaTurns.length; t++) {
      await sleep(DELAY_MS);
      const userText = personaTurns[t];
      dayRes.messages.push({ speaker: persona.name, text: userText });
      apiHistory.push({ role: 'user', content: userText });

      let vmText;
      try {
        vmText = await chatAPI(apiHistory, systemPrompt);
      } catch (e) {
        vmText = `[שגיאת API: ${e.message.slice(0, 60)}]`;
      }

      apiHistory.push({ role: 'assistant', content: vmText });
      dayRes.messages.push({ speaker: 'VerMillion', text: vmText });

      const issues = detectIssues(vmText, apiHistory, persona.age, day, t + 1, askedQuestions);
      if (issues.length) {
        dayRes.issues.push(...issues.map(i => ({ turn: t + 1, ...i })));
        result.allIssues.push(...issues.map(i => ({ day, turn: t + 1, ...i })));
      }

      // Track questions asked
      const q = vmText.match(/[^.!]*\?/)?.[0];
      if (q) askedQuestions.push(q.trim());

      updateCollected(collected, userText, day, t);
      process.stdout.write('.');
    }

    result.days.push(dayRes);
    console.log(` (${dayRes.issues.length} בעיות)`);
  }

  return result;
}

// ── Score ───────────────────────────────────────────────────────
function scorePersona(result) {
  let score = 9;
  for (const issue of result.allIssues) {
    if (issue.type === 'forbidden_phrase') score -= 1.5;
    if (issue.type === 'age_context')      score -= 1;
    if (issue.type === 'repeated_question') score -= 1;
    if (issue.type === 'echo_parrot')      score -= 0.5;
    if (issue.type === 'no_question')      score -= 0.3;
  }
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

// ── Report generation ───────────────────────────────────────────
function generateReport(allResults) {
  const lines = [];
  lines.push('# דוח סימולציה — שבוע אפיון VerMillion\n');
  lines.push(`_נוצר: ${new Date().toLocaleString('he-IL')}_\n`);

  for (const r of allResults) {
    const score = scorePersona(r);
    lines.push(`---\n`);
    lines.push(`## פרסונה: ${r.name}, גיל ${r.age}\n`);
    lines.push(`**רקע:** ${r.desc}\n`);
    lines.push(`**דירוג חוויה: ${score}/10**\n`);

    lines.push(`\n### תמלול מלא יום 1–7\n`);
    for (const d of r.days) {
      lines.push(`\n#### יום ${d.day}\n`);
      for (const m of d.messages) {
        lines.push(`**${m.speaker}:** ${m.text}\n`);
      }
    }

    lines.push(`\n### רגעים בעייתיים\n`);
    const issues = r.allIssues;
    if (issues.length === 0) {
      lines.push('לא זוהו בעיות.\n');
    } else {
      for (const i of issues) {
        lines.push(`- **יום ${i.day}, סיבוב ${i.turn}** [${i.type}]: ${i.detail}\n  > _"${i.snippet}"_\n`);
      }
    }

    lines.push(`\n### מה עבד טוב\n`);
    const goodMsgs = r.days.flatMap(d =>
      d.messages
        .filter(m => m.speaker === 'VerMillion' && m.text.includes('?') && !m.text.startsWith('['))
        .slice(0, 2)
    ).slice(0, 3);
    if (goodMsgs.length === 0) {
      lines.push('ראה תמלול מעלה.\n');
    } else {
      for (const m of goodMsgs) {
        lines.push(`- "${m.text.slice(0, 120)}"\n`);
      }
    }
  }

  // Global summary
  lines.push(`\n---\n\n## סיכום כולל\n`);

  const allIssues = allResults.flatMap(r => r.allIssues.map(i => ({ persona: r.name, ...i })));

  // Count by type
  const byType = {};
  for (const i of allIssues) {
    byType[i.type] = (byType[i.type] || 0) + 1;
  }

  lines.push(`\n### 5 הבעיות החמורות ביותר (לפי תדירות)\n`);
  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5);
  sorted.forEach(([type, count], idx) => {
    const example = allIssues.find(i => i.type === type);
    const codeHint = {
      forbidden_phrase:   'profilingAgent.js → FORBIDDEN PHRASES list',
      age_context:        'profilingAgent.js → buildProfilingSystemPrompt — add age guard',
      repeated_question:  'profilingAgent.js → RULES section: "Never repeat a question"',
      echo_parrot:        'profilingAgent.js → RULES: react to emotion, not repeat info',
      no_question:        'profilingAgent.js → RULES: end every message with ONE question',
    };
    lines.push(`${idx + 1}. **${type}** (${count} מופעים) — ${codeHint[type] || 'ראה קובץ profilingAgent.js'}\n`);
    if (example) lines.push(`   > דוגמה: "${example.snippet?.slice(0, 100)}"\n`);
  });

  lines.push(`\n### פערים בין פרסונות\n`);
  for (const r of allResults) {
    const score = scorePersona(r);
    lines.push(`- **${r.name}** (${r.age}): ${score}/10 — ${r.allIssues.length} בעיות\n`);
  }

  lines.push(`\n### מה VerMillion עושה טוב\n`);
  lines.push(`- שואל שאלה אחת בסוף כל תגובה (ברוב המקרים)\n`);
  lines.push(`- עובר בין יומות חלק\n`);
  lines.push(`- מגיב בעברית טבעית\n`);
  lines.push(`- מכבד תשובות "0" ו-"אין" (כשהגדרת ה-system prompt עובדת)\n`);

  return lines.join('');
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('VerMillion UX Simulation — 5 פרסונות × 7 ימים');
  console.log(`API: ${API_URL}\n`);

  const allResults = [];

  for (const persona of PERSONAS) {
    const result = await runPersona(persona);
    allResults.push(result);
    writeFileSync('scripts/simulation-results.json', JSON.stringify(allResults, null, 2));
    await sleep(2500);
  }

  console.log('\n✅ סיום סימולציה. כותב דוח...');
  const report = generateReport(allResults);
  writeFileSync('docs/ux-simulation-report.md', report);

  console.log('✅ docs/ux-simulation-report.md נשמר');
  console.log('✅ scripts/simulation-results.json נשמר');

  // Quick summary
  console.log('\nציונים:');
  for (const r of allResults) {
    console.log(`  ${r.name}: ${scorePersona(r)}/10 (${r.allIssues.length} בעיות)`);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
