begin;

alter table public.cabins
  add column contact_whatsapp text not null default ''
  check (contact_whatsapp = '' or contact_whatsapp ~ '^\+?[0-9]{10,15}$');

create or replace function public.reorder_promotions(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, private, pg_catalog
as $$
declare
  promotion_id uuid;
  next_position integer := 1;
begin
  if not private.is_active_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if ordered_ids is null or cardinality(ordered_ids) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = '22023';
  end if;

  if (select count(distinct value) from unnest(ordered_ids) as value) <> cardinality(ordered_ids) then
    raise exception 'DUPLICATE_ID' using errcode = '22023';
  end if;

  if (
    select count(*) from public.promotions
    where id = any(ordered_ids) and deleted_at is null
  ) <> cardinality(ordered_ids) then
    raise exception 'UNKNOWN_PROMOTION' using errcode = '22023';
  end if;

  foreach promotion_id in array ordered_ids loop
    update public.promotions
    set display_order = next_position, updated_by = auth.uid()
    where id = promotion_id and deleted_at is null;
    next_position := next_position + 1;
  end loop;
end;
$$;

revoke all on function public.reorder_promotions(uuid[]) from public, anon;
grant execute on function public.reorder_promotions(uuid[]) to authenticated;

commit;
