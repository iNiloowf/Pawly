-- Fix: infinite recursion in household_members RLS policy
-- Run in Supabase → SQL Editor (safe to run multiple times)

create or replace function public.is_household_member(hid uuid)
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
  );
$$;

drop policy if exists "Members read own household" on public.households;

create policy "Members read own household"
  on public.households for select
  using (public.is_household_member(id));

drop policy if exists "Members read household roster" on public.household_members;

create policy "Members read household roster"
  on public.household_members for select
  using (public.is_household_member(household_id));
