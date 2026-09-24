begin;

alter table public.cabins
  add column if not exists bed_distribution jsonb not null default '{}'::jsonb,
  add column if not exists address text not null default '',
  add column if not exists zone text not null default '',
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists maps_url text not null default '',
  add column if not exists pool_type text not null default 'none';

alter table public.cabins
  add constraint cabins_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint cabins_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint cabins_coordinates_pair check ((latitude is null) = (longitude is null)),
  add constraint cabins_maps_url_https check (maps_url = '' or maps_url ~ '^https://'),
  add constraint cabins_pool_type_check check (pool_type in ('none', 'standard', 'heated')),
  add constraint cabins_bed_distribution_object check (jsonb_typeof(bed_distribution) = 'object');

alter table public.owners
  add column if not exists contact_hours text not null default '';

create or replace function private.valid_bed_distribution(value jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as item(key, amount)
      where jsonb_typeof(amount) <> 'number'
        or (amount::text)::numeric < 0
        or trunc((amount::text)::numeric) <> (amount::text)::numeric
    );
$$;

alter table public.cabins
  add constraint cabins_valid_bed_distribution check (private.valid_bed_distribution(bed_distribution));

-- La migración 009 contenía un máximo comercial de diez fotografías. Se
-- reemplaza únicamente esa función, preservando todas las validaciones de
-- seguridad, portada, orden, propiedad del asset y estado de Storage.
create or replace function public.sync_cabin_images(target_cabin_id uuid, images jsonb)
returns setof public.cabin_images
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  image_count integer;
  cover_count integer;
  item record;
  target_asset public.media_assets%rowtype;
  existing_image_id uuid;
  target_publication_state public.publication_state;
  removed_asset_ids uuid[] := array[]::uuid[];
begin
  if not private.is_active_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if jsonb_typeof(images) is distinct from 'array' then raise exception 'IMAGES_MUST_BE_ARRAY' using errcode = '22023'; end if;
  image_count := jsonb_array_length(images);

  select publication_state into target_publication_state from public.cabins
  where id = target_cabin_id and deleted_at is null for update;
  if not found then raise exception 'CABIN_NOT_FOUND' using errcode = 'P0002'; end if;
  if image_count = 0 and target_publication_state = 'published' then raise exception 'PUBLISHED_CABIN_REQUIRES_IMAGE' using errcode = '23514'; end if;

  if exists (
    select 1 from jsonb_array_elements(images) as entry(value)
    where jsonb_typeof(value) is distinct from 'object'
      or not (value ? 'asset_id') or not (value ? 'is_cover')
      or jsonb_typeof(value->'asset_id') is distinct from 'string'
      or jsonb_typeof(value->'is_cover') is distinct from 'boolean'
      or coalesce(value->>'asset_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then raise exception 'INVALID_IMAGE_ITEM' using errcode = '22023'; end if;

  if image_count > 0 and (select count(distinct (value->>'asset_id')::uuid) from jsonb_array_elements(images)) <> image_count
  then raise exception 'DUPLICATE_ASSET_ID' using errcode = '22023'; end if;

  select count(*) into cover_count from jsonb_array_elements(images) as value
  where coalesce((value->>'is_cover')::boolean, false);
  if (image_count = 0 and cover_count <> 0) or (image_count > 0 and cover_count <> 1)
  then raise exception 'EXACTLY_ONE_COVER_REQUIRED' using errcode = '22023'; end if;

  select coalesce(array_agg(asset_id), array[]::uuid[]) into removed_asset_ids
  from public.cabin_images where cabin_id = target_cabin_id and deleted_at is null
    and not (asset_id = any (coalesce((select array_agg((value->>'asset_id')::uuid) from jsonb_array_elements(images)), array[]::uuid[])));

  update public.cabin_images set is_cover = false where cabin_id = target_cabin_id and deleted_at is null;
  update public.cabin_images set deleted_at = timezone('utc', now()), is_cover = false
  where cabin_id = target_cabin_id and deleted_at is null and asset_id = any (removed_asset_ids);
  update public.media_assets set updated_at = timezone('utc', now()) where id = any (removed_asset_ids);

  for item in select value, ordinality::integer as position from jsonb_array_elements(images) with ordinality loop
    select * into target_asset from public.media_assets
    where id = (item.value->>'asset_id')::uuid and deleted_at is null and processing_status = 'ready'
      and public_bucket = 'public-media' and public_path is not null and canonical_public_url is not null
      and split_part(source_path, '/', 2) = 'cabins';
    if not found then raise exception 'MEDIA_ASSET_NOT_READY' using errcode = '23514'; end if;

    select id into existing_image_id from public.cabin_images
    where cabin_id = target_cabin_id and asset_id = target_asset.id;
    if existing_image_id is null then
      insert into public.cabin_images (cabin_id, asset_id, public_url, alt_text, position, is_cover, deleted_at)
      values (target_cabin_id, target_asset.id, target_asset.canonical_public_url, left(coalesce(item.value->>'alt_text', ''), 300), item.position, coalesce((item.value->>'is_cover')::boolean, false), null);
    else
      update public.cabin_images set public_url = target_asset.canonical_public_url,
        alt_text = left(coalesce(item.value->>'alt_text', ''), 300), position = item.position,
        is_cover = coalesce((item.value->>'is_cover')::boolean, false), deleted_at = null
      where id = existing_image_id;
    end if;
  end loop;

  return query select image.* from public.cabin_images as image
  where image.cabin_id = target_cabin_id and image.deleted_at is null order by image.position, image.id;
end;
$$;

revoke all on function public.sync_cabin_images(uuid, jsonb) from public, anon;
grant execute on function public.sync_cabin_images(uuid, jsonb) to authenticated;

-- Archivar conserva relaciones, portada, orden y archivos. deleted_at en la
-- cabaña basta para retirarla de vistas públicas y listados activos.
create or replace function public.archive_cabin_with_images(target_cabin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.cabins set deleted_at = timezone('utc', now()), publication_state = 'draft', published_at = null, updated_by = auth.uid()
  where id = target_cabin_id and deleted_at is null;
  return found;
end;
$$;

create or replace function public.restore_archived_cabin(target_cabin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  update public.cabins set deleted_at = null, publication_state = 'draft', published_at = null, updated_by = auth.uid()
  where id = target_cabin_id and deleted_at is not null;
  return found;
end;
$$;

revoke all on function public.archive_cabin_with_images(uuid) from public, anon;
grant execute on function public.archive_cabin_with_images(uuid) to authenticated;
revoke all on function public.restore_archived_cabin(uuid) from public, anon;
grant execute on function public.restore_archived_cabin(uuid) to authenticated;

commit;
