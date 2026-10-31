delete from public.email_login_challenges;
alter table public.email_login_challenges add column challenge_hash text not null;
create unique index email_login_challenges_hash_idx on public.email_login_challenges(challenge_hash);

create or replace function private.email_step_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.email_verified_sessions verified
    join auth.sessions active
      on active.id = verified.session_id
     and active.user_id = verified.user_id
    where verified.user_id = (select auth.uid())
      and verified.session_id::text = (select auth.jwt() ->> 'session_id')
  );
$$;

create or replace function public.complete_email_step_admin(
  p_user_id uuid,
  p_challenge_hash text,
  p_session_id uuid,
  p_expires_at timestamptz
)
returns table(completed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare consumed_user uuid;
begin
  delete from public.email_login_challenges
  where user_id = p_user_id
    and challenge_hash = p_challenge_hash
    and expires_at > now()
  returning user_id into consumed_user;

  if consumed_user is null then
    return query select false;
    return;
  end if;

  insert into public.email_verified_sessions (session_id, user_id, expires_at)
  values (p_session_id, p_user_id, p_expires_at)
  on conflict (session_id) do update
    set user_id = excluded.user_id,
        expires_at = excluded.expires_at,
        created_at = now();
  return query select true;
end;
$$;

revoke all on function public.complete_email_step_admin(uuid, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.complete_email_step_admin(uuid, text, uuid, timestamptz) to service_role;

