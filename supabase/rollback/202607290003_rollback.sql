begin;

drop view if exists public.public_promotions;
drop view if exists public.public_cabins;

-- Keep base tables private after removing the public API projections. Restoring
-- anonymous table grants would expose administrative columns that RLS cannot hide.
revoke all on public.cabins, public.services, public.cabin_services, public.categories,
  public.cabin_categories, public.cabin_images, public.promotions, public.promotion_images from anon;

commit;
