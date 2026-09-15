begin;

drop function if exists public.restore_archived_cabin(uuid);
alter table public.owners drop column if exists contact_hours;
alter table public.cabins
  drop column if exists pool_type,
  drop column if exists maps_url,
  drop column if exists longitude,
  drop column if exists latitude,
  drop column if exists zone,
  drop column if exists address,
  drop column if exists bed_distribution;
drop function if exists private.valid_bed_distribution(jsonb);

-- Las funciones de sincronización y archivado deben restaurarse aplicando de
-- nuevo la migración 009 en un entorno de recuperación controlado.
commit;
