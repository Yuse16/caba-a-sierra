begin;
drop trigger if exists cabins_derive_bed_total on public.cabins;
drop function if exists private.derive_cabin_bed_total();
commit;
