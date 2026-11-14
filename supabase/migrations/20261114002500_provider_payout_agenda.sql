alter table public.contracts
  add column if not exists service_scheduled_at timestamptz,
  add column if not exists service_duration_minutes integer check (service_duration_minutes is null or service_duration_minutes between 15 and 1440),
  add column if not exists service_location text check (service_location is null or char_length(service_location) <= 300),
  add column if not exists provider_completed_at timestamptz,
  add column if not exists confirmation_deadline timestamptz,
  add column if not exists customer_confirmed_at timestamptz,
  add column if not exists auto_confirmed_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists dispute_reason text check (dispute_reason is null or char_length(dispute_reason) <= 1000);

alter table public.profile_private
  add column if not exists pix_key text,
  add column if not exists pix_key_type text;

alter table public.profile_private drop constraint if exists profile_private_pix_key_pair_check;
alter table public.profile_private
  add constraint profile_private_pix_key_pair_check
  check ((pix_key is null) = (pix_key_type is null));

alter table public.profile_private drop constraint if exists profile_private_pix_key_type_check;
alter table public.profile_private
  add constraint profile_private_pix_key_type_check
  check (pix_key_type is null or pix_key_type in ('CPF', 'CNPJ', 'PHONE', 'EMAIL', 'RANDOM'));

