begin;
drop view if exists public.public_site_config;

-- Restore the pre-migration anonymous access to the base settings row
-- (policy + grant from migration 202607290002).
create policy public_site_settings_read on public.public_site_settings
  for select to anon using (true);
grant select on public.public_site_settings to anon;

alter table public.public_site_settings
  drop constraint if exists public_site_settings_hero_asset_fkey;
alter table public.public_site_settings
  drop column if exists subtitle,
  drop column if exists tagline,
  drop column if exists hero_asset_id,
  drop column if exists office_address,
  drop column if exists office_maps_url;

update public.public_site_settings set
  business_name = 'Cabañas Sierra Norte',
  public_whatsapp = '',
  public_phone = '',
  public_email = null,
  general_location = 'Arteaga, Coahuila, México',
  business_hours = '',
  timezone = 'America/Monterrey',
  currency = 'MXN'
where id;
commit;