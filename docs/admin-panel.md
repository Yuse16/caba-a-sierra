# Panel administrativo preservado

El panel administrativo está separado de la experiencia pública y preparado en la ruta privada no enlazada `/panel`. La ruta anterior `/admin` se conserva como acceso compatible y redirige a `/panel`.

## Administración de cabañas

- `/panel/cabanas`: listado, publicación y vista previa.
- `/panel/cabanas/nueva`: creación de una cabaña.
- `/panel/cabanas/[id]`: edición de una cabaña existente.
- `components/panel/`: interfaz responsive, formularios, imágenes y confirmaciones.
- `lib/admin-cabins/`: tipos, repositorio server-only para Supabase, fallback efímero de desarrollo y preparación de imágenes.

La ficha admite una galería sin límite comercial de cantidad (cada archivo conserva validación técnica individual de 5 MB), portada, orden y texto alternativo. También conserva distribución de camas por tipo, capacidad sin topes arbitrarios, ubicación estructurada, coordenadas, enlace de mapa y tipo de alberca. Archivar es reversible: la cabaña deja de publicarse, pero conserva fotografías, portada, orden y datos; restaurarla la devuelve como borrador.

La información del propietario —nombre, teléfono, WhatsApp, correo, preferencia, horario y notas— es exclusivamente interna. Sólo los administradores con permiso sensible pueden leerla o modificarla; no forma parte de `public_cabins`, del catálogo, del modal ni de las consultas públicas.

Los componentes llaman Server Actions autorizadas; el repositorio productivo lee y escribe en Supabase sin exponer el cliente administrativo al navegador. Los repositorios efímeros existen únicamente para pruebas y desarrollo aislado. La página pública nunca usa esos registros: sin configuración de Supabase muestra un estado vacío en lugar de publicar cabañas o promociones de relleno.

## Solicitudes públicas reales

El formulario público no genera contadores ni solicitudes de relleno. Antes de abrir WhatsApp registra de forma transaccional el cliente y su solicitud en `customers` y `booking_inquiries`, conservando la cabaña, teléfono normalizado, fechas, huéspedes y comentarios capturados. La operación se ejecuta únicamente en el servidor mediante `public.create_website_booking_inquiry`; `anon` y `authenticated` no pueden invocar esa función directamente y la llave `SUPABASE_SERVICE_ROLE_KEY` nunca llega al navegador.

La migración `202609030010_public_booking_inquiry_submission.sql` debe estar aplicada en cada entorno. El identificador de idempotencia y la deduplicación de cinco minutos evitan crear solicitudes repetidas por doble clic o reintentos inmediatos. El contador de Solicitudes y el seguimiento que muestra `/panel` se derivan de esos registros reales; cambiar un estado desde el panel persiste el cambio en Supabase.

## CRM de solicitudes y clientes

`/panel/solicitudes` es la bandeja operativa diaria. Muestra cliente, teléfono, cabaña, entrada, salida, huéspedes, fecha de solicitud, comentarios, estado y último seguimiento. Permite buscar por nombre, teléfono o cabaña; filtrar por estado, cabaña y rango de fechas; ordenar; paginar; abrir detalle; agregar notas internas; cambiar estado con control de versión optimista; registrar eventos de negocio; y abrir WhatsApp con mensaje precargado hacia el teléfono del cliente.

Los estados de solicitud son: Nueva, Contactado, Pendiente, Confirmada, No disponible, Sin respuesta, Cancelada y Finalizada. Abrir WhatsApp no cambia el estado por sí solo; el administrador debe marcar Contactado, Confirmada u otro estado después de operar la conversación.

El historial se guarda en `inquiry_events` y registra eventos relevantes: solicitud recibida, WhatsApp abierto, alternativa ofrecida, cambio de estado y nota agregada. Las notas privadas de solicitud y cliente viven en `internal_notes`. Ambas tablas están protegidas por RLS y no se consultan desde la página pública.

`/panel/clientes` conserva una ficha reutilizable por teléfono normalizado E.164. No fusiona personas por nombre. La ficha muestra primeras y últimas consultas, número de solicitudes, historial relacionado, notas privadas, WhatsApp y estado comercial independiente: Prospecto, Cliente, Recurrente o Inactivo. Prospecto no significa solicitud abierta; es una clasificación comercial separada para poder dar seguimiento futuro.

Las plantillas de WhatsApp son locales y editables antes de abrir `wa.me`. No integran WhatsApp Cloud API, Meta Business API, Twilio ni envío automático. El mensaje de alternativa sólo incluye la cabaña publicada y su URL pública, nunca datos de propietario.

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

La interfaz valida JPG, PNG y WebP de hasta 5 MB. Para fotografías de cabañas, el navegador corrige la orientación, mantiene la proporción, limita el lado mayor a 1600 px y genera WebP cuando reduce el tamaño; el servidor vuelve a comprobar el MIME real, las dimensiones y el peso antes de aceptar el archivo. Cada archivo recibe un nombre único y se guarda primero en `admin-media/<usuario>/cabins/staging/` y después en `public-media/<usuario>/cabins/`; la base de datos conserva el identificador del asset y su ruta pública, nunca el base64.

Los assets de cabañas quedan listos pero marcados como pendientes en el formulario hasta que la galería se guarda. Si se cancela o se retira una imagen pendiente, el servidor la elimina únicamente después de comprobar dos veces que no tenga referencias activas. Para cierres de navegador o formularios abandonados existe el trabajo de mantenimiento `pnpm media:cleanup`, que retira cargas sin referencias después del periodo de gracia. Tanto la carga/limpieza de cabañas como ese trabajo usan `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en código server-only; la variable debe configurarse en el gestor de secretos del servidor y nunca exponerse al navegador.

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
