grant delete on public.monthly_goals to authenticated;

create or replace function public.begin_checkout(p_contract_id bigint)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare result public.contracts;
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  select * into result from public.contracts
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento';
  if result.id is not null then return result; end if;
  update public.contracts set status = 'aguardando_pagamento', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'proposta'
  returning * into result;
  if result.id is null then raise exception 'Proposal unavailable'; end if;
  return result;
end;
$$;

revoke all on function public.begin_checkout(bigint) from public, anon;
grant execute on function public.begin_checkout(bigint) to authenticated;
