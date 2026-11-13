create or replace function public.attach_abacate_checkout(p_contract_id bigint, p_checkout_id text)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.contracts;
begin
  update public.contracts
     set abacatepay_checkout_id = p_checkout_id,
         updated_at = pg_catalog.now()
   where id = p_contract_id
     and buyer_id = (select auth.uid())
     and status = 'aguardando_pagamento'
     and (abacatepay_checkout_id is null or abacatepay_checkout_id = p_checkout_id)
   returning * into result;

  if result.id is null then
    raise exception 'Contrato inválido para checkout';
  end if;

  return result;
end;
$$;

revoke all on function public.attach_abacate_checkout(bigint, text) from public, anon;
grant execute on function public.attach_abacate_checkout(bigint, text) to authenticated;
