begin;

drop function if exists public.mark_orphaned_media_assets(timestamptz);
drop function if exists public.archive_cabin_with_images(uuid);
drop function if exists public.sync_cabin_images(uuid, jsonb);

drop trigger if exists force_association_public_url on public.cabin_images;
drop function if exists private.force_association_public_url();
drop function if exists private.active_media_reference_count(uuid);

drop trigger if exists enforce_media_lifecycle on public.media_assets;
drop function if exists private.enforce_media_lifecycle();
drop view if exists public.public_cabins;
drop index if exists public.media_assets_uploader_sha_live_idx;
alter table public.media_assets drop column if exists canonical_public_url;

grant insert, update, delete on public.cabin_images to authenticated;
grant update, delete on public.media_assets to authenticated;

drop policy if exists public_media_staff_insert on storage.objects;
create policy public_media_staff_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] in ('cabins', 'promotions')
    and (select private.is_active_staff())
  );

create view public.public_cabins
with (security_barrier = true, security_invoker = false)
as
select
  cabin.id,
  cabin.slug,
  cabin.name,
  cabin.description,
  cabin.location,
  cabin.nightly_price,
  cabin.old_price,
  cabin.min_guests,
  cabin.max_guests,
  cabin.bedrooms,
  cabin.bathrooms,
  cabin.cabin_type,
  cabin.display_order,
  cover.public_url as image_url,
  coalesce(service_list.amenities, array[]::text[]) as amenities,
  coalesce(category_list.categories, array[]::text[]) as categories
from public.cabins as cabin
join lateral (
  select image.public_url
  from public.cabin_images as image
  join public.media_assets as asset on asset.id = image.asset_id
  where image.cabin_id = cabin.id
    and image.deleted_at is null
    and image.public_url is not null
    and image.public_url <> ''
    and asset.deleted_at is null
    and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media'
    and asset.public_path is not null
    and asset.public_path <> ''
  order by image.is_cover desc, image.position, image.id
  limit 1
) as cover on true
left join lateral (
  select array_agg(service.name order by service.display_order, service.name) as amenities
  from public.cabin_services as cabin_service
  join public.services as service on service.id = cabin_service.service_id
  where cabin_service.cabin_id = cabin.id and service.is_active
) as service_list on true
left join lateral (
  select array_agg(category.code order by category.display_order, category.code) as categories
  from public.cabin_categories as cabin_category
  join public.categories as category on category.id = cabin_category.category_id
  where cabin_category.cabin_id = cabin.id and category.is_active
) as category_list on true
where cabin.publication_state = 'published'
  and cabin.deleted_at is null;

alter view public.public_cabins owner to postgres;
revoke all on public.public_cabins from public;
grant select on public.public_cabins to anon, authenticated;

comment on view public.public_cabins is
  'Contrato anonimo de cabañas; solo publica activos listos en public-media.';

commit;
