-- game_sessions: proof that a game was actually played before stamp
-- token is single-use, issued by game-complete Edge Function

CREATE TABLE IF NOT EXISTS game_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day          integer     NOT NULL,
  month_key    text        NOT NULL,
  game_key     text        NOT NULL,
  game_score   integer,
  started_at   timestamptz NOT NULL,
  duration_ms  integer     NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  token        text        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  token_used   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, day, month_key)
);

-- Only Edge Functions (service role) read/write this table
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Users cannot read or write directly — all access via Edge Functions
DROP POLICY IF EXISTS "no direct access" ON game_sessions;
CREATE POLICY "no direct access" ON game_sessions
  FOR ALL USING (false);

-- Index for token lookup (called on every stamp)
CREATE INDEX IF NOT EXISTS game_sessions_token_idx ON game_sessions (token);
CREATE INDEX IF NOT EXISTS game_sessions_user_day_idx ON game_sessions (user_id, day, month_key);

-- Stamp windows use profiles.timezone (IANA, e.g. Asia/Jerusalem)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
