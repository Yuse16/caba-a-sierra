begin;

drop policy if exists admin_media_staff_insert on storage.objects;
drop policy if exists admin_media_owner_read on storage.objects;
drop policy if exists admin_media_owner_delete on storage.objects;

-- Supabase protects Storage metadata from direct deletion. A migration owner may
-- opt in for this transaction only; targets remain restricted to project buckets.
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id in ('admin-media', 'public-media');
delete from storage.buckets where id in ('admin-media', 'public-media');

drop table if exists public.audit_logs;
drop table if exists public.business_settings;
drop table if exists public.public_site_settings;
drop table if exists public.internal_notes;
drop table if exists public.reservations;
drop table if exists public.availability_entries;
drop table if exists public.booking_inquiries;
drop table if exists public.customers;
drop table if exists public.cabin_owner_assignments;
drop table if exists public.owner_contacts;
drop table if exists public.owners;
drop table if exists public.promotion_images;
drop table if exists public.promotions;
drop table if exists public.cabin_images;
drop table if exists public.media_assets;
drop table if exists public.cabin_categories;
drop table if exists public.categories;
drop table if exists public.cabin_services;
drop table if exists public.services;
drop table if exists public.cabins;
drop table if exists public.admin_profiles;

drop function if exists private.has_admin_role(public.admin_role);
drop function if exists private.is_active_staff();
drop function if exists private.set_updated_at();
drop schema if exists private;

drop type if exists public.media_processing_status;
drop type if exists public.availability_status;
drop type if exists public.availability_kind;
drop type if exists public.reservation_status;
drop type if exists public.inquiry_status;
drop type if exists public.owner_contact_type;
drop type if exists public.preferred_contact_method;
drop type if exists public.publication_state;
drop type if exists public.admin_role;

commit;
