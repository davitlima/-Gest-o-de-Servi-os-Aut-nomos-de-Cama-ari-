-- Permit account removal without discarding contractual records. Historical
-- rows remain, while participant and conversation references are anonymized.
alter table public.contracts
  alter column conversation_id drop not null,
  alter column buyer_id drop not null,
  alter column provider_id drop not null;

alter table public.contracts
  drop constraint contracts_conversation_id_fkey,
  drop constraint contracts_buyer_id_fkey,
  drop constraint contracts_provider_id_fkey,
  add constraint contracts_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete set null,
  add constraint contracts_buyer_id_fkey
    foreign key (buyer_id) references public.profiles(id) on delete set null,
  add constraint contracts_provider_id_fkey
    foreign key (provider_id) references public.profiles(id) on delete set null;

alter table public.reviews
  alter column reviewer_id drop not null,
  alter column provider_id drop not null;

alter table public.reviews
  drop constraint reviews_reviewer_id_fkey,
  drop constraint reviews_provider_id_fkey,
  add constraint reviews_reviewer_id_fkey
    foreign key (reviewer_id) references public.profiles(id) on delete set null,
  add constraint reviews_provider_id_fkey
    foreign key (provider_id) references public.profiles(id) on delete set null;

create or replace function public.delete_own_account(p_confirmation text)
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

  if p_confirmation is distinct from 'EXCLUIR' then
    raise exception using errcode = '42501', message = 'CONFIRMATION_REQUIRED';
  end if;

  -- Keep the rating but remove free text written by the deleting reviewer.
  update public.reviews
  set comment = null
  where reviewer_id = deleting_user_id;

  delete from auth.users where id = deleting_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.delete_own_account(text) from public, anon;
grant execute on function public.delete_own_account(text) to authenticated;

