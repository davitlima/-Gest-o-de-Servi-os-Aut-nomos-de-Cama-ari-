alter table public.contracts
  add column if not exists abacatepay_checkout_id text unique,
  add column if not exists abacatepay_payment_id text unique;

create or replace function public.attach_abacate_checkout(p_contract_id bigint, p_checkout_id text)
returns public.contracts
language plpgsql
security invoker
set search_path = public
as $$
declare result public.contracts;
begin
  update public.contracts set abacatepay_checkout_id = p_checkout_id, updated_at = now()
   where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and abacatepay_checkout_id is null
   returning * into result;
  if result.id is null then raise exception 'Contrato inválido para checkout'; end if;
  return result;
end;
$$;

revoke all on function public.attach_abacate_checkout(bigint, text) from public, anon;
grant execute on function public.attach_abacate_checkout(bigint, text) to authenticated;

