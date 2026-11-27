
create table if not exists public.account_restrictions (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  identifier_type text not null check (identifier_type in ('email', 'phone', 'document')),
  normalized_value text not null,
  reason text not null check (char_length(btrim(reason)) between 5 and 1000),
  created_by_email text not null,
  created_at timestamptz not null default now(),
  unique (identifier_type, normalized_value)
);

comment on table public.account_restrictions is
  'Identificadores de contas restritas permanentemente; acesso apenas pelo backend e Auth Hook.';

alter table public.account_restrictions enable row level security;
revoke all on public.account_restrictions from public, anon, authenticated;
grant all on public.account_restrictions to service_role;

create or replace function public.nexlar_is_user_restricted(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users u
    left join public.profile_private pp on pp.user_id = u.id
    where u.id = p_user_id
      and exists (
        select 1
        from public.account_restrictions r
        where (r.identifier_type = 'email'
               and r.normalized_value = lower(btrim(coalesce(u.email, ''))))
           or (r.identifier_type = 'phone'
               and r.normalized_value = regexp_replace(
                 coalesce(pp.phone, u.raw_user_meta_data ->> 'phone', u.phone, ''),
                 '[^0-9]', '', 'g'
               ))
           or (r.identifier_type = 'document'
               and r.normalized_value = regexp_replace(coalesce(pp.document, ''), '[^0-9]', '', 'g'))
           or (r.identifier_type = 'document'
               and r.normalized_value = regexp_replace(
                 coalesce(u.raw_user_meta_data ->> 'document', ''), '[^0-9]', '', 'g'
               ))
      )
  );
$function$;

revoke all on function public.nexlar_is_user_restricted(uuid) from public, anon, authenticated;
grant execute on function public.nexlar_is_user_restricted(uuid) to service_role;

create or replace function public.nexlar_current_user_is_restricted()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.nexlar_is_user_restricted((select auth.uid()));
$function$;

revoke all on function public.nexlar_current_user_is_restricted() from public, anon;
grant execute on function public.nexlar_current_user_is_restricted() to authenticated;

create or replace function public.nexlar_current_user_restriction_status()
returns table (restricted boolean)
language sql
stable
security definer
set search_path = ''
as $function$
  select public.nexlar_current_user_is_restricted();
$function$;

revoke all on function public.nexlar_current_user_restriction_status() from public, anon;
grant execute on function public.nexlar_current_user_restriction_status() to authenticated;

create or replace function public.nexlar_reject_restricted_signup(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  signup_email text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
  signup_phone text := regexp_replace(
    coalesce(event -> 'user' -> 'user_metadata' ->> 'phone', event -> 'user' ->> 'phone', ''),
    '[^0-9]', '', 'g'
  );
  signup_document text := regexp_replace(
    coalesce(event -> 'user' -> 'user_metadata' ->> 'document', ''), '[^0-9]', '', 'g'
  );
begin
  if exists (
    select 1
    from public.account_restrictions r
    where (r.identifier_type = 'email' and r.normalized_value = signup_email)
       or (r.identifier_type = 'phone' and r.normalized_value = signup_phone)
       or (r.identifier_type = 'document' and r.normalized_value = signup_document)
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Este CPF, e-mail ou telefone está impedido de criar uma conta Nexlar.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$function$;

revoke all on function public.nexlar_reject_restricted_signup(jsonb) from public, anon, authenticated;
grant execute on function public.nexlar_reject_restricted_signup(jsonb) to supabase_auth_admin;

create or replace function public.nexlar_restrict_account(
  p_user_id uuid,
  p_reason text,
  p_actor_email text
)
returns table (user_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_email text;
  target_phone text;
  target_document text;
begin
  if p_user_id is null or char_length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception 'Conta ou motivo inválido.' using errcode = '22023';
  end if;

  select lower(btrim(coalesce(u.email, ''))),
         regexp_replace(coalesce(pp.phone, u.raw_user_meta_data ->> 'phone', u.phone, ''), '[^0-9]', '', 'g'),
         regexp_replace(coalesce(pp.document, u.raw_user_meta_data ->> 'document', ''), '[^0-9]', '', 'g')
    into target_email, target_phone, target_document
    from auth.users u
    left join public.profile_private pp on pp.user_id = u.id
   where u.id = p_user_id;

  if not found then
    raise exception 'Conta não encontrada.' using errcode = 'P0002';
  end if;

  if target_email <> '' then
    insert into public.account_restrictions
      (user_id, identifier_type, normalized_value, reason, created_by_email)
    values (p_user_id, 'email', target_email, btrim(p_reason), lower(btrim(p_actor_email)))
    on conflict (identifier_type, normalized_value) do nothing;
  end if;
  if target_phone <> '' then
    insert into public.account_restrictions
      (user_id, identifier_type, normalized_value, reason, created_by_email)
    values (p_user_id, 'phone', target_phone, btrim(p_reason), lower(btrim(p_actor_email)))
    on conflict (identifier_type, normalized_value) do nothing;
  end if;
  if target_document <> '' then
    insert into public.account_restrictions
      (user_id, identifier_type, normalized_value, reason, created_by_email)
    values (p_user_id, 'document', target_document, btrim(p_reason), lower(btrim(p_actor_email)))
    on conflict (identifier_type, normalized_value) do nothing;
  end if;

  return query
    select u.id
      from auth.users u
      left join public.profile_private pp on pp.user_id = u.id
     where (target_email <> '' and lower(btrim(coalesce(u.email, ''))) = target_email)
        or (target_phone <> '' and regexp_replace(
              coalesce(pp.phone, u.raw_user_meta_data ->> 'phone', u.phone, ''), '[^0-9]', '', 'g'
            ) = target_phone)
        or (target_document <> '' and regexp_replace(
              coalesce(pp.document, u.raw_user_meta_data ->> 'document', ''), '[^0-9]', '', 'g'
            ) = target_document);
end;
$function$;

revoke all on function public.nexlar_restrict_account(uuid, text, text) from public, anon, authenticated;
grant execute on function public.nexlar_restrict_account(uuid, text, text) to service_role;

do $block_restricted_accounts$
declare
  relation record;
begin
  for relation in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
       and c.relrowsecurity
       and c.relname <> 'account_restrictions'
  loop
    execute format(
      'drop policy if exists nexlar_restricted_account_guard on public.%I',
      relation.relname
    );
    execute format(
      'create policy nexlar_restricted_account_guard on public.%I as restrictive for all to authenticated using (not public.nexlar_current_user_is_restricted()) with check (not public.nexlar_current_user_is_restricted())',
      relation.relname
    );
  end loop;
end;
$block_restricted_accounts$;
