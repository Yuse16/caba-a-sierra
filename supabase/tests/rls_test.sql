begin;

create extension if not exists pgtap with schema extensions;

select plan(91);

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
  ('20000000-0000-0000-0000-000000000006', 'asset-privado-qa', 'Asset privado QA', 'published');

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
  id, source_bucket, source_path, public_bucket, public_path, original_name,
  mime_type, extension, byte_size, width, height, sha256, processing_status
)
values
  (
    '50000000-0000-0000-0000-000000000001', 'admin-media', 'qa/cabin.webp',
    'public-media', 'qa/cabin.webp', 'cabin.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('a', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000002', 'admin-media', 'qa/promotion.webp',
    'public-media', 'qa/promotion.webp', 'promotion.webp', 'image/webp', 'webp', 100, 1200, 630,
    repeat('b', 64), 'ready'
  ),
  (
    '50000000-0000-0000-0000-000000000003', 'admin-media', 'qa/staging.webp',
    'public-media', 'qa/staging.webp', 'staging.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('c', 64), 'staging'
  ),
  (
    '50000000-0000-0000-0000-000000000004', 'admin-media', 'qa/private.webp',
    'admin-media', 'qa/private.webp', 'private.webp', 'image/webp', 'webp', 100, 1200, 800,
    repeat('d', 64), 'ready'
  );

insert into public.cabin_images (cabin_id, asset_id, public_url, alt_text, is_cover)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'https://example.invalid/cabin.webp',
    'Cabaña publicada QA',
    true
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '50000000-0000-0000-0000-000000000003',
    'https://example.invalid/staging.webp',
    'Activo todavía en staging',
    true
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000004',
    'https://example.invalid/private.webp',
    'Activo todavía privado',
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
  'anonymous cannot see a cabin whose asset is not ready'
);
select is(
  (select count(*) from public.public_cabins where id = '20000000-0000-0000-0000-000000000006'),
  0::bigint,
  'anonymous cannot see a cabin whose asset is outside public-media'
);
select is((select count(*) from public.public_site_settings), 1::bigint, 'anonymous can read public settings');
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
select is((select count(*) from public.cabins), 5::bigint, 'active editor can read administrative cabins');
select is(
  (select business_name from public.public_site_settings where id),
  'Cabañas Sierra Norte',
  'active editor can read public settings'
);
select lives_ok(
  $$update public.public_site_settings set business_name = 'Editor no autorizado' where id$$,
  'editor settings update is safely filtered by RLS'
);
select is(
  (select business_name from public.public_site_settings where id),
  'Cabañas Sierra Norte',
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
select throws_ok(
  $$update public.cabins set deleted_at = now()
    where id = '20000000-0000-0000-0000-000000000002'$$,
  '42501',
  'SOFT_DELETE_REQUIRES_ADMIN',
  'editor cannot soft-delete a cabin through the Data API'
);
update public.media_assets set deleted_at = now()
where id = '50000000-0000-0000-0000-000000000001';
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
select lives_ok(
  $$update public.media_assets set processing_status = 'ready'
    where id = '50000000-0000-0000-0000-000000000005'$$,
  'editor can finalize an own media asset'
);
update public.media_assets set processing_status = 'failed'
where id = '50000000-0000-0000-0000-000000000001';
select is(
  (select processing_status::text from public.media_assets where id = '50000000-0000-0000-0000-000000000001'),
  'ready',
  'editor cannot mutate a media asset owned by another actor'
);
select lives_ok(
  $$update public.cabin_images set deleted_at = now()
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  'editor can soft-delete a cabin image association'
);
select lives_ok(
  $$update public.cabin_images set deleted_at = null
    where cabin_id = '20000000-0000-0000-0000-000000000001'$$,
  'editor can restore a cabin image association'
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
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('public-media', '10000000-0000-0000-0000-000000000001/cabins/editor.webp', '10000000-0000-0000-0000-000000000001')$$,
  'editor can upload a public derivative into an approved own prefix'
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
  'editor reads the public derivative created under own prefix'
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
select throws_ok(
  $$update public.audit_logs set action = action where id = (select min(id) from public.audit_logs)$$,
  '55000',
  'AUDIT_LOGS_APPEND_ONLY',
  'append-only trigger blocks privileged audit mutation'
);
select * from finish();
rollback;
