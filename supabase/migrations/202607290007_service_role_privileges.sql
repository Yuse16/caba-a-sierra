begin;

-- La llave service_role se usa solo en procesos server-only y pruebas locales.
-- RLS se mantiene para anon/authenticated; nunca se expone esta llave al navegador.
grant usage on schema public, private to service_role;
grant all privileges on all tables in schema public to service_role;
grant usage, select, update on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant execute on all functions in schema private to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant usage, select, update on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
alter default privileges in schema private grant execute on functions to service_role;

commit;