create table if not exists public.provider_payouts (
  id bigint generated always as identity primary key,
  contract_id bigint not null unique references public.contracts(id) on delete restrict,
  provider_id uuid not null references public.profiles(id) on delete restrict,
  gross_amount numeric(12,2) not null check (gross_amount > 0),
  platform_commission numeric(12,2) not null check (platform_commission >= 0),
  provider_amount numeric(12,2) not null check (provider_amount > 0),
  transfer_fee numeric(12,2) not null default 0 check (transfer_fee >= 0),
  transfer_request_amount numeric(12,2) not null check (transfer_request_amount > 0),
  provider_received_amount numeric(12,2),
  status text not null default 'aguardando_servico'
    check (status in ('aguardando_servico', 'aguardando_confirmacao', 'disponivel', 'processando', 'pago', 'falhou', 'bloqueado')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  external_id text unique,
  abacatepay_transfer_id text unique,
  receipt_url text,
  failure_reason text,
  available_at timestamptz,
  attempted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_payouts_provider_created_idx
  on public.provider_payouts(provider_id, created_at desc);
create index if not exists provider_payouts_release_idx
  on public.provider_payouts(status, available_at, updated_at);

alter table public.provider_payouts enable row level security;
revoke all on public.provider_payouts from public, anon, authenticated;
drop policy if exists provider_payouts_provider_read on public.provider_payouts;
create policy provider_payouts_provider_read
  on public.provider_payouts for select to authenticated
  using (provider_id = (select auth.uid()));
grant select on public.provider_payouts to authenticated;
grant all on public.provider_payouts to service_role;
revoke all on sequence public.provider_payouts_id_seq from public, anon, authenticated;
grant usage, select on sequence public.provider_payouts_id_seq to service_role;

create table if not exists public.provider_agenda_events (
  id bigint generated always as identity primary key,
  contract_id bigint not null unique references public.contracts(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 15 and 1440),
  location text check (location is null or char_length(location) <= 300),
  status text not null default 'a_combinar'
    check (status in ('a_combinar', 'agendado', 'em_andamento', 'concluido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_agenda_events_provider_date_idx
  on public.provider_agenda_events(provider_id, starts_at);
alter table public.provider_agenda_events enable row level security;
revoke all on public.provider_agenda_events from public, anon, authenticated;
drop policy if exists provider_agenda_events_participant_read on public.provider_agenda_events;
create policy provider_agenda_events_participant_read
  on public.provider_agenda_events for select to authenticated
  using (provider_id = (select auth.uid()) or client_id = (select auth.uid()));
grant select on public.provider_agenda_events to authenticated;
grant all on public.provider_agenda_events to service_role;
revoke all on sequence public.provider_agenda_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.provider_agenda_events_id_seq to service_role;

create or replace function public.create_contract_with_schedule(
  p_conversation_id bigint,
  p_description text,
  p_amount numeric,
  p_actor_id uuid,
  p_scheduled_at timestamptz default null,
  p_duration_minutes integer default null,
  p_location text default null
)
returns public.contracts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  conversation public.conversations;
  result public.contracts;
begin
  if p_amount <= 0 or char_length(trim(p_description)) < 3 then
    raise exception 'Invalid proposal';
  end if;
  if p_duration_minutes is not null and p_duration_minutes not between 15 and 1440 then
    raise exception 'Invalid service duration';
  end if;
  if p_location is not null and char_length(trim(p_location)) > 300 then
    raise exception 'Invalid service location';
  end if;

  select * into conversation
  from public.conversations
  where id = p_conversation_id;
  if conversation.provider_id <> p_actor_id then
    raise exception 'Not the conversation provider';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role in ('autonomo', 'empresa')
  ) then
    raise exception 'Provider role required';
  end if;

  insert into public.contracts (
    conversation_id, buyer_id, provider_id, description, amount, status,
    service_scheduled_at, service_duration_minutes, service_location
  ) values (
    conversation.id, conversation.client_id, conversation.provider_id,
    trim(p_description), p_amount, 'proposta', p_scheduled_at,
    p_duration_minutes, nullif(trim(p_location), '')
  ) returning * into result;
  return result;
end;
$function$;

revoke all on function public.create_contract_with_schedule(bigint, text, numeric, uuid, timestamptz, integer, text) from public, anon, authenticated;
grant execute on function public.create_contract_with_schedule(bigint, text, numeric, uuid, timestamptz, integer, text) to service_role;

create or replace function public.provider_complete_service(p_contract_id bigint, p_actor_id uuid)
returns public.contracts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.contracts;
begin
  update public.contracts
     set provider_completed_at = pg_catalog.now(),
         confirmation_deadline = pg_catalog.now() + interval '72 hours',
         updated_at = pg_catalog.now()
   where id = p_contract_id
     and provider_id = p_actor_id
     and status = 'em_andamento'
     and provider_completed_at is null
     and disputed_at is null
   returning * into result;

  if result.id is null then
    raise exception 'Service cannot be marked complete';
  end if;

  update public.provider_payouts
     set status = 'aguardando_confirmacao',
         updated_at = pg_catalog.now()
   where contract_id = p_contract_id and status = 'aguardando_servico';
  update public.provider_agenda_events
     set status = 'concluido', updated_at = pg_catalog.now()
   where contract_id = p_contract_id;
  return result;
end;
$function$;

create or replace function public.client_confirm_service(p_contract_id bigint, p_actor_id uuid)
returns public.contracts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.contracts;
begin
  update public.contracts
     set status = 'concluido',
         customer_confirmed_at = pg_catalog.now(),
         updated_at = pg_catalog.now()
   where id = p_contract_id
     and buyer_id = p_actor_id
     and status = 'em_andamento'
     and provider_completed_at is not null
     and disputed_at is null
     and confirmation_deadline >= pg_catalog.now()
   returning * into result;

  if result.id is null then
    raise exception 'Service cannot be confirmed';
  end if;

  update public.provider_payouts
     set status = 'disponivel', available_at = pg_catalog.now(), updated_at = pg_catalog.now()
   where contract_id = p_contract_id and status in ('aguardando_servico', 'aguardando_confirmacao');
  return result;
end;
$function$;

create or replace function public.client_dispute_service(p_contract_id bigint, p_actor_id uuid, p_reason text)
returns public.contracts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.contracts;
begin
  if char_length(trim(p_reason)) < 5 or char_length(trim(p_reason)) > 1000 then
    raise exception 'Informe o motivo da contestação';
  end if;

  update public.contracts
     set disputed_at = pg_catalog.now(),
         dispute_reason = trim(p_reason),
         updated_at = pg_catalog.now()
   where id = p_contract_id
     and buyer_id = p_actor_id
     and status = 'em_andamento'
     and provider_completed_at is not null
     and disputed_at is null
     and confirmation_deadline >= pg_catalog.now()
   returning * into result;

  if result.id is null then
    raise exception 'Service cannot be disputed';
  end if;

  update public.provider_payouts
     set status = 'bloqueado', failure_reason = 'Contestação do cliente', updated_at = pg_catalog.now()
   where contract_id = p_contract_id and status in ('aguardando_servico', 'aguardando_confirmacao', 'disponivel');
  return result;
end;
$function$;

revoke all on function public.provider_complete_service(bigint, uuid) from public, anon, authenticated;
revoke all on function public.client_confirm_service(bigint, uuid) from public, anon, authenticated;
revoke all on function public.client_dispute_service(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.provider_complete_service(bigint, uuid) to service_role;
grant execute on function public.client_confirm_service(bigint, uuid) to service_role;
grant execute on function public.client_dispute_service(bigint, uuid, text) to service_role;

create or replace function public.transition_contract(p_contract_id bigint, p_status public.contract_status, p_actor_id uuid)
returns public.contracts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.contracts;
begin
  update public.contracts
     set status = 'em_andamento', updated_at = pg_catalog.now()
   where id = p_contract_id
     and provider_id = p_actor_id
     and status = 'pago'
     and p_status = 'em_andamento'
  returning * into result;
  if result.id is null then raise exception 'Invalid transition'; end if;
  return result;
end;
$function$;

revoke all on function public.transition_contract(bigint, public.contract_status) from public, anon, authenticated;
revoke all on function public.transition_contract(bigint, public.contract_status, uuid) from public, anon, authenticated;
grant execute on function public.transition_contract(bigint, public.contract_status, uuid) to service_role;

create or replace function public.register_abacatepay_payment(p_contract_id bigint, p_payment_id text)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  current_contract public.contracts;
  gross numeric(12,2);
  commission numeric(12,2);
  provider_net numeric(12,2);
begin
  select * into current_contract
  from public.contracts
  where id = p_contract_id
  for update;
  if current_contract.id is null then
    raise exception 'Contract unavailable';
  end if;
  if current_contract.status = 'pago' and current_contract.abacatepay_payment_id = p_payment_id then
    return;
  end if;
  if current_contract.status <> 'aguardando_pagamento' then
    raise exception 'Contract is not awaiting payment';
  end if;
  if current_contract.abacatepay_checkout_id is null or trim(p_payment_id) = '' then
    raise exception 'Payment reference is missing';
  end if;

  gross := current_contract.amount;
  commission := round(gross * 0.15, 2);
  provider_net := gross - commission;

  update public.contracts
     set status = 'pago', abacatepay_payment_id = p_payment_id, updated_at = pg_catalog.now()
   where id = p_contract_id;

  insert into public.financial_entries (owner_id, contract_id, name, amount, service_date, status, source)
  values (
    current_contract.provider_id, current_contract.id, current_contract.description,
    provider_net, coalesce(current_contract.service_scheduled_at::date, pg_catalog.current_date),
    'Pendente', 'pagamento'
  ) on conflict (contract_id) do nothing;

  insert into public.provider_payouts (
    contract_id, provider_id, gross_amount, platform_commission, provider_amount, transfer_request_amount
  ) values (
    current_contract.id, current_contract.provider_id, gross, commission, provider_net, provider_net
  ) on conflict (contract_id) do nothing;

  insert into public.provider_agenda_events (
    contract_id, provider_id, client_id, title, starts_at, duration_minutes, location, status
  ) values (
    current_contract.id, current_contract.provider_id, current_contract.buyer_id,
    current_contract.description, current_contract.service_scheduled_at,
    current_contract.service_duration_minutes, current_contract.service_location,
    case when current_contract.service_scheduled_at is null then 'a_combinar' else 'agendado' end
  ) on conflict (contract_id) do nothing;
end;
$function$;

revoke all on function public.register_abacatepay_payment(bigint, text) from public, anon, authenticated;
grant execute on function public.register_abacatepay_payment(bigint, text) to service_role;

create or replace function public.release_due_service_payouts(p_limit integer default 100)
returns integer
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  released integer;
begin
  with due as (
    select c.id
      from public.contracts c
      join public.provider_payouts p on p.contract_id = c.id
     where c.status = 'em_andamento'
       and c.provider_completed_at is not null
       and c.confirmation_deadline <= pg_catalog.now()
       and c.disputed_at is null
       and p.status = 'aguardando_confirmacao'
     order by c.confirmation_deadline
     for update of c skip locked
     limit greatest(1, least(p_limit, 500))
  ), completed as (
    update public.contracts c
       set status = 'concluido', auto_confirmed_at = pg_catalog.now(), updated_at = pg_catalog.now()
      from due
     where c.id = due.id
     returning c.id
  )
  update public.provider_payouts p
     set status = 'disponivel', available_at = pg_catalog.now(), updated_at = pg_catalog.now()
    from completed
   where p.contract_id = completed.id;

  get diagnostics released = row_count;
  return released;
end;
$function$;

create or replace function public.claim_provider_payouts(p_limit integer default 20)
returns setof public.provider_payouts
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  return query
  with candidates as (
    select p.id, p.status as previous_status
      from public.provider_payouts p
      join public.contracts c on c.id = p.contract_id
     where c.status = 'concluido'
       and c.disputed_at is null
       and (c.customer_confirmed_at is not null or c.auto_confirmed_at is not null)
       and (
         p.status = 'disponivel'
         or (p.status = 'processando' and p.attempted_at < pg_catalog.now() - interval '10 minutes')
       )
     order by p.available_at nulls first, p.id
     for update of p skip locked
     limit greatest(1, least(p_limit, 100))
  )
  update public.provider_payouts p
     set status = 'processando',
         attempt_count = p.attempt_count + case when candidates.previous_status = 'disponivel' then 1 else 0 end,
         external_id = case
           when candidates.previous_status = 'disponivel'
             then 'nexlar-payout-' || p.contract_id::text || '-' || (p.attempt_count + 1)::text
           else p.external_id
         end,
         attempted_at = pg_catalog.now(), updated_at = pg_catalog.now()
    from candidates
   where p.id = candidates.id
  returning p.*;
end;
$function$;

create or replace function public.record_provider_payout_result(
  p_payout_id bigint,
  p_status text,
  p_transfer_id text default null,
  p_receipt_url text default null,
  p_transfer_fee numeric default null,
  p_provider_received numeric default null,
  p_failure_reason text default null
)
returns public.provider_payouts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.provider_payouts;
begin
  if p_status not in ('pago', 'falhou', 'processando') then
    raise exception 'Invalid payout status';
  end if;
  update public.provider_payouts
     set status = p_status,
         abacatepay_transfer_id = coalesce(p_transfer_id, abacatepay_transfer_id),
         receipt_url = coalesce(p_receipt_url, receipt_url),
         transfer_fee = coalesce(p_transfer_fee, transfer_fee),
         provider_received_amount = coalesce(p_provider_received, provider_received_amount),
         failure_reason = case when p_status = 'falhou' then left(p_failure_reason, 1000) else null end,
         paid_at = case when p_status = 'pago' then coalesce(paid_at, pg_catalog.now()) else paid_at end,
         updated_at = pg_catalog.now()
   where id = p_payout_id
   returning * into result;
  if result.id is null then
    raise exception 'Payout unavailable';
  end if;

  if p_status = 'pago' then
    update public.financial_entries
       set amount = coalesce(result.provider_received_amount, result.provider_amount),
           status = 'Concluído', updated_at = pg_catalog.now()
     where contract_id = result.contract_id and source = 'pagamento';
  elsif p_status = 'falhou' then
    update public.financial_entries
       set status = 'Pendente', updated_at = pg_catalog.now()
     where contract_id = result.contract_id and source = 'pagamento';
  end if;
  return result;
end;
$function$;

create or replace function public.retry_provider_payout(p_payout_id bigint, p_actor_id uuid)
returns public.provider_payouts
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  result public.provider_payouts;
begin
  update public.provider_payouts p
     set status = 'disponivel', external_id = null, failure_reason = null,
         available_at = pg_catalog.now(), updated_at = pg_catalog.now()
    from public.contracts c
   where p.id = p_payout_id
     and p.contract_id = c.id
     and p.provider_id = p_actor_id
     and p.status = 'falhou'
     and c.status = 'concluido'
     and c.disputed_at is null
     and (c.customer_confirmed_at is not null or c.auto_confirmed_at is not null)
   returning p.* into result;
  if result.id is null then
    raise exception 'Payout cannot be retried';
  end if;
  return result;
end;
$function$;

revoke all on function public.release_due_service_payouts(integer) from public, anon, authenticated;
revoke all on function public.claim_provider_payouts(integer) from public, anon, authenticated;
revoke all on function public.record_provider_payout_result(bigint, text, text, text, numeric, numeric, text) from public, anon, authenticated;
revoke all on function public.retry_provider_payout(bigint, uuid) from public, anon, authenticated;
grant execute on function public.release_due_service_payouts(integer) to service_role;
grant execute on function public.claim_provider_payouts(integer) to service_role;
grant execute on function public.record_provider_payout_result(bigint, text, text, text, numeric, numeric, text) to service_role;
grant execute on function public.retry_provider_payout(bigint, uuid) to service_role;

