begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.admin_role as enum ('admin', 'editor');
create type public.publication_state as enum ('draft', 'published', 'hidden');
create type public.preferred_contact_method as enum ('whatsapp', 'phone', 'message', 'email');
create type public.owner_contact_type as enum ('phone', 'whatsapp', 'email', 'other');
create type public.inquiry_status as enum ('new', 'pending', 'contacted', 'available', 'unavailable', 'converted', 'closed');
create type public.reservation_status as enum ('new', 'pending', 'held', 'confirmed', 'cancelled', 'completed');
create type public.availability_kind as enum ('hold', 'reservation', 'blocked', 'maintenance');
create type public.availability_status as enum ('active', 'released');
create type public.media_processing_status as enum ('staging', 'processing', 'ready', 'failed', 'pending_delete', 'deleted');

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  disabled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((is_active and disabled_at is null) or (not is_active))
);

create table public.cabins (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  slug text not null,
  name text not null check (char_length(name) between 1 and 100),
  short_description text not null default '' check (char_length(short_description) <= 180),
  description text not null default '',
  location text not null default '',
  nightly_price numeric(12,2) not null default 0 check (nightly_price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= 0),
  currency char(3) not null default 'MXN',
  min_guests integer not null default 1 check (min_guests > 0),
  max_guests integer not null default 1 check (max_guests >= min_guests),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  beds integer not null default 0 check (beds >= 0),
  bathrooms numeric(4,1) not null default 0 check (bathrooms >= 0),
  check_in_time time not null default '15:00',
  check_out_time time not null default '11:00',
  accepts_pets boolean not null default false,
  cabin_type text not null default 'familiar',
  rules text[] not null default '{}',
  display_order integer not null default 1 check (display_order > 0),
  publication_state public.publication_state not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create unique index cabins_slug_active_key on public.cabins (lower(slug)) where deleted_at is null;
create index cabins_publication_idx on public.cabins (publication_state, display_order) where deleted_at is null;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.cabin_services (
  cabin_id uuid not null references public.cabins(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key (cabin_id, service_id)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.cabin_categories (
  cabin_id uuid not null references public.cabins(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (cabin_id, category_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  source_bucket text not null,
  source_path text not null unique,
  public_bucket text,
  public_path text unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  extension text not null check (extension in ('jpg', 'jpeg', 'png', 'webp')),
  byte_size bigint not null check (byte_size between 1 and 5242880),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  processing_status public.media_processing_status not null default 'staging',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create index media_assets_cleanup_idx on public.media_assets (processing_status, updated_at);

create table public.cabin_images (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabins(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  public_url text,
  alt_text text not null default '',
  position integer not null default 1 check (position > 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (cabin_id, asset_id)
);
create unique index cabin_single_cover_idx on public.cabin_images (cabin_id) where is_cover and deleted_at is null;
create index cabin_images_order_idx on public.cabin_images (cabin_id, position) where deleted_at is null;

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 100),
  short_description text not null default '' check (char_length(short_description) <= 180),
  image_alt text not null default '' check (char_length(image_alt) <= 160),
  starts_on date,
  ends_on date,
  publication_state public.publication_state not null default 'draft',
  display_order integer not null default 1 check (display_order > 0),
  cta_label text not null default '' check (char_length(cta_label) <= 40),
  href text not null default '' check (href in ('', '/', '#inicio', '#cabanas', '#como-reservar', '#contacto')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  check (ends_on is null or starts_on is null or ends_on > starts_on),
  check ((cta_label = '' and href = '') or (cta_label <> '' and href <> ''))
);
create index promotions_publication_idx on public.promotions (publication_state, starts_on, ends_on, display_order) where deleted_at is null;

create table public.promotion_images (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  public_url text,
  alt_text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create unique index promotion_single_image_idx on public.promotion_images (promotion_id) where deleted_at is null;

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(name) between 1 and 120),
  preferred_contact public.preferred_contact_method not null default 'whatsapp',
  notes text not null default '',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create table public.owner_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  contact_type public.owner_contact_type not null,
  label text not null default '',
  display_value text not null,
  normalized_value text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create unique index owner_contact_value_idx on public.owner_contacts (owner_id, contact_type, normalized_value) where deleted_at is null;
create unique index owner_primary_contact_idx on public.owner_contacts (owner_id, contact_type) where is_primary and deleted_at is null;
create table public.cabin_owner_assignments (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabins(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete restrict,
  is_primary boolean not null default false,
  agreed_commission numeric(5,2) check (agreed_commission between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (cabin_id, owner_id)
);
create unique index cabin_primary_owner_idx on public.cabin_owner_assignments (cabin_id) where is_primary and is_active;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone_display text not null,
  phone_e164 text not null,
  email text,
  consent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);
create index customers_phone_idx on public.customers (phone_e164) where deleted_at is null;
create index customers_email_idx on public.customers (lower(email)) where email is not null and deleted_at is null;

create table public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabins(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  message text not null default '',
  origin text not null default 'website',
  status public.inquiry_status not null default 'new',
  idempotency_key uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (check_out > check_in)
);
create index booking_inquiries_status_idx on public.booking_inquiries (status, created_at desc);

create table public.availability_entries (
  id uuid primary key default gen_random_uuid(),
  cabin_id uuid not null references public.cabins(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  period daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  kind public.availability_kind not null,
  status public.availability_status not null default 'active',
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  released_at timestamptz,
  check (check_out > check_in),
  exclude using gist (cabin_id with =, period with &&) where (status = 'active')
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  cabin_id uuid not null references public.cabins(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  inquiry_id uuid references public.booking_inquiries(id) on delete set null,
  availability_entry_id uuid unique references public.availability_entries(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  adults integer not null check (adults > 0),
  minors integer not null default 0 check (minors >= 0),
  nightly_price numeric(12,2) not null check (nightly_price >= 0),
  estimated_total numeric(12,2) not null check (estimated_total >= 0),
  currency char(3) not null default 'MXN',
  status public.reservation_status not null default 'new',
  origin text not null default 'website',
  internal_notes text not null default '',
  version bigint not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (check_out > check_in),
  check (guests = adults + minors)
);
create index reservations_status_dates_idx on public.reservations (status, check_in, check_out);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 10000),
  author_id uuid references auth.users(id) on delete set null,
  owner_id uuid references public.owners(id) on delete cascade,
  cabin_id uuid references public.cabins(id) on delete cascade,
  inquiry_id uuid references public.booking_inquiries(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  promotion_id uuid references public.promotions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  check (num_nonnulls(owner_id, cabin_id, inquiry_id, reservation_id, promotion_id) = 1)
);

create table public.public_site_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Cabañas Sierra Norte',
  logo_url text,
  public_whatsapp text not null default '',
  public_phone text not null default '',
  public_email text,
  general_location text not null default 'Arteaga, Coahuila, México',
  business_hours text not null default '',
  social_links jsonb not null default '{}',
  public_policies jsonb not null default '{}',
  timezone text not null default 'America/Monterrey',
  currency char(3) not null default 'MXN',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.business_settings (
  id boolean primary key default true check (id),
  min_stay_nights integer not null default 1 check (min_stay_nights > 0),
  max_stay_nights integer check (max_stay_nights is null or max_stay_nights >= min_stay_nights),
  default_messages jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role public.admin_role,
  action text not null,
  table_name text not null,
  record_id text,
  before_data jsonb,
  after_data jsonb,
  transaction_id bigint not null default txid_current(),
  created_at timestamptz not null default timezone('utc', now())
);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'admin_profiles','cabins','services','categories','media_assets','promotions','owners','owner_contacts',
    'cabin_owner_assignments','customers','booking_inquiries','availability_entries','reservations','internal_notes',
    'public_site_settings','business_settings'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name, table_name);
  end loop;
end $$;

commit;
