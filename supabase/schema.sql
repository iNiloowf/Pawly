-- Run this in Supabase Dashboard → SQL Editor

-- Pet profile per user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pet_name text not null default 'Woody',
  pet_breed text,
  pet_photo_url text,
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

-- If table already exists, run this migration:
-- alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
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

-- Storage bucket: create "photos" in Dashboard → Storage (public read, auth write)
-- Policies (run after bucket exists):
-- create policy "Users upload own photos" on storage.objects for insert
--   with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users read own photos" on storage.objects for select
--   using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Public read photos" on storage.objects for select using (bucket_id = 'photos');
