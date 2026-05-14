export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, systemPrompt } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: 'missing messages' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  try {
    const groqMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 400,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[groq] error:', err);
      return res.status(502).json({ error: 'groq_error' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ response: text });
  } catch (e) {
    console.error('[groq] fetch failed:', e);
    res.status(500).json({ error: 'internal' });
  }
}
