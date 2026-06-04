-- Run this in Supabase Dashboard → SQL Editor

-- Pet profile per user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pet_name text not null default 'Woody',
  pet_breed text,
  pet_photo_url text,
  pet_age smallint check (pet_age is null or (pet_age >= 0 and pet_age <= 30)),
  pet_body_condition_score smallint check (
    pet_body_condition_score is null
    or (pet_body_condition_score >= 1 and pet_body_condition_score <= 9)
  ),
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

-- If table already exists, run this migration:
-- alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
-- alter table public.profiles add column if not exists pet_age smallint check (pet_age is null or (pet_age >= 0 and pet_age <= 30));
-- alter table public.profiles add column if not exists pet_body_condition_score smallint check (pet_body_condition_score is null or (pet_body_condition_score >= 1 and pet_body_condition_score <= 9));
-- update public.profiles set onboarding_complete = true;

-- Daily journal entries
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  sleep text not null check (sleep in ('poor', 'okay', 'great')),
  food text not null check (food in ('less', 'normal', 'more')),
  activity text not null check (activity in ('low', 'normal', 'high')),
  mood text not null check (mood in ('sad', 'normal', 'happy')),
  photo_url text,
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own entries"
  on public.daily_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: run supabase/storage.sql in SQL Editor
-- Or manually: Dashboard → Storage → New bucket → name "photos" → Public
