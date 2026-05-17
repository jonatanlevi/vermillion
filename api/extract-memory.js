export const config = { runtime: 'edge' };

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

  const systemPrompt = `אתה מנתח שיחות פיננסיות ומחלץ תובנות על המשתמש.
כתוב 1-2 משפטים קצרים בעברית על מה שלמדת חדש על המשתמש מהשיחה הזו.
התמקד ב: דפוסי הוצאות, פחדים כלכליים, מטרות, התנהגויות, עמדות לכסף.
אל תחזור על מה שכבר ידוע. אם אין שום דבר חדש — החזר מחרוזת ריקה בלבד.
פורמט: משפט אחד בשורה. ללא כותרות, ללא מספרים.`;

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
