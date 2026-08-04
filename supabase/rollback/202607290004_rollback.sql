begin;

drop function if exists public.reorder_promotions(uuid[]);
alter table public.cabins drop column if exists contact_whatsapp;

commit;
