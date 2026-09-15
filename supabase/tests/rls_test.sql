begin;

create extension if not exists pgtap with schema extensions;

select plan(167);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.cabins'::regclass),
  'cabins has RLS enabled'
);
select ok(
  (select relforcerowsecurity from pg_class where oid = 'public.cabins'::regclass),
  'cabins forces RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.owners'::regclass),
  'owners has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.admin_profiles'::regclass),
  'admin profiles has RLS enabled'
);

select is(
  (select public from storage.buckets where id = 'admin-media'),
  false,
  'admin media bucket is private'
);
select is(
  (select public from storage.buckets where id = 'public-media'),
  true,
  'public media bucket is public'
);
select is(
  (select file_size_limit from storage.buckets where id = 'admin-media'),
  5242880::bigint,
  'admin media bucket enforces five megabytes'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'public_cabins'
      and column_name in ('legacy_id', 'created_by', 'updated_by', 'published_at')
  ),
  'public cabin contract excludes administrative columns'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'public_promotions'
      and column_name in ('legacy_id', 'created_by', 'updated_by', 'created_at', 'updated_at')
  ),
  'public promotion contract excludes administrative columns'
);
select throws_ok(
  $$insert into public.cabins (slug, name, contact_whatsapp) values ('telefono-invalido', 'Teléfono inválido', '123')$$,
  '23514',
  null,
  'cabin contact WhatsApp rejects invalid numbers'
);
select ok(
  (select count(*) = 2 from information_schema.columns
    where table_schema = 'public' and table_name = 'cabin_services'
      and column_name in ('created_at', 'updated_at')),
  'cabin service links have uniform timestamps'
);
select ok(
  (select count(*) = 2 from information_schema.columns
    where table_schema = 'public' and table_name = 'cabin_categories'
      and column_name in ('created_at', 'updated_at')),
  'cabin category links have uniform timestamps'
);
select ok(
  exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cabin_images' and column_name = 'updated_at'),
  'cabin images have an updated timestamp'
);
select ok(
  exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'promotion_images' and column_name = 'updated_at'),
  'promotion images have an updated timestamp'
);

insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'editor@example.invalid', 'authenticated', 'authenticated', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'admin@example.invalid', 'authenticated', 'authenticated', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'inactive@example.invalid', 'authenticated', 'authenticated', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'unknown@example.invalid', 'authenticated', 'authenticated', now(), now());

