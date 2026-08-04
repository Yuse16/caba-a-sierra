begin;

-- Los uploads se ejecutan con la sesión real del administrador. La ruta debe
-- comenzar con su UUID y separar cabañas de promociones.
drop policy if exists admin_media_staff_insert on storage.objects;
create policy admin_media_staff_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'admin-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] in ('cabins', 'promotions')
    and (storage.foldername(name))[3] = 'staging'
    and (select private.is_active_staff())
  );

drop policy if exists public_media_staff_insert on storage.objects;
create policy public_media_staff_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] in ('cabins', 'promotions')
    and (select private.is_active_staff())
  );

drop policy if exists public_media_owner_read on storage.objects;
create policy public_media_owner_read on storage.objects for select to authenticated
  using (
    bucket_id = 'public-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.has_admin_role('admin')))
  );

drop policy if exists public_media_owner_delete on storage.objects;
create policy public_media_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.has_admin_role('admin')))
  );

-- Editors only move their own newly uploaded assets through staging/ready/delete.
-- Administrators may complete maintenance for any uploader.
drop policy if exists media_assets_staff_update on public.media_assets;
drop policy if exists media_assets_owner_update on public.media_assets;
create policy media_assets_owner_update on public.media_assets for update to authenticated
  using (
    (select private.is_active_staff())
    and (uploaded_by = (select auth.uid()) or (select private.has_admin_role('admin')))
  )
  with check (
    (select private.is_active_staff())
    and (uploaded_by = (select auth.uid()) or (select private.has_admin_role('admin')))
  );

commit;
