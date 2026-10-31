create or replace function private.touch_conversation_from_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function private.touch_conversation_from_message() from public;
revoke all on function private.touch_conversation_from_message() from anon;
revoke all on function private.touch_conversation_from_message() from authenticated;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function private.touch_conversation_from_message();

alter publication supabase_realtime add table public.messages;