insert into public.admin_profiles (user_id, display_name, role, is_active, disabled_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Editor QA', 'editor', true, null),
  ('10000000-0000-0000-0000-000000000002', 'Admin QA', 'admin', true, null),
  ('10000000-0000-0000-0000-000000000003', 'Inactive QA', 'editor', false, now());

insert into public.cabins (id, slug, name, publication_state)
values
  ('20000000-0000-0000-0000-000000000001', 'publicada-qa', 'Publicada QA', 'published'),
  ('20000000-0000-0000-0000-000000000002', 'borrador-qa', 'Borrador QA', 'draft'),
  ('20000000-0000-0000-0000-000000000003', 'oculta-qa', 'Oculta QA', 'hidden'),
  ('20000000-0000-0000-0000-000000000005', 'asset-staging-qa', 'Asset staging QA', 'published'),
  ('20000000-0000-0000-0000-000000000006', 'sin-galeria-qa', 'Sin galería QA', 'published'),
  ('20000000-0000-0000-0000-000000000007', 'galeria-borrador-qa', 'Galería borrador QA', 'draft');

-- Aísla el universo que exige reorder_promotions sin alterar datos locales: toda
-- la suite corre dentro de esta transacción y termina con rollback.
update public.promotions set deleted_at = timezone('utc', now()) where deleted_at is null;

insert into public.promotions (id, name, publication_state, starts_on, ends_on)
values
  ('30000000-0000-0000-0000-000000000001', 'Activa QA', 'published', current_date - 1, current_date + 1),
  ('30000000-0000-0000-0000-000000000002', 'Futura QA', 'published', current_date + 1, current_date + 2),
  ('30000000-0000-0000-0000-000000000003', 'Borrador QA', 'draft', null, null);
insert into public.promotions (id, name, publication_state, deleted_at)
values ('30000000-0000-0000-0000-000000000004', 'Eliminada QA', 'draft', now());

insert into public.media_assets (
  id, source_bucket, source_path, public_bucket, public_path, canonical_public_url, original_name,
  mime_type, extension, byte_size, width, height, sha256, processing_status
)
values
  (
    '50000000-0000-0000-0000-000000000001', 'admin-media', 'qa/cabins/staging/cabin.webp',
    'public-media', 'qa/cabins/cabin.webp', 'https://qa.supabase.co/storage/v1/object/public/public-media/qa/cabins/cabin.webp', 'cabin.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('a', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000002', 'admin-media', 'qa/promotions/staging/promotion.webp',
    'public-media', 'qa/promotions/promotion.webp', null, 'promotion.webp', 'image/webp', 'webp', 100, 1200, 630,
    repeat('b', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000003', 'admin-media', 'qa/cabins/staging/staging.webp',
    null, null, null, 'staging.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('c', 64), 'staging'
  ),
  (
    '50000000-0000-0000-0000-000000000004', 'admin-media', 'qa/cabins/staging/private.webp',
    null, null, null, 'private.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('d', 64), 'processing'
  ),
  (
    '50000000-0000-0000-0000-000000000006', 'admin-media', 'qa/cabins/staging/gallery-a.webp',
    'public-media', 'qa/cabins/gallery-a.webp', 'https://qa.supabase.co/storage/v1/object/public/public-media/qa/cabins/gallery-a.webp', 'gallery-a.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('e', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000007', 'admin-media', 'qa/cabins/staging/gallery-b.webp',
    'public-media', 'qa/cabins/gallery-b.webp', 'https://qa.supabase.co/storage/v1/object/public/public-media/qa/cabins/gallery-b.webp', 'gallery-b.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('f', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000008', 'admin-media', 'qa/cabins/staging/gallery-c.webp',
    'public-media', 'qa/cabins/gallery-c.webp', 'https://qa.supabase.co/storage/v1/object/public/public-media/qa/cabins/gallery-c.webp', 'gallery-c.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('1', 64), 'ready'
  );

insert into public.cabin_images (cabin_id, asset_id, public_url, alt_text, is_cover)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'https://example.invalid/cabin.webp',
    'Cabaña publicada QA',
    true
  );

insert into public.promotion_images (promotion_id, asset_id, public_url, alt_text)
values (
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  'https://example.invalid/promotion.webp',
  'Promoción activa QA'
);

insert into public.owners (id, name)
values ('40000000-0000-0000-0000-000000000001', 'Propietario privado QA');
insert into public.customers(id,name,phone_display,phone_e164) values('61000000-0000-0000-0000-000000000001','Cliente CRM QA','844 555 0101','+528445550101');
insert into public.booking_inquiries(id,cabin_id,customer_id,check_in,check_out,guests,message)
values('71000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000001',current_date+100,current_date+103,75,'Solicitud CRM QA');

insert into public.cabin_services (cabin_id, service_id)
select '20000000-0000-0000-0000-000000000001', service.id
from public.services as service where service.code = 'wifi';
insert into public.cabin_categories (cabin_id, category_id)
select '20000000-0000-0000-0000-000000000001', category.id
from public.categories as category where category.code = 'familiar';

set local role anon;
select is((select count(*) from public.public_cabins), 1::bigint, 'anonymous sees only published cabins through the public contract');
select is((select name from public.public_cabins), 'Publicada QA', 'anonymous sees the expected published cabin');
select is((select count(*) from public.public_promotions), 1::bigint, 'anonymous sees only active published promotions through the public contract');
select is((select name from public.public_promotions), 'Activa QA', 'anonymous sees the expected active promotion');
select is(
  (select count(*) from public.public_cabins where id = '20000000-0000-0000-0000-000000000005'),
  0::bigint,
  'anonymous cannot see a published cabin without a ready gallery'
);
select is(
  (select count(*) from public.public_cabins where id = '20000000-0000-0000-0000-000000000006'),
  0::bigint,
  'anonymous cannot see another published cabin without a ready gallery'
);
select is((select count(*) from public.public_site_config), 1::bigint, 'anonymous can read public site config projection');
select is(
  (select business_name from public.public_site_config where business_name is not null),
  'DUPEZ',
  'anonymous reads the DUPEZ brand from the public projection'
);
select is(
  (select public_whatsapp from public.public_site_config where public_whatsapp is not null),
  '528444556929',
  'anonymous reads the official DUPEZ WhatsApp number from the public projection'
);
select throws_ok(
  $$select count(*) from public.public_site_settings$$,
  '42501',
  null,
  'anonymous cannot read the base settings row directly'
);
select throws_ok(
  $$select count(*) from public.cabins$$,
  '42501',
  null,
  'anonymous cannot query the administrative cabins table directly'
);
select throws_ok(
  $$select count(*) from public.promotions$$,
  '42501',
  null,
  'anonymous cannot query the administrative promotions table directly'
);
select throws_ok(
  $$select count(*) from public.owners$$,
  '42501',
  null,
  'anonymous cannot read owners'
);
select throws_ok($$select count(*) from public.inquiry_events$$,'42501',null,'anonymous cannot read inquiry history');
select throws_ok(
  $$insert into public.cabins (slug, name) values ('anon-write', 'Anon write')$$,
  '42501',
  null,
  'anonymous cannot create cabins'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.cabins), 0::bigint, 'authenticated user without staff profile sees no cabins');
