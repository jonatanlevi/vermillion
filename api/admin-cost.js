export const config = { runtime: 'edge' };

// POST /api/admin-cost
// Body: { secret, category, amount_ils, description, month? }
// categories: 'vercel' | 'supabase' | 'groq_api' | 'other'
//
// Example (run from curl or Postman once a month):
//   curl -X POST https://vermillion-ashen.vercel.app/api/admin-cost \
//     -H "Content-Type: application/json" \
//     -d '{"secret":"vermillion-secret-2026","category":"vercel","amount_ils":150,"description":"Vercel Pro May 2026"}'

const SUPABASE_URL  = process.env.SUPABASE_URL    || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const APP_SECRET    = process.env.APP_SECRET;

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const { secret, category, amount_ils, description, month } = body || {};

  if (!secret || secret !== APP_SECRET) return new Response('Forbidden', { status: 403 });
  if (!category || !amount_ils) return new Response('missing category or amount_ils', { status: 400 });

  const VALID_CATEGORIES = ['vercel', 'supabase', 'groq_api', 'other'];
  if (!VALID_CATEGORIES.includes(category)) {
    return new Response(`invalid category. use: ${VALID_CATEGORIES.join(' | ')}`, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/operational_costs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      month:        month || currentMonth(),
      category,
      amount_ils:   parseFloat(amount_ils),
      description:  description || category,
      auto_tracked: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, inserted: data }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
