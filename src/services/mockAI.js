import { computeFinancialMetrics, calcCompletion } from '../data/dailyQuestions';
import { classifyTier } from './financialTier';

const fmt = (n) => `₪${Math.round(n).toLocaleString('he-IL')}`;

// ─── Conversation state (module-level, resets with resetMockConversation) ───
let conv = makeConv();

function makeConv() {
  return {
    collected: {
      income: null,
      housing: null,     // 'parents' | 'renting' | 'owned'
      rent: null,
      alimony: null,
      otherFixed: 0,
      creditDebt: null,
      savings: null,
    },
    pushbacks: new Set(),
    lastTopic: null,
    turnCount: 0,
    phase: 'collect',  // 'collect' | 'advise'
  };
}

export function resetMockConversation() {
  conv = makeConv();
}

// ─── Hebrew number extractor ───
function extractNum(text) {
  const t = text.replace(/,/g, '');
  const thousands = t.match(/(\d+(?:\.\d+)?)\s*אלף/);
  if (thousands) return parseFloat(thousands[1]) * 1000;
  const plain = t.match(/(\d{2,6}(?:\.\d+)?)/);
  if (plain) return parseFloat(plain[1]);
  return null;
}

function isPushback(text) {
  return /לא אופציה|לא יכול|אי.?אפשר|לא מסוגל|זה קבוע|אין ברירה|חייב|חובה|קשה לי/.test(text);
}

function detectHousing(text) {
  if (/בית הורים|אצל הורים|גר אצל|אצל אמא|אצל אבא/.test(text)) return 'parents';
  if (/שוכר|שכירות|דירה שכורה|משלם שכ/.test(text)) return 'renting';
  if (/בעלות|דירה שלי|משלם משכנתא|רכשתי|קניתי/.test(text)) return 'owned';
  return null;
}

function detectYesNo(text) {
  if (/^(כן|יש|יש לי|בטח|אה כן|נכון)/.test(text)) return 'yes';
  if (/^(לא|אין|אין לי|ממש לא)/.test(text)) return 'no';
  return null;
}

// ─── Missing data questions ───
function nextQuestion(c) {
  if (c.income === null)                      return { topic: 'income',   q: 'מה ההכנסה החודשית נטו שלך — אחרי מיסים?' };
  if (c.housing === null)                     return { topic: 'housing',  q: 'איפה אתה גר — שכירות, בית הורים, דירה בבעלות?' };
  if (c.housing === 'renting' && !c.rent)     return { topic: 'rent',     q: 'כמה שכירות בחודש?' };
  if (c.alimony === null)                     return { topic: 'alimony',  q: 'יש תשלומים קבועים חוץ משכירות — מזונות, הלוואה, ביטוח?' };
  if (c.creditDebt === null)                  return { topic: 'debt',     q: 'יש חובות — כרטיס אשראי, מינוס, הלוואה?' };
  if (c.savings === null)                     return { topic: 'savings',  q: 'כמה כסף יש לך בצד — חיסכון, פיקדון, כל דבר?' };
  return null;
}

// ─── Financial summary from collected data ───
function buildMetrics(c) {
  const income  = c.income  || 0;
  const rent    = c.housing === 'renting' ? (c.rent || 0) : 0;
  const alimony = c.alimony || 0;
  const other   = c.otherFixed || 0;
  const debt    = c.creditDebt || 0;
  const savings = c.savings || 0;
  const fixed   = rent + alimony + other;
  const surplus = income - fixed;
  return { income, rent, alimony, fixed, surplus, debt, savings };
}

