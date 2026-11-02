alter table public.portfolio_items
  add column if not exists storage_path text;

create index if not exists portfolio_items_owner_created_idx
  on public.portfolio_items (owner_id, created_at desc);

drop policy if exists portfolio_owner_all on public.portfolio_items;
drop policy if exists portfolio_owner_insert on public.portfolio_items;
drop policy if exists portfolio_owner_update on public.portfolio_items;
drop policy if exists portfolio_owner_delete on public.portfolio_items;

create policy portfolio_owner_insert
on public.portfolio_items for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);

create policy portfolio_owner_update
on public.portfolio_items for update to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);

create policy portfolio_owner_delete
on public.portfolio_items for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);

drop policy if exists "Users upload their own avatar" on storage.objects;
drop policy if exists "Users update their own avatar" on storage.objects;
drop policy if exists "Users delete their own avatar" on storage.objects;
drop policy if exists "Providers upload portfolio images" on storage.objects;
drop policy if exists "Providers update portfolio images" on storage.objects;
drop policy if exists "Providers delete portfolio images" on storage.objects;

create policy "Users upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and array_length(storage.foldername(name), 1) = 1
);

create policy "Users update their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and array_length(storage.foldername(name), 1) = 1
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and array_length(storage.foldername(name), 1) = 1
);

create policy "Users delete their own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and array_length(storage.foldername(name), 1) = 1
);

create policy "Providers upload portfolio images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'portfolio'
  and array_length(storage.foldername(name), 1) = 2
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);

create policy "Providers update portfolio images"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'portfolio'
  and array_length(storage.foldername(name), 1) = 2
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'portfolio'
  and array_length(storage.foldername(name), 1) = 2
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);

create policy "Providers delete portfolio images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'portfolio'
  and array_length(storage.foldername(name), 1) = 2
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')
  )
);
