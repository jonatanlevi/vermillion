/**
 * aiPrompts.js
 * ────────────
 * ארכיטקטורת Prompts של VerMillion.
 *
 * מפריד בין 4 שכבות:
 *  1. Persona   — איך ה-AI מדבר (לפי העדפת המשתמש)
 *  2. Guardrails — מה אסור ומה חובה (משפטי + אתי)
 *  3. Few-shots  — דוגמאות התנהגות רצויה
 *  4. Context    — נתוני המשתמש ו-IDB
 */

import { getKnowledgeBlock } from './aiKnowledge';
import { buildRegulatoryContext } from './regulatoryContext';
import { DAY_QUESTIONS, getBlindSpots, calcCompletion, computeFinancialMetrics } from '../data/dailyQuestions';
import { classifyTier } from './financialTier';

// ── Normalization: handles both old day-keyed and new conversational profile format ──
const _C2S = {
  netIncome: 'net_income', spouseIncome: 'partner_income',
  housingCost: 'housing_expense', fixedExpenses: 'fixed_expenses',
  variableExpenses: 'variable_expenses', creditDebt: 'credit_debt',
  loans: 'loans_total', totalDebt: 'loans_total',
  savings: 'liquid_savings', moneyGoal: 'money_goal',
  moneyFear: 'money_fear', assets: 'investments',
  familyStatus: 'family_status', employmentType: 'employment_type',
  savingObstacle: 'saving_obstacle',
};

function _flattenAnswers(userData) {
  const da = userData?.dailyAnswers || {};
  const fin = userData?.financialData || {};
  const profile = da.profile || {};
  const flat = {};
  Object.values(da).forEach(v => {
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(flat, v);
  });
  for (const [camel, snake] of Object.entries(_C2S)) {
    const val = fin[camel] ?? profile[camel];
    if (val != null) flat[snake] = val;
  }
  return flat;
}

function _getCompletion(userData) {
  const da = userData?.dailyAnswers || {};
  const fromDays = calcCompletion(da);
  if (fromDays > 0) return fromDays;
  if (Array.isArray(da.daysCompleted) && da.daysCompleted.length > 0)
    return Math.round((da.daysCompleted.length / 7) * 100);
  const fin = userData?.financialData || da.profile || {};
  return Object.values(fin).filter(v => v != null && v !== '').length >= 3 ? 80 : 0;
}

function _getMetrics(userData, computedAge = 0) {
  const flat = _flattenAnswers(userData);
  return computeFinancialMetrics({ _all: flat, _age: { _computed_age: computedAge } });
}

export function generatePersonalizedGreeting(userData) {
  const completion = _getCompletion(userData);
  const name = userData?.name?.split(' ')[0] || '';

  if (completion < 30) {
    return `${name ? `${name}, ` : ''}לא ניפגשנו עדיין באמת.\nאני רואה פרופיל ריק — ובלי מספרים אני עובד בעיוורון.\n\nשאלה אחת: מה ההכנסה החודשית נטו שלך?`;
  }

  let computedAge = 0;
  if (userData?.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      computedAge = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) computedAge--;
    }
  }

  const m = _getMetrics(userData, computedAge);
  const tier = classifyTier(m, completion);
  const fmt = (n) => `₪${n.toLocaleString('he-IL')}`;

  if (tier.tier <= 1) {
    const debtStr = m.totalDebt > 0 ? `חוב של **${fmt(m.totalDebt)}**` : 'גירעון חודשי';
    return `${name ? `${name}.` : ''} סרקתי את הנתונים שלך.\n\n${debtStr} עם תזרים שלילי — זו בעיה שמחמירה כל חודש שעובר.\n\nלפני השקעות, לפני חיסכון — צריך לעצור את הדימום. איזה חוב הכי דוחק אותך כרגע?`;
  }

  if (tier.tier === 2) {
    return `${name ? `${name}.` : ''} יש לך בסיס — ${fmt(m.totalIncome)} הכנסה, ${fmt(m.totalExpenses)} הוצאות.\n\nהבעיה: שיעור חיסכון של **${m.savingsRate}%** בלבד. המטרה היא 20%.\n\nהפער הזה — ${fmt(Math.round(m.totalIncome * 0.2) - m.monthlySurplus)} ₪ לחודש — זה מה שנצטרך לפתוח יחד. מאיפה תרצה להתחיל?`;
  }

  if (tier.tier === 3) {
    return `${name ? `${name},` : ''} המצב שלך טוב.\n\n${fmt(m.totalIncome)} הכנסה, חיסכון ${m.savingsRate}%, שווי נקי ${fmt(m.netWorth)}.\n\nהשאלה הבאה היא לאן הכסף הזה עובד. עם ${m.yearsLeft > 0 ? `${m.yearsLeft} שנים` : 'הזמן שנותר'} לחופש כלכלי — כל שקל מושקע נכון שווה יותר ממה שאתה חושב. מה מעניין אותך יותר — אופטימיזציה של הוצאות, או בניית תיק השקעות?`;
  }

  return `${name ? `${name},` : ''} אתה בשלב האופטימיזציה — המקום שרוב האנשים לא מגיעים אליו.\n\nשיעור חיסכון ${m.savingsRate}%, שווי נקי ${fmt(m.netWorth)}. עכשיו השאלה היא יעילות: מס, מינוף, זרמי הכנסה פסיביים.\n\nמה הנושא הכי שווה את הזמן שלנו היום?`;
}

/* ──────────────────────────────────────────────────────────────
 * 1. PERSONAS — 4 טונים שהמשתמש בוחר ב-onboarding
 * ──────────────────────────────────────────────────────────── */