// ─── Advice generation ───
function buildAdvice(c, m) {
  const lines = [];

  if (m.surplus <= 0) {
    lines.push(`**גירעון של ${fmt(Math.abs(m.surplus))} בחודש.**`);
    lines.push(`לפני כל דבר אחר — צריך לעצור את הדימום.`);
    lines.push(`\nמה ההוצאה הכי גדולה שיש לך שליטה עליה?`);
    return lines.join('\n');
  }

  if (m.debt > 0 && !c.pushbacks.has('debt')) {
    const months = Math.ceil(m.debt / m.surplus);
    lines.push(`**יש לך ${fmt(m.debt)} חוב ו-${fmt(m.surplus)} עודף בחודש.**`);
    lines.push(`\nאם תשים את כל העודף על החוב — הוא נגמר תוך **${months} חודשים**.`);
    lines.push(`\nאחרי זה? ${fmt(m.surplus)} לחודש הופכים לחיסכון נטו. מה המטרה שלך — קרן חירום, קנייה, חופש?`);
    return lines.join('\n');
  }

  if (m.savings < m.fixed * 3) {
    lines.push(`**קרן חירום: ${fmt(m.savings)} — פחות מ-3 חודשי הוצאות.**`);
    lines.push(`היעד הראשון: ${fmt(m.fixed * 3)}. מהנוכחי — עוד ${fmt(m.fixed * 3 - m.savings)}.`);
    lines.push(`בקצב חיסכון של ${fmt(m.surplus)} — מגיע תוך **${Math.ceil((m.fixed * 3 - m.savings) / m.surplus)} חודשים**.`);
    lines.push(`\nמה מונע ממך לחסוך עכשיו?`);
    return lines.join('\n');
  }

  lines.push(`**${fmt(m.income)} הכנסה, ${fmt(m.surplus)} עודף חודשי, ${fmt(m.savings)} חיסכון.**`);
  lines.push(`המצב יציב. עכשיו השאלה היא לאן הכסף עובד — לא שיישב בעו"ש ויפסיד לאינפלציה.`);
  lines.push(`\nמה מעניין אותך יותר — אופטימיזציה של הוצאות, או השקעה של העודף?`);
  return lines.join('\n');
}

// ─── Topic detection for free-form messages ───
function detectTopic(msg) {
  if (/חוב|הלוואה|אשראי|מינוס/.test(msg))          return 'debt';
  if (/חסכ|לחסוך|לשמור/.test(msg))                  return 'savings';
  if (/השקע|מניות|בורסה|ETF/.test(msg))             return 'invest';
  if (/משכנתא|דירה|לקנות דירה/.test(msg))           return 'realestate';
  if (/שכר|משכורת|העלאה|להרוויח יותר/.test(msg))   return 'income';
  if (/פנסיה|השתלמות/.test(msg))                    return 'pension';
  if (/תקציב|הוצאות/.test(msg))                     return 'budget';
  if (/^(שלום|היי|הי|בוקר|ערב|מה נשמע)/.test(msg)) return 'greeting';
  return 'general';
}

