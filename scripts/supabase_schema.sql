-- VerMillion — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Enable anonymous auth (do this in Dashboard → Auth → Providers → Anonymous)

-- Users profile
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_style text default 'default',
  avatar_color text default '#C0392B',
  subscription text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Financial data (flat key-value from onboarding questions)
create table if not exists financial_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Onboarding state (days completed, answers per day)
create table if not exists onboarding_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  days_completed integer[] default '{}',
  daily_answers jsonb default '{}',
  updated_at timestamptz default now()
);

-- Chat history
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  messages jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Commitment (time + streak)
create table if not exists commitment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  committed_at timestamptz,
  streak_days integer default 0,
  updated_at timestamptz default now()
);

-- Game log (obstacle game scores)
create table if not exists game_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  entries jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Leaderboard view (public, read-only)
create or replace view leaderboard as
  select
    p.id,
    p.name,
    p.avatar_style,
    p.avatar_color,
    p.subscription,
    coalesce(array_length(o.days_completed, 1), 0) as days_completed,
    coalesce(c.streak_days, 0) as streak_days
  from profiles p
  left join onboarding_state o on o.user_id = p.id
  left join commitment c on c.user_id = p.id
  order by days_completed desc, streak_days desc;

-- RLS: users can only read/write their own rows
alter table profiles enable row level security;
alter table financial_data enable row level security;
alter table onboarding_state enable row level security;
alter table chat_history enable row level security;
alter table commitment enable row level security;
alter table game_log enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own financial" on financial_data for all using (auth.uid() = user_id);
create policy "own onboarding" on onboarding_state for all using (auth.uid() = user_id);
create policy "own chat" on chat_history for all using (auth.uid() = user_id);
create policy "own commitment" on commitment for all using (auth.uid() = user_id);
create policy "own game_log" on game_log for all using (auth.uid() = user_id);

-- Leaderboard: everyone can read
grant select on leaderboard to anon, authenticated;
