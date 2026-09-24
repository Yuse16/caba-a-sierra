begin;

create or replace function public.create_website_booking_inquiry(
  p_cabin_id uuid,
  p_customer_name text,
  p_phone_display text,
  p_phone_e164 text,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_message text,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_customer_id uuid;
  v_inquiry_id uuid;
begin
  if char_length(trim(p_customer_name)) not between 2 and 120 then
    raise exception 'INVALID_CUSTOMER_NAME';
  end if;
  if p_phone_e164 !~ '^\+[1-9][0-9]{9,14}$' then
    raise exception 'INVALID_CUSTOMER_PHONE';
  end if;
  if p_check_out <= p_check_in then
    raise exception 'INVALID_DATE_RANGE';
  end if;
  if p_guests < 1 then
    raise exception 'INVALID_GUEST_COUNT';
  end if;
  if char_length(coalesce(p_message, '')) > 2000 then
    raise exception 'MESSAGE_TOO_LONG';
  end if;

  perform 1
  from public.cabins
  where id = p_cabin_id
    and publication_state = 'published'
    and deleted_at is null
    and max_guests >= p_guests;
  if not found then
    raise exception 'CABIN_NOT_AVAILABLE';
  end if;

  -- Serializa consultas simultáneas del mismo teléfono sin imponer una
  -- restricción nueva sobre registros históricos que pudieran estar duplicados.
  perform pg_advisory_xact_lock(hashtextextended(p_phone_e164, 0));

  select id
  into v_customer_id
  from public.customers
  where phone_e164 = p_phone_e164
    and deleted_at is null
  order by updated_at desc
  limit 1
  for update;

  if v_customer_id is null then
    insert into public.customers (name, phone_display, phone_e164)
    values (trim(p_customer_name), trim(p_phone_display), p_phone_e164)
    returning id into v_customer_id;
  else
    update public.customers
    set name = trim(p_customer_name),
        phone_display = trim(p_phone_display)
    where id = v_customer_id;
  end if;

  select id
  into v_inquiry_id
  from public.booking_inquiries
  where cabin_id = p_cabin_id
    and customer_id = v_customer_id
    and check_in = p_check_in
    and check_out = p_check_out
    and guests = p_guests
    and created_at >= timezone('utc', now()) - interval '5 minutes'
  order by created_at desc
  limit 1;

  if v_inquiry_id is not null then
    return v_inquiry_id;
  end if;

  insert into public.booking_inquiries (
    cabin_id,
    customer_id,
    check_in,
    check_out,
    guests,
    message,
    origin,
    status,
    idempotency_key
  )
  values (
    p_cabin_id,
    v_customer_id,
    p_check_in,
    p_check_out,
    p_guests,
    coalesce(trim(p_message), ''),
    'website',
    'new',
    p_idempotency_key
  )
  on conflict (idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$;

revoke all on function public.create_website_booking_inquiry(uuid, text, text, text, date, date, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.create_website_booking_inquiry(uuid, text, text, text, date, date, integer, text, uuid) to service_role;

commit;
