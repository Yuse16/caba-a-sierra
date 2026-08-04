begin;

alter default privileges in schema private revoke execute on functions from service_role;
alter default privileges in schema public revoke execute on functions from service_role;
alter default privileges in schema public revoke usage, select, update on sequences from service_role;
alter default privileges in schema public revoke all privileges on tables from service_role;

revoke execute on all functions in schema private from service_role;
revoke execute on all functions in schema public from service_role;
revoke usage, select, update on all sequences in schema public from service_role;
revoke all privileges on all tables in schema public from service_role;
revoke usage on schema private from service_role;

commit;
