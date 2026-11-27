create schema if not exists nexlar_private;
revoke all on schema nexlar_private from public, anon;
grant usage on schema nexlar_private to authenticated;

create or replace function nexlar_private.current_user_is_restricted()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.nexlar_is_user_restricted((select auth.uid()));
$function$;

revoke all on function nexlar_private.current_user_is_restricted() from public, anon;
grant execute on function nexlar_private.current_user_is_restricted() to authenticated;

do $replace_restriction_guards$
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
      'create policy nexlar_restricted_account_guard on public.%I as restrictive for all to authenticated using (not nexlar_private.current_user_is_restricted()) with check (not nexlar_private.current_user_is_restricted())',
      relation.relname
    );
  end loop;
end;
$replace_restriction_guards$;

drop function public.nexlar_current_user_restriction_status();
drop function public.nexlar_current_user_is_restricted();

drop policy if exists account_restrictions_no_direct_access on public.account_restrictions;
create policy account_restrictions_no_direct_access
on public.account_restrictions
as restrictive
for all
to authenticated
using (false)
with check (false);
