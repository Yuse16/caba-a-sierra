begin;

-- Restore the public projections that existed before migration 005.
create or replace view public.public_cabins
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

create or replace view public.public_promotions
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
revoke all on public.public_cabins, public.public_promotions from public;
grant select on public.public_cabins, public.public_promotions to anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'admin_profiles', 'cabins', 'services', 'cabin_services', 'categories', 'cabin_categories',
    'media_assets', 'cabin_images', 'promotions', 'promotion_images', 'owners', 'owner_contacts',
    'cabin_owner_assignments', 'customers', 'booking_inquiries', 'availability_entries', 'reservations',
    'internal_notes', 'public_site_settings', 'business_settings'
  ] loop
    execute format('drop trigger if exists audit_row_change on public.%I', table_name);
  end loop;
end $$;

drop trigger if exists audit_logs_append_only on public.audit_logs;
drop trigger if exists enforce_reservation_availability on public.reservations;
drop trigger if exists protect_linked_availability on public.availability_entries;

do $$
declare table_name text;
begin
  foreach table_name in array array['cabins', 'promotions', 'owners', 'reservations'] loop
    execute format('drop trigger if exists force_actor_columns on public.%I', table_name);
  end loop;
end $$;
drop trigger if exists force_actor_columns on public.availability_entries;
drop trigger if exists force_actor_columns on public.media_assets;
drop trigger if exists force_actor_columns on public.internal_notes;

drop policy if exists cabin_services_staff_delete on public.cabin_services;
create policy cabin_services_admin_delete on public.cabin_services
  for delete to authenticated
  using ((select private.has_admin_role('admin')));
drop policy if exists cabin_categories_staff_delete on public.cabin_categories;
create policy cabin_categories_admin_delete on public.cabin_categories
  for delete to authenticated
  using ((select private.has_admin_role('admin')));

drop policy if exists public_settings_staff_read on public.public_site_settings;
drop policy if exists public_settings_admin_insert on public.public_site_settings;
drop policy if exists public_settings_admin_update on public.public_site_settings;
drop policy if exists public_settings_admin_delete on public.public_site_settings;
create policy public_settings_staff_write on public.public_site_settings
  for all to authenticated
  using ((select private.is_active_staff()))
  with check ((select private.is_active_staff()));

drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_all on public.audit_logs
  for all to authenticated
  using ((select private.has_admin_role('admin')))
  with check ((select private.has_admin_role('admin')));
grant insert, update, delete on public.audit_logs to authenticated;

alter table public.reservations
  drop constraint if exists reservations_active_availability_required;
alter table public.reservations
  drop constraint if exists reservations_availability_matches_fkey;
alter table public.availability_entries
  drop constraint if exists availability_entries_identity_dates_key;

drop trigger if exists cabin_services_set_updated_at on public.cabin_services;
drop trigger if exists cabin_categories_set_updated_at on public.cabin_categories;
drop trigger if exists cabin_images_set_updated_at on public.cabin_images;
drop trigger if exists promotion_images_set_updated_at on public.promotion_images;
alter table public.cabin_services drop column if exists updated_at, drop column if exists created_at;
alter table public.cabin_categories drop column if exists updated_at, drop column if exists created_at;
alter table public.cabin_images drop column if exists updated_at;
alter table public.promotion_images drop column if exists updated_at;

drop function if exists private.prevent_audit_log_mutation();
drop function if exists private.write_audit_log();
drop function if exists private.protect_linked_availability();
drop function if exists private.enforce_reservation_availability();
drop function if exists private.force_note_author();
drop function if exists private.force_uploaded_by();
drop function if exists private.force_created_by();
drop function if exists private.force_created_updated_by();

commit;
