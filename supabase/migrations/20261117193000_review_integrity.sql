alter table public.reviews
  alter column reviewer_id set not null,
  alter column provider_id set not null;

drop policy if exists reviews_buyer_insert on public.reviews;
create policy reviews_buyer_insert
  on public.reviews for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1
      from public.contracts c
      where c.id = reviews.contract_id
        and c.buyer_id = (select auth.uid())
        and c.provider_id = reviews.provider_id
        and c.status = 'concluido'
    )
  );
