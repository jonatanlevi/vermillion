import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vermillion-secret',
};

const SESSION_MAX_MS = 30 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function requireAppSecret(req: Request): Response | null {
  const expected = Deno.env.get('APP_SECRET');
  if (!expected) {
    console.error('[game-complete] APP_SECRET missing on server');
    return json({ error: 'SERVER_MISCONFIGURED' }, 500);
  }
  if (req.headers.get('x-vermillion-secret') !== expected) {
    return json({ error: 'Forbidden' }, 403);
  }
  return null;
}

// Minimum playtime per game (ms) — impossible to beat this fast as a human
const GAME_MIN_MS: Record<string, number> = {
  memorytap:   4_000,
  reflex:      3_000,
  sort:        5_000,
  runner:     12_000,
  colorboom:   4_000,
  speedtap:    3_000,
  breakout:   15_000,
  obstacle:   10_000,
  timing:      3_000,
  stack:       5_000,
  bubblepop:   6_000,
  bullseye:    3_000,
  catch:       8_000,
  taprhythm:   5_000,
  pingpong:   10_000,
  dodge:      10_000,
  whackmole:   8_000,
  mathsprint:  8_000,
  cardflip:   10_000,
  safecracker: 6_000,
  wordsnap:    5_000,
  taporder:    4_000,
  numberline:  4_000,
  stockticker:10_000,
  pincrack:    5_000,
  scale:       5_000,
  chaintap:    4_000,
  flashcount:  4_000,
  speedmatch:  6_000,
  mathchain:   8_000,
  diceadd:     4_000,
  default:     3_000,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const secretBlock = requireAppSecret(req);
    if (secretBlock) return secretBlock;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authErr } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { day, month_key, game_key, game_score, started_at, duration_ms } = body;
    if (!day || !month_key || !game_key || duration_ms == null || !started_at) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const durationNum = Number(duration_ms);
    if (!Number.isFinite(durationNum) || durationNum < 0) {
      return json({ error: 'INVALID_DURATION' }, 400);
    }

    const minMs = GAME_MIN_MS[game_key] ?? GAME_MIN_MS.default;
    if (durationNum < minMs) {
      return json({ error: 'GAME_TOO_FAST', minMs }, 422);
    }

    const startedDate = new Date(started_at);
    if (Number.isNaN(startedDate.getTime())) {
      return json({ error: 'INVALID_SESSION_TIME' }, 422);
    }

    const now = new Date();
    const ageMs = now.getTime() - startedDate.getTime();
    if (ageMs < -60_000) {
      return json({ error: 'INVALID_SESSION_TIME' }, 422);
    }
    if (ageMs > SESSION_MAX_MS) {
      return json({ error: 'SESSION_EXPIRED' }, 422);
    }

    // duration_ms must match wall clock (client cannot claim 2h play in 5 min wall time)
    const slackMs = 8_000;
    if (durationNum > ageMs + slackMs) {
      return json({ error: 'DURATION_MISMATCH' }, 422);
    }
    if (durationNum > SESSION_MAX_MS) {
      return json({ error: 'DURATION_TOO_LONG' }, 422);
    }

    const token = crypto.randomUUID();

    const { error: upsertErr } = await admin.from('game_sessions').upsert(
      {
        user_id:     user.id,
        day,
        month_key,
        game_key,
        game_score:  game_score ?? null,
        started_at:  startedDate.toISOString(),
        duration_ms: Math.round(durationNum),
        completed_at: now.toISOString(),
        token,
        token_used:  false,
      },
      { onConflict: 'user_id,day,month_key' },
    );

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    return json({ token });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
