begin;

-- Invoker rights preserve the existing admin-only RLS of both CRM tables.
-- Search is performed before pagination, without capped ID candidate lists.
create view public.admin_inquiry_search with (security_invoker = true) as
select i.*, c.name as customer_name, c.phone_display, c.phone_e164,
       b.name as cabin_name,
       (i.created_at at time zone 'America/Monterrey')::date as created_on
from public.booking_inquiries i
join public.customers c on c.id = i.customer_id
join public.cabins b on b.id = i.cabin_id;
revoke all on public.admin_inquiry_search from public, anon;
grant select on public.admin_inquiry_search to authenticated, service_role;

commit;
