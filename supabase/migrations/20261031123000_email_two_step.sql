create table public.email_login_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  password_session_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.email_verified_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index email_verified_sessions_user_idx on public.email_verified_sessions(user_id, expires_at);

alter table public.email_login_challenges enable row level security;
alter table public.email_verified_sessions enable row level security;
revoke all on public.email_login_challenges, public.email_verified_sessions from public, anon, authenticated;

create or replace function private.email_step_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.email_verified_sessions s
    where s.user_id = (select auth.uid())
      and s.session_id::text = (select auth.jwt() ->> 'session_id')
      and s.expires_at > now()
  );
$$;

revoke all on function private.email_step_verified() from public, anon;
grant execute on function private.email_step_verified() to authenticated;

alter policy profiles_owner_update on public.profiles
  using ((select auth.uid()) = id and (select private.email_step_verified()))
  with check ((select auth.uid()) = id and (select private.email_step_verified()));
alter policy profile_private_owner_read on public.profile_private
  using ((select auth.uid()) = user_id and (select private.email_step_verified()));
alter policy profile_private_owner_update on public.profile_private
  using ((select auth.uid()) = user_id and (select private.email_step_verified()))
  with check ((select auth.uid()) = user_id and (select private.email_step_verified()));
alter policy portfolio_owner_all on public.portfolio_items
  using ((select private.email_step_verified()) and (select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
  with check ((select private.email_step_verified()) and (select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));
alter policy conversations_participant_read on public.conversations
  using ((select auth.uid()) in (client_id, provider_id) and (select private.email_step_verified()));
alter policy conversations_client_insert on public.conversations
  with check ((select auth.uid()) = client_id and (select private.email_step_verified()) and exists (select 1 from public.profiles p where p.id = provider_id and p.role in ('autonomo', 'empresa')));
alter policy messages_participant_read on public.messages
  using ((select private.email_step_verified()) and exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));
alter policy messages_participant_insert on public.messages
  with check ((select private.email_step_verified()) and sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));
alter policy contracts_participant_read on public.contracts
  using ((select auth.uid()) in (buyer_id, provider_id) and (select private.email_step_verified()));
alter policy reviews_buyer_insert on public.reviews
  with check ((select private.email_step_verified()) and reviewer_id = (select auth.uid()) and exists (select 1 from public.contracts c where c.id = contract_id and c.buyer_id = (select auth.uid()) and c.provider_id = provider_id and c.status = 'concluido'));
alter policy finance_owner_all on public.financial_entries
  using ((select private.email_step_verified()) and owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
  with check ((select private.email_step_verified()) and owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));
alter policy goals_owner_all on public.monthly_goals
  using ((select private.email_step_verified()) and owner_id = (select auth.uid()))
  with check ((select private.email_step_verified()) and owner_id = (select auth.uid()));

create or replace function public.create_contract(p_conversation_id bigint, p_description text, p_amount numeric)
returns public.contracts language plpgsql security definer set search_path = '' as $$
declare conversation public.conversations; result public.contracts;
begin
  if not private.email_step_verified() then raise exception 'Email verification required'; end if;
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
  if not private.email_step_verified() then raise exception 'Email verification required'; end if;
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
  if not private.email_step_verified() then raise exception 'Email verification required'; end if;
  update public.contracts set mercado_pago_preference_id = p_preference_id, updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
  if not found then raise exception 'Checkout unavailable'; end if;
end; $$;

create or replace function public.reset_checkout(p_contract_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.email_step_verified() then raise exception 'Email verification required'; end if;
  update public.contracts set status = 'proposta', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
end; $$;

create or replace function public.transition_contract(p_contract_id bigint, p_status public.contract_status)
returns public.contracts language plpgsql security definer set search_path = '' as $$
declare current_contract public.contracts; result public.contracts;
begin
  if not private.email_step_verified() then raise exception 'Email verification required'; end if;
  select * into current_contract from public.contracts where id = p_contract_id and provider_id = (select auth.uid());
  if current_contract.id is null then raise exception 'Contract unavailable'; end if;
  if not ((current_contract.status = 'pago' and p_status = 'em_andamento') or (current_contract.status = 'em_andamento' and p_status = 'concluido')) then raise exception 'Invalid transition'; end if;
  update public.contracts set status = p_status, updated_at = now() where id = p_contract_id returning * into result;
  return result;
end; $$;

