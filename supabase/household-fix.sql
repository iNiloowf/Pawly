-- Run this if invite link fails after household.sql was already applied once.
-- Safe to run multiple times.

drop policy if exists "Household owners manage invites" on public.household_invites;
drop policy if exists "Anyone can read invite by token for validation" on public.household_invites;
drop policy if exists "Household owners insert invites" on public.household_invites;
drop policy if exists "Household owners update invites" on public.household_invites;
drop policy if exists "Household owners delete invites" on public.household_invites;
drop policy if exists "Members and public read invites" on public.household_invites;

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
  using (true);

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
