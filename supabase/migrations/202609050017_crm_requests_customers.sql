begin;

create type public.customer_commercial_status as enum ('prospect', 'customer', 'repeat', 'inactive');
alter table public.customers add column commercial_status public.customer_commercial_status not null default 'prospect',
  add column last_interaction_at timestamptz, add column version bigint not null default 1 check (version > 0);
alter table public.booking_inquiries add column last_contact_at timestamptz,
  add column version bigint not null default 1 check (version > 0);

alter table public.internal_notes add column customer_id uuid references public.customers(id) on delete cascade;
alter table public.internal_notes drop constraint internal_notes_check;
alter table public.internal_notes add constraint internal_notes_single_subject
  check (num_nonnulls(owner_id, cabin_id, inquiry_id, reservation_id, promotion_id, customer_id) = 1);

create table public.inquiry_events (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.booking_inquiries(id) on delete restrict,
  event_type text not null check (event_type in ('received','whatsapp_opened','status_changed','note_added','alternative_offered')),
  from_status public.inquiry_status,
  to_status public.inquiry_status,
  details jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index inquiry_events_timeline_idx on public.inquiry_events(inquiry_id, created_at desc, id desc);
create index booking_inquiries_customer_timeline_idx on public.booking_inquiries(customer_id, created_at desc, id desc);
create index booking_inquiries_cabin_timeline_idx on public.booking_inquiries(cabin_id, created_at desc, id desc);
create index customers_commercial_timeline_idx on public.customers(commercial_status, updated_at desc, id desc) where deleted_at is null;

-- Consolida identidades activas ya duplicadas antes de imponer la garantía.
create temporary table customer_merge_map on commit drop as
select id duplicate_id, first_value(id) over (partition by phone_e164 order by updated_at desc, created_at desc, id) canonical_id
from public.customers where deleted_at is null;
delete from customer_merge_map where duplicate_id = canonical_id;
update public.booking_inquiries inquiry set customer_id = map.canonical_id from customer_merge_map map where inquiry.customer_id = map.duplicate_id;
update public.reservations reservation set customer_id = map.canonical_id from customer_merge_map map where reservation.customer_id = map.duplicate_id;
update public.customers customer set deleted_at = timezone('utc', now()) from customer_merge_map map where customer.id = map.duplicate_id;
drop index if exists public.customers_phone_idx;
create unique index customers_phone_active_uidx on public.customers(phone_e164) where deleted_at is null;

alter table public.inquiry_events enable row level security;
alter table public.inquiry_events force row level security;
revoke all on public.inquiry_events from public, anon, authenticated;
grant select, insert on public.inquiry_events to authenticated;
create policy inquiry_events_admin_select on public.inquiry_events for select to authenticated using (private.has_admin_role('admin'));
create policy inquiry_events_admin_insert on public.inquiry_events for insert to authenticated with check (private.has_admin_role('admin') and actor_id = auth.uid());

create or replace function private.record_inquiry_received()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into public.inquiry_events(inquiry_id,event_type,details) values (new.id,'received','{}');
  update public.customers set last_interaction_at = new.created_at, updated_at = new.created_at where id = new.customer_id;
  return new;
end; $$;
create trigger booking_inquiry_received after insert on public.booking_inquiries for each row execute function private.record_inquiry_received();

create or replace function public.transition_booking_inquiry(p_inquiry_id uuid, p_status public.inquiry_status, p_expected_version bigint)
returns bigint language plpgsql security definer set search_path = public, private, pg_catalog as $$
declare previous public.inquiry_status; customer uuid; next_version bigint;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_status not in ('new','contacted','pending','confirmed','unavailable','no_response','cancelled','completed') then
    raise exception 'UNSUPPORTED_STATUS' using errcode='22023'; end if;
  select status,customer_id into previous,customer from public.booking_inquiries where id=p_inquiry_id for update;
  if not found then raise exception 'INQUIRY_NOT_FOUND' using errcode='P0002'; end if;
  update public.booking_inquiries set status=p_status, version=version+1, updated_at=timezone('utc',now()),
    last_contact_at=case when p_status='contacted' then timezone('utc',now()) else last_contact_at end
  where id=p_inquiry_id and version=p_expected_version returning version into next_version;
  if next_version is null then raise exception 'STALE_WRITE' using errcode='40001'; end if;
  if previous is distinct from p_status then
    insert into public.inquiry_events(inquiry_id,event_type,from_status,to_status,actor_id)
    values(p_inquiry_id,'status_changed',previous,p_status,auth.uid());
  end if;
  update public.customers set last_interaction_at=timezone('utc',now()), updated_at=timezone('utc',now()), version=version+1,
    commercial_status=case when p_status in ('confirmed','completed') and commercial_status='prospect' then 'customer' else commercial_status end
  where id=customer;
  return next_version;
end; $$;

create or replace function public.add_inquiry_note(p_inquiry_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public, private, pg_catalog as $$
declare note_id uuid; customer uuid;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if length(trim(p_body)) not between 1 and 10000 then raise exception 'INVALID_NOTE' using errcode='22023'; end if;
  select customer_id into customer from public.booking_inquiries where id=p_inquiry_id for update;
  if not found then raise exception 'INQUIRY_NOT_FOUND' using errcode='P0002'; end if;
  insert into public.internal_notes(body,author_id,inquiry_id) values(trim(p_body),auth.uid(),p_inquiry_id) returning id into note_id;
  insert into public.inquiry_events(inquiry_id,event_type,details,actor_id) values(p_inquiry_id,'note_added',jsonb_build_object('note_id',note_id),auth.uid());
  update public.customers set last_interaction_at=timezone('utc',now()),updated_at=timezone('utc',now()),version=version+1 where id=customer;
  return note_id;
end; $$;

create or replace function public.record_inquiry_contact_event(p_inquiry_id uuid, p_event_type text, p_details jsonb default '{}')
returns bigint language plpgsql security definer set search_path = public, private, pg_catalog as $$
declare event_id bigint; customer uuid;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_event_type not in ('whatsapp_opened','alternative_offered') then raise exception 'INVALID_EVENT' using errcode='22023'; end if;
  select customer_id into customer from public.booking_inquiries where id=p_inquiry_id;
  if not found then raise exception 'INQUIRY_NOT_FOUND' using errcode='P0002'; end if;
  insert into public.inquiry_events(inquiry_id,event_type,details,actor_id) values(p_inquiry_id,p_event_type,coalesce(p_details,'{}'),auth.uid()) returning id into event_id;
  update public.customers set last_interaction_at=timezone('utc',now()),updated_at=timezone('utc',now()),version=version+1 where id=customer;
  return event_id;
end; $$;

create or replace function public.add_customer_note(p_customer_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public, private, pg_catalog as $$
declare note_id uuid;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if length(trim(p_body)) not between 1 and 10000 then raise exception 'INVALID_NOTE' using errcode='22023'; end if;
  insert into public.internal_notes(body,author_id,customer_id) values(trim(p_body),auth.uid(),p_customer_id) returning id into note_id;
  update public.customers set last_interaction_at=timezone('utc',now()),updated_at=timezone('utc',now()),version=version+1 where id=p_customer_id;
  return note_id;
end; $$;

create or replace function public.set_customer_commercial_status(p_customer_id uuid, p_status public.customer_commercial_status, p_expected_version bigint)
returns bigint language plpgsql security definer set search_path = public, private, pg_catalog as $$
declare next_version bigint;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  update public.customers set commercial_status=p_status,version=version+1,updated_at=timezone('utc',now()),last_interaction_at=timezone('utc',now())
  where id=p_customer_id and version=p_expected_version and deleted_at is null returning version into next_version;
  if next_version is null then raise exception 'STALE_WRITE' using errcode='40001'; end if;
  return next_version;
end; $$;

revoke all on function public.transition_booking_inquiry(uuid,public.inquiry_status,bigint) from public,anon;
revoke all on function public.add_inquiry_note(uuid,text) from public,anon;
revoke all on function public.record_inquiry_contact_event(uuid,text,jsonb) from public,anon;
revoke all on function public.add_customer_note(uuid,text) from public,anon;
revoke all on function public.set_customer_commercial_status(uuid,public.customer_commercial_status,bigint) from public,anon;
grant execute on function public.transition_booking_inquiry(uuid,public.inquiry_status,bigint), public.add_inquiry_note(uuid,text),
  public.record_inquiry_contact_event(uuid,text,jsonb), public.add_customer_note(uuid,text),
  public.set_customer_commercial_status(uuid,public.customer_commercial_status,bigint) to authenticated;

commit;