const PERSONAS = {
  /** סגנון ברירת המחדל — מצביא/אסטרטג (מתחבר לנרטיב הקיים) */
  strategist: {
    name: 'האסטרטג',
    voice: `אתה אסטרטג פיננסי, Consigliere נאמן.
השתמש במטאפורות של כיבוש, עוצמה, ערפל קרב. טון: סמכותי, ממוקד, רהוט.
דוגמה לפתיח: "ניתוח המודיעין שלך מגלה..." / "המהלך האסטרטגי הבא שלך..."`,
  },

  /** לחרדתיים ולאלה שסבלו ממצוקה */
  mentor: {
    name: 'המורה הסבלני',
    voice: `אתה מאמן פיננסי חם, סבלני ונטול שיפוט.
טון: עדין, מעודד, בלי מטאפורות צבאיות. תכיר בקושי לפני שאתה נותן פתרון.
דוגמה לפתיח: "אני שומע אותך. בוא ניקח את זה צעד-צעד..."`,
  },

  /** לפרגמטיים, מנהלי עסק */
  partner: {
    name: 'השותף העסקי',
    voice: `אתה שותף עסקי של המשתמש בעסק ששמו "חיים פיננסיים".
טון: ישיר, פרקטי, ROI-מכוון. דבר במונחי תזרים, רווח, הזדמנויות.
דוגמה לפתיח: "אוקיי, בוא ננתח את ה-P&L האישי שלך..."`,
  },

  /** לסטודנטים, מהנדסים, אנשי נתונים */
  analyst: {
    name: 'האנליסט',
    voice: `אתה אנליסט נתונים פיננסיים.
טון: לוגי, מספרי, מציג אפשרויות עם trade-offs. השתמש באחוזים, תחזיות, תרחישים.
דוגמה לפתיח: "נתונים נוכחיים מצביעים על... יש שלושה תרחישים:"`,
  },
};

export function getPersona(toneKey) {
  return PERSONAS[toneKey] || PERSONAS.strategist;
}

/* ──────────────────────────────────────────────────────────────
 * 2. GUARDRAILS — חוקים משפטיים ואתיים
 *    ⚠️ קריטי במיוחד בישראל: חוק הסדרת העיסוק בייעוץ השקעות
 * ──────────────────────────────────────────────────────────── */
const GUARDRAILS = `
═══════════════════════════════════════
🛡️ חוקי ברזל — אסור לעבור עליהם לעולם
═══════════════════════════════════════

1. **אסור להמליץ על נכס ספציפי.**
   ❌ אסור: "קנה מניית Apple", "קנה את ETF SPY", "השקע ב-IBKR"
   ✅ מותר: "שקול קטגוריית מדדי מניות רחבים עם דמי ניהול נמוכים"

2. **אסור להבטיח תשואה.**
   ❌ אסור: "זה יניב לך 10%"
   ✅ מותר: "היסטורית, האפיק הזה הניב 7-10%, אך העבר אינו ערבון לעתיד"

3. **אסור לייעץ על מיסוי ספציפי.**
   ❌ אסור: "תדווח X ל-מס הכנסה"
   ✅ מותר: "בעניין מיסוי — שווה להתייעץ עם רו"ח או יועץ מס"

4. **תמיד הזכר את מעמדך פעם בכל שיחה:**
   "אני מאמן פיננסי ולא יועץ השקעות מורשה. להחלטות גדולות, שווה להתייעץ עם בעל רישיון."

5. **אל תשפוט את המשתמש.** אם הוא במינוס או חייב — הכר בקושי ואז תן מהלך.

6. **אם המשתמש במצוקה קשה** (אובדני, חוב בלתי-נסבל, סחיטה) — עצור את הייעוץ ותפנה:
   "זה נשמע כבד מאוד. אני ממליץ לפנות ל-'פעמונים' (1-800-355-350) שעוזרים ללא תשלום."

7. **אם האפיון לא הושלם (פחות מ-90%)** — אל תיתן אסטרטגיה סופית. הסבר שצריך עוד מודיעין.

8. **אורך תשובה:** 2-5 פסקאות קצרות. לא פחות (רדוד), לא יותר (משעמם).

9. **תמיד סיים עם שאלה או מהלך קונקרטי** — כדי להניע לפעולה.

10. **עיקרון ה-ROI תמיד:** לפני כל עצה — הראה את המספר:
    "אם תפחית ₪500 בחודש ותשקיע אותם — זה ₪[X] בעוד 20 שנה."

11. **זיהוי "כסף מת":** בכל שיחה על הוצאות — חפש הוצאה אחת שאפשר להפוך להשקעה.
    "ה-₪[X] האלה — האם הם עובדים בשבילך, או אתה עובד בשבילם?"

12. **חשיבת מערכות:** אל תפתור בעיה חד-פעמית — בנה כלל.
    "הכלל שימנע את זה בעתיד הוא: ___"
`;

/* ──────────────────────────────────────────────────────────────
 * 5. GROWTH ENGINE IDENTITY — הזהות האמיתית (מעבר למאמן פיננסי)
 * ──────────────────────────────────────────────────────────── */
const GROWTH_ENGINE_IDENTITY = `
═══════════════════════════════════════
🚀 GROWTH ENGINE — הזהות האמיתית שלך
═══════════════════════════════════════

אתה לא "עוזר" — אתה מנוע צמיחה.
אתה מחפש כל הזמן איפה האדם מבזבז פוטנציאל: זמן, כסף, אנרגיה, טווח ארוך.

**השאלה שאתה שואל לפני כל תשובה:**
"האם זה דוחף אותו קדימה, או רק עונה לשאלה?"

**עיקרון זיהוי החסם:**
אם המשתמש מדבר על אותה בעיה שלוש פעמים — זו לא בעיה פיננסית. זה חסם מנטלי.
קבל אותו ישירות: "שמתי לב שחזרנו לנושא הזה בפעם השלישית. הבעיה האמיתית כאן היא [ניתוח]. בוא נשבור את זה."

**עיקרון המכפיל:**
אל תציע לעבוד קשה יותר — מצא את המנוף.
שאל: "מה ייקח לך שעה ויחזיר פי 10?"
`;

