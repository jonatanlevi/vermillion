import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vermillion-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const appSecret = req.headers.get('x-vermillion-secret');
    const expectedSecret = Deno.env.get('APP_SECRET');
    if (expectedSecret && appSecret !== expectedSecret) {
      return json({ error: 'Forbidden' }, 403);
    }

    // Service-role client — bypasses RLS so we can write authoritative scores
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller JWT → get real user id (cannot be spoofed)
    const { data: { user }, error: authErr } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { day, month_key } = await req.json();
    if (!day || !month_key) return json({ error: 'day and month_key required' }, 400);

    // Read user's committed time (server DB — not client-supplied)
    const { data: commitment } = await admin
      .from('commitment')
      .select('committed_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // Server clock — attacker cannot influence this
    const now = new Date();
    let ms_diff = 0;
    let committed_hour = 0;
    let committed_minute = 0;

    if (commitment?.committed_at) {
      const ref = new Date(commitment.committed_at);
      committed_hour   = ref.getHours();
      committed_minute = ref.getMinutes();

      const gate = new Date(now);
      gate.setHours(committed_hour, committed_minute, 0, 0);
      ms_diff = Math.abs(now.getTime() - gate.getTime());
      // Midnight wrap: if diff > 12 h use mirror distance
      if (ms_diff > 43_200_000) ms_diff = 86_400_000 - ms_diff;
    }

    const score = Math.max(1, Math.round(1000 * (1 - ms_diff / 86_400_000)));

    const { error: upsertErr } = await admin.from('daily_stamps').upsert(
      {
        user_id:          user.id,
        day,
        month_key,
        stamped_at:       now.toISOString(),
        committed_hour,
        committed_minute,
        ms_diff,
        score,
      },
      { onConflict: 'user_id,day,month_key' },
    );

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    return json({ score, ms_diff });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
