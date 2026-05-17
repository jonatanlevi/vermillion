export const config = { runtime: 'edge' };

import { trackGroqCost } from './_shared/trackCost.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { messages, existingInsights, userContext } = body || {};
  if (!messages?.length) return new Response(JSON.stringify({ insights: [] }), { status: 200 });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'GROQ_API_KEY missing' }), { status: 500 });

  const existing = (existingInsights || []).slice(-10).join('\n');
  const convo = messages
    .filter(m => m.text?.trim())
    .slice(-8)
    .map(m => `${m.role === 'user' ? 'משתמש' : 'יועץ'}: ${m.text}`)
    .join('\n');

  const systemPrompt = `אתה פסיכולוג פיננסי שמנתח שיחות ומחלץ תובנות עמוקות על המשתמש.
כתוב 1-3 משפטים קצרים בעברית על מה שלמדת חדש מהשיחה הזו.

התמקד ב-4 קטגוריות (ציין רק מה שנחשף בשיחה הנוכחית):
• דפוס התנהגותי: "כשמתחת ללחץ הוא מוציא על [X]" / "נוטה לדחות החלטות על [X]"
• טריגר רגשי: "נושא [X] מעלה חרדה" / "מדבר על [X] עם הגנה"
• אמונה כלכלית: "מאמין ש[X]" / "חושש ש[X] לעולם לא יקרה"
• פעולה שנקט: "הצליח / נכשל ב[X]" / "החליט לעשות [X]"

אל תחזור על מה שכבר ידוע. אם אין שום דבר חדש — החזר מחרוזת ריקה בלבד.
פורמט: משפט אחד בשורה. ללא כותרות, ללא מספרים. עברית בלבד.`;

  const userPrompt = `מה שכבר ידוע על המשתמש:\n${existing || 'אין מידע קודם'}\n\nשיחה עכשיו:\n${convo}\n\nמה חדש?`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!res.ok) return new Response(JSON.stringify({ insights: [] }), { status: 200 });
    const json = await res.json();
    // Track cost (non-blocking)
    if (json.usage) trackGroqCost(SUPABASE_URL, SUPABASE_KEY, 'llama-3.1-8b-instant', json.usage, 'memory_extract');
    const text = json.choices?.[0]?.message?.content?.trim() || '';
    const newInsights = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 && l.length < 200);

    return new Response(JSON.stringify({ insights: newInsights }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ insights: [] }), { status: 200 });
  }
}
