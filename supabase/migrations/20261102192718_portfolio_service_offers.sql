alter table public.portfolio_items
  add column if not exists title text,
  add column if not exists price_mode text not null default 'sob_consulta',
  add column if not exists price numeric(10, 2),
  add column if not exists estimated_duration text;

update public.portfolio_items
set title = left(coalesce(nullif(btrim(description), ''), 'Trabalho realizado'), 90)
where title is null;

alter table public.portfolio_items
  alter column title set not null,
  add constraint portfolio_items_title_length check (char_length(title) between 2 and 90),
  add constraint portfolio_items_description_length check (description is null or char_length(description) <= 1000),
  add constraint portfolio_items_price_mode check (price_mode in ('fixo', 'a_partir_de', 'sob_consulta')),
  add constraint portfolio_items_price_valid check (
    (price_mode = 'sob_consulta' and price is null)
    or (price_mode in ('fixo', 'a_partir_de') and price > 0 and price <= 1000000)
  ),
  add constraint portfolio_items_duration_length check (estimated_duration is null or char_length(estimated_duration) <= 80);

