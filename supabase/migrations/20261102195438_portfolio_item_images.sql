create table public.portfolio_item_images (
  id bigint generated always as identity primary key,
  portfolio_item_id bigint not null references public.portfolio_items(id) on delete cascade,
  image_url text not null,
  storage_path text,
  position smallint not null check (position >= 0 and position < 5),
  created_at timestamptz not null default now(),
  constraint portfolio_item_images_position_unique unique (portfolio_item_id, position)
);

create index portfolio_item_images_item_position_idx
  on public.portfolio_item_images (portfolio_item_id, position);

insert into public.portfolio_item_images (portfolio_item_id, image_url, storage_path, position)
select id, image_url, storage_path, 0
from public.portfolio_items
where image_url is not null
on conflict (portfolio_item_id, position) do nothing;

alter table public.portfolio_item_images enable row level security;

create policy portfolio_images_public_read
on public.portfolio_item_images for select
using (true);

create policy portfolio_images_owner_insert
on public.portfolio_item_images for insert to authenticated
with check (
  (
    (select auth.uid())::text = split_part(storage_path, '/', 1)
    and storage_path like (select auth.uid())::text || '/portfolio/%'
    or storage_path is null and exists (
      select 1 from public.portfolio_items item
      where item.id = portfolio_item_id and item.owner_id = (select auth.uid())
        and item.image_url = portfolio_item_images.image_url and item.storage_path is null
    )
  )
  and exists (
    select 1 from public.portfolio_items item
    join public.profiles provider on provider.id = item.owner_id
    where item.id = portfolio_item_id
      and item.owner_id = (select auth.uid())
      and provider.role in ('autonomo', 'empresa')
  )
);

create policy portfolio_images_owner_update
on public.portfolio_item_images for update to authenticated
using (
  exists (
    select 1 from public.portfolio_items item
    join public.profiles provider on provider.id = item.owner_id
    where item.id = portfolio_item_id and item.owner_id = (select auth.uid())
      and provider.role in ('autonomo', 'empresa')
  )
)
with check (
  (
    (select auth.uid())::text = split_part(storage_path, '/', 1)
    and storage_path like (select auth.uid())::text || '/portfolio/%'
    or storage_path is null and exists (
      select 1 from public.portfolio_items item
      where item.id = portfolio_item_id and item.owner_id = (select auth.uid())
        and item.image_url = portfolio_item_images.image_url and item.storage_path is null
    )
  )
  and exists (
    select 1 from public.portfolio_items item
    join public.profiles provider on provider.id = item.owner_id
    where item.id = portfolio_item_id
      and item.owner_id = (select auth.uid())
      and provider.role in ('autonomo', 'empresa')
  )
);

create policy portfolio_images_owner_delete
on public.portfolio_item_images for delete to authenticated
using (
  exists (
    select 1 from public.portfolio_items item
    join public.profiles provider on provider.id = item.owner_id
    where item.id = portfolio_item_id and item.owner_id = (select auth.uid())
      and provider.role in ('autonomo', 'empresa')
  )
);

grant select on public.portfolio_item_images to anon, authenticated;
grant insert, update, delete on public.portfolio_item_images to authenticated;
grant usage, select on sequence public.portfolio_item_images_id_seq to authenticated;

create function public.create_portfolio_offer(
  p_title text,
  p_description text,
  p_price_mode text,
  p_price numeric,
  p_estimated_duration text,
  p_images jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item public.portfolio_items;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão necessária.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles provider
    where provider.id = (select auth.uid()) and provider.role in ('autonomo', 'empresa')
  ) then
    raise exception 'Seu perfil não possui portfólio.' using errcode = '42501';
  end if;
  if coalesce(jsonb_typeof(p_images), '') <> 'array' then
    raise exception 'A oferta deve ter de uma a cinco imagens.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_images) not between 1 and 5 then
    raise exception 'A oferta deve ter de uma a cinco imagens.' using errcode = '22023';
  end if;

  insert into public.portfolio_items (
    owner_id, image_url, storage_path, title, description, price_mode, price, estimated_duration
  ) values (
    (select auth.uid()),
    p_images -> 0 ->> 'image_url',
    p_images -> 0 ->> 'storage_path',
    p_title, nullif(p_description, ''), p_price_mode, p_price, nullif(p_estimated_duration, '')
  ) returning * into v_item;

  insert into public.portfolio_item_images (portfolio_item_id, image_url, storage_path, position)
  select v_item.id, image.image_url, image.storage_path, (image.ordinality - 1)::smallint
  from jsonb_to_recordset(p_images) with ordinality as image(image_url text, storage_path text, ordinality bigint);

  return to_jsonb(v_item) || jsonb_build_object(
    'images', coalesce((
      select jsonb_agg(to_jsonb(image) order by image.position)
      from public.portfolio_item_images image where image.portfolio_item_id = v_item.id
    ), '[]'::jsonb)
  );
end;
$$;

create function public.replace_portfolio_offer(
  p_id bigint,
  p_title text,
  p_description text,
  p_price_mode text,
  p_price numeric,
  p_estimated_duration text,
  p_images jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item public.portfolio_items;
begin
  if coalesce(jsonb_typeof(p_images), '') <> 'array' then
    raise exception 'A oferta deve ter de uma a cinco imagens.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_images) not between 1 and 5 then
    raise exception 'A oferta deve ter de uma a cinco imagens.' using errcode = '22023';
  end if;

  update public.portfolio_items
  set image_url = p_images -> 0 ->> 'image_url',
      storage_path = p_images -> 0 ->> 'storage_path',
      title = p_title,
      description = nullif(p_description, ''),
      price_mode = p_price_mode,
      price = p_price,
      estimated_duration = nullif(p_estimated_duration, '')
  where id = p_id and owner_id = (select auth.uid())
  returning * into v_item;

  if not found then
    raise exception 'Oferta não encontrada.' using errcode = 'P0002';
  end if;

  delete from public.portfolio_item_images where portfolio_item_id = p_id;
  insert into public.portfolio_item_images (portfolio_item_id, image_url, storage_path, position)
  select p_id, image.image_url, image.storage_path, (image.ordinality - 1)::smallint
  from jsonb_to_recordset(p_images) with ordinality as image(image_url text, storage_path text, ordinality bigint);

  return to_jsonb(v_item) || jsonb_build_object(
    'images', coalesce((
      select jsonb_agg(to_jsonb(image) order by image.position)
      from public.portfolio_item_images image where image.portfolio_item_id = p_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_portfolio_offer(text, text, text, numeric, text, jsonb) from public, anon;
revoke all on function public.replace_portfolio_offer(bigint, text, text, text, numeric, text, jsonb) from public, anon;
grant execute on function public.create_portfolio_offer(text, text, text, numeric, text, jsonb) to authenticated;
grant execute on function public.replace_portfolio_offer(bigint, text, text, text, numeric, text, jsonb) to authenticated;