// ─── Advice responses using real user metrics ───
function topicResponse(topic, m, pushbacks) {
  switch (topic) {
    case 'greeting':
      if (!m.income) return 'שלום. בוא נתחיל — מה ההכנסה החודשית נטו שלך?';
      if (m.surplus < 0) return `${m.income ? fmt(m.income) : ''} הכנסה, גירעון של **${fmt(Math.abs(m.surplus))}** בחודש. זה המכשול הראשון. מה ההוצאה הכי גדולה שבשליטתך?`;
      return `הכנסה ${fmt(m.income)}, עודף ${fmt(m.surplus)} לחודש. מה מעסיק אותך כלכלית היום?`;

    case 'debt':
      if (!m.income) return 'בשביל לנתח את החוב — צריך לדעת מה ההכנסה שלך. כמה נכנס כל חודש?';
      if (!m.debt) return 'לפי מה שאמרת — אין חובות. זה יתרון גדול. איפה יושב הכסף שלך כרגע?';
      const monthsToPay = m.surplus > 0 ? Math.ceil(m.debt / m.surplus) : null;
      return `**${fmt(m.debt)} חוב.**\n\nריבית כרטיס אשראי ממוצעת — 12-18% שנתי. זה ${fmt(Math.round(m.debt * 0.15 / 12))} לחודש שיוצא לריבית בלבד.\n\n${monthsToPay ? `עם עודף של ${fmt(m.surplus)} — החוב נסגר תוך **${monthsToPay} חודשים** אם תפסיק להוסיף עליו.` : 'קודם צריך לייצר עודף חודשי לפני שנדבר על כיסוי חוב.'}\n\nמה גרם לחוב לצמוח?`;

    case 'savings':
      if (!m.income) return 'כמה אתה מרוויח נטו? בלי זה אני לא יכול לחשב כמה כדאי לחסוך.';
      if (m.surplus <= 0) return `עם גירעון של ${fmt(Math.abs(m.surplus))} בחודש — אי אפשר לחסוך לפני שסוגרים את הפרצה. מאיפה הגירעון מגיע?`;
      const target3m = (m.fixed || m.income * 0.5) * 3;
      return `**${fmt(m.surplus)} לחודש פנויים.**\n\nכלל ראשון: קרן חירום לפני כל דבר אחר — 3 חודשי הוצאות = ${fmt(target3m)}.\n\nאחרי שזה קיים, כל שקל נוסף יכול לעבוד. ${m.savings > 0 ? `יש לך ${fmt(m.savings)} בצד — עוד ${fmt(Math.max(0, target3m - m.savings))} לסגור.` : 'עדיין אין קרן חירום — זה הצעד הראשון.'}\n\nאיפה הכסף יושב כרגע?`;

    case 'invest':
      if (!m.income) return 'לפני שמדברים על השקעות — כמה אתה מרוויח? צריך להבין את הבסיס.';
      if (m.debt > 0) return `**לפני השקעות — יש ${fmt(m.debt)} חוב.**\n\nאין השקעה שמנצחת ריבית של 12-18% מובטחת. קודם מכבים את השריפה, אחרי זה בונים.\n\nכמה מהעודף החודשי שלך אתה יכול להפנות לסגירת החוב?`;
      if (m.surplus <= 0) return 'להשקיע — צריך קודם עודף חודשי. עכשיו אין. בוא נסגור את הגירעון קודם. מה ההוצאה הגדולה ביותר שלך?';
      return `**${fmt(m.surplus)} לחודש להשקיע.**\n\nכלל ברזל: קרן מחקה מדד (ת"א 125 / S&P500) + דמי ניהול נמוכים (מתחת ל-0.5%) = עדיפה על 80% מהמנהלים הפעילים. לא כי זה מגניב — כי זה מה שהנתונים מראים.\n\nאני מאמן פיננסי ולא יועץ מורשה — להחלטה ספציפית כדאי יועץ. מה שיעור הסיכון שאתה מוכן לקחת?`;

    case 'income':
      return `העלאת שכר היא ה-ROI הכי גבוה שיש — עבודה אחת, תשואה לכל החיים.\n\nהמהלך: אל תחכה לסקירה שנתית. בקש פגישה, הצג ערך ספציפי שהבאת, תבקש 15-20% מעל מה שאתה מוכן לקבל.\n\nמתי הפעם האחרונה שביקשת העלאה?`;

    case 'realestate':
      const equity = m.savings || 0;
      if (equity < 200000) return `דירה ב-₪2M צריכה **הון עצמי של ₪500K** (25%) + עלויות עסקה ~₪60K.\n\n${equity > 0 ? `יש לך ${fmt(equity)} — עוד ${fmt(500000 - equity)} לסגור.` : 'קודם צריך לבנות הון עצמי.'}\n\nמה שיעור החיסכון שלך לכיוון הזה?`;
      return `**${fmt(equity)} הון עצמי — כבר יש עם מה לדבר.**\n\nשאלות שחייב לענות לפני: (1) כמה ריבית על משכנתא? (2) האם שכירות + השקעה עדיפה?\n\nיש לך מספרים ספציפיים?`;

    case 'pension':
      return `פנסיה וקרן השתלמות — **כסף פטור ממס** שאתה משאיר על הרצפה אם לא מנצל.\n\nקרן השתלמות: פטורה ממס רווחי הון עד ₪20,520 שנתי — כל שכיר חייב למצות.\n\nהמעסיק שלך מפקיד קרן השתלמות?`;

    case 'budget':
      if (!m.income) return 'בשביל לנתח תקציב — כמה נכנס כל חודש?';
      return `**התמונה שלך:**\nהכנסה: ${fmt(m.income)} | קבוע: ${fmt(m.fixed)} | עודף: **${fmt(m.surplus)}**\n\n${m.surplus < 0 ? `גירעון של ${fmt(Math.abs(m.surplus))} — דורש טיפול מיידי.` : m.surplus < m.income * 0.1 ? `חיסכון של ${Math.round(m.surplus/m.income*100)}% — מתחת ל-10%, יש מקום לשיפור.` : `תקציב מאוזן. השאלה — לאן הולך העודף?`}\n\nמה ההוצאה שהכי כואבת לך?`;

    default:
      if (m.income) return `לפי הנתונים שלך — ${fmt(m.income)} הכנסה, ${m.surplus >= 0 ? fmt(m.surplus) + ' עודף' : fmt(Math.abs(m.surplus)) + ' גירעון'} בחודש.\n\nמה בדיוק מעסיק אותך?`;
      return 'שאלה טובה. כדי לענות ברצינות — צריך קודם לדעת את המספרים שלך. מה ההכנסה החודשית נטו?';
  }
}

