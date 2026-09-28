begin;

create or replace view public.public_cabins
with (security_barrier = true, security_invoker = false)
as
select
  cabin.id, cabin.slug, cabin.name, cabin.description, cabin.location,
  cabin.nightly_price, cabin.old_price, cabin.min_guests, cabin.max_guests,
  cabin.bedrooms, cabin.bathrooms, cabin.cabin_type, cabin.display_order,
  cover.cover_url as image_url,
  coalesce(service_list.amenities, array[]::text[]) as amenities,
  coalesce(category_list.categories, array[]::text[]) as categories,
  gallery.images as gallery,
  cabin.short_description,
  cabin.beds,
  cabin.bed_distribution,
  cabin.check_in_time,
  cabin.check_out_time,
  cabin.accepts_pets,
  cabin.rules,
  cabin.address,
  cabin.zone,
  cabin.latitude,
  cabin.longitude,
  cabin.maps_url,
  cabin.pool_type
from public.cabins as cabin
join lateral (
  select asset.canonical_public_url as cover_url
  from public.cabin_images as image
  join public.media_assets as asset on asset.id = image.asset_id
  where image.cabin_id = cabin.id and image.deleted_at is null and image.is_cover
    and asset.deleted_at is null and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media' and asset.public_path is not null
    and asset.canonical_public_url is not null
  limit 1
) as cover on true
join lateral (
  select jsonb_agg(jsonb_build_object(
    'id', image.id, 'url', asset.canonical_public_url, 'alt_text', image.alt_text,
    'position', image.position, 'is_cover', image.is_cover
  ) order by image.position, image.id) as images
  from public.cabin_images as image
  join public.media_assets as asset on asset.id = image.asset_id
  where image.cabin_id = cabin.id and image.deleted_at is null and asset.deleted_at is null
    and asset.processing_status = 'ready' and asset.public_bucket = 'public-media'
    and asset.public_path is not null and asset.canonical_public_url is not null
) as gallery on gallery.images is not null
left join lateral (
  select array_agg(service.name order by service.display_order, service.name) as amenities
  from public.cabin_services as cabin_service join public.services as service on service.id = cabin_service.service_id
  where cabin_service.cabin_id = cabin.id and service.is_active
) as service_list on true
left join lateral (
  select array_agg(category.code order by category.display_order, category.code) as categories
  from public.cabin_categories as cabin_category join public.categories as category on category.id = cabin_category.category_id
  where cabin_category.cabin_id = cabin.id and category.is_active
) as category_list on true
where cabin.publication_state = 'published' and cabin.deleted_at is null;

alter view public.public_cabins owner to postgres;
revoke all on public.public_cabins from public;
grant select on public.public_cabins to anon, authenticated;

commit;
