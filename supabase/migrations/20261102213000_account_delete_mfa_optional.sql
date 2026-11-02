drop function public.delete_own_account(text);

create function public.delete_own_account(p_confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleting_user_id uuid := (select auth.uid());
begin
  if deleting_user_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if exists (
    select 1
    from auth.mfa_factors
    where user_id = deleting_user_id and status = 'verified'
  ) and (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception using errcode = '42501', message = 'MFA_REQUIRED';
  end if;

  if p_confirmation is distinct from 'EXCLUIR' then
    raise exception using errcode = '42501', message = 'CONFIRMATION_REQUIRED';
  end if;

  if exists (
    select 1
    from public.contracts
    where buyer_id = deleting_user_id or provider_id = deleting_user_id
  ) then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_HAS_CONTRACT_HISTORY';
  end if;

  delete from auth.users where id = deleting_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.delete_own_account(text) from public, anon;
grant execute on function public.delete_own_account(text) to authenticated;

