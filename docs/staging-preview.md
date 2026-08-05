# Staging con Supabase y Vercel Preview

Este procedimiento conecta exclusivamente la rama `feature/supabase-admin-platform` a recursos desechables de staging. No reutilices proyectos, buckets, usuarios, contraseñas ni dominios de producción.

## 1. Crear el proyecto Supabase de staging

1. En Supabase Dashboard, selecciona la organización autorizada y crea un proyecto nuevo.
2. Usa un nombre inequívoco, por ejemplo `cabanas-sierra-norte-staging`.
3. Selecciona la región más cercana al equipo de prueba.
4. Genera una contraseña de base de datos única y guárdala en un gestor de contraseñas. No la pegues en Git, Codex, Slack ni Vercel.
5. Espera a que el proyecto aparezca como activo y copia únicamente su `Project ref` para enlazar la CLI.

## 2. Enlazar y aplicar migraciones

Desde esta rama:

```bash
pnpm exec supabase link --project-ref <PROJECT_REF_DE_STAGING>
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
pnpm exec supabase migration list --linked
```

El `dry-run` debe mostrar únicamente las migraciones `202607290001` a `202607290008`. No uses `db reset --linked`, `migration repair` ni los archivos de `supabase/rollback/` durante esta preparación.

Después ejecuta la suite transaccional RLS, que termina con `rollback`:

```bash
pnpm exec supabase test db --linked supabase/tests/rls_test.sql
```

El resultado esperado es `Tests=91` y `Result: PASS`.

## 3. Obtener variables sin exponerlas

En Supabase abre **Project Settings → API Keys** o el diálogo **Connect**:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`.
- Publishable key o llave `anon` heredada → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

La llave pública puede llegar al navegador, pero no sustituye RLS. La secret key o `service_role` no es necesaria para login, CRUD ni cargas normales y no debe agregarse al Preview de Vercel.

Copia `.env.example` a `.env.local` y completa localmente:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<URL_STAGING>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<LLAVE_PUBLICA_STAGING>
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=<URL_HTTPS_ESTABLE_DEL_PREVIEW>
```

No muestres el contenido del archivo. `.env.local` está ignorado por Git.

Para las pruebas remotas copia `.env.staging.example` a `.env.staging.local` y completa sus valores con dos cuentas exclusivas de QA. Este archivo también está ignorado.

## 4. Crear usuarios y perfiles

1. En **Authentication → Users**, crea o invita dos cuentas exclusivas de staging: una administradora y una editora.
2. Usa correos controlados por el equipo y contraseñas únicas. Confirma los correos antes de probar login.
3. Desactiva el registro público en **Authentication → Sign In / Providers**; sólo deben entrar cuentas creadas por un administrador.
4. Copia los UUID de las dos cuentas.
5. En SQL Editor, confirma visualmente el nombre y `Project ref` de staging antes de ejecutar:

```sql
insert into public.admin_profiles (user_id, display_name, role, is_active)
values
  ('<UUID_ADMIN>', 'Administrador de staging', 'admin', true),
  ('<UUID_EDITOR>', 'Editor de staging', 'editor', true)
on conflict (user_id) do update
set display_name = excluded.display_name,
    role = excluded.role,
    is_active = excluded.is_active,
    disabled_at = null;
```

No asignes roles mediante `user_metadata`: la autorización de esta aplicación usa `public.admin_profiles` y RLS.

## 5. Crear el proyecto Vercel

1. Inicia sesión en Vercel con la cuenta que tenga acceso a `Yuse16/caba-a-sierra`.
2. Selecciona **Add New → Project** e importa el repositorio de GitHub.
3. Conserva `main` como **Production Branch**. No ejecutes un despliegue Production.
4. Framework: Next.js. Root Directory: raíz del repositorio. Install Command: `pnpm install`. Build Command: `pnpm build`.
5. En **Settings → Environment Variables**, crea variables sólo para **Preview** y, cuando la interfaz lo permita, limítalas a `feature/supabase-admin-platform`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Crea un deployment desde la referencia `feature/supabase-admin-platform` y copia su alias estable de rama.
7. Agrega `NEXT_PUBLIC_SITE_URL` sólo a Preview y a esa rama, con el origen HTTPS exacto, sin diagonal final.
8. Redeploya el mismo commit para que las tres variables estén disponibles durante build y runtime.

No agregues `SUPABASE_SERVICE_ROLE_KEY` al proyecto Vercel en esta etapa.

## 6. Autorizar callbacks de staging

En Supabase abre **Authentication → URL Configuration**:

- Site URL: el alias estable HTTPS de la rama Preview.
- Additional Redirect URLs: `<URL_PREVIEW>/auth/callback`.
- Conserva URLs localhost sólo si este proyecto también se usa para QA local.

Prefiere la URL exacta. Si el equipo decide autorizar previews efímeros, limita el wildcard al slug real de la cuenta Vercel, por ejemplo `https://*-<slug>.vercel.app/**`; nunca uses `https://**`.

Solicita una recuperación desde `/recuperar-contrasena`, verifica que el mensaje apunte al dominio Preview y completa el cambio en `/actualizar-contrasena`.

## 7. Validación

Con `.env.local` configurado:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Con `.env.staging.local` configurado:

```bash
pnpm test:e2e:staging
pnpm exec supabase test db --linked supabase/tests/rls_test.sql
```

La suite de staging usa únicamente las cuentas admin/editor, la URL y la llave pública. Crea, publica, edita, oculta y limpia contenido de QA mediante la interfaz; no usa una secret key ni `service_role`.

Antes de aprobar la fusión revisa manualmente el Preview en 320, 360, 375, 390, 412, 768 y 1440 px, incluyendo consola, red, cookies Secure/HttpOnly/SameSite, callbacks, imágenes, desbordamientos y persistencia en una segunda sesión.
