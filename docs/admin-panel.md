# Panel administrativo preservado

El panel administrativo está separado de la experiencia pública y preparado en la ruta privada no enlazada `/panel`. La ruta anterior `/admin` se conserva como acceso compatible y redirige a `/panel`.

## Administración de cabañas

- `/panel/cabanas`: listado, publicación y vista previa.
- `/panel/cabanas/nueva`: creación de una cabaña.
- `/panel/cabanas/[id]`: edición de una cabaña existente.
- `components/panel/`: interfaz responsive, formularios, imágenes y confirmaciones.
- `lib/admin-cabins/`: tipos, repositorio server-only para Supabase, fallback efímero de desarrollo y preparación de imágenes.

Los componentes llaman Server Actions autorizadas; el repositorio productivo lee y escribe en Supabase sin exponer el cliente administrativo al navegador. Sin configuración de Supabase, el entorno local utiliza un archivo JSON efímero dentro del directorio temporal del sistema para que la demostración sobreviva recargas y workers de Next. Ese archivo no se usa ni se crea en producción.

## Administración de promociones

- `/panel/promociones`: listado, búsqueda, filtros, orden, vista previa y visibilidad.
- `/panel/promociones/nueva`: creación de una promoción.
- `/panel/promociones/[id]`: edición de una promoción existente.
- `components/panel/`: listado, formulario, carga de imagen, mensajes y confirmaciones.
- `components/promotions/public-promotion-card.tsx`: diseño único reutilizado en la vista previa y en la página pública.
- `lib/admin-promotions/`: tipos, validaciones, servicio de fechas, procesamiento de imagen y repositorio server-only para Supabase.

Cada promoción contiene nombre, imagen principal, descripción corta opcional, texto alternativo, fechas opcionales, estado, orden, texto de botón y destino público opcional. Los destinos permitidos se limitan a Inicio, Cabañas, Cómo reservar y Contacto.

Los estados son:

- **Borrador:** conserva la información sin mostrarla públicamente.
- **Programada:** tiene una fecha de inicio futura.
- **Activa:** puede aparecer en la página pública durante sus fechas vigentes.
- **Vencida:** la fecha de finalización ya pasó; se detecta automáticamente.
- **Oculta:** conserva todos sus datos, pero no aparece públicamente.

La fecha de inicio futura programa la promoción. La fecha final debe ser posterior a la inicial. Cuando la fecha final termina, la promoción cambia automáticamente a vencida. La página pública muestra únicamente promociones activas, vigentes y no ocultas, ordenadas según el panel.

La interfaz valida JPG, PNG y WebP de hasta 5 MB. El navegador prepara una vista previa y el servidor vuelve a comprobar el MIME real, las dimensiones y el peso. Después corrige la orientación, mantiene la proporción y genera WebP cuando reduce el tamaño. Cada archivo recibe un nombre único y se guarda primero en `admin-media/<usuario>/<módulo>/staging/` y después en `public-media/<usuario>/<módulo>/`; la base de datos conserva el identificador del asset y su ruta pública, nunca el base64.

Los assets nuevos permanecen en estado `staging` hasta que el registro se guarda. Si el guardado falla vuelven a ese estado para permitir el reintento. Al reemplazar, quitar, archivar o eliminar contenido, el servicio borra el archivo únicamente si no tiene referencias activas. Para cierres de navegador o formularios abandonados existe el trabajo de mantenimiento `pnpm media:cleanup`, que retira cargas `staging` sin referencias con más de 24 horas. Este trabajo es la única operación habitual que usa `SUPABASE_SERVICE_ROLE_KEY`; debe ejecutarse exclusivamente en un entorno de servidor protegido.

Las promociones se guardan en Supabase mediante Server Actions y el sitio público consume una vista anónima de campos mínimos. Guardar, publicar, ocultar y reordenar revalida la página pública. El fallback local es efímero y no se usa en producción.

## Archivos del panel

- `app/panel/page.tsx`: entrada principal del panel.
- `app/admin/page.tsx`: redirección de compatibilidad hacia `/panel`.
- `components/admin/admin-route-shell.tsx`: conserva localmente la versión administrativa activa.
- `components/admin/admin-panel.tsx`: composición y estado principal de los paneles Start y Pro.
- `components/admin/admin-sidebar.tsx`: navegación administrativa y acceso interno de Start a Pro.
- `components/admin/nav-config.tsx`: módulos disponibles por versión.
- `components/admin/admin-sections.tsx`: solicitudes, reservaciones, pagos, propietarios, comisiones y operaciones.
- `components/admin/admin-header.tsx`: encabezado administrativo.
- `components/admin/cabins-table.tsx`: catálogo administrativo responsive.
- `components/admin/occupancy-calendar.tsx`: calendario visual.
- `components/admin/side-panels.tsx`: actividad, tareas y acciones rápidas.

## Protección y persistencia

El panel usa autenticación PKCE de Supabase, sesión validada en el servidor, perfil administrativo activo y autorización por rol. El proxy protege `/panel`, sus subrutas y `/admin`; el layout vuelve a validar la sesión y el perfil. Cuando falta la configuración de Supabase, el acceso al panel se bloquea y se muestra un aviso de configuración; no existe un perfil administrativo local de respaldo.

Los editores administran catálogo y promociones, pero no reciben el dashboard ni datos sensibles de propietarios. Los administradores cargan propietarios, contactos, consultas, reservaciones y notas reales desde Supabase. RLS, auditoría y autoría forzada complementan la autorización de las Server Actions. `noindex` se mantiene como protección adicional, no como control de acceso.

Antes de habilitar el panel en un entorno real deben configurarse el proyecto Supabase, aplicar las migraciones, crear los usuarios administrativos y activar sus perfiles. El panel usa la sesión autenticada y RLS para las lecturas, escrituras y cargas ordinarias; la llave de servicio no se incluye en el bundle ni se usa desde componentes React.

La ruta pública `/` no contiene enlaces hacia `/panel` o `/admin` ni expone parámetros de vista o versión.

## Contacto público

El correo, teléfono y enlace de WhatsApp públicos se leen exclusivamente desde `lib/site-config.ts`. Antes de cada entrega debe confirmarse esa única configuración y verificarse nuevamente la llamada telefónica, el correo y el enlace de WhatsApp; no deben duplicarse los datos directamente en componentes.
