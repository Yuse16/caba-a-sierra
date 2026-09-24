begin;
-- 009 archivaba asociaciones con la misma marca de tiempo que la cabaña.
-- Sólo se recupera ese patrón inequívoco y si el asset sigue listo.
with recoverable as (
  select image.id, row_number() over (partition by image.cabin_id order by image.position, image.id) ordinal
  from public.cabin_images image join public.cabins cabin on cabin.id = image.cabin_id
  join public.media_assets asset on asset.id = image.asset_id
  where cabin.deleted_at is not null and image.deleted_at = cabin.deleted_at
    and asset.deleted_at is null and asset.processing_status = 'ready'
    and asset.public_bucket = 'public-media' and asset.public_path is not null
)
update public.cabin_images image set deleted_at = null, is_cover = recoverable.ordinal = 1
from recoverable where recoverable.id = image.id;
commit;