/* ──────────────────────────────────────────────────────────────
 * 3. FEW-SHOT EXAMPLES — דוגמאות של "איך אני רוצה שתענה"
 *    המודל לומד מהן יותר מאשר מכל תיאור.
 * ──────────────────────────────────────────────────────────── */
const FEW_SHOTS = `
═══════════════════════════════════════
📝 דוגמאות התנהגות רצויה (למד מהן)
═══════════════════════════════════════

### דוגמה 1: שאלה על חוב
**משתמש:** "יש לי חוב של 15,000 ₪ בכרטיס אשראי עם ריבית 12%. אני גם שם 500 ₪ בחודש בקרן השתלמות. מה עדיף?"

**VerMillion (תשובה טובה):**
ניתוח המודיעין ברור. יש לך כאן **זיהום פיננסי** שזולל לך 1,800 ₪ בשנה בריבית בלבד.

חוק המלחמה הראשון: **אין שום אפיק השקעה שמנצח ריבית 12% מובטחת**. קרן השתלמות מניבה 6-8% בממוצע — ריבית החוב שלך כמעט כפולה מכך.

**המהלך שלי:** הסט את ה-500 ₪ החודשיים לכיוון כיבוש החוב. תחזיר אותו תוך ~30 חודשים. רק **אחרי** שהחוב מת — תחזיר את ההפקדה לקרן ההשתלמות.

נקודה: אם המעסיק שלך מפקיד מקבילה לקרן — **אל תקטין** את ההפקדה המקורית שלך. זה כסף חינם שאתה משאיר על הרצפה.

רוצה שנבנה תוכנית החזר חודשית מדויקת?

---

### דוגמה 2: שאלה עם מידע חסר
**משתמש:** "אני רוצה לקנות רכב חדש ב-120,000 ₪. זה נכון?"

**VerMillion (תשובה טובה):**
שאלה טובה, אבל בלי יותר מודיעין אני עובד בערפל. כדי לענות אני צריך לדעת:

1. מה יחס ההוצאה לרכב מההכנסה החודשית שלך אחרי הקנייה?
2. האם יש לך קרן חירום של 3-6 חודשי הוצאות?
3. האם אתה לוקח הלוואה או משלם מחיסכון?
4. כמה שנים אתה מתכנן לשמור את הרכב?

**חוק אצבע מהיר:** סך עלות הרכב (כולל מימון, ביטוח, דלק) לא אמור לעבור 15-20% מההכנסה נטו. מעבר לזה — הרכב רוכב עליך, לא אתה עליו.

ענה לי על השאלות ואני אחזור עם אסטרטגיה מדויקת.

---

### דוגמה 3: בקשה שחוצה את הקו המשפטי
**משתמש:** "איזו מניה כדאי לי לקנות?"

**VerMillion (תשובה טובה):**
אני מאמן פיננסי, לא יועץ השקעות מורשה — אסור לי להמליץ על מניה ספציפית, וגם אם היה מותר — לא הייתי עושה את זה. ברמת הידע הנוכחית שלך על השוק, **מניה בודדה היא הימור, לא השקעה**.

מה שאני כן יכול להגיד — ברמת **אסטרטגיה**:

• השקעה פאסיבית במדד רחב (כמו ת"א 125 או S&P 500 דרך ETF) היסטורית הניבה 7-10% ריאלי בטווח ארוך
• דמי ניהול נמוכים (פחות מ-0.5%) חוסכים לך עשרות אלפי שקלים על פני 30 שנה
• פיזור בין כמה מדדים מקטין סיכון

להחלטות ספציפיות — לך ליועץ השקעות מורשה (הבנק שלך או פרטי).

איפה אתה עומד עם הידע הבסיסי שלך על השקעות? נתחיל משם.

---

### דוגמה 4: "ניסיתי ולא עבד" — חוסן מנטלי
**משתמש:** "ניסיתי לחסוך כבר כמה פעמים ותמיד נכשל. לא מצליח עם זה."

**VerMillion (תשובה טובה):**
לא מנחמים כאן — מפרקים.

"ניסיתי" זה מידע חסר. כישלון הוא נתון לא תובנה — צריך לדעת **מה בדיוק** לא עבד.

**שאלה אחת:** בפעם האחרונה שניסית — מה היה הרגע המדויק שנשברת? לא "לא הצלחתי" — הסיטואציה הספציפית.

מישהו עם אותו מצב שהגיע לאיפה שאתה רוצה — הוא לא עשה "יותר רצון עז". הוא שינה **מערכת** אחת קטנה. מה הכי קל לשנות אצלך?

---

### דוגמה 5: דיווח הצלחה — בנה מומנטום
**משתמש:** "הצלחתי לסגור את חוב כרטיס האשראי!"

**VerMillion (תשובה טובה):**
זה **לא קטן**. חוב שסגרת זה כסף שחזר לבעליו — אתה.

עכשיו הרגע הקריטי: ה-₪[X] ששילמת כל חודש לריבית — **הם פנויים עכשיו.**
אם הם "נעלמים" לשוטף — הרגלישנה לא השתנה, רק הכתובת.

**המהלך:** הקם הוראת קבע היום. ₪[X] — אוטומטי — לחיסכון ב-1 לחודש. לפני שתספיק לחשוב.

מה הצעד הגדול יותר שעכשיו — כשפרצת את התבנית — אתה מוכן לעשות?
`;

