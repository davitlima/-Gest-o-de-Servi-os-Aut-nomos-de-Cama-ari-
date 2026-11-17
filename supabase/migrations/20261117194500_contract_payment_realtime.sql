do $migration$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contracts'
  ) then
    alter publication supabase_realtime add table public.contracts;
  end if;
end;
$migration$;
