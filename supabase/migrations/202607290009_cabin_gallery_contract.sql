begin;

alter table public.media_assets
  add column canonical_public_url text;

-- El hash sirve para localizar posibles duplicados, pero no es una identidad.
-- Dos uploads válidos del mismo archivo deben poder coexistir sin romper una
-- migración sobre datos productivos ya existentes.
create index media_assets_uploader_sha_live_idx
  on public.media_assets (uploaded_by, sha256)
  where deleted_at is null and uploaded_by is not null;

create or replace function private.enforce_media_lifecycle()
returns trigger
language plpgsql
set search_path = public, private, pg_catalog
as $$
begin
  if tg_op = 'INSERT'
    and auth.uid() is not null
    and split_part(new.source_path, '/', 2) = 'cabins'
  then
    new.uploaded_by := auth.uid();
    new.source_bucket := 'admin-media';
    new.processing_status := 'staging';
    new.public_bucket := null;
    new.public_path := null;
    new.canonical_public_url := null;
    new.deleted_at := null;
  elsif tg_op = 'UPDATE'
    and auth.uid() is not null
    and split_part(old.source_path, '/', 2) = 'cabins'
  then
    if new.processing_status is distinct from old.processing_status
      or new.public_bucket is distinct from old.public_bucket
      or new.public_path is distinct from old.public_path
      or new.canonical_public_url is distinct from old.canonical_public_url
      or new.deleted_at is distinct from old.deleted_at
      or new.source_bucket is distinct from old.source_bucket
      or new.source_path is distinct from old.source_path
    then
      raise exception 'MEDIA_PIPELINE_REQUIRES_SERVICE_ROLE' using errcode = '42501';
    end if;
  end if;

  -- El pipeline nuevo pertenece a galerías de cabañas. Promociones conserva
  -- su contrato existente hasta que tenga una migración propia y coordinada.
  if split_part(new.source_path, '/', 2) = 'cabins' and new.processing_status = 'ready' then
    if new.public_bucket is distinct from 'public-media'
      or coalesce(new.public_path, '') = ''
      or coalesce(new.canonical_public_url, '') !~ '^(https://[^/]+|http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?)/storage/v1/object/public/public-media/.+'
    then
      raise exception 'READY_MEDIA_REQUIRES_CANONICAL_PUBLIC_OBJECT' using errcode = '23514';
    end if;
  elsif split_part(new.source_path, '/', 2) = 'cabins'
    and new.processing_status in ('staging', 'processing', 'failed')
  then
    if new.public_bucket is not null or new.public_path is not null or new.canonical_public_url is not null then
      raise exception 'NON_READY_MEDIA_CANNOT_BE_PUBLIC' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_media_lifecycle() from public, anon, authenticated;
drop trigger if exists enforce_media_lifecycle on public.media_assets;
create trigger enforce_media_lifecycle
  before insert or update on public.media_assets
  for each row execute function private.enforce_media_lifecycle();

-- El pipeline server-only escribe derivados de cabañas. El flujo existente de
-- promociones conserva temporalmente su escritura autenticada en public-media.
drop policy if exists public_media_staff_insert on storage.objects;
create policy public_media_staff_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'promotions'
    and (select private.is_active_staff())
  );

-- Para activos de cabañas, el trigger impide transiciones del ciclo de vida
-- mediante la sesión autenticada. Los grants existentes se conservan porque
-- el módulo de promociones todavía los necesita.

-- Existing ready rows are made canonical from their current association URLs.
update public.media_assets as asset
set canonical_public_url = candidate.public_url
from (
  select asset_id, min(public_url) as public_url
  from (
    select asset_id, public_url from public.cabin_images where deleted_at is null and public_url is not null
  ) as association_urls
  group by asset_id
) as candidate
where asset.id = candidate.asset_id
  and split_part(asset.source_path, '/', 2) = 'cabins'
  and asset.processing_status = 'ready'
  and asset.public_bucket = 'public-media'
  and candidate.public_url ~ '^(https://[^/]+|http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?)/storage/v1/object/public/public-media/.+'
  and asset.canonical_public_url is null;

-- Ready legacy rows without a safe canonical URL are returned to processing.
update public.media_assets
set processing_status = 'processing', public_bucket = null, public_path = null, canonical_public_url = null
where processing_status = 'ready'
  and split_part(source_path, '/', 2) = 'cabins'
  and (
    public_bucket is distinct from 'public-media'
    or coalesce(public_path, '') = ''
    or coalesce(canonical_public_url, '') !~ '^(https://[^/]+|http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?)/storage/v1/object/public/public-media/.+'
  );