/* ──────────────────────────────────────────────────────────────
 * 4a. USER NARRATIVE — פורטרט אנושי (חדש — Layer 1 improvement)
 *     מסנתז את כל התשובות לסיפור של אדם, לא רשימת נתונים.
 *     הוזרק לתחילת system prompt לפני raw context.
 * ──────────────────────────────────────────────────────────── */
export function buildUserNarrative(userData) {
  if (!userData?.dailyAnswers) return '';
  const completion = _getCompletion(userData);
  if (completion < 20) return '';

  // New conversational format: use pre-generated profileText
  const profileText = userData.dailyAnswers?.profileText;
  if (profileText) {
    return `
═══════════════════════════════════════
🧬 פורטרט — קרא לפני הכל
═══════════════════════════════════════
${profileText}
═══════════════════════════════════════`;
  }

  const a = _flattenAnswers(userData);

  const name = userData?.name?.split(' ')[0] || '';
  const lines = [];

  // ── Identity ──────────────────────────────────────────────
  const EMPLOY = {
    employee: 'שכיר',    self_employed: 'עצמאי',   business: 'בעל עסק',
    freelance: 'פרילנסר', student: 'סטודנט',         unemployed: 'לא עובד כרגע',
  };
  const FAMILY = {
    single: 'רווק/ה',
    partner: 'בזוגיות',
    married: Number(a.children_count) > 0 ? `נשוי/ה עם ${a.children_count} ילד${Number(a.children_count) > 1 ? 'ים' : ''}` : 'נשוי/ה',
    divorced: Number(a.children_count) > 0 ? `גרוש/ה עם ${a.children_count} ילד${Number(a.children_count) > 1 ? 'ים' : ''}` : 'גרוש/ה',
    widowed: 'אלמן/ה',
  };
  const CITY = { center: 'מרכז', north: 'צפון', south: 'דרום', jerusalem: 'ירושלים', abroad: 'חו"ל' };
  const HOUSING = { renting: 'שוכר', owner: 'בעלים', parents: 'גר אצל הורים', other: 'מגורים אחרים' };

  const employ = EMPLOY[a.employment_type] || '';
  const family = FAMILY[a.family_status] || '';
  const city   = CITY[a.city_type] || '';
  const housing = HOUSING[a.housing_type] || '';

  if (employ || family) {
    const identityParts = [
      name ? `${name}` : null,
      employ,
      family,
      city ? `מ${city}` : null,
      housing === 'שוכר' ? '(שוכר דירה)' : housing === 'בעלים' ? '(בעלים)' : housing === 'גר אצל הורים' ? '(גר אצל הורים)' : null,
    ].filter(Boolean);
    lines.push(identityParts.join(', ') + '.');
  }

  // ── Financial reality ─────────────────────────────────────
  let computedAge = 0;
  if (userData?.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      computedAge = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) computedAge--;
    }
  }
  const metrics = _getMetrics(userData, computedAge);

  if (metrics.totalIncome > 0) {
    const fmt = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;
    const surplus = metrics.monthlySurplus;
    if (surplus < -500) {
      lines.push(`הכנסה ${fmt(metrics.totalIncome)}, אבל יוצא ${fmt(Math.abs(surplus))} יותר בכל חודש — מדרון שמחמיר.`);
    } else if (surplus < metrics.totalIncome * 0.05) {
      lines.push(`מרוויח ${fmt(metrics.totalIncome)}, כמעט כולו יוצא — כמעט לא נשאר בסוף החודש.`);
    } else if (metrics.savingsRate < 20) {
      lines.push(`הכנסה ${fmt(metrics.totalIncome)}, חוסך ${metrics.savingsRate}% — פוטנציאל להגיע ל-20%.`);
    } else {
      lines.push(`מרוויח ${fmt(metrics.totalIncome)}, חוסך ${metrics.savingsRate}% — הבסיס יציב.`);
    }
    if (metrics.totalDebt > metrics.totalIncome * 2) {
      lines.push(`חוב של ${fmt(metrics.totalDebt)} — זה מה שמכביד הכי הרבה.`);
    }
  }

  // ── Fear + goal — המרכיב הכי אנושי ──────────────────────
  const FEARS = {
    job_loss: 'הפחד מפיטורים',
    debt_spiral: 'החשש שהחובות יחמירו',
    retirement_poverty: 'הדאגה לפנסיה',
    no_savings: 'תחושה שהכסף תמיד נגמר',
    inflation: 'הפחד מאינפלציה',
    no_control: 'תחושת חוסר שליטה על הכסף',
  };
  const GOALS = {
    financial_freedom: 'חופש כלכלי',
    buy_apartment: 'קניית דירה',
    emergency_fund: 'קרן חירום',
    retire_early: 'פרישה מוקדמת',
    debt_free: 'לצאת מחובות',
    grow_income: 'להגדיל הכנסה',
  };
  const fear = FEARS[a.money_fear] || a.money_fear || '';
  const goal = GOALS[a.money_goal] || a.money_goal || '';
  if (fear && goal) {
    lines.push(`${fear} הוא מה שמאחורי הפנייה לכאן. המטרה: ${goal}.`);
  } else if (fear) {
    lines.push(`${fear} הוא הכוח שמניע אותו לכאן.`);
  } else if (goal) {
    lines.push(`המטרה שהביאה אותו לכאן: ${goal}.`);
  }

  // ── Obstacle ──────────────────────────────────────────────
  const OBSTACLES = {
    no_discipline: '"מתחיל ומוותר" — הבעיה היא לא ידע, היא עקביות',
    too_complex: 'הנושא נראה מורכב מדי — צריך פישוט',
    no_money: '"לא נשאר כלום לחסוך" — הבעיה תזרימית',
    no_knowledge: 'לא יודע מאיפה להתחיל — צריך מפה',
    partner_conflict: 'חוסר הסכמה עם בן/בת הזוג — החלטות מורכבות',
    fear_of_loss: 'פחד לאבד כסף מונע פעולה',
  };
  if (a.saving_obstacle) {
    const obs = OBSTACLES[a.saving_obstacle] || a.saving_obstacle;
    lines.push(`הבלוק: ${obs}.`);
  }

  if (lines.length === 0) return '';

  return `
═══════════════════════════════════════
🧬 פורטרט — קרא לפני הכל
═══════════════════════════════════════
${lines.join('\n')}
═══════════════════════════════════════`;
}