select throws_ok(
  $$insert into public.cabins (slug, name) values ('unknown-write', 'Unknown write')$$,
  '42501',
  null,
  'authenticated user without staff profile cannot create cabins'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.cabins), 0::bigint, 'inactive staff sees no cabins');

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.cabins), 6::bigint, 'active editor can read administrative cabins');
select is(
  (select business_name from public.public_site_settings where id),
  'DUPEZ',
  'active editor can read public settings'
);
select lives_ok(
  $$update public.public_site_settings set business_name = 'Editor no autorizado' where id$$,
  'editor settings update is safely filtered by RLS'
);
select is(
  (select business_name from public.public_site_settings where id),
  'DUPEZ',
  'editor cannot change public settings'
);
select is((select count(*) from public.audit_logs), 0::bigint, 'editor cannot read audit logs');
select lives_ok(
  $$insert into public.cabins (id, slug, name, created_by, updated_by) values (
    '20000000-0000-0000-0000-000000000004', 'editor-write', 'Editor write',
    '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'
  )$$,
  'active editor can create cabins'
);
select is(
  (select created_by from public.cabins where id = '20000000-0000-0000-0000-000000000004'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'inserted cabin author is forced to auth.uid'
);
select is(
  (select updated_by from public.cabins where id = '20000000-0000-0000-0000-000000000004'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'inserted cabin updater is forced to auth.uid'
);
select lives_ok(
  $$update public.cabins set
      name = 'Editor updated',
      created_by = '10000000-0000-0000-0000-000000000002',
      updated_by = '10000000-0000-0000-0000-000000000002'
    where id = '20000000-0000-0000-0000-000000000004'$$,
  'active editor can update cabins'
);
select is(
  (select created_by from public.cabins where id = '20000000-0000-0000-0000-000000000004'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'original cabin author cannot be overwritten'
);
select is(
  (select updated_by from public.cabins where id = '20000000-0000-0000-0000-000000000004'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'updated cabin actor is forced to auth.uid'
);
select lives_ok(
  $$delete from public.cabins where id = '20000000-0000-0000-0000-000000000004'$$,
  'an editor delete is safely filtered by RLS'
);
select is(
  (select count(*) from public.cabins where id = '20000000-0000-0000-0000-000000000004'),
  1::bigint,
  'editor cannot delete cabins'
);
select is(
  (select count(*) from public.owners),
  0::bigint,
  'editor cannot read private owner records'
);
select is((select count(*) from public.inquiry_events),0::bigint,'editor cannot read inquiry history');
select throws_ok(
  $$update public.cabins set deleted_at = now()
    where id = '20000000-0000-0000-0000-000000000002'$$,
  '42501',
  'SOFT_DELETE_REQUIRES_ADMIN',
  'editor cannot soft-delete a cabin through the Data API'
);
select lives_ok(
  $$update public.media_assets set deleted_at = now()
    where id = '50000000-0000-0000-0000-000000000001'$$,
  'editor deletion of another uploader asset is safely filtered by RLS'
);
select is(
  (select deleted_at from public.media_assets where id = '50000000-0000-0000-0000-000000000001'),
  null::timestamptz,
  'editor cannot soft-delete a media asset owned by another actor'
);
select lives_ok(
  $$insert into public.media_assets (
      id, source_bucket, source_path, public_bucket, public_path, original_name,
      mime_type, extension, byte_size, width, height, sha256, processing_status
    ) values (
      '50000000-0000-0000-0000-000000000005', 'admin-media', 'editor/cabins/staging/own.webp',
      'public-media', 'editor/cabins/own.webp', 'own.webp', 'image/webp', 'webp', 100, 1200, 800,
      repeat('c', 64), 'staging'
    )$$,
  'editor can register an uploaded media asset'
);
select is(
  (select uploaded_by from public.media_assets where id = '50000000-0000-0000-0000-000000000005'),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'media asset author is forced to the authenticated editor'
);
select throws_ok(
  $$update public.media_assets set processing_status = 'ready'
    where id = '50000000-0000-0000-0000-000000000005'$$,
  '42501',
  null,
  'editor cannot bypass the server-only media pipeline'
);
select lives_ok(
  $$update public.media_assets set processing_status = 'failed'
    where id = '50000000-0000-0000-0000-000000000001'$$,
  'editor lifecycle update of another uploader asset is safely filtered by RLS'
);
select is(
  (select processing_status::text from public.media_assets where id = '50000000-0000-0000-0000-000000000001'),
  'ready',
  'editor cannot mutate a media asset owned by another actor'
);
select lives_ok(
  $$insert into public.media_assets (
      id, source_bucket, source_path, public_bucket, public_path, original_name,
      mime_type, extension, byte_size, width, height, sha256, processing_status
    ) values (
      '50000000-0000-0000-0000-000000000009', 'admin-media',
      '10000000-0000-0000-0000-000000000001/promotions/staging/promo-editor.webp',
      'public-media', '10000000-0000-0000-0000-000000000001/promotions/promo-editor.webp',
      'promo-editor.webp', 'image/webp', 'webp', 100, 1200, 630, repeat('9', 64), 'staging'
    )$$,
  'existing promotion flow can register a staging asset with its public path'
);
select lives_ok(
  $$update public.media_assets set processing_status = 'ready'
    where id = '50000000-0000-0000-0000-000000000009'$$,
  'existing promotion flow can finalize its own media asset'
);
select ok(
  (select processing_status = 'ready' and canonical_public_url is null
   from public.media_assets where id = '50000000-0000-0000-0000-000000000009'),
  'promotion finalization does not require the cabin-only canonical URL contract'
);
select lives_ok(
  $$insert into public.promotion_images (promotion_id, asset_id, public_url, alt_text)
    values (
      '30000000-0000-0000-0000-000000000003',
      '50000000-0000-0000-0000-000000000009',
      'https://qa.supabase.co/storage/v1/object/public/public-media/10000000-0000-0000-0000-000000000001/promotions/promo-editor.webp',
      'Promoción editor QA'
    )$$,
  'existing promotion flow can associate the finalized asset'
);
select is(
  (select asset_id from public.promotion_images
   where promotion_id = '30000000-0000-0000-0000-000000000003' and deleted_at is null),
  '50000000-0000-0000-0000-000000000009'::uuid,
  'promotion association remains persisted'
);
select throws_ok(
  $$update public.cabin_images set deleted_at = now()
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'editor cannot mutate cabin image associations outside the atomic RPC'
);
select throws_ok(
  $$update public.cabin_images set deleted_at = null
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'editor cannot restore cabin image associations outside the atomic RPC'
);
select throws_ok(
  $$update public.promotions set deleted_at = now()
    where id = '30000000-0000-0000-0000-000000000003'$$,
  '42501',
  'SOFT_DELETE_REQUIRES_ADMIN',
  'editor cannot soft-delete a promotion through the Data API'
);
select lives_ok(
  $$update public.promotion_images set deleted_at = now()
    where promotion_id = '30000000-0000-0000-0000-000000000001'$$,
  'editor can soft-delete a promotion image association'
);
select lives_ok(
  $$update public.promotion_images set deleted_at = null
    where promotion_id = '30000000-0000-0000-0000-000000000001'$$,
  'editor can restore a promotion image association'
);
select throws_ok(
  $$update public.promotions set deleted_at = null
    where id = '30000000-0000-0000-0000-000000000004'$$,
  '42501',
  'SOFT_DELETE_REQUIRES_ADMIN',
  'editor cannot restore soft-deleted content through the Data API'
);
select lives_ok(
  $$delete from public.cabin_services
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  'editor can delete cabin service bridge rows for repository replacement'
);
select is(
  (select count(*) from public.cabin_services
    where cabin_id = '20000000-0000-0000-0000-000000000001'),
  0::bigint,
  'editor cabin service bridge deletion persists'
);
select lives_ok(
  $$delete from public.cabin_categories
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  'editor can delete cabin category bridge rows for repository replacement'
);
select is(
  (select count(*) from public.cabin_categories
    where cabin_id = '20000000-0000-0000-0000-000000000001'),
  0::bigint,
  'editor cabin category bridge deletion persists'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('admin-media', '10000000-0000-0000-0000-000000000001/cabins/staging/editor.webp', '10000000-0000-0000-0000-000000000001')$$,
  'editor can upload only into own admin-media prefix'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('admin-media', '10000000-0000-0000-0000-000000000002/cabins/staging/other.webp', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'editor cannot upload into another user prefix'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('admin-media', '10000000-0000-0000-0000-000000000001/invalid/staging/invalid.webp', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'editor cannot upload into an unapproved admin-media scope'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'admin-media'),
  1::bigint,
  'editor reads own private upload'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('public-media', '10000000-0000-0000-0000-000000000001/cabins/editor.webp', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'editor cannot write a public derivative outside the server pipeline'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('public-media', '10000000-0000-0000-0000-000000000001/promotions/editor.webp', '10000000-0000-0000-0000-000000000001')$$,
  'existing promotion flow retains its authenticated public-media upload'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('public-media', '10000000-0000-0000-0000-000000000002/cabins/other.webp', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'editor cannot upload a public derivative into another user prefix'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('public-media', '10000000-0000-0000-0000-000000000001/invalid/invalid.webp', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'editor cannot upload a public derivative into an unapproved scope'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'public-media'),
  1::bigint,
  'only the allowed promotion derivative was written by the editor'
);
select lives_ok(
  $$select public.reorder_promotions(array[
    '30000000-0000-0000-0000-000000000003'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid
  ])$$,
  'editor can reorder promotions atomically'
);
select is(
  (select display_order from public.promotions where id = '30000000-0000-0000-0000-000000000003'),
  1,
  'promotion reorder persists the requested position'
);
select throws_ok(
  $$select public.reorder_promotions(array[
    '30000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid
  ])$$,
  '22023',
  'DUPLICATE_ID',
  'promotion reorder rejects duplicate IDs'
);
select throws_ok(
  $$select public.reorder_promotions(array[
    '30000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid
  ])$$,
  '22023',
  'INCOMPLETE_ORDER',
  'promotion reorder rejects a valid but incomplete live set'
);

select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":true,"alt_text":"Foto A"},
      {"asset_id":"50000000-0000-0000-0000-000000000007","is_cover":false,"alt_text":"Foto B"},
      {"asset_id":"50000000-0000-0000-0000-000000000008","is_cover":false,"alt_text":"Foto C"}
    ]'::jsonb
  )$$,
  'editor synchronizes three cabin images atomically'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  3::bigint,
  'all three gallery associations persist'
);
select is(
  (select array_agg(position order by position) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  array[1,2,3],
  'gallery positions are contiguous and preserve request order'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null and is_cover),
  1::bigint,
  'the synchronized gallery has exactly one cover'
);
select ok(
  (select bool_and(image.public_url = asset.canonical_public_url)
   from public.cabin_images as image join public.media_assets as asset on asset.id = image.asset_id
   where image.cabin_id = '20000000-0000-0000-0000-000000000007' and image.deleted_at is null),
  'association URLs are forced from canonical ready assets'
);
select throws_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":true},
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":false}
    ]'::jsonb
  )$$,
  '22023',
  'DUPLICATE_ASSET_ID',
  'gallery synchronization rejects duplicate asset IDs'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  3::bigint,
  'a rejected duplicate request leaves the previous gallery intact'
);
select throws_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[{"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":false}]'::jsonb
  )$$,
  '22023',
  'EXACTLY_ONE_COVER_REQUIRED',
  'a nonempty gallery requires exactly one cover'
);
select throws_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[{"asset_id":"50000000-0000-0000-0000-000000000003","is_cover":true}]'::jsonb
  )$$,
  '23514',
  'MEDIA_ASSET_NOT_READY',
  'gallery synchronization rejects a staging asset'
);
select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":false,"alt_text":"Foto A"},
      {"asset_id":"50000000-0000-0000-0000-000000000007","is_cover":true,"alt_text":"Foto B"},
      {"asset_id":"50000000-0000-0000-0000-000000000008","is_cover":false,"alt_text":"Foto C"}
    ]'::jsonb
  )$$,
  'cover changes without replacing the gallery'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  3::bigint,
  'changing cover preserves all three images'
);
select is(
  (select asset_id from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null and is_cover),
  '50000000-0000-0000-0000-000000000007'::uuid,
  'the requested image becomes the only cover'
);
select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000007","is_cover":true},
      {"asset_id":"50000000-0000-0000-0000-000000000008","is_cover":false}
    ]'::jsonb
  )$$,
  'one image can be removed without replacing the others'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  2::bigint,
  'removing one image leaves two active associations'
);
select ok(
  (select deleted_at is not null from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and asset_id = '50000000-0000-0000-0000-000000000006'),
  'the removed association is soft-deleted'
);
select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000008","is_cover":false},
      {"asset_id":"50000000-0000-0000-0000-000000000007","is_cover":true},
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":false}
    ]'::jsonb
  )$$,
  'a removed image can be restored and reordered atomically'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  3::bigint,
  'adding the image again restores a three-image gallery'
);
select is(
  (select array_agg(asset_id order by position) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  array[
    '50000000-0000-0000-0000-000000000008'::uuid,
    '50000000-0000-0000-0000-000000000007'::uuid,
    '50000000-0000-0000-0000-000000000006'::uuid
  ],
  'restored gallery order matches the last complete request'
);
update public.cabins
set publication_state = 'published', published_at = timezone('utc', now())
where id = '20000000-0000-0000-0000-000000000007';
select is(
  (select image_url from public.public_cabins where id = '20000000-0000-0000-0000-000000000007'),
  'https://qa.supabase.co/storage/v1/object/public/public-media/qa/cabins/gallery-b.webp',
  'public cabin image_url is the explicit cover, independent of gallery order'
);
select is(
  (select jsonb_array_length(gallery) from public.public_cabins where id = '20000000-0000-0000-0000-000000000007'),
  3,
  'public cabin contract exposes the complete gallery JSON'
);
select throws_ok(
  $$select * from public.sync_cabin_images('20000000-0000-0000-0000-000000000007', '[]'::jsonb)$$,
  '23514',
  'PUBLISHED_CABIN_REQUIRES_IMAGE',
  'a published cabin cannot be emptied'
);
update public.cabins
set publication_state = 'draft', published_at = null
where id = '20000000-0000-0000-0000-000000000007';
select lives_ok(
  $$select * from public.sync_cabin_images('20000000-0000-0000-0000-000000000007', '[]'::jsonb)$$,
  'a draft cabin can intentionally save an empty gallery'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  0::bigint,
  'empty draft synchronization soft-deletes every former association'
);
select throws_ok(
  $$select public.archive_cabin_with_images('20000000-0000-0000-0000-000000000007')$$,
  '42501',
  'FORBIDDEN',
  'an editor cannot archive a cabin through the atomic admin RPC'
);
select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000007',
    '[
      {"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":false},
      {"asset_id":"50000000-0000-0000-0000-000000000007","is_cover":true},
      {"asset_id":"50000000-0000-0000-0000-000000000008","is_cover":false}
    ]'::jsonb
  )$$,
  'gallery is restored before testing atomic archive cleanup'
);
select lives_ok(
  $$select * from public.sync_cabin_images(
    '20000000-0000-0000-0000-000000000002',
    '[{"asset_id":"50000000-0000-0000-0000-000000000006","is_cover":true}]'::jsonb
  )$$,
  'a ready asset may be shared by another cabin'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.owners), 1::bigint, 'admin can read owners');
