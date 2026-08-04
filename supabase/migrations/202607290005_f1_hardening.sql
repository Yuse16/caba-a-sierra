begin;

-- Keep bridge and image records consistent with the rest of the domain model.
alter table public.cabin_services
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.cabin_categories
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.cabin_images
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.promotion_images
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

drop trigger if exists cabin_services_set_updated_at on public.cabin_services;
create trigger cabin_services_set_updated_at
  before update on public.cabin_services
  for each row execute function private.set_updated_at();
drop trigger if exists cabin_categories_set_updated_at on public.cabin_categories;
create trigger cabin_categories_set_updated_at
  before update on public.cabin_categories
  for each row execute function private.set_updated_at();
drop trigger if exists cabin_images_set_updated_at on public.cabin_images;
create trigger cabin_images_set_updated_at
  before update on public.cabin_images
  for each row execute function private.set_updated_at();
drop trigger if exists promotion_images_set_updated_at on public.promotion_images;
create trigger promotion_images_set_updated_at
  before update on public.promotion_images
  for each row execute function private.set_updated_at();

-- Editors replace catalog associations with DELETE + INSERT. Limit that delete
-- capability to bridge rows; destructive access to catalog entities stays admin-only.
drop policy if exists cabin_services_admin_delete on public.cabin_services;
create policy cabin_services_staff_delete on public.cabin_services
  for delete to authenticated
  using ((select private.is_active_staff()));
drop policy if exists cabin_categories_admin_delete on public.cabin_categories;
create policy cabin_categories_staff_delete on public.cabin_categories
  for delete to authenticated
  using ((select private.is_active_staff()));

-- Public settings stay readable by staff, but only an administrator may mutate them.
drop policy if exists public_settings_staff_write on public.public_site_settings;
create policy public_settings_staff_read on public.public_site_settings
  for select to authenticated
  using ((select private.is_active_staff()));
create policy public_settings_admin_insert on public.public_site_settings
  for insert to authenticated
  with check ((select private.has_admin_role('admin')));
create policy public_settings_admin_update on public.public_site_settings
  for update to authenticated
  using ((select private.has_admin_role('admin')))
  with check ((select private.has_admin_role('admin')));
create policy public_settings_admin_delete on public.public_site_settings
  for delete to authenticated
  using ((select private.has_admin_role('admin')));

-- Never trust actor columns supplied by a browser client.
create or replace function private.force_created_updated_by()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  else
    new.created_by = old.created_by;
  end if;
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function private.force_created_by()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  else
    new.created_by = old.created_by;
  end if;
  return new;
end;
$$;

create or replace function private.force_uploaded_by()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    new.uploaded_by = auth.uid();
  else
    new.uploaded_by = old.uploaded_by;
  end if;
  return new;
end;
$$;

create or replace function private.force_note_author()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    new.author_id = auth.uid();
  else
    new.author_id = old.author_id;
  end if;
  return new;
end;
$$;

revoke all on function private.force_created_updated_by() from public, anon, authenticated;
revoke all on function private.force_created_by() from public, anon, authenticated;
revoke all on function private.force_uploaded_by() from public, anon, authenticated;
revoke all on function private.force_note_author() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['cabins', 'promotions', 'owners', 'reservations'] loop
    execute format('drop trigger if exists force_actor_columns on public.%I', table_name);
    execute format(
      'create trigger force_actor_columns before insert or update on public.%I for each row execute function private.force_created_updated_by()',
      table_name
    );
  end loop;
end $$;

drop trigger if exists force_actor_columns on public.availability_entries;
create trigger force_actor_columns
  before insert or update on public.availability_entries
  for each row execute function private.force_created_by();
drop trigger if exists force_actor_columns on public.media_assets;
create trigger force_actor_columns
  before insert or update on public.media_assets
  for each row execute function private.force_uploaded_by();
drop trigger if exists force_actor_columns on public.internal_notes;
create trigger force_actor_columns
  before insert or update on public.internal_notes
  for each row execute function private.force_note_author();

-- A held or confirmed reservation must own a matching active reservation block.
alter table public.availability_entries
  add constraint availability_entries_identity_dates_key
  unique (id, cabin_id, check_in, check_out);
