begin;
drop policy if exists media_assets_owner_update on public.media_assets;
drop policy if exists media_assets_staff_update on public.media_assets;
create policy media_assets_staff_update on public.media_assets for update to authenticated
  using ((select private.is_active_staff())) with check ((select private.is_active_staff()));
drop policy if exists public_media_owner_delete on storage.objects;
drop policy if exists public_media_owner_read on storage.objects;
drop policy if exists public_media_staff_insert on storage.objects;
drop policy if exists admin_media_staff_insert on storage.objects;
create policy admin_media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'admin-media' and (storage.foldername(name))[1] = (select auth.uid())::text and (select private.is_active_staff()));
commit;
