-- PostgreSQL no permite retirar valores de un enum de forma segura. La migración
-- es aditiva y los consumidores anteriores ignoran estos estados.
begin;
commit;
