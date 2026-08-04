begin;

-- The public Data API exposes only these explicit projections. RLS limits rows,
-- but it does not hide administrative columns such as created_by or legacy_id.
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
  where image.cabin_id = cabin.id
    and image.deleted_at is null
    and image.public_url is not null
    and image.public_url <> ''
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

create view public.public_promotions
with (security_barrier = true, security_invoker = false)
as
select
  promotion.id,
  promotion.name,
  promotion.short_description,
  promotion.image_alt,
  promotion.cta_label,
  promotion.href,
  promotion.display_order,
  image.public_url as image_url,
  coalesce(nullif(image.alt_text, ''), promotion.image_alt) as image_alt_text
from public.promotions as promotion
join lateral (
  select promotion_image.public_url, promotion_image.alt_text
  from public.promotion_images as promotion_image
  where promotion_image.promotion_id = promotion.id
    and promotion_image.deleted_at is null
    and promotion_image.public_url is not null
    and promotion_image.public_url <> ''
  order by promotion_image.created_at desc, promotion_image.id
  limit 1
) as image on true
where promotion.publication_state = 'published'
  and promotion.deleted_at is null
  and (
    promotion.starts_on is null
    or promotion.starts_on <= (
      now() at time zone coalesce(
        (select settings.timezone from public.public_site_settings as settings where settings.id),
        'America/Monterrey'
      )
    )::date
  )
  and (
    promotion.ends_on is null
    or promotion.ends_on >= (
      now() at time zone coalesce(
        (select settings.timezone from public.public_site_settings as settings where settings.id),
        'America/Monterrey'
      )
    )::date
  );

alter view public.public_cabins owner to postgres;
alter view public.public_promotions owner to postgres;

revoke all on public.cabins, public.services, public.cabin_services, public.categories,
  public.cabin_categories, public.cabin_images, public.promotions, public.promotion_images from anon;
revoke all on public.public_cabins, public.public_promotions from public;
grant select on public.public_cabins, public.public_promotions to anon, authenticated;

comment on view public.public_cabins is
  'Contrato anonimo de cabañas; excluye metadatos administrativos y registros sin imagen publicada.';
comment on view public.public_promotions is
  'Contrato anonimo de promociones; aplica ventana horaria del negocio y excluye metadatos administrativos.';

commit;
