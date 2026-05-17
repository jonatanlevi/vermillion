// Groq pricing (USD per 1M tokens, May 2026)
const GROQ_PRICES = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant':    { input: 0.05, output: 0.08 },
};
const USD_TO_ILS = 3.72;

function groqCostIls(model, inputTokens, outputTokens) {
  const p = GROQ_PRICES[model] || GROQ_PRICES['llama-3.3-70b-versatile'];
  const usd = (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  return usd * USD_TO_ILS;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

export async function trackGroqCost(supabaseUrl, supabaseKey, model, usage, description) {
  if (!usage?.prompt_tokens && !usage?.completion_tokens) return;
  const amountIls = groqCostIls(
    model,
    usage.prompt_tokens    || 0,
    usage.completion_tokens || 0,
  );
  if (amountIls < 0.0001) return; // לא שווה לרשום פחות מ-0.01 אגורה

  try {
    await fetch(`${supabaseUrl}/rest/v1/operational_costs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        month:        currentMonth(),
        category:     'groq_api',
        amount_ils:   amountIls,
        description:  description || model,
        auto_tracked: true,
      }),
    });
  } catch { /* non-critical */ }
}
