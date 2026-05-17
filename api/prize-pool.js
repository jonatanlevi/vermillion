export const config = { runtime: 'edge' };

const SUPABASE_URL  = process.env.SUPABASE_URL    || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default async function handler(req) {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  try {
    const headers = {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    };
    const month = currentMonth();

    // Fetch config, active subscribers, and actual costs this month — in parallel
    const [cfgRes, subRes, costsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/prize_config?id=eq.1&select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/profiles?subscription=eq.premium&select=id`, {
        headers: { ...headers, 'Prefer': 'count=exact', 'Range': '0-0' },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/operational_costs?month=eq.${month}&select=amount_ils`, { headers }),
    ]);

    if (!cfgRes.ok) throw new Error('config fetch failed');

    const [cfgArr] = await cfgRes.json();
    const cfg = cfgArr || {};

    // Active subscriber count from Content-Range header
    const contentRange   = subRes.headers.get('content-range') || '0-0/0';
    const activeSubscribers = parseInt(contentRange.split('/')[1] || '0', 10);

    // Actual costs this month (sum)
    const costsArr = costsRes.ok ? await costsRes.json() : [];
    const actualCostsIls = costsArr.reduce((sum, row) => sum + parseFloat(row.amount_ils || 0), 0);

    // Revenue
    const monthlyRevenue  = activeSubscribers * (cfg.monthly_price_ils || 99);

    // Use actual costs if tracked; fall back to percentage estimate
    const estimatedCosts  = monthlyRevenue * ((cfg.operational_cost_pct || 20) / 100);
    const operationalCosts = actualCostsIls > 0 ? actualCostsIls : estimatedCosts;
    const usingActualCosts = actualCostsIls > 0;

    const netRevenue        = Math.max(0, monthlyRevenue - operationalCosts);
    const monthlyPrizePool  = netRevenue * ((cfg.prize_pool_pct || 50) / 100);
    const weeklyPrizePool   = monthlyPrizePool / 4;
    const withholdingTaxPct = cfg.withholding_tax_pct || 0;
    const weeklyPrizeNet    = weeklyPrizePool * (1 - withholdingTaxPct / 100);

    return new Response(JSON.stringify({
      month,
      activeSubscribers,
      monthlyRevenue:      Math.round(monthlyRevenue),
      operationalCosts:    Math.round(operationalCosts),
      usingActualCosts,
      netRevenue:          Math.round(netRevenue),
      prizePoolPct:        cfg.prize_pool_pct || 50,
      monthlyPrizePool:    Math.round(monthlyPrizePool),
      weeklyPrizePool:     Math.round(weeklyPrizePool),
      withholdingTaxPct,
      weeklyPrizeNet:      Math.round(weeklyPrizeNet),
      incomeTaxNote:       cfg.income_tax_note || '',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, weeklyPrizePool: 0, activeSubscribers: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