select lives_ok(
  $$update public.public_site_settings set business_name = business_name where id$$,
  'admin can update public settings'
);
select lives_ok(
  $$insert into public.owners (name) values ('Propietario creado por admin')$$,
  'admin can create owners'
);
select lives_ok(
  $$delete from public.cabins where id = '20000000-0000-0000-0000-000000000004'$$,
  'admin can delete cabins'
);
select is(
  (select count(*) from storage.objects where bucket_id = 'admin-media'),
  1::bigint,
  'admin can read another user private upload'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where actor_id = '10000000-0000-0000-0000-000000000002'
      and table_name = 'public.public_site_settings' and action = 'update'
  ),
  'audit log captures an administrator settings update'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where actor_id = '10000000-0000-0000-0000-000000000001'
      and table_name = 'public.cabins' and action in ('insert', 'update')
  ),
  'audit log captures the authenticated editor actor'
);
select lives_ok(
  $$update public.promotions set deleted_at = now()
    where id = '30000000-0000-0000-0000-000000000002'$$,
  'admin can soft-delete content'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where actor_id = '10000000-0000-0000-0000-000000000002'
      and table_name = 'public.promotions'
      and record_id = '30000000-0000-0000-0000-000000000002'
      and action = 'update'
      and before_data->>'deleted_at' is null
      and after_data->>'deleted_at' is not null
  ),
  'audit log records the administrator soft-delete actor and transition'
);
select lives_ok(
  $$update public.promotions set deleted_at = null
    where id = '30000000-0000-0000-0000-000000000002'$$,
  'admin can restore soft-deleted content'
);
select ok(
  exists (
    select 1 from public.audit_logs
    where actor_id = '10000000-0000-0000-0000-000000000002'
      and table_name = 'public.promotions'
      and record_id = '30000000-0000-0000-0000-000000000002'
      and action = 'update'
      and before_data->>'deleted_at' is not null
      and after_data->>'deleted_at' is null
  ),
  'audit log records the administrator restore actor and transition'
);
select throws_ok(
  $$update public.audit_logs set action = action where id = (select min(id) from public.audit_logs)$$,
  '42501',
  null,
  'admin cannot update audit logs through the Data API role'
);
select throws_ok(
  $$delete from public.audit_logs where id = (select min(id) from public.audit_logs)$$,
  '42501',
  null,
  'admin cannot delete audit logs through the Data API role'
);

