alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_or_attachment_check
  check (
    char_length(body) between 0 and 4000
    and (char_length(btrim(body)) > 0 or attachment_path is not null)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', false, 15728640,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','application/zip'])
on conflict (id) do update set public = false, file_size_limit = 15728640, allowed_mime_types = excluded.allowed_mime_types;

create policy "chat participants upload attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.client_id, c.provider_id)
  )
);

create policy "chat participants read attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.client_id, c.provider_id)
  )
);


