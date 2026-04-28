-- VerMillion — Supabase Schema
-- הרץ את זה ב: Supabase Dashboard → SQL Editor → New query

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles (מחובר ל-auth.users) ────────────────────────
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text,
  name            text,
  avatar_style    jsonb    default '{}',
  subscription    text     default 'free' check (subscription in ('free', 'premium')),
  lang            text     default 'he'  check (lang in ('he', 'en', 'ru')),
  joined_at       timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- ─── Onboarding answers (ימים 1–7) ────────────────────────
create table public.onboarding_answers (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  day          int         not null check (day between 1 and 7),
  question_key text        not null,
  answer       text,
  answered_at  timestamptz default now(),
  unique(user_id, day, question_key)
);

alter table public.onboarding_answers enable row level security;
create policy "manage own answers" on public.onboarding_answers for all using (auth.uid() = user_id);

-- ─── Game scores ───────────────────────────────────────────
create table public.game_scores (
  id          uuid        default uuid_generate_v4() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  game_type   text        not null,
  score       int         default 0,
  stamps      int         default 0,
  accuracy_ms int         default 0,
  played_at   timestamptz default now()
);

alter table public.game_scores enable row level security;
create policy "manage own scores" on public.game_scores for all using (auth.uid() = user_id);

-- ─── Daily log (ימים 9–30) ─────────────────────────────────
create table public.daily_logs (
  id           uuid        default uuid_generate_v4() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  day          int         not null,
  coaching_answer text,
  challenge_done  boolean  default false,
  multiplier   real        default 1.0,
  logged_at    timestamptz default now(),
  unique(user_id, day)
);

alter table public.daily_logs enable row level security;
create policy "manage own logs" on public.daily_logs for all using (auth.uid() = user_id);

-- ─── Auto-create profile on sign-up ────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