select lives_ok(
  $$select public.archive_cabin_with_images('20000000-0000-0000-0000-000000000007')$$,
  'admin archives the cabin and gallery through one transaction'
);
select ok(
  (select deleted_at is not null and publication_state = 'draft'
   from public.cabins where id = '20000000-0000-0000-0000-000000000007'),
  'atomic archive soft-deletes and unpublishes the cabin'
);
select is(
  (select count(*) from public.cabin_images
   where cabin_id = '20000000-0000-0000-0000-000000000007' and deleted_at is null),
  3::bigint,
  'atomic archive preserves every gallery association'
);
select is(
  (select count(*) from public.cabin_images where cabin_id = '20000000-0000-0000-0000-000000000007' and is_cover and deleted_at is null),
  1::bigint,
  'atomic archive preserves the selected cover'
);
select is(
  (select count(*) from public.cabin_images
   where asset_id = '50000000-0000-0000-0000-000000000006' and deleted_at is null),
  2::bigint,
  'archive preserves both active gallery references for a shared asset'
);
select lives_ok(
  $$select public.restore_archived_cabin('20000000-0000-0000-0000-000000000007')$$,
  'admin restores an archived cabin'
);
select ok(
  (select deleted_at is null and publication_state = 'draft' from public.cabins where id = '20000000-0000-0000-0000-000000000007'),
  'restored cabin returns as a private draft'
);
select is((select count(*) from public.inquiry_events where inquiry_id='71000000-0000-0000-0000-000000000001' and event_type='received'),1::bigint,'new inquiry has one received event');
select lives_ok($$select public.add_inquiry_note('71000000-0000-0000-0000-000000000001','Nota privada CRM')$$,'admin adds an inquiry note atomically');
select is((select count(*) from public.internal_notes where inquiry_id='71000000-0000-0000-0000-000000000001'),1::bigint,'inquiry note persists privately');
select is((select count(*) from public.inquiry_events where inquiry_id='71000000-0000-0000-0000-000000000001' and event_type='note_added'),1::bigint,'note creates a business event');
select lives_ok($$select public.transition_booking_inquiry('71000000-0000-0000-0000-000000000001','contacted',1)$$,'admin transitions inquiry with expected version');
select is((select status::text from public.booking_inquiries where id='71000000-0000-0000-0000-000000000001'),'contacted','status transition persists');
select throws_ok($$select public.transition_booking_inquiry('71000000-0000-0000-0000-000000000001','pending',1)$$,'40001','STALE_WRITE','stale concurrent update is rejected');
select lives_ok($$select public.record_inquiry_contact_event('71000000-0000-0000-0000-000000000001','whatsapp_opened','{}')$$,'opening WhatsApp records an event');
select is((select status::text from public.booking_inquiries where id='71000000-0000-0000-0000-000000000001'),'contacted','opening WhatsApp does not change status');
select lives_ok($$select public.set_customer_commercial_status('61000000-0000-0000-0000-000000000001','inactive',(select version from public.customers where id='61000000-0000-0000-0000-000000000001'))$$,'admin sets customer commercial status');
select is((select commercial_status::text from public.customers where id='61000000-0000-0000-0000-000000000001'),'inactive','customer status remains separate from inquiry');
select lives_ok($$select public.add_customer_note('61000000-0000-0000-0000-000000000001','Nota privada de cliente')$$,'admin adds a private customer note');
select lives_ok(
  $$select public.sync_cabin_owner('20000000-0000-0000-0000-000000000007', jsonb_build_object(
    'name', 'Propietario transaccional QA', 'phone', '8442779001', 'whatsapp', '528442779001',
    'email', 'owner-transaction@example.invalid', 'preferred_contact', 'whatsapp',
    'notes', 'Nota interna QA', 'contact_hours', '09:00-18:00'
  ))$$,
  'admin synchronizes owner, contacts and assignment transactionally'
);
select is(
  (select o.name from public.owners o join public.cabin_owner_assignments a on a.owner_id = o.id
   where a.cabin_id = '20000000-0000-0000-0000-000000000007' and a.is_active and a.is_primary),
  'Propietario transaccional QA',
  'transactional owner synchronization activates the selected owner'
);
select lives_ok(
  $$select public.sync_cabin_owner('20000000-0000-0000-0000-000000000007', null)$$,
  'admin can explicitly remove the cabin owner assignment'
);
select is(
  (select count(*) from public.cabin_owner_assignments
   where cabin_id = '20000000-0000-0000-0000-000000000007' and is_active),
  0::bigint,
  'owner removal leaves no active assignment'
);

reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select lives_ok(
  $$select * from public.mark_orphaned_media_assets(timezone('utc', now()) + interval '1 second')$$,
  'service cleanup evaluates old unreferenced assets'
);
select is(
  (select processing_status::text from public.media_assets where id = '50000000-0000-0000-0000-000000000006'),
  'ready',
  'cleanup preserves an asset while any cabin still references it'
);
select ok(
  (select bool_and(processing_status = 'ready') from public.media_assets
   where id in ('50000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000008')),
  'cleanup preserves every asset referenced by an archived or restored gallery'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select * from public.sync_cabin_images('20000000-0000-0000-0000-000000000002', '[]'::jsonb)$$,
  'admin removes the final shared-asset reference from a draft cabin'
);

reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select lives_ok(
  $$select * from public.mark_orphaned_media_assets(timezone('utc', now()) + interval '1 second')$$,
  'cleanup runs again after the final reference is removed'
);
select is(
  (select processing_status::text from public.media_assets where id = '50000000-0000-0000-0000-000000000006'),
  'ready',
  'cleanup preserves the asset while the restored cabin still references it'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

insert into public.customers (id, name, phone_display, phone_e164)
values ('60000000-0000-0000-0000-000000000001', 'Cliente reserva QA', '844 123 4567', '+528441234567');
insert into public.availability_entries (id, cabin_id, check_in, check_out, kind, status)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '2030-01-10', '2030-01-13', 'reservation', 'active'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '2030-02-10', '2030-02-13', 'blocked', 'active'
  );
