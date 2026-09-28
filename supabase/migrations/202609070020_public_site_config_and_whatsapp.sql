begin;

-- Public site configuration grows to cover the full DUPEZ public identity:
-- branding (name/subtitle/tagline), a hero image managed through the media
-- system, a physical office with an optional Google Maps link, and a single
-- source of truth for the public phone and WhatsApp number.
--
-- The old intermediary WhatsApp (528442779477) is replaced by the official
-- DUPEZ number (8444556929 -> wa.me/528444556929). No public surface reads
-- the number from hardcoded constants anymore; it is exposed through the
-- public_site_config view below.

alter table public.public_site_settings
  add column if not exists subtitle text not null default '',
  add column if not exists tagline text not null default '',
  add column if not exists hero_asset_id uuid,
  add column if not exists office_address text not null default '',
  add column if not exists office_maps_url text not null default '';

alter table public.public_site_settings
  add constraint public_site_settings_hero_asset_fkey
  foreign key (hero_asset_id) references public.media_assets(id)
  on delete set null;

-- Initial DUPEZ identity. The enable toggle guard keeps the seed idempotent.
insert into public.public_site_settings (id, business_name, subtitle, tagline, public_whatsapp, public_phone, public_email, general_location, business_hours, office_address, office_maps_url, timezone, currency)
values (
  true,
  'DUPEZ',
  'Renta de cabañas en toda la Sierra de Arteaga',
  'Respira el bosque. Vive la sierra.',
  '528444556929',
  '844 455 6929',
  'cabanasdupez@gmail.com',
  'Arteaga, Coahuila, México',
  'Lunes a domingo · 8:00 a 21:00 h',
  '',
  '',
  'America/Monterrey',
  'MXN'
)
on conflict (id) do update set
  business_name = excluded.business_name,
  subtitle = excluded.subtitle,
  tagline = excluded.tagline,
  public_whatsapp = excluded.public_whatsapp,
  public_phone = excluded.public_phone,
  public_email = excluded.public_email,
  general_location = excluded.general_location,
  business_hours = excluded.business_hours,
  office_address = excluded.office_address,
  office_maps_url = excluded.office_maps_url,
  timezone = excluded.timezone,
  currency = excluded.currency;

-- Public read surface: only columns the public site may see. The view resolves
-- the hero asset to its canonical public URL so the public page never needs to
-- know about the private bucket, signed URLs, or internal asset ids.
create or replace view public.public_site_config
with (security_barrier = true, security_invoker = false)
as
select
  settings.business_name,
  settings.subtitle,
  settings.tagline,
  settings.logo_url,
  asset.canonical_public_url as hero_image_url,
  settings.public_whatsapp,
  settings.public_phone,
  settings.public_email,
  settings.general_location,
  settings.business_hours,
  settings.office_address,
  settings.office_maps_url,
  settings.timezone,
  settings.currency
from public.public_site_settings as settings
left join public.media_assets as asset
  on asset.id = settings.hero_asset_id
  and asset.deleted_at is null
  and asset.processing_status = 'ready'
  and asset.public_bucket = 'public-media'
  and asset.canonical_public_url is not null
  and asset.public_path is not null;

alter view public.public_site_config owner to postgres;
revoke all on public.public_site_config from public;
grant select on public.public_site_config to anon, authenticated;

-- Anonymous access is narrowed to the explicit public projection above.
-- Opening the base table directly would expose every settings column, so the
-- public surface is exclusively the view. Staff keep read-only access to the
-- base row and only administrators may mutate it (existing policies).
drop policy if exists public_site_settings_read on public.public_site_settings;
revoke select on public.public_site_settings from anon;

commit;