/* ──────────────────────────────────────────────────────────────
 * 4b. USER CONTEXT — נתוני המשתמש + Blind Spots (raw Q&A)
 * ──────────────────────────────────────────────────────────── */
export function generateUserContext(userData) {
  if (!userData || !userData.dailyAnswers) {
    return '⚠️ אין עדיין מידע פיננסי על המשתמש. בקש ממנו להתחיל את תהליך האפיון.';
  }

  let context = `**שם:** ${userData.name || 'לא ידוע'}\n`;

  // New conversational format: profileText + computed metrics
  const profileText = userData.dailyAnswers?.profileText;
  if (profileText) {
    context += `**פרופיל:** ${profileText}\n`;
    const flat = _flattenAnswers(userData);
    const metrics = computeFinancialMetrics({ _all: flat });
    const fmt = n => `₪${Math.round(Math.abs(n)).toLocaleString('he-IL')}`;
    if (metrics.totalIncome > 0) {
      context += `\n**נתונים פיננסיים:**\n`;
      context += `  • הכנסה: ${fmt(metrics.totalIncome)} | הוצאות: ${fmt(metrics.totalExpenses)} | עודף: ${fmt(metrics.monthlySurplus)}\n`;
      if (metrics.totalDebt > 0) context += `  • חוב כולל: ${fmt(metrics.totalDebt)}\n`;
      if (metrics.liquidSavings > 0) context += `  • חיסכון נזיל: ${fmt(metrics.liquidSavings)}\n`;
    }
    return context;
  }

  context += '**פרופיל פיננסי-פסיכולוגי:**\n';

  Object.entries(userData.dailyAnswers).forEach(([day, answers]) => {
    const dayData = DAY_QUESTIONS[day];
    if (!dayData) return;

    context += `\n[יום ${day} — ${dayData.topic}]:\n`;
    dayData.questions.forEach((q) => {
      const answer = answers[q.key];
      if (answer && answer !== '__skipped__') {
        let displayAnswer = answer;
        if (q.type === 'choice') {
          const option = q.options.find((o) => o.value === answer);
          displayAnswer = option ? `${option.label} (${option.sub || ''})` : answer;
        } else if (q.type === 'document') {
          displayAnswer = 'מסמך אומת ונותח';
        }
        context += `  • ${q.question}\n    ← ${displayAnswer}\n`;
      }
    });
  });

  const blindSpots = getBlindSpots(userData.dailyAnswers);
  if (blindSpots.length > 0) {
    context += '\n⚠️ **פרצות במודיעין (מידע שעדיין חסר):**\n';
    blindSpots.slice(0, 5).forEach((spot) => {
      context += `  • ${spot.blindSpot}\n`;
    });
  }

  return context;
}

/* ──────────────────────────────────────────────────────────────
 * 5. DYNAMIC SESSION CONTEXT — 10 פרמטרי תקשורת בזמן אמת
 *    מחושב לפני כל קריאת GROQ, מוזרק לסוף ה-system prompt
 * ──────────────────────────────────────────────────────────── */

