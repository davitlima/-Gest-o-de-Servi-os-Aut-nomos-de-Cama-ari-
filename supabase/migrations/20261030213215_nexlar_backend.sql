create type public.account_role as enum ('cliente', 'autonomo', 'empresa');
create type public.contract_status as enum ('proposta', 'aguardando_pagamento', 'pago', 'recusado', 'em_andamento', 'concluido', 'cancelado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  neighborhood text,
  bio text,
  service_category text,
  company_name text,
  avatar_url text,
  mercado_pago_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  document text
);

create table public.portfolio_items (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id <> provider_id),
  unique (client_id, provider_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.contracts (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.profiles(id) on delete restrict,
  description text not null check (char_length(description) between 3 and 500),
  amount numeric(12,2) not null check (amount > 0),
  status public.contract_status not null default 'proposta',
  mercado_pago_preference_id text unique,
  mercado_pago_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> provider_id)
);

create table public.reviews (
  id bigint generated always as identity primary key,
  contract_id bigint not null unique references public.contracts(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.profiles(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create table public.financial_entries (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contract_id bigint unique references public.contracts(id) on delete set null,
  name text not null check (char_length(name) between 2 and 160),
  category text,
  amount numeric(12,2) not null check (amount > 0),
  service_date date not null,
  client_name text,
  status text not null default 'Concluído' check (status in ('Concluído', 'Em andamento', 'Pendente')),
  notes text,
  source text not null default 'manual' check (source in ('manual', 'pagamento')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_goals (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  amount numeric(12,2) not null check (amount > 0),
  primary key (owner_id, month),
  check (month = date_trunc('month', month)::date)
);

create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index contracts_participants_idx on public.contracts(buyer_id, provider_id, status);
create index financial_entries_owner_date_idx on public.financial_entries(owner_id, service_date desc);
create index reviews_provider_idx on public.reviews(provider_id, created_at desc);

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, full_name, company_name)
  values (
    new.id,
    case when requested_role in ('cliente', 'autonomo', 'empresa') then requested_role::public.account_role else 'cliente'::public.account_role end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'company_name'), '')
  );
  insert into public.profile_private (user_id, phone, document)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), nullif(trim(new.raw_user_meta_data ->> 'document'), ''));
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.contracts enable row level security;
alter table public.reviews enable row level security;
alter table public.financial_entries enable row level security;
alter table public.monthly_goals enable row level security;

create policy profiles_public_read on public.profiles for select using (true);
create policy profiles_owner_update on public.profiles for update to authenticated using ((select auth.uid()) = id and (select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.uid()) = id and (select auth.jwt() ->> 'aal') = 'aal2');
create policy profile_private_owner_read on public.profile_private for select to authenticated using ((select auth.uid()) = user_id and (select auth.jwt() ->> 'aal') = 'aal2');
create policy profile_private_owner_update on public.profile_private for update to authenticated using ((select auth.uid()) = user_id and (select auth.jwt() ->> 'aal') = 'aal2') with check ((select auth.uid()) = user_id and (select auth.jwt() ->> 'aal') = 'aal2');

create policy portfolio_public_read on public.portfolio_items for select using (true);
create policy portfolio_owner_all on public.portfolio_items for all to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2' and (select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
with check ((select auth.jwt() ->> 'aal') = 'aal2' and (select auth.uid()) = owner_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));

create policy conversations_participant_read on public.conversations for select to authenticated
using ((select auth.uid()) in (client_id, provider_id) and (select auth.jwt() ->> 'aal') = 'aal2');
create policy conversations_client_insert on public.conversations for insert to authenticated
with check ((select auth.uid()) = client_id and (select auth.jwt() ->> 'aal') = 'aal2' and exists (select 1 from public.profiles p where p.id = provider_id and p.role in ('autonomo', 'empresa')));

create policy messages_participant_read on public.messages for select to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2' and exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));
create policy messages_participant_insert on public.messages for insert to authenticated
with check ((select auth.jwt() ->> 'aal') = 'aal2' and sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.provider_id)));

create policy contracts_participant_read on public.contracts for select to authenticated using ((select auth.uid()) in (buyer_id, provider_id) and (select auth.jwt() ->> 'aal') = 'aal2');

