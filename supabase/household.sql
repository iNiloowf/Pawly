-- Joint account / household sharing
-- Run in Supabase Dashboard → SQL Editor (after schema.sql)

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  unique (user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists household_id uuid references public.households (id) on delete set null;

create index if not exists idx_household_members_user on public.household_members (user_id);
create index if not exists idx_household_invites_token on public.household_invites (token);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

create or replace function public.can_access_user_data(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = target_user
    or exists (
      select 1
      from public.household_members me
      join public.household_members them on them.household_id = me.household_id
      where me.user_id = auth.uid()
        and them.user_id = target_user
    );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = hid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- Households
create policy "Members read own household"
  on public.households for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id and hm.user_id = auth.uid()
    )
  );

create policy "Users create own household"
  on public.households for insert
  with check (auth.uid() = owner_id);

-- Household members: users can always read their own row
drop policy if exists "Members read household roster" on public.household_members;

create policy "Members read household roster"
  on public.household_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.household_members me
      where me.household_id = household_members.household_id
        and me.user_id = auth.uid()
    )
  );

create policy "Users join via invite or create as owner"
  on public.household_members for insert
  with check (auth.uid() = user_id);

-- Invites: owners manage; everyone can read active invites (for validation)
drop policy if exists "Household owners manage invites" on public.household_invites;
drop policy if exists "Anyone can read invite by token for validation" on public.household_invites;

create policy "Household owners insert invites"
  on public.household_invites for insert
  with check (public.is_household_owner(household_id));

create policy "Household owners update invites"
  on public.household_invites for update
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

create policy "Household owners delete invites"
  on public.household_invites for delete
  using (public.is_household_owner(household_id));

create policy "Members and public read invites"
  on public.household_invites for select
  using (
    true
  );

-- Replace profile policies for shared access
drop policy if exists "Users manage own profile" on public.profiles;

create policy "Users read accessible profiles"
  on public.profiles for select
  using (public.can_access_user_data(id));

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update accessible profiles"
  on public.profiles for update
  using (public.can_access_user_data(id))
  with check (public.can_access_user_data(id));

-- Replace entry policies for shared access
drop policy if exists "Users manage own entries" on public.daily_entries;

create policy "Household members manage shared entries"
  on public.daily_entries for all
  using (public.can_access_user_data(user_id))
  with check (public.can_access_user_data(user_id));

-- Accept invite atomically
create or replace function public.accept_household_invite(invite_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.household_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.household_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'Already linked to a shared account';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, uid, 'member');

  insert into public.profiles (id, pet_name, household_id, onboarding_complete)
  values (uid, 'Woody', inv.household_id, true)
  on conflict (id) do update
  set household_id = excluded.household_id,
      onboarding_complete = true;

  update public.household_invites
  set accepted_by = uid, accepted_at = now()
  where id = inv.id;

  return json_build_object(
    'household_id', inv.household_id,
    'owner_id', (select owner_id from public.households where id = inv.household_id)
  );
end;
$$;

grant execute on function public.accept_household_invite(text) to authenticated;

-- Create invite (bypasses RLS edge cases; uses gen_random_uuid, not pgcrypto)
create or replace function public.create_household_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  hid uuid;
  tok text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into hid
  from public.household_members
  where user_id = uid;

  if hid is null then
    insert into public.households (owner_id) values (uid) returning id into hid;

    insert into public.household_members (household_id, user_id, role)
    values (hid, uid, 'owner');

    insert into public.profiles (id, pet_name, household_id, onboarding_complete)
    values (uid, 'Woody', hid, false)
    on conflict (id) do update
    set household_id = excluded.household_id;
  end if;

  select token into tok
  from public.household_invites
  where household_id = hid
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if tok is not null then
    return tok;
  end if;

  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  tok := substring(tok from 1 for 32);

  insert into public.household_invites (household_id, created_by, token)
  values (hid, uid, tok);

  return tok;
end;
$$;

grant execute on function public.create_household_invite() to authenticated;
