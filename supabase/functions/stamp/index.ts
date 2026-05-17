import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getLocalHM, getLocalTimeParts, resolveStampTimezone } from '../_shared/time.ts';
import { CHALLENGE_WINDOWS, calcWindowScore, isChallengeLocalDay, isHmInChallengeWindow } from '../_shared/windows.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vermillion-secret',
};

const DAY_MS = 86_400_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function requireAppSecret(req: Request): Response | null {
  const expected = Deno.env.get('APP_SECRET');
  if (!expected) {
    console.error('[stamp] APP_SECRET missing on server');
    return json({ error: 'SERVER_MISCONFIGURED' }, 500);
  }
  if (req.headers.get('x-vermillion-secret') !== expected) {
    return json({ error: 'Forbidden' }, 403);
  }
  return null;
}

function msDiffFromCommitment(now: Date, committedHour: number, committedMinute: number, timezone: string): number {
  const { hour: nowH, minute: nowM } = getLocalHM(now.toISOString(), timezone);
  const nowMins = nowH * 60 + nowM;
  const targetMins = committedHour * 60 + committedMinute;
  let diffMins = Math.abs(nowMins - targetMins);
  if (diffMins > 12 * 60) diffMins = 24 * 60 - diffMins;
  return diffMins * 60_000;
}

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

    const { day, month_key, game_token, client_timezone } = await req.json();
    if (!day || !month_key) return json({ error: 'day and month_key required' }, 400);
    if (!game_token) return json({ error: 'GAME_TOKEN_REQUIRED' }, 403);

    const now = new Date();

    const { data: profile } = await admin
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    // שעון מקומי של המשתמש ברגע החתימה (מכשיר), לא timezone ישראל קבוע
    const userTz = resolveStampTimezone(client_timezone, profile?.timezone);
    if (client_timezone && userTz === client_timezone) {
      await admin.from('profiles').update({ timezone: userTz }).eq('id', user.id);
    }

    const { day: localDay, mins } = getLocalTimeParts(now, userTz);

    let score = 0;
    let ms_diff = 0;
    let committed_hour = 0;
    let committed_minute = 0;
    let window_mode = false;

    if (isChallengeLocalDay(localDay)) {
      const win = localDay === 5 ? CHALLENGE_WINDOWS.FRIDAY : CHALLENGE_WINDOWS.SATURDAY;
      if (mins < win.open || mins > win.close) {
        const message = localDay === 5
          ? 'חלון החתימה ביום שישי נסגר בשעה 15:30'
          : mins < win.open
            ? 'חלון החתימה נפתח בשבת בשעה 21:00'
            : 'חלון החתימה בשבת נסגר בחצות';
        return json({
          error: 'WINDOW_CLOSED',
          message,
          next_open: localDay === 5 ? 'שבת 21:00' : (mins > win.close ? 'יום ראשון' : 'שבת 21:00'),
        }, 403);
      }

      const { data: challengeCommit } = await admin
        .from('commitment')
        .select('friday_target_hour, friday_target_minute, saturday_target_hour, saturday_target_minute')
        .eq('user_id', user.id)
        .maybeSingle();

      const targetH = localDay === 5
        ? challengeCommit?.friday_target_hour
        : challengeCommit?.saturday_target_hour;
      const targetM = localDay === 5
        ? challengeCommit?.friday_target_minute
        : challengeCommit?.saturday_target_minute;

      if (targetH == null || targetM == null) {
        return json({
          error: 'CHALLENGE_TIME_REQUIRED',
          message: 'קבע שעת חתימה בתוך הטווח לפני שאתה חותם',
        }, 403);
      }

      if (!isHmInChallengeWindow(localDay, targetH, targetM)) {
        return json({
          error: 'OUT_OF_WINDOW',
          message: 'שעת היעד שמורה מחוץ לטווח — קבע שעה חדשה',
        }, 403);
      }

      committed_hour   = targetH;
      committed_minute = targetM;
      ms_diff = msDiffFromCommitment(now, targetH, targetM, userTz);
      score = Math.max(1, Math.round(1000 * (1 - ms_diff / DAY_MS)));
      window_mode = true;
    } else {
      // ימי חול: DNA אישי — שעה שנקבעה בהרשמה, מושווית לשעון המקומי עכשיו (userTz)
      const { data: commitment } = await admin
        .from('commitment')
        .select('committed_hour, committed_minute')
        .eq('user_id', user.id)
        .maybeSingle();

      if (commitment?.committed_hour != null && commitment?.committed_minute != null) {
        committed_hour   = commitment.committed_hour;
        committed_minute = commitment.committed_minute;
        ms_diff = msDiffFromCommitment(now, committed_hour, committed_minute, userTz);
      }

      score = Math.max(1, Math.round(1000 * (1 - ms_diff / DAY_MS)));
    }

    // Atomic: burn token only if valid and unused (prevents double-stamp race)
    const { data: session, error: burnErr } = await admin
      .from('game_sessions')
      .update({ token_used: true })
      .eq('token', game_token)
      .eq('user_id', user.id)
      .eq('day', day)
      .eq('month_key', month_key)
      .eq('token_used', false)
      .select('id')
      .maybeSingle();

    if (burnErr) return json({ error: burnErr.message }, 500);
    if (!session) {
      return json({ error: 'INVALID_TOKEN' }, 403);
    }

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

    if (upsertErr) {
      // Roll back burn so user can retry stamp after transient failure
      await admin
        .from('game_sessions')
        .update({ token_used: false })
        .eq('id', session.id);
      return json({ error: upsertErr.message }, 500);
    }

    return json({ score, ms_diff, window_mode });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
