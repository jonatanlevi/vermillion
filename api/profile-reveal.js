export const config = { runtime: 'edge' };

import { trackGroqCost } from './_shared/trackCost.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const TIER_CONTEXT = {
  0: 'המשתמש לא סיים את האפיון (מידע חסר). כתוב על מה שכן ידוע.',
  1: 'יש חוב שגבוה מ-6x הכנסה חודשית או גירעון שוטף — שלב ייצוב.',
  2: 'אין חוב גדול אבל שיעור חיסכון פחות מ-5% — שלב שרידות.',
  3: 'חוסך אבל מתחת ל-20% — שלב בנייה עם פוטנציאל גדול.',
  4: 'חיסכון מעל 20% — שלב אופטימיזציה.',
};

const EMPLOYMENT_HE = {
  employee: 'שכיר',    self_employed: 'עצמאי',   business: 'בעל עסק',
  freelance: 'פרילנסר', student: 'סטודנט',         unemployed: 'לא עובד',
};

const FAMILY_HE = {
  single: 'רווק/ה', partner: 'בזוגיות', married: 'נשוי/ה',
  divorced: 'גרוש/ה', widowed: 'אלמן/ה',
};

const GOAL_HE = {
  financial_freedom: 'חופש כלכלי', buy_apartment: 'קניית דירה',
  emergency_fund: 'קרן חירום', retire_early: 'פרישה מוקדמת',
  debt_free: 'לצאת מחובות', grow_income: 'להגדיל הכנסה',
};

const FEAR_HE = {
  job_loss: 'פחד מפיטורים', debt_spiral: 'חשש מהחרפת החובות',
  retirement_poverty: 'דאגה לפנסיה', no_savings: 'תחושה שהכסף תמיד נגמר',
  inflation: 'פחד מאינפלציה', no_control: 'חוסר שליטה על הכסף',
};

const OBSTACLE_HE = {
  no_discipline: 'חוסר עקביות', too_complex: 'נראה מורכב מדי',
  no_money: 'לא נשאר מה לחסוך', no_knowledge: 'לא יודע מאיפה להתחיל',
  partner_conflict: 'חוסר הסכמה עם בן/בת הזוג', fear_of_loss: 'פחד לאבד כסף',
};

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { userData, tier = 0 } = body || {};
  if (!userData) return new Response(JSON.stringify({ error: 'missing userData' }), { status: 400 });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY missing' }), { status: 500 });

  // ── Build data summary for Claude ──────────────────────────────
  const a = {};
  Object.values(userData.dailyAnswers || {}).forEach(day => Object.assign(a, day));
  const name = userData?.name?.split(' ')[0] || 'המשתמש';

  const income       = Number(a.net_income || 0) + Number(a.side_income || 0) + Number(a.partner_income || 0);
  const housing      = Number(a.housing_expense || 0);
  const fixed        = Number(a.fixed_expenses || 0);
  const variable     = Number(a.variable_expenses || 0);
  const totalExp     = housing + fixed + variable;
  const surplus      = income - totalExp;
  const savingsRate  = income > 0 ? Math.round((surplus / income) * 100) : 0;
  const totalDebt    = Number(a.credit_debt || 0) + Number(a.loans_total || 0) + Number(a.mortgage_balance || 0);
  const liquid       = Number(a.liquid_savings || 0);
  const investments  = Number(a.investments || 0);
  const realEstate   = Number(a.real_estate_equity || 0);
  const netWorth     = liquid + investments + realEstate - Number(a.credit_debt || 0) - Number(a.loans_total || 0);

  const fmt = n => n > 0 ? `₪${Math.round(n).toLocaleString('he-IL')}` : '—';

  const dataSummary = `
שם: ${name}
תעסוקה: ${EMPLOYMENT_HE[a.employment_type] || '?'}
מצב משפחתי: ${FAMILY_HE[a.family_status] || '?'}${Number(a.children_count) > 0 ? ` + ${a.children_count} ילדים` : ''}
דיור: ${a.housing_type || '?'}

הכנסה חודשית נטו: ${fmt(income)}
הוצאות חודשיות: ${fmt(totalExp)} (דיור ${fmt(housing)}, קבוע ${fmt(fixed)}, משתנה ${fmt(variable)})
עודף/גירעון: ${surplus >= 0 ? fmt(surplus) + ' עודף' : fmt(Math.abs(surplus)) + ' גירעון'} (${savingsRate}% חיסכון)

חובות: ${totalDebt > 0 ? fmt(totalDebt) : 'אין'}
חיסכון נזיל: ${fmt(liquid)}
השקעות: ${fmt(investments)}
נדל"ן (הון עצמי): ${fmt(realEstate)}
שווי נקי כולל: ${netWorth >= 0 ? fmt(netWorth) : '−' + fmt(Math.abs(netWorth))}

מטרה: ${GOAL_HE[a.money_goal] || a.money_goal || '?'}
פחד: ${FEAR_HE[a.money_fear] || a.money_fear || '?'}
בלוק: ${OBSTACLE_HE[a.saving_obstacle] || a.saving_obstacle || '?'}
מחויבות: ${a.commitment || '?'}

שלב פיננסי: Tier ${tier} — ${TIER_CONTEXT[tier] || ''}
`.trim();

  const systemPrompt = `אתה VerMillion — מאמן פיננסי אישי שיוצר דוח חשיפת פרופיל ביום 8.
כתוב **בעברית בלבד**. טון: כמו מישהו שבאמת רואה את האדם — לא רשימת נתונים.

המבנה: 3 פסקאות בדיוק. בין כל פסקה — שורה ריקה. **ללא כותרות** (לא "פסקה 1" וכו').

פסקה 1 — "מי אתה כלכלית": 3-4 משפטים. פורטרט בגוף שלישי שמשלב identity + מספרים + הדינמיקה ביניהם. לא רשימה.
פסקה 2 — "הנקודה שלא ידעת על עצמך": משפט אחד של תובנה חדה שהמשתמש לא ניסח לעצמו — דפוס, סתירה, עיוור-ספוט. הכי חשוב שתרגיש אמיתי, לא גנרי.
פסקה 3 — "הצעד הראשון שלך": מהלך ספציפי אחד שמתאים לשלב הפיננסי שלו — לא עצה כללית. משפטיים קצרים. מסיים בשאלה קצרה שמזמינה להמשך.

אסור: ייעוץ השקעות ספציפי, הבטחת תשואה, ציון מניות/ETF ספציפיים.
חובה: מזכיר שהוא מאמן ולא יועץ מורשה — אבל רק במשפט אחד קצר בפסקה 3.`;

  const userPrompt = `צור דוח חשיפת פרופיל עבור:\n\n${dataSummary}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'Anthropic error', detail: err }), { status: 502 });
    }

    const json = await res.json();
    const reveal = json.content?.[0]?.text?.trim() || '';

    if (!reveal) return new Response(JSON.stringify({ error: 'empty response' }), { status: 502 });

    return new Response(JSON.stringify({ reveal, name }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
