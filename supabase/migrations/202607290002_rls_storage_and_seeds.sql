begin;

create or replace function private.is_active_staff()
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and is_active
  );
$$;
create or replace function private.has_admin_role(required_role public.admin_role)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = (select auth.uid()) and is_active and role = required_role
  );
$$;
revoke all on function private.is_active_staff() from public;
revoke all on function private.has_admin_role(public.admin_role) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_active_staff() to authenticated;
grant execute on function private.has_admin_role(public.admin_role) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'admin_profiles','cabins','services','cabin_services','categories','cabin_categories','media_assets','cabin_images',
    'promotions','promotion_images','owners','owner_contacts','cabin_owner_assignments','customers','booking_inquiries',
    'availability_entries','reservations','internal_notes','public_site_settings','business_settings','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.cabins, public.services, public.cabin_services, public.categories, public.cabin_categories,
  public.cabin_images, public.promotions, public.promotion_images, public.public_site_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on public.owners, public.owner_contacts, public.cabin_owner_assignments, public.customers,
  public.booking_inquiries, public.availability_entries, public.reservations, public.internal_notes,
  public.business_settings, public.audit_logs, public.admin_profiles, public.media_assets from anon;

create policy cabins_public_read on public.cabins for select to anon
  using (publication_state = 'published' and deleted_at is null);
create policy services_public_read on public.services for select to anon using (is_active);
create policy cabin_services_public_read on public.cabin_services for select to anon
  using (exists (select 1 from public.cabins where cabins.id = cabin_services.cabin_id and cabins.publication_state = 'published' and cabins.deleted_at is null));
create policy categories_public_read on public.categories for select to anon using (is_active);
create policy cabin_categories_public_read on public.cabin_categories for select to anon
  using (exists (select 1 from public.cabins where cabins.id = cabin_categories.cabin_id and cabins.publication_state = 'published' and cabins.deleted_at is null));
create policy cabin_images_public_read on public.cabin_images for select to anon
  using (public_url is not null and deleted_at is null and exists (select 1 from public.cabins where cabins.id = cabin_images.cabin_id and cabins.publication_state = 'published' and cabins.deleted_at is null));
create policy promotions_public_read on public.promotions for select to anon
  using (publication_state = 'published' and deleted_at is null and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date));
create policy promotion_images_public_read on public.promotion_images for select to anon
  using (public_url is not null and deleted_at is null and exists (select 1 from public.promotions where promotions.id = promotion_images.promotion_id and promotions.publication_state = 'published' and promotions.deleted_at is null and (promotions.starts_on is null or promotions.starts_on <= current_date) and (promotions.ends_on is null or promotions.ends_on >= current_date)));
create policy public_site_settings_read on public.public_site_settings for select to anon using (true);

create policy profiles_self_read on public.admin_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_admin_all on public.admin_profiles for all to authenticated
  using ((select private.has_admin_role('admin'))) with check ((select private.has_admin_role('admin')));

do $$
declare table_name text;
begin
  foreach table_name in array array['cabins','services','cabin_services','categories','cabin_categories','media_assets','cabin_images','promotions','promotion_images'] loop
    execute format('create policy %I_staff_select on public.%I for select to authenticated using ((select private.is_active_staff()))', table_name, table_name);
    execute format('create policy %I_staff_insert on public.%I for insert to authenticated with check ((select private.is_active_staff()))', table_name, table_name);
    execute format('create policy %I_staff_update on public.%I for update to authenticated using ((select private.is_active_staff())) with check ((select private.is_active_staff()))', table_name, table_name);
    execute format('create policy %I_admin_delete on public.%I for delete to authenticated using ((select private.has_admin_role(''admin'')))', table_name, table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['owners','owner_contacts','cabin_owner_assignments','customers','booking_inquiries','availability_entries','reservations','internal_notes','business_settings','audit_logs'] loop
    execute format('create policy %I_admin_all on public.%I for all to authenticated using ((select private.has_admin_role(''admin''))) with check ((select private.has_admin_role(''admin'')))', table_name, table_name);
  end loop;
end $$;
create policy public_settings_staff_write on public.public_site_settings for all to authenticated
  using ((select private.is_active_staff())) with check ((select private.is_active_staff()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('admin-media', 'admin-media', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('public-media', 'public-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy admin_media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'admin-media' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.is_active_staff()));
create policy admin_media_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'admin-media' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.has_admin_role('admin'))));
create policy admin_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'admin-media' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.has_admin_role('admin'))));

insert into public.categories (code, name, display_order) values
  ('parejas','Para parejas',1),('familiar','Familiar',2),('grupos','Grupos',3),
  ('chimenea','Con chimenea',4),('pet-friendly','Pet friendly',5),('bosque','Cerca del bosque',6)
on conflict (code) do update set name = excluded.name, display_order = excluded.display_order;
insert into public.services (code, name, display_order) values
  ('chimenea','Chimenea',1),('wifi','WiFi',2),('asador','Asador',3),('cocina','Cocina',4),
  ('vista','Vista',5),('terraza','Terraza',6),('jacuzzi','Jacuzzi',7)
on conflict (code) do update set name = excluded.name, display_order = excluded.display_order;
insert into public.public_site_settings (id) values (true) on conflict (id) do nothing;
insert into public.business_settings (id) values (true) on conflict (id) do nothing;

commit;
