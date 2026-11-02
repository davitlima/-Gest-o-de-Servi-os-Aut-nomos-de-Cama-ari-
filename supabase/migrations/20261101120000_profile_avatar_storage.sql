insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public avatars are readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users update their own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users delete their own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Providers upload portfolio images"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and (storage.foldername(name))[2] = 'portfolio' and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')));

create policy "Providers update portfolio images"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and (storage.foldername(name))[2] = 'portfolio' and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')))
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and (storage.foldername(name))[2] = 'portfolio' and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')));

create policy "Providers delete portfolio images"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text) and (storage.foldername(name))[2] = 'portfolio' and exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')));
