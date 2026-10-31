alter policy profiles_owner_update on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
alter policy profile_private_owner_read on public.profile_private
  using ((select auth.uid()) = user_id);
alter policy profile_private_owner_update on public.profile_private
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy portfolio_owner_all on public.portfolio_items
  using ((select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
  with check ((select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));
alter policy conversations_participant_read on public.conversations
  using ((select auth.uid()) in (client_id, provider_id));
alter policy conversations_client_insert on public.conversations
  with check ((select auth.uid()) = client_id and exists (select 1 from public.profiles p where p.id = provider_id and p.role in ('autonomo', 'empresa')));
alter policy messages_participant_read on public.messages
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));
alter policy messages_participant_insert on public.messages
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));
alter policy contracts_participant_read on public.contracts
  using ((select auth.uid()) in (buyer_id, provider_id));
alter policy reviews_buyer_insert on public.reviews
  with check (reviewer_id = (select auth.uid()) and exists (select 1 from public.contracts c where c.id = contract_id and c.buyer_id = (select auth.uid()) and c.provider_id = provider_id and c.status = 'concluido'));
alter policy finance_owner_all on public.financial_entries
  using (owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));
alter policy goals_owner_all on public.monthly_goals
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create or replace function public.create_contract(p_conversation_id bigint, p_description text, p_amount numeric)
returns public.contracts language plpgsql security definer set search_path = '' as $$
declare conversation public.conversations; result public.contracts;
begin
  if p_amount <= 0 or char_length(trim(p_description)) < 3 then raise exception 'Invalid proposal'; end if;
  select * into conversation from public.conversations where id = p_conversation_id;
  if conversation.provider_id <> (select auth.uid()) then raise exception 'Not the conversation provider'; end if;
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')) then raise exception 'Provider role required'; end if;
  insert into public.contracts (conversation_id, buyer_id, provider_id, description, amount, status)
  values (conversation.id, conversation.client_id, conversation.provider_id, trim(p_description), p_amount, 'proposta') returning * into result;
  return result;
end; $$;

create or replace function public.begin_checkout(p_contract_id bigint)
returns public.contracts language plpgsql security definer set search_path = '' as $$
declare result public.contracts;
begin
  select * into result from public.contracts where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento';
  if result.id is not null then return result; end if;
  update public.contracts set status = 'aguardando_pagamento', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'proposta' returning * into result;
  if result.id is null then raise exception 'Proposal unavailable'; end if;
  return result;
end; $$;

create or replace function public.attach_checkout(p_contract_id bigint, p_preference_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.contracts set mercado_pago_preference_id = p_preference_id, updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
  if not found then raise exception 'Checkout unavailable'; end if;
end; $$;

create or replace function public.reset_checkout(p_contract_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.contracts set status = 'proposta', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
end; $$;

create or replace function public.transition_contract(p_contract_id bigint, p_status public.contract_status)
returns public.contracts language plpgsql security definer set search_path = '' as $$
declare current_contract public.contracts; result public.contracts;
begin
  select * into current_contract from public.contracts where id = p_contract_id and provider_id = (select auth.uid());
  if current_contract.id is null then raise exception 'Contract unavailable'; end if;
  if not ((current_contract.status = 'pago' and p_status = 'em_andamento') or (current_contract.status = 'em_andamento' and p_status = 'concluido')) then raise exception 'Invalid transition'; end if;
  update public.contracts set status = p_status, updated_at = now() where id = p_contract_id returning * into result;
  return result;
end; $$;

drop function if exists public.complete_email_step_admin(uuid, text, uuid, timestamptz);
drop function if exists private.email_step_verified();
drop table if exists public.email_login_challenges;
drop table if exists public.email_verified_sessions;

