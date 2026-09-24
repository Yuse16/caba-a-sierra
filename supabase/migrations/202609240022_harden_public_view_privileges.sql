begin;

revoke all on public.public_cabins, public.public_promotions, public.public_site_config from public;
revoke all on public.public_cabins, public.public_promotions, public.public_site_config from anon, authenticated;

grant select on public.public_cabins, public.public_promotions, public.public_site_config to anon, authenticated, service_role;

commit;
