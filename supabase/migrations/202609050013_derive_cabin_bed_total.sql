begin;

create or replace function private.derive_cabin_bed_total()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.bed_distribution <> '{}'::jsonb then
    select coalesce(sum((amount::text)::integer), 0)
    into new.beds
    from jsonb_each(new.bed_distribution) as item(kind, amount);
  end if;
  return new;
end;
$$;

drop trigger if exists cabins_derive_bed_total on public.cabins;
create trigger cabins_derive_bed_total
before insert or update of bed_distribution on public.cabins
for each row execute function private.derive_cabin_bed_total();

commit;