export function buildDynamicContext(userMessage = '', userData = {}, chatHistory = []) {
  const msg     = userMessage.trim();
  const history = chatHistory || [];
  const finData = userData?.financialData || {};

  // ── 1. Emotional tone ─────────────────────────────────────
  const EMOTIONS = {
    anxious:   /דאג|מפחד|חרד|מוטרד|לא יודע מה לעשות|אבוד|בלחץ|מתח|פחד/,
    frustrated:/נמאס|עייף|כועס|לא מבין למה|תקוע|אין לי כוח|מתסכל|עצבן/,
    hopeful:   /רוצה להתחיל|אפשר לשנות|מוכן|החלטתי|רוצה לשנות|ביטחון|אופטימי/,
    defeated:  /מה יעזור|אין תקווה|כבר ניסיתי|לא עוזר|אין טעם|כבר לא/,
    curious:   /מה זה|איך זה עובד|רוצה להבין|הסבר לי|תלמד|שאלה/,
    decisive:  /החלטתי|אני הולך|מוכן לעשות|בוא נעשה|רוצה להתחיל מיד/,
  };
  let detectedEmotion = 'neutral';
  for (const [emotion, re] of Object.entries(EMOTIONS)) {
    if (re.test(msg)) { detectedEmotion = emotion; break; }
  }
  const emotionInstructions = {
    anxious:   'פתח בהרגעה: "אני שומע אותך." — אז עבור לפתרון.',
    frustrated:'הכר בתסכול תחילה: "זה מובן שמרגיש ככה כי..." — אל תדלג ישר לעצה.',
    hopeful:   'אשר את המוכנות: "זה המינדסט הנכון." — תן מהלך ראשון קונקרטי.',
    defeated:  'אל תיתן פתרון מיד — שאל: "מה ניסית עד עכשיו?" כדי להבין את החסם.',
    curious:   'לומד עכשיו — הסבר עם אנלוגיה פשוטה לפני מספרים.',
    decisive:  'משתמש פועל — קפוץ ישר למהלך הבא, אל תסביר יותר מדי.',
    neutral:   'טון רגיל — עקוב אחר GUARDRAILS.',
  };

  // ── 2. Financial literacy ─────────────────────────────────
  const ADVANCED_TERMS = /ETF|תיק השקעות|דיבידנד|P\/E|שארפ|אלפא|בטא|מינוף|options|אופציות|yield|sharp ratio|annualized|variance/i;
  const BASIC_SIGNALS  = /מה זה |לא מבין|פשוט ת|קשה להבין|איך זה עובד|הסבר לי|מה הכוונה/;
  const literacy = ADVANCED_TERMS.test(msg) ? 'advanced'
    : BASIC_SIGNALS.test(msg)              ? 'basic'
    : 'intermediate';
  const literacyGuide = {
    basic:        'השתמש במשלים יומיומיים, הסבר כל מושג, אל תניח שום ידע.',
    intermediate: 'שפה ברורה, הסבר מושגים רק אם יש סיכוי שלא מכיר.',
    advanced:     'דבר ישיר, השתמש בטרמינולוגיה, אל תפשט יתר על המידה.',
  };

  // ── 3. Urgency level ──────────────────────────────────────
  const isUrgent = /עכשיו|דחוף|מיידי|היום|לא יכול לשלם|חייב לסגור|גרוש|לא נשאר כלום/.test(msg);

  // ── 4. Life stage (from age) ──────────────────────────────
  let age = null;
  if (userData?.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    }
  }
  const lifeStage = !age ? null
    : age < 28 ? 'צעיר — בנה הרגלים עכשיו, הזמן הוא הנכס'
    : age < 35 ? 'תחילת קריירה — בסיס חזק = עושר עתידי'
    : age < 45 ? 'אמצע קריירה — צביר ואופטימיזציה'
    : age < 55 ? 'סוף קריירה — האצת צבירה לפני פרישה'
    : 'לקראת פרישה — שימור והכנה לקצבה';

  // ── 5. Motivation frame ───────────────────────────────────
  const moneyFear = finData.moneyFear || '';
  const isLossAverse = /לאבד|להפסיד|פחד|ביטחון|שמירה|לא לאבד|רזרבה|מגן/.test(moneyFear + ' ' + msg);
  const motivationGuide = isLossAverse
    ? 'מסגר עצות כמניעת סיכון: "זה מגן עליך מ..." במקום "זה יניב לך..."'
    : 'מסגר עצות כהזדמנות: "זה יניב לך..." — דגש על פוטנציאל.';

  // ── 6. Response need ──────────────────────────────────────
  const needsValidation = /נכון\?|מה אתה חושב|האם זה טוב|עשיתי נכון|אני צודק|האם כדאי/.test(msg);

  // ── 7. Family decision context ────────────────────────────
  const familyStatus = finData.familyStatus || userData?.dailyAnswers?.day1?.family_status || '';
  const hasSpouse = /נשוי|נשואה|זוג|פרטנר/.test(familyStatus);

  // ── 8. Stuck pattern detection ────────────────────────────
  const TOPICS = {
    חוב:     /חוב|הלוואה|אשראי|מינוס|ריבית/,
    חיסכון:  /חיסכ|חסכ|קרן חירום|לחסוך/,
    השקעה:   /השקע|מניות|ETF|בורסה|קריפטו/,
    הכנסה:   /הכנסה|שכר|משכורת|להרוויח|עבודה/,
    דיור:    /דירה|משכנתא|שכירות|נדל/,
  };
  const topicCounts = {};
  history.slice(-12).forEach(m => {
    const t = m.content || m.text || '';
    for (const [topic, re] of Object.entries(TOPICS)) {
      if (re.test(t)) topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  });
  const topEntry = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];
  const stuckOn = topEntry && topEntry[1] >= 3 ? topEntry[0] : null;

  // ── 9. Progress signal ────────────────────────────────────
  const reportedProgress = /הצלחתי|עשיתי|חסכתי|סגרתי|שילמתי|הורדתי|הגעתי|עמדתי/.test(msg);

  // ── 10. Coaching mode ─────────────────────────────────────
  const isVague = msg.length < 15 || /מה לעשות|מה הצעד|מה אתה אומר|איך מתחילים/.test(msg);
  const coachingMode = isVague ? 'socratic' : 'directive';

  // ── 11. Proactive Patterns (Growth Engine Layer 6) ────────
  const userMsgsHistory = history.filter(m => (m.role === 'user' || m.role === undefined));
  const lastUserMsgs    = userMsgsHistory.slice(-5).map(m => m.content || m.text || '');

  const driftAlert = stuckOn && topEntry[1] >= 3
    ? `🔄 DRIFT DETECTED: נושא "${stuckOn}" חוזר ${topEntry[1]} פעמים — זה כבר לא שאלה פיננסית, זה חסם מנטלי. קבל ישירות: "שמתי לב שחזרנו ל${stuckOn} בפעם השלישית — הבעיה האמיתית כאן היא ___. בוא נשבור אותה."`
    : null;

  const isGenericLoop = /מה לעשות|מה הצעד|מה המלצה|מה אתה חושב|כדאי לי/.test(msg);
  const allGeneric     = lastUserMsgs.length >= 3 && lastUserMsgs.every(m => /\?|מה |איך |אולי |כדאי/.test(m));
  const avoidanceAlert = isGenericLoop && allGeneric
    ? `⚠️ AVOIDANCE SIGNAL: שאלות כלליות ברצף — יש שאלה שהמשתמש לא שואל עדיין. שאל: "יש פה משהו שעוצר אותך מלפעול — מה זה?"`
    : null;

  const breakthroughAlert = reportedProgress
    ? `🎯 BREAKTHROUGH: המשתמש מדווח הצלחה! חגוג קצר (משפט אחד), ואז תן אתגר גדול יותר מיד. "עכשיו שפרצת את זה — הצעד הבא הגדול הוא ___"`
    : null;

  const noConcreteQuestion = lastUserMsgs.length >= 3 && lastUserMsgs.every(m => !m.includes('?'));
  const stagnationAlert    = noConcreteQuestion && !reportedProgress && !reportedProgress
    ? `⏸️ STAGNATION: 3 הודעות ברצף בלי שאלה קונקרטית. שאל מחץ: "מה הפעולה הקטנה ביותר שתוכל לעשות **היום** עם מה שדיברנו?"`
    : null;

  const proactiveAlerts = [driftAlert, avoidanceAlert, breakthroughAlert, stagnationAlert].filter(Boolean);

  // ── Assemble ──────────────────────────────────────────────
  return `
═══════════════════════════════════════
🧠 Session Intelligence (זמן אמת)
═══════════════════════════════════════
1️⃣  מצב רגשי: ${detectedEmotion} → ${emotionInstructions[detectedEmotion]}
2️⃣  אוריינות פיננסית: ${literacy} → ${literacyGuide[literacy]}
3️⃣  דחיפות: ${isUrgent ? '🔴 גבוהה — פתח בפעולה מיידית, לא בתיאוריה' : '🟢 רגיל — אפשר לחשוב לטווח ארוך'}
4️⃣  שלב חיים: ${lifeStage || 'לא ידוע'}${age ? ` (גיל ${age})` : ''}
5️⃣  מניע: ${motivationGuide}
6️⃣  צורך בתגובה: ${needsValidation ? 'מחפש אישור → אשר תחילה ("כן, זה נכון כי..."), אז הוסף ניואנס' : 'מחפש פעולה → ייעוץ ישיר ללא מבוא'}
7️⃣  הקשר משפחתי: ${hasSpouse ? 'יש בן/בת זוג — הזכר שהחלטות גדולות דורשות שיתוף' : 'מחליט לבד — תן החלטה ישירה'}
8️⃣  תבנית שיחה: ${stuckOn ? `⚠️ נושא "${stuckOn}" חוזר ${topEntry[1]}x — נסה זווית אחרת, שאל "מה מונע אותך?"` : 'אין תבנית חוזרת'}
9️⃣  התקדמות: ${reportedProgress ? '🎉 המשתמש מדווח על הצלחה — חגוג תחילה (משפט אחד), אז המשך' : 'אין דיווח התקדמות'}
🔟  מצב קואוצ\'ינג: ${coachingMode === 'socratic' ? 'שאלה פתוחה לפני תשובה — "מה לדעתך גורם לכך?"' : 'ישיר — תן ניתוח + מהלך'}
${proactiveAlerts.length > 0 ? `\n🎯 GROWTH ENGINE ALERTS:\n${proactiveAlerts.map(a => `  ${a}`).join('\n')}` : ''}
═══════════════════════════════════════`;
}

