create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  provider_role boolean := requested_role in ('autonomo', 'empresa');
begin
  insert into public.profiles (id, role, full_name, company_name, service_category, neighborhood)
  values (
    new.id,
    case when requested_role in ('cliente', 'autonomo', 'empresa') then requested_role::public.account_role else 'cliente'::public.account_role end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''),
    case when provider_role then nullif(trim(new.raw_user_meta_data ->> 'service_category'), '') else null end,
    case when provider_role then nullif(trim(new.raw_user_meta_data ->> 'neighborhood'), '') else null end
  );
  insert into public.profile_private (user_id, phone, document)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), nullif(trim(new.raw_user_meta_data ->> 'document'), ''));
  return new;
end;
$$;
