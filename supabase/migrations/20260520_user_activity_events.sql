-- Activity timeline: every meaningful user action in the app
-- Run in Supabase SQL Editor BEFORE deploying app update

create table if not exists public.user_activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  event_type  text not null,
  screen      text,
  payload     jsonb not null default '{}',
  session_id  text,
  device_tz   text
);

create index if not exists user_activity_events_user_time_idx
  on public.user_activity_events (user_id, occurred_at desc);

-- Users can insert their own events; no SELECT (CRM reads via service role only)
alter table public.user_activity_events enable row level security;

create policy "insert own events"
  on public.user_activity_events
  for insert
  with check (auth.uid() = user_id);

-- Enable Realtime for CRM live feed
-- (Also toggle on in Supabase Dashboard → Database → Replication)
alter publication supabase_realtime add table public.user_activity_events;