select throws_ok(
  $$insert into public.reservations (
      folio, cabin_id, customer_id, check_in, check_out, guests, adults, minors,
      nightly_price, estimated_total, status
    ) values (
      'QA-SIN-AVAIL', '20000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000001', '2030-01-10', '2030-01-13',
      2, 2, 0, 1000, 3000, 'held'
    )$$,
  '23514',
  'ACTIVE_AVAILABILITY_REQUIRED',
  'held reservation requires an availability entry'
);
select throws_ok(
  $$insert into public.reservations (
      folio, cabin_id, customer_id, availability_entry_id, check_in, check_out,
      guests, adults, minors, nightly_price, estimated_total, status
    ) values (
      'QA-FECHAS-DISTINTAS', '20000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001',
      '2030-01-10', '2030-01-14', 2, 2, 0, 1000, 4000, 'held'
    )$$,
  '23514',
  'RESERVATION_AVAILABILITY_MISMATCH',
  'reservation dates must match its availability entry'
);
select throws_ok(
  $$insert into public.reservations (
      folio, cabin_id, customer_id, availability_entry_id, check_in, check_out,
      guests, adults, minors, nightly_price, estimated_total, status
    ) values (
      'QA-TIPO-INVALIDO', '20000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
      '2030-02-10', '2030-02-13', 2, 2, 0, 1000, 3000, 'held'
    )$$,
  '23514',
  'RESERVATION_AVAILABILITY_MISMATCH',
  'reservation cannot use a blocked or maintenance entry'
);
select lives_ok(
  $$insert into public.reservations (
      id, folio, cabin_id, customer_id, availability_entry_id, check_in, check_out,
      guests, adults, minors, nightly_price, estimated_total, status
    ) values (
      '80000000-0000-0000-0000-000000000001', 'QA-VALIDA',
      '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
      '70000000-0000-0000-0000-000000000001', '2030-01-10', '2030-01-13',
      2, 2, 0, 1000, 3000, 'held'
    )$$,
  'held reservation accepts its matching active reservation entry'
);
select throws_ok(
  $$update public.availability_entries set status = 'released'
    where id = '70000000-0000-0000-0000-000000000001'$$,
  '23514',
  'AVAILABILITY_LINKED_TO_ACTIVE_RESERVATION',
  'active reservation availability cannot be released'
);
select throws_ok(
  $$insert into public.availability_entries (cabin_id, check_in, check_out, kind, status)
    values ('20000000-0000-0000-0000-000000000001', '2030-01-12', '2030-01-15', 'hold', 'active')$$,
  '23P01',
  null,
  'active availability periods cannot overlap for one cabin'
);
select throws_ok(
  $$delete from storage.objects where bucket_id = 'admin-media' and name = '10000000-0000-0000-0000-000000000001/cabins/staging/editor.webp'$$,
  '42501',
  null,
  'direct SQL storage deletion is blocked even when RLS permits the admin; the Storage API is required'
);