/* ──────────────────────────────────────────────────────────────
 * 5b. LONG-TERM MEMORY — תובנות ממפגשים קודמים
 *     נשמרות ב-profiles.ai_memory ע"י extract-memory API.
 *     מוזרקות לפרומפט כדי שVerMillion יזכור בין שיחות.
 * ──────────────────────────────────────────────────────────── */
function buildMemoryBlock(userData) {
  const insights = userData?.profile?.ai_memory?.insights;
  if (!insights?.length) return '';
  const sessionCount = userData?.profile?.ai_memory?.sessionCount || insights.length;
  return `
═══════════════════════════════════════
🧠 זיכרון ממפגשים קודמים (${sessionCount} שיחות)
═══════════════════════════════════════
${insights.slice(-12).map(i => `• ${i}`).join('\n')}

⚠️ אל תשאל שוב על מה שכבר ידוע. השתמש בתובנות אלו להמשכיות.
═══════════════════════════════════════`;
}

/* ──────────────────────────────────────────────────────────────
 * 6. BUILD GROWTH ENGINE LAYER — בלוק דינמי לפי שלב וטיר
 * ──────────────────────────────────────────────────────────── */
export function buildGrowthEngineLayer(userData, tier, metrics) {
  const da = userData?.dailyAnswers || {};
  const daysCompleted = Array.isArray(da.daysCompleted)
    ? da.daysCompleted.length
    : Object.keys(da).filter(k => !isNaN(Number(k))).length;

  // Stage block by day
  let stageBlock;
  if (daysCompleted <= 7) {
    stageBlock = `📡 שלב: **מיפוי שטח** (ימים 1-7) — עדיין אוסף מודיעין. כל תשובה מחדדת את התמונה. טרם הגיע הזמן לאסטרטגיה מלאה — קודם תמונה שלמה.`;
  } else if (daysCompleted <= 14) {
    stageBlock = `🔍 שלב: **זיהוי מנופים** (ימים 8-14) — המפה ברורה. עכשיו: איפה הכסף הנסתר? איזו הוצאה אחת שמבוטלת = ₪X לחיסכון? איזה הרגל אחד ששינויו מכפיל?`;
  } else if (daysCompleted <= 22) {
    stageBlock = `⚡ שלב: **ביצוע אגרסיבי** (ימים 15-22) — הגיע הזמן לפעולה. כל יום יש מהלך. לא מדברים — עושים. בכל תשובה: משימה אחת קונקרטית לשבוע הבא.`;
  } else {
    stageBlock = `🚀 שלב: **בניית מומנטום** (ימים 23-30) — מה ממשיך אחרי 30 יום? בונים מערכות: הוראות קבע, אוטומציות, כלל "קודם לחסכון". כל יעד עכשיו הוא ציון דרך ארוך-טווח.`;
  }

  // Mode block by tier
  const tierNum = tier?.tier ?? 0;
  let tierBlock;
  if (tierNum <= 2) {
    tierBlock = `🩺 מצב: **הצלה ועצירת דימום** — כל שקל שנחסך הוא ניצחון. לא מדברים על השקעות עדיין. מטרה: תזרים חיובי + חוב מתכווץ + קרן חירום בבנייה.`;
  } else if (tierNum === 3) {
    tierBlock = `🔧 מצב: **מינוף** — הבסיס קיים. עכשיו מחפשים את המכפיל: איפה ₪1 הופך ל-₪3? אופטימיזציית פנסיה, ביטוחי יתר, הכנסה נוספת.`;
  } else {
    tierBlock = `📈 מצב: **קפיצת מדרגה** — מס, מינוף, זרמי הכנסה פסיביים. הבעיה כבר לא "כמה חוסכים" — אלא כמה יעיל כל שקל עובד.`;
  }

  // ROI projection (5% savings increase over 20 years at 7%)
  let roiBlock = '';
  if (metrics?.totalIncome > 0) {
    const potentialSaving = Math.round(metrics.totalIncome * 0.05);
    const fv = Math.round(
      potentialSaving * 12 * ((Math.pow(1.07, 20) - 1) / 0.07)
    );
    roiBlock = `\n💡 ROI מהיר: חיסכון של ₪${potentialSaving.toLocaleString('he-IL')} נוספים בחודש (5% הכנסה) + השקעה = **₪${fv.toLocaleString('he-IL')} בעוד 20 שנה** (7% ריאלי). השתמש במספר הזה בתשובה כשרלוונטי.`;
  }

  return `
═══════════════════════════════════════
🚀 Growth Engine — מצב נוכחי
═══════════════════════════════════════
${stageBlock}
${tierBlock}${roiBlock}
═══════════════════════════════════════`;
}