create policy reviews_public_read on public.reviews for select using (true);
create policy reviews_buyer_insert on public.reviews for insert to authenticated
with check ((select auth.jwt() ->> 'aal') = 'aal2' and reviewer_id = (select auth.uid()) and exists (select 1 from public.contracts c where c.id = contract_id and c.buyer_id = (select auth.uid()) and c.provider_id = provider_id and c.status = 'concluido'));

create policy finance_owner_all on public.financial_entries for all to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2' and owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')))
with check ((select auth.jwt() ->> 'aal') = 'aal2' and owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('autonomo', 'empresa')));

create policy goals_owner_all on public.monthly_goals for all to authenticated
using ((select auth.jwt() ->> 'aal') = 'aal2' and owner_id = (select auth.uid())) with check ((select auth.jwt() ->> 'aal') = 'aal2' and owner_id = (select auth.uid()));

create or replace function public.create_contract(p_conversation_id bigint, p_description text, p_amount numeric)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation public.conversations;
  result public.contracts;
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  if p_amount <= 0 or char_length(trim(p_description)) < 3 then raise exception 'Invalid proposal'; end if;
  select * into conversation from public.conversations where id = p_conversation_id;
  if conversation.provider_id <> (select auth.uid()) then raise exception 'Not the conversation provider'; end if;
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('autonomo', 'empresa')) then raise exception 'Provider role required'; end if;
  insert into public.contracts (conversation_id, buyer_id, provider_id, description, amount, status)
  values (conversation.id, conversation.client_id, conversation.provider_id, trim(p_description), p_amount, 'proposta')
  returning * into result;
  return result;
end;
$$;

create or replace function public.begin_checkout(p_contract_id bigint)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare result public.contracts;
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  update public.contracts set status = 'aguardando_pagamento', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'proposta'
  returning * into result;
  if result.id is null then raise exception 'Proposal unavailable'; end if;
  return result;
end;
$$;

create or replace function public.attach_checkout(p_contract_id bigint, p_preference_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  update public.contracts set mercado_pago_preference_id = p_preference_id, updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
  if not found then raise exception 'Checkout unavailable'; end if;
end;
$$;

create or replace function public.reset_checkout(p_contract_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  update public.contracts set status = 'proposta', updated_at = now()
  where id = p_contract_id and buyer_id = (select auth.uid()) and status = 'aguardando_pagamento' and mercado_pago_preference_id is null;
end;
$$;

create or replace function public.transition_contract(p_contract_id bigint, p_status public.contract_status)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare current_contract public.contracts; result public.contracts;
begin
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'MFA required'; end if;
  select * into current_contract from public.contracts where id = p_contract_id and provider_id = (select auth.uid());
  if current_contract.id is null then raise exception 'Contract unavailable'; end if;
  if not ((current_contract.status = 'pago' and p_status = 'em_andamento') or (current_contract.status = 'em_andamento' and p_status = 'concluido')) then raise exception 'Invalid transition'; end if;
  update public.contracts set status = p_status, updated_at = now() where id = p_contract_id returning * into result;
  return result;
end;
$$;

revoke all on function public.create_contract(bigint, text, numeric) from public, anon;
revoke all on function public.begin_checkout(bigint) from public, anon;
revoke all on function public.attach_checkout(bigint, text) from public, anon;
revoke all on function public.reset_checkout(bigint) from public, anon;
revoke all on function public.transition_contract(bigint, public.contract_status) from public, anon;
grant execute on function public.create_contract(bigint, text, numeric) to authenticated;
grant execute on function public.begin_checkout(bigint) to authenticated;
grant execute on function public.attach_checkout(bigint, text) to authenticated;
grant execute on function public.reset_checkout(bigint) to authenticated;
grant execute on function public.transition_contract(bigint, public.contract_status) to authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.portfolio_items, public.reviews to anon, authenticated;
grant select, update on public.profile_private to authenticated;
grant select, insert on public.conversations, public.messages to authenticated;
grant select, insert, update on public.financial_entries, public.monthly_goals to authenticated;
grant delete on public.financial_entries to authenticated;
grant select on public.contracts to authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;
grant insert on public.reviews to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke update on public.profiles from authenticated;
grant update (full_name, neighborhood, bio, service_category, company_name, avatar_url, updated_at) on public.profiles to authenticated;
grant update (phone, document) on public.profile_private to authenticated;