reset role;
select ok(
  not has_function_privilege('anon', 'public.create_website_booking_inquiry(uuid,text,text,text,date,date,integer,text,uuid)', 'EXECUTE'),
  'anonymous clients cannot execute the inquiry writer directly'
);
select ok(
  not has_function_privilege('authenticated', 'public.create_website_booking_inquiry(uuid,text,text,text,date,date,integer,text,uuid)', 'EXECUTE'),
  'authenticated clients cannot bypass the server inquiry flow'
);
select ok(
  has_function_privilege('service_role', 'public.create_website_booking_inquiry(uuid,text,text,text,date,date,integer,text,uuid)', 'EXECUTE'),
  'the server service role can execute the inquiry writer'
);

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select lives_ok(
  $$select public.create_website_booking_inquiry(
    '20000000-0000-0000-0000-000000000001', 'Cliente web real', '844 222 3344', '+528442223344',
    '2031-01-10', '2031-01-12', 1, 'Consulta pública QA', '90000000-0000-4000-8000-000000000001'
  )$$,
  'the server inquiry flow creates a real customer and inquiry atomically'
);
select is(
  (select count(*)::integer from public.booking_inquiries where idempotency_key = '90000000-0000-4000-8000-000000000001'),
  1,
  'the website inquiry is persisted exactly once'
);
select is(
  (select public.create_website_booking_inquiry(
    '20000000-0000-0000-0000-000000000001', 'Cliente web real', '844 222 3344', '+528442223344',
    '2031-01-10', '2031-01-12', 1, 'Consulta pública QA', '90000000-0000-4000-8000-000000000001'
  )),
  (select id from public.booking_inquiries where idempotency_key = '90000000-0000-4000-8000-000000000001'),
  'retrying the same idempotency key returns the original inquiry'
);
select is(
  (select count(*)::integer from public.inquiry_events events join public.booking_inquiries inquiry on inquiry.id = events.inquiry_id where inquiry.idempotency_key = '90000000-0000-4000-8000-000000000001' and events.event_type = 'received'),
  1,
  'idempotent retry does not duplicate the received event'
);
select throws_ok(
  $$select public.create_website_booking_inquiry(
    '20000000-0000-0000-0000-000000000001', 'Cliente web real', '844 222 3344', '+528442223344',
    '2031-01-11', '2031-01-13', 1, 'Consulta pública QA', '90000000-0000-4000-8000-000000000001'
  )$$,
  'P0001',
  'IDEMPOTENCY_KEY_REUSED',
  'reusing an idempotency key with a different payload is rejected'
);

reset role;
select throws_ok(
  $$update public.audit_logs set action = action where id = (select min(id) from public.audit_logs)$$,
  '55000',
  'AUDIT_LOGS_APPEND_ONLY',
  'append-only trigger blocks privileged audit mutation'
);
select * from finish();
rollback;