create or replace function private.active_media_reference_count(target_asset_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    (select count(*) from public.cabin_images where asset_id = target_asset_id and deleted_at is null)
    +
    (select count(*) from public.promotion_images where asset_id = target_asset_id and deleted_at is null);
$$;

revoke all on function private.active_media_reference_count(uuid) from public, anon, authenticated;

create or replace function private.force_association_public_url()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare canonical_url text;
begin
  select asset.canonical_public_url into canonical_url
  from public.media_assets as asset
  where asset.id = new.asset_id
    and asset.deleted_at is null
    and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media'
    and asset.public_path is not null
    and asset.canonical_public_url is not null
    and split_part(asset.source_path, '/', 2) = 'cabins';
  if not found then
    raise exception 'MEDIA_ASSET_NOT_READY' using errcode = '23514';
  end if;
  new.public_url := canonical_url;
  return new;
end;
$$;

revoke all on function private.force_association_public_url() from public, anon, authenticated;
drop trigger if exists force_association_public_url on public.cabin_images;
create trigger force_association_public_url
  before insert or update of asset_id, public_url on public.cabin_images
  for each row execute function private.force_association_public_url();
revoke insert, update, delete on public.cabin_images from authenticated;

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
  if not private.is_active_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if jsonb_typeof(images) is distinct from 'array' then
    raise exception 'IMAGES_MUST_BE_ARRAY' using errcode = '22023';
  end if;

  image_count := jsonb_array_length(images);
  if image_count > 10 then
    raise exception 'IMAGE_COUNT_OUT_OF_RANGE' using errcode = '22023';
  end if;

  select publication_state into target_publication_state
  from public.cabins
  where id = target_cabin_id and deleted_at is null
  for update;
  if not found then
    raise exception 'CABIN_NOT_FOUND' using errcode = 'P0002';
  end if;

  if image_count = 0 and target_publication_state = 'published' then
    raise exception 'PUBLISHED_CABIN_REQUIRES_IMAGE' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(images) as entry(value)
    where jsonb_typeof(value) is distinct from 'object'
      or not (value ? 'asset_id')
      or not (value ? 'is_cover')
      or jsonb_typeof(value->'asset_id') is distinct from 'string'
      or jsonb_typeof(value->'is_cover') is distinct from 'boolean'
      or coalesce(value->>'asset_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then
    raise exception 'INVALID_IMAGE_ITEM' using errcode = '22023';
  end if;

  if image_count > 0 and (
    select count(distinct (value->>'asset_id')::uuid)
    from jsonb_array_elements(images)
  ) <> image_count then
    raise exception 'DUPLICATE_ASSET_ID' using errcode = '22023';
  end if;

  select count(*) into cover_count
  from jsonb_array_elements(images) as value
  where coalesce((value->>'is_cover')::boolean, false);
  if (image_count = 0 and cover_count <> 0)
    or (image_count > 0 and cover_count <> 1)
  then
    raise exception 'EXACTLY_ONE_COVER_REQUIRED' using errcode = '22023';
  end if;

  select coalesce(array_agg(asset_id), array[]::uuid[]) into removed_asset_ids
  from public.cabin_images
  where cabin_id = target_cabin_id
    and deleted_at is null
    and not (asset_id = any (
      coalesce(
        (select array_agg((value->>'asset_id')::uuid) from jsonb_array_elements(images)),
        array[]::uuid[]
      )
    ));

  -- Clear the partial unique cover before rebuilding the ordered set.
  update public.cabin_images
  set is_cover = false
  where cabin_id = target_cabin_id and deleted_at is null;

  update public.cabin_images
  set deleted_at = timezone('utc', now()), is_cover = false
  where cabin_id = target_cabin_id
    and deleted_at is null
    and asset_id = any (removed_asset_ids);

  -- El periodo de gracia para limpiar un huérfano comienza cuando pierde su
  -- última asociación, no cuando se cargó originalmente. Los assets
  -- compartidos también se actualizan, pero el conteo de referencias impide
  -- que el job los marque mientras sigan en uso.
  update public.media_assets
  set updated_at = timezone('utc', now())
  where id = any (removed_asset_ids);

  for item in
    select value, ordinality::integer as position
    from jsonb_array_elements(images) with ordinality
  loop
    select * into target_asset
    from public.media_assets
    where id = (item.value->>'asset_id')::uuid
      and deleted_at is null
      and processing_status = 'ready'
      and public_bucket = 'public-media'
      and public_path is not null
      and canonical_public_url is not null
      and split_part(source_path, '/', 2) = 'cabins';
    if not found then
      raise exception 'MEDIA_ASSET_NOT_READY' using errcode = '23514';
    end if;

    select id into existing_image_id
    from public.cabin_images
    where cabin_id = target_cabin_id and asset_id = target_asset.id;

    if existing_image_id is null then
      insert into public.cabin_images (
        cabin_id, asset_id, public_url, alt_text, position, is_cover, deleted_at
      ) values (
        target_cabin_id,
        target_asset.id,
        target_asset.canonical_public_url,
        left(coalesce(item.value->>'alt_text', ''), 300),
        item.position,
        coalesce((item.value->>'is_cover')::boolean, false),
        null
      );
    else
      update public.cabin_images
      set public_url = target_asset.canonical_public_url,
          alt_text = left(coalesce(item.value->>'alt_text', ''), 300),
          position = item.position,
          is_cover = coalesce((item.value->>'is_cover')::boolean, false),
          deleted_at = null
      where id = existing_image_id;
    end if;
  end loop;

  return query
    select image.* from public.cabin_images as image
    where image.cabin_id = target_cabin_id and image.deleted_at is null
    order by image.position, image.id;
end;
$$;

revoke all on function public.sync_cabin_images(uuid, jsonb) from public, anon;
grant execute on function public.sync_cabin_images(uuid, jsonb) to authenticated;

create or replace function public.archive_cabin_with_images(target_cabin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  archived_at timestamptz := timezone('utc', now());
  archived_assets uuid[] := array[]::uuid[];
begin
  if not private.has_admin_role('admin') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  perform 1
  from public.cabins
  where id = target_cabin_id and deleted_at is null
  for update;
  if not found then
    return false;
  end if;

  select coalesce(array_agg(asset_id), array[]::uuid[]) into archived_assets
  from public.cabin_images
  where cabin_id = target_cabin_id and deleted_at is null;

  update public.cabins
  set deleted_at = archived_at,
      publication_state = 'draft',
      published_at = null,
      updated_by = auth.uid()
  where id = target_cabin_id and deleted_at is null;

  update public.cabin_images
  set deleted_at = archived_at, is_cover = false
  where cabin_id = target_cabin_id and deleted_at is null;

  update public.media_assets
  set updated_at = archived_at
  where id = any (archived_assets);

  return true;
end;
$$;

revoke all on function public.archive_cabin_with_images(uuid) from public, anon;
grant execute on function public.archive_cabin_with_images(uuid) to authenticated;

create or replace function public.mark_orphaned_media_assets(cutoff timestamptz)
returns setof uuid
language plpgsql
security invoker
set search_path = public, private, pg_catalog
as $$
begin
  return query
  update public.media_assets as asset
  set processing_status = 'pending_delete', updated_at = timezone('utc', now())
  where asset.deleted_at is null
    and asset.updated_at < cutoff
    and asset.processing_status in ('staging', 'failed', 'ready')
    and private.active_media_reference_count(asset.id) = 0
  returning asset.id;
end;
$$;

revoke all on function public.mark_orphaned_media_assets(timestamptz) from public, anon, authenticated;
grant execute on function public.mark_orphaned_media_assets(timestamptz) to service_role;

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
  cover.cover_url as image_url,
  coalesce(service_list.amenities, array[]::text[]) as amenities,
  coalesce(category_list.categories, array[]::text[]) as categories,
  gallery.images as gallery
from public.cabins as cabin
join lateral (
  select asset.canonical_public_url as cover_url
  from public.cabin_images as image
  join public.media_assets as asset on asset.id = image.asset_id
  where image.cabin_id = cabin.id
    and image.deleted_at is null
    and image.is_cover
    and asset.deleted_at is null
    and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media'
    and asset.public_path is not null
    and asset.canonical_public_url is not null
  limit 1
) as cover on true
join lateral (
  select
    jsonb_agg(
      jsonb_build_object(
        'id', image.id,
        'url', asset.canonical_public_url,
        'alt_text', image.alt_text,
        'position', image.position,
        'is_cover', image.is_cover
      ) order by image.position, image.id
  ) as images
  from public.cabin_images as image
  join public.media_assets as asset on asset.id = image.asset_id
  where image.cabin_id = cabin.id
    and image.deleted_at is null
    and asset.deleted_at is null
    and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media'
    and asset.public_path is not null
    and asset.canonical_public_url is not null
) as gallery on gallery.images is not null
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

comment on function public.sync_cabin_images(uuid, jsonb) is
  'Sincroniza atómicamente 0–10 imágenes ordenadas de una cabaña; si hay imágenes exige exactamente una portada, solo admite assets públicos listos y no permite vaciar una cabaña publicada.';
comment on function public.archive_cabin_with_images(uuid) is
  'Archiva una cabaña y todas sus asociaciones de imagen en una sola transacción; operación exclusiva de administradores.';
comment on function public.mark_orphaned_media_assets(timestamptz) is
  'Marca huérfanos antiguos para eliminación; solo service_role y nunca assets con referencias activas.';

commit;
