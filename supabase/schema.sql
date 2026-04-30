-- VerMillion — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles (linked to auth.users) ──────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text,
  name            text,
  first_name      text,
  last_name       text,
  phone           text,
  date_of_birth   date,
  id_number_last4 text,
  avatar_style    jsonb       default '{}',
  subscription    text        default 'free' check (subscription in ('free', 'premium')),
  lang            text        default 'he'   check (lang in ('he', 'en', 'ru')),
  onboarding_complete boolean default false,
  profile_intake_complete boolean default false,
  joined_at       timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Existing DBs (before these columns): run once in SQL Editor if missing
alter table public.profiles add column if not exists onboarding_complete boolean default false;
alter table public.profiles add column if not exists profile_intake_complete boolean default false;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists id_number_last4 text;

alter table public.profiles enable row level security;

drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- ─── Onboarding answers (days 1–7) ────────────────────────
create table if not exists public.onboarding_answers (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  day          int         not null check (day between 1 and 7),
  question_key text        not null,
  answer       text,
  answered_at  timestamptz default now(),
  unique(user_id, day, question_key)
);

alter table public.onboarding_answers enable row level security;
drop policy if exists "manage own answers" on public.onboarding_answers;
create policy "manage own answers" on public.onboarding_answers for all using (auth.uid() = user_id);

-- ─── Financial data (key/value blob) ──────────────────────
create table if not exists public.financial_data (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null unique,
  data       jsonb       default '{}',
  updated_at timestamptz default now()
);

alter table public.financial_data enable row level security;
drop policy if exists "manage own financial" on public.financial_data;
create policy "manage own financial" on public.financial_data for all using (auth.uid() = user_id);

-- ─── Onboarding state (days completed, profile text) ──────
create table if not exists public.onboarding_state (
  id              uuid        default uuid_generate_v4() primary key,
  user_id         uuid        references auth.users(id) on delete cascade not null unique,
  days_completed  int[]       default '{}',
  daily_answers   jsonb       default '{}',
  updated_at      timestamptz default now()
);

alter table public.onboarding_state enable row level security;
drop policy if exists "manage own onboarding" on public.onboarding_state;
create policy "manage own onboarding" on public.onboarding_state for all using (auth.uid() = user_id);

-- ─── Chat history ─────────────────────────────────────────
create table if not exists public.chat_history (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null unique,
  messages   jsonb       default '[]',
  updated_at timestamptz default now()
);

alter table public.chat_history enable row level security;
drop policy if exists "manage own chat" on public.chat_history;
create policy "manage own chat" on public.chat_history for all using (auth.uid() = user_id);

-- ─── Commitment ───────────────────────────────────────────
create table if not exists public.commitment (
  id            uuid        default uuid_generate_v4() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null unique,
  committed_at  timestamptz,
  streak_days   int         default 0,
  updated_at    timestamptz default now()
);

alter table public.commitment enable row level security;
drop policy if exists "manage own commitment" on public.commitment;
create policy "manage own commitment" on public.commitment for all using (auth.uid() = user_id);

-- ─── Game scores / stamps ─────────────────────────────────
create table if not exists public.game_scores (
  id          uuid        default uuid_generate_v4() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  game_type   text        not null,
  score       int         default 0,
  stamps      int         default 0,
  accuracy_ms int         default 0,
  played_at   timestamptz default now()
);

alter table public.game_scores enable row level security;
drop policy if exists "manage own scores" on public.game_scores;
create policy "manage own scores" on public.game_scores for all using (auth.uid() = user_id);

-- ─── Game log (per-day stamps used by GamesScreen) ────────
create table if not exists public.game_log (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null unique,
  entries    jsonb       default '{}',
  updated_at timestamptz default now()
);

alter table public.game_log enable row level security;
drop policy if exists "manage own game_log" on public.game_log;
create policy "manage own game_log" on public.game_log for all using (auth.uid() = user_id);

-- ─── Daily log (days 9–30) ────────────────────────────────
create table if not exists public.daily_logs (
  id              uuid        default uuid_generate_v4() primary key,
  user_id         uuid        references auth.users(id) on delete cascade not null,
  day             int         not null,
  coaching_answer text,
  challenge_done  boolean     default false,
  multiplier      real        default 1.0,
  logged_at       timestamptz default now(),
  unique(user_id, day)
);

alter table public.daily_logs enable row level security;
drop policy if exists "manage own logs" on public.daily_logs;
create policy "manage own logs" on public.daily_logs for all using (auth.uid() = user_id);

-- ─── Auto-create profile on sign-up ───────────────────────
-- NOTE: Only id + email from auth — ignore Google display name/avatar until the user
-- completes CompleteProfileScreen (profile_intake_complete). MainTabs after onboarding_complete.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