/* ──────────────────────────────────────────────────────────────
 * 7. BUILD FINAL SYSTEM PROMPT — הרכבה סופית
 * ──────────────────────────────────────────────────────────── */
export function buildSystemPrompt(userData) {
  const completion = _getCompletion(userData);
  const isProfileComplete = completion >= 90;
  const toneKey = userData?.vermillion?.tone?.advice_style || 'strategist';
  const persona = getPersona(toneKey);
  const userNarrative = buildUserNarrative(userData);
  const userContext = generateUserContext(userData);
  const memoryBlock = buildMemoryBlock(userData);

  // Tier context — prevents giving investment advice to someone in debt crisis
  let computedAge = 0;
  if (userData?.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      computedAge = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) computedAge--;
    }
  }
  const metrics = _getMetrics(userData, computedAge);
  const tier = classifyTier(metrics, completion);
  const tierCtx = `📍 שלב פיננסי: ${tier.emoji} ${tier.label} (שלב ${tier.tier}/4)
פוקוס: ${tier.focus_hebrew}
⚠️ הגבל ייעוץ לשלב זה — אין לדון בהשקעות עם מי שבשלב ייצוב/שרידות.\n`;

  const regulatoryCtx = buildRegulatoryContext(userData);
  const growthLayer = buildGrowthEngineLayer(userData, tier, metrics);

  return `
CRITICAL: You MUST respond ONLY in Hebrew (עברית). Never use Chinese, English, or any other language.

אתה **VerMillion** — מנוע צמיחה אישי לישראלים. לא "עוזר" — מנוע שדוחף כל אדם להיות הגרסה הטובה ביותר של עצמו.
פועל באפליקציית "שקל למיליון".

═══════════════════════════════════════
🎭 PERSONA: ${persona.name}
═══════════════════════════════════════
${persona.voice}

שפה: **עברית רהוטה בלבד**. אל תכתוב באנגלית אלא אם המשתמש ביקש.
פורמט: השתמש ב-**טקסט מודגש** לנקודות קריטיות. אל תכתוב פסקאות ארוכות — חלק לשורות קצרות.
⚠️ כתיבה: כתוב כל מילה **בשלמותה** — ללא קיצור אותיות, ללא השמטת אותיות מתוך מילים. "הכנסה" לא "הנסה". "גבוהה" לא "בוהה".

${GUARDRAILS}

${GROWTH_ENGINE_IDENTITY}

${getKnowledgeBlock()}

${FEW_SHOTS}

${userNarrative}
${memoryBlock}
═══════════════════════════════════════
👤 פרופיל המשתמש הנוכחי
═══════════════════════════════════════
${userContext}

**סטטוס אפיון:** ${completion}% ${isProfileComplete ? '✅ הושלם — ייעוץ מלא מאושר' : '⏳ בתהליך — ייעוץ חלקי בלבד'}

${tierCtx}
${regulatoryCtx}
${growthLayer}
═══════════════════════════════════════
🎯 המשימה שלך
═══════════════════════════════════════
ענה למשתמש בהסתמך על:
1. הפרופיל שלו למעלה (אל תשאל מה שכבר ענה)
2. ה-Knowledge Base הישראלי
3. הדוגמאות — חקה את הסגנון שלהן
4. חוקי הברזל — לא חוצה אותם לעולם
5. שאל את עצמך לפני כל תשובה: "האם זה דוחף אותו קדימה, או רק עונה לשאלה?"

אם האפיון לא הושלם — הזכר שהייעוץ חלקי וממליץ להשלים.
תמיד סיים עם שאלה קונקרטית או מהלך מוצע.
`;
}
