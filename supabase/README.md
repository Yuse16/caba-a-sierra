# Supabase local y migraciones

Las migraciones son aditivas y deben aplicarse primero en un entorno desechable y después en el proyecto remoto autorizado. Los seeds contienen únicamente catálogos públicos seguros; no incluyen propietarios, clientes, reservas, usuarios ni contraseñas simuladas.

## Preparación

1. Instala o ejecuta Supabase CLI.
2. Copia `.env.example` a `.env.local` y agrega valores del proyecto de desarrollo.
3. Inicia Supabase local y ejecuta `supabase db reset`.
4. Crea el primer usuario mediante una invitación autorizada de Supabase Auth.
5. Asigna su UUID manualmente en `admin_profiles` con rol `admin`; nunca habilites un trigger que convierta registros nuevos en administradores.

## Variables y activación remota

No hay valores reales versionados. Para conectar un proyecto de desarrollo o producción:

1. Copia `.env.example` a `.env.local`.
2. En Supabase, copia la URL del proyecto en `NEXT_PUBLIC_SUPABASE_URL` y la llave `anon` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Define `NEXT_PUBLIC_SITE_URL` con el origen exacto permitido, sin una ruta final, por ejemplo `https://app.ejemplo.com`.
4. Aplica en orden las migraciones `202607290001` a `202607290008` y ejecuta `supabase test db` contra un entorno local desechable.
5. Crea cada usuario mediante Supabase Auth y agrega explícitamente su fila activa en `public.admin_profiles` con rol `editor` o `admin`.
6. Agrega las URLs de callback del sitio a la lista permitida de Supabase Auth y prueba login, recuperación y actualización de contraseña.
7. Conserva `SUPABASE_SERVICE_ROLE_KEY` únicamente en el gestor de secretos del servidor. No es necesaria para las acciones normales del panel; se reserva para `pnpm media:cleanup`.
8. Programa `pnpm media:cleanup` al menos una vez al día en un job de servidor. `MEDIA_STAGING_MAX_AGE_HOURS` es opcional y su valor predeterminado es `24`.
9. Ejecuta `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm test:e2e:auth`, `pnpm test:rls`, `pnpm test:security-bundle` y `pnpm build` antes de publicar.

La carga normal usa la sesión real del usuario y políticas RLS. `admin-media` conserva la copia privada de origen; `public-media` contiene el derivado público utilizado por el catálogo. Las rutas se limitan al UUID autenticado y a los ámbitos `cabins` o `promotions`.

## Rollback

Los rollbacks son destructivos y deben ejecutarse únicamente durante una ventana de mantenimiento, con autorización independiente. Antes de comenzar:

1. Exporta y verifica un respaldo restaurable de la base de datos.
2. Respalda los objetos físicos de `admin-media` y `public-media`, no solo sus metadatos SQL.
3. Detén escrituras de la aplicación y confirma que no haya migraciones simultáneas.
4. Registra el proyecto, ambiente y responsable que autoriza la reversión.

Con las migraciones 001–008 aplicadas, el único orden soportado es el inverso exacto:

```text
202607290008_rollback.sql
202607290007_rollback.sql
202607290006_rollback.sql
202607290005_rollback.sql
202607290004_rollback.sql
202607290003_rollback.sql
202607290002_rollback.sql
```

El rollback 002 también retira el esquema creado por 001; por eso no existe un archivo de rollback 001 independiente. No ejecutes 002 antes de 003–008: las vistas, funciones, triggers y políticas posteriores todavía dependen de esos objetos.

El rollback 002 activa `storage.allow_delete_query = 'true'` con `SET LOCAL`, limitado a su transacción, y elimina metadatos SQL únicamente de los buckets `admin-media` y `public-media`. Este mecanismo es necesario porque Supabase protege sus tablas de Storage contra borrado SQL directo. No usa `DROP ... CASCADE` ni `TRUNCATE`.

Eliminar filas de `storage.objects` o `storage.buckets` no garantiza que los blobs físicos desaparezcan del proveedor de objetos. Coordina la exportación y eliminación física mediante la API de Storage; de lo contrario pueden quedar blobs huérfanos. Nunca ejecutes el rollback 002 sobre datos reales sin haber validado el respaldo de base y objetos.
