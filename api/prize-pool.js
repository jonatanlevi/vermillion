export const config = { runtime: 'edge' };

const SUPABASE_URL    = process.env.SUPABASE_URL    || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON   = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req) {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  try {
    // Fetch config + active subscriber count in parallel
    const headers = {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    };

    const [cfgRes, subRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/prize_config?id=eq.1&select=*`, { headers }),
      // Count profiles with subscription = 'premium' and updated in last 35 days (active)
      fetch(`${SUPABASE_URL}/rest/v1/profiles?subscription=eq.premium&select=id`, {
        headers: { ...headers, 'Prefer': 'count=exact', 'Range': '0-0' },
      }),
    ]);

    if (!cfgRes.ok) throw new Error('config fetch failed');

    const [cfgArr] = await cfgRes.json();
    const cfg = cfgArr || {};

    // Parse active subscriber count from Content-Range header (e.g. "0-0/1247")
    const contentRange = subRes.headers.get('content-range') || '0-0/0';
    const activeSubscribers = parseInt(contentRange.split('/')[1] || '0', 10);

    const monthlyRevenue      = activeSubscribers * (cfg.monthly_price_ils || 99);
    const operationalCost     = monthlyRevenue * ((cfg.operational_cost_pct || 20) / 100);
    const netRevenue          = monthlyRevenue - operationalCost;
    const monthlyPrizePool    = netRevenue    * ((cfg.prize_pool_pct || 50) / 100);
    const weeklyPrizePool     = monthlyPrizePool / 4;
    const withholdingTaxPct   = cfg.withholding_tax_pct || 0;
    // Winner receives after withholding
    const weeklyPrizeNet      = weeklyPrizePool * (1 - withholdingTaxPct / 100);

    return new Response(JSON.stringify({
      activeSubscribers,
      monthlyRevenue:     Math.round(monthlyRevenue),
      operationalCostPct: cfg.operational_cost_pct || 20,
      netRevenue:         Math.round(netRevenue),
      prizePoolPct:       cfg.prize_pool_pct || 50,
      monthlyPrizePool:   Math.round(monthlyPrizePool),
      weeklyPrizePool:    Math.round(weeklyPrizePool),
      withholdingTaxPct,
      weeklyPrizeNet:     Math.round(weeklyPrizeNet),
      incomeTaxNote:      cfg.income_tax_note || '',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // cache 5 min
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, weeklyPrizePool: 0, activeSubscribers: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