// ─── Process user message and update collected data ───
function processAnswer(userMsg, lastTopic, c) {
  const num = extractNum(userMsg);
  const yn  = detectYesNo(userMsg);

  switch (lastTopic) {
    case 'income':
      if (num) c.income = num;
      break;
    case 'housing':
      const h = detectHousing(userMsg);
      if (h) c.housing = h;
      break;
    case 'rent':
      if (num) c.rent = num;
      break;
    case 'alimony':
      if (num)          c.alimony = num;
      else if (yn === 'no' || /אין/.test(userMsg)) c.alimony = 0;
      else if (num === null && userMsg.length > 10) {
        // User described expenses in text — try to extract largest number
        const nums = userMsg.match(/\d{3,5}/g);
        if (nums) c.alimony = nums.map(Number).reduce((a, b) => a + b, 0);
      }
      break;
    case 'debt':
      if (yn === 'no' || /אין/.test(userMsg)) c.creditDebt = 0;
      else if (num) c.creditDebt = num;
      break;
    case 'savings':
      if (yn === 'no' || /אין/.test(userMsg)) c.savings = 0;
      else if (num) c.savings = num;
      break;
  }
}

// ─── Main entry point ───
export async function mockChatWithAI(userMessage, userData, onPartial) {
  const msg = userMessage.trim();
  const c   = conv.collected;

  // Process answer to previous question
  if (conv.lastTopic) processAnswer(msg, conv.lastTopic, c);

  // Handle pushback
  if (isPushback(msg) && conv.lastTopic) {
    conv.pushbacks.add(conv.lastTopic);
  }

  conv.turnCount++;

  let response;

  // COLLECT phase: still missing key data
  if (conv.phase === 'collect') {
    const nq = nextQuestion(c);
    if (nq && !conv.pushbacks.has(nq.topic)) {
      conv.lastTopic = nq.topic;

      // Acknowledge previous answer + ask next
      if (conv.turnCount === 1) {
        response = `שלום.\n\nלא מאמין בשיחות חולין. בשביל לעזור לך באמת — צריך מספרים.\n\n${nq.q}`;
      } else if (isPushback(msg)) {
        response = `מקובל. נעבור הלאה.\n\n${nq.q}`;
      } else {
        // Acknowledge what we just got
        const ack = buildAck(conv.lastTopic === nq.topic ? null : conv.lastTopic, c);
        response = ack ? `${ack}\n\n${nq.q}` : nq.q;
      }
    } else {
      // Have all data (or pushed back on everything) → switch to advise
      conv.phase = 'advise';
      conv.lastTopic = 'advice';
      const m = buildMetrics(c);
      response = buildAdvice(c, m);
    }
  } else {
    // ADVISE phase: respond to free-form questions
    conv.lastTopic = 'advice';
    const m = buildMetrics(c);

    // Merge with userData if available
    if (userData?.dailyAnswers) {
      const pm = computeFinancialMetrics({ ...userData.dailyAnswers, _age: { _computed_age: 0 } });
      if (pm.totalIncome > 0 && !c.income) c.income = pm.totalIncome;
      if (pm.totalDebt > 0 && c.creditDebt === null) c.creditDebt = pm.totalDebt;
      if (pm.liquidSavings > 0 && c.savings === null) c.savings = pm.liquidSavings;
    }

    const topic = detectTopic(msg);
    const merged = buildMetrics(c);
    response = topicResponse(topic, merged, conv.pushbacks);
  }

  // Stream word-by-word
  const words = response.split(' ');
  let built = '';
  for (let i = 0; i < words.length; i++) {
    await _sleep(38 + Math.random() * 28);
    built += (i === 0 ? '' : ' ') + words[i];
    onPartial?.(built);
  }
  return response;
}

function buildAck(topic, c) {
  switch (topic) {
    case 'income':  return c.income  ? `${fmt(c.income)} נטו. מקובל.` : null;
    case 'housing': return c.housing === 'parents' ? 'בית הורים — חוסך לך ₪3,000+ בחודש על שכירות.' : c.housing === 'renting' ? 'שוכר. אוסיף לחשבון.' : null;
    case 'rent':    return c.rent    ? `${fmt(c.rent)} שכירות בחודש.` : null;
    case 'alimony': return c.alimony ? `${fmt(c.alimony)} תשלומים קבועים.` : null;
    case 'debt':    return c.creditDebt === 0 ? 'אין חובות — יתרון.' : c.creditDebt ? `${fmt(c.creditDebt)} חוב.` : null;
    case 'savings': return c.savings === 0 ? 'אין כרגע כסף בצד.' : c.savings ? `${fmt(c.savings)} בצד.` : null;
    default:        return null;
  }
}

function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
