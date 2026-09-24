begin;

create or replace function public.sync_cabin_owner(target_cabin_id uuid, owner_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_catalog
as $$
declare
  target_owner_id uuid;
  contact record;
  contact_value text;
begin
  if not private.has_admin_role('admin') then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  perform 1 from public.cabins where id = target_cabin_id and deleted_at is null for update;
  if not found then raise exception 'CABIN_NOT_FOUND' using errcode = 'P0002'; end if;

  if owner_payload is null or owner_payload = 'null'::jsonb then
    update public.cabin_owner_assignments
      set is_primary = false, is_active = false, updated_at = timezone('utc', now())
      where cabin_id = target_cabin_id and is_active;
    return null;
  end if;

  if jsonb_typeof(owner_payload) <> 'object'
    or length(trim(coalesce(owner_payload->>'name', ''))) not between 1 and 120
    or coalesce(owner_payload->>'preferred_contact', '') not in ('whatsapp', 'phone', 'message', 'email')
  then raise exception 'INVALID_OWNER_PAYLOAD' using errcode = '22023'; end if;

  if nullif(owner_payload->>'id', '') is not null then
    target_owner_id := (owner_payload->>'id')::uuid;
    update public.owners set
      name = trim(owner_payload->>'name'),
      preferred_contact = (owner_payload->>'preferred_contact')::public.preferred_contact_method,
      notes = coalesce(owner_payload->>'notes', ''),
      contact_hours = coalesce(owner_payload->>'contact_hours', ''),
      updated_by = auth.uid(), updated_at = timezone('utc', now())
    where id = target_owner_id and deleted_at is null;
    if not found then raise exception 'OWNER_NOT_FOUND' using errcode = 'P0002'; end if;
  else
    insert into public.owners (name, preferred_contact, notes, contact_hours, created_by, updated_by)
    values (trim(owner_payload->>'name'), (owner_payload->>'preferred_contact')::public.preferred_contact_method,
      coalesce(owner_payload->>'notes', ''), coalesce(owner_payload->>'contact_hours', ''), auth.uid(), auth.uid())
    returning id into target_owner_id;
  end if;

  delete from public.owner_contacts
    where owner_id = target_owner_id and contact_type in ('phone', 'whatsapp', 'email');
  for contact in select * from (values
    ('phone'::public.owner_contact_type, 'phone'),
    ('whatsapp'::public.owner_contact_type, 'whatsapp'),
    ('email'::public.owner_contact_type, 'email')
  ) as values_to_sync(contact_type, payload_key) loop
    contact_value := trim(coalesce(owner_payload->>contact.payload_key, ''));
    if contact_value <> '' then
      insert into public.owner_contacts (owner_id, contact_type, display_value, normalized_value, is_primary)
      values (target_owner_id, contact.contact_type, contact_value,
        case when contact.contact_type = 'email' then lower(contact_value) else regexp_replace(contact_value, '\D', '', 'g') end,
        true);
    end if;
  end loop;

  update public.cabin_owner_assignments
    set is_primary = false, is_active = false, updated_at = timezone('utc', now())
    where cabin_id = target_cabin_id and is_active and owner_id <> target_owner_id;
  insert into public.cabin_owner_assignments (cabin_id, owner_id, is_primary, is_active)
    values (target_cabin_id, target_owner_id, true, true)
  on conflict (cabin_id, owner_id) do update
    set is_primary = true, is_active = true, updated_at = timezone('utc', now());
  return target_owner_id;
end;
$$;

revoke all on function public.sync_cabin_owner(uuid, jsonb) from public, anon;
grant execute on function public.sync_cabin_owner(uuid, jsonb) to authenticated;

commit;