alter table public.reservations
  add constraint reservations_availability_matches_fkey
  foreign key (availability_entry_id, cabin_id, check_in, check_out)
  references public.availability_entries (id, cabin_id, check_in, check_out)
  on update restrict on delete restrict;
alter table public.reservations
  add constraint reservations_active_availability_required
  check (status not in ('held', 'confirmed') or availability_entry_id is not null);

create or replace function private.enforce_reservation_availability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  linked_kind public.availability_kind;
  linked_status public.availability_status;
begin
  if new.availability_entry_id is null then
    if new.status in ('held', 'confirmed') then
      raise exception 'ACTIVE_AVAILABILITY_REQUIRED' using errcode = '23514';
    end if;
    return new;
  end if;

  select entry.kind, entry.status
    into linked_kind, linked_status
  from public.availability_entries as entry
  where entry.id = new.availability_entry_id
    and entry.cabin_id = new.cabin_id
    and entry.check_in = new.check_in
    and entry.check_out = new.check_out;

  if not found or linked_kind <> 'reservation' then
    raise exception 'RESERVATION_AVAILABILITY_MISMATCH' using errcode = '23514';
  end if;
  if new.status in ('held', 'confirmed') and linked_status <> 'active' then
    raise exception 'ACTIVE_AVAILABILITY_REQUIRED' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.protect_linked_availability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if exists (
    select 1
    from public.reservations as reservation
    where reservation.availability_entry_id = old.id
      and reservation.status in ('held', 'confirmed')
  ) and (
    new.status <> 'active'
    or new.kind <> 'reservation'
    or new.cabin_id <> old.cabin_id
    or new.check_in <> old.check_in
    or new.check_out <> old.check_out
  ) then
    raise exception 'AVAILABILITY_LINKED_TO_ACTIVE_RESERVATION' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_reservation_availability() from public, anon, authenticated;
revoke all on function private.protect_linked_availability() from public, anon, authenticated;
drop trigger if exists enforce_reservation_availability on public.reservations;
create trigger enforce_reservation_availability
  before insert or update on public.reservations
  for each row execute function private.enforce_reservation_availability();
drop trigger if exists protect_linked_availability on public.availability_entries;
create trigger protect_linked_availability
  before update on public.availability_entries
  for each row execute function private.protect_linked_availability();

-- Audit every domain mutation and make the resulting log append-only.
drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using ((select private.has_admin_role('admin')));
revoke insert, update, delete on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  current_actor uuid := auth.uid();
  current_actor_role public.admin_role;
begin
  select profile.role
    into current_actor_role
  from public.admin_profiles as profile
  where profile.user_id = current_actor and profile.is_active;

  insert into public.audit_logs (
    actor_id, actor_role, action, table_name, record_id, before_data, after_data
  ) values (
    current_actor,
    current_actor_role,
    lower(tg_op),
    tg_table_schema || '.' || tg_table_name,
    coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id', to_jsonb(new)->>'user_id', to_jsonb(old)->>'user_id'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  -- This function is attached only to AFTER triggers; its return value is ignored.
  return null;
end;
$$;

create or replace function private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'AUDIT_LOGS_APPEND_ONLY' using errcode = '55000';
end;
$$;

revoke all on function private.write_audit_log() from public, anon, authenticated;
revoke all on function private.prevent_audit_log_mutation() from public, anon, authenticated;

drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function private.prevent_audit_log_mutation();

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
    execute format(
      'create trigger audit_row_change after insert or update or delete on public.%I for each row execute function private.write_audit_log()',
      table_name
    );
  end loop;
end $$;

-- Public contracts only expose images whose canonical asset is ready in public-media.
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
  join public.media_assets as asset on asset.id = promotion_image.asset_id
  where promotion_image.promotion_id = promotion.id
    and promotion_image.deleted_at is null
    and promotion_image.public_url is not null
    and promotion_image.public_url <> ''
    and asset.deleted_at is null
    and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media'
    and asset.public_path is not null
    and asset.public_path <> ''
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

comment on view public.public_cabins is
  'Contrato anonimo de cabañas; solo publica activos listos en public-media.';
comment on view public.public_promotions is
  'Contrato anonimo de promociones; aplica horario del negocio y solo publica activos listos en public-media.';

commit;
