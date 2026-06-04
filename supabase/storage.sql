-- Run in Supabase Dashboard → SQL Editor (after main schema.sql)

-- 1. Create public photos bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- 2. Storage policies
create policy "Public read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Users upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own photos"
  on storage.objects for update
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
