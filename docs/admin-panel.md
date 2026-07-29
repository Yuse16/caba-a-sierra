# Panel administrativo preservado

El panel administrativo está separado de la experiencia pública y preparado en la ruta privada no enlazada `/panel`. La ruta anterior `/admin` se conserva como acceso compatible y redirige a `/panel`.

## Administración de cabañas

- `/panel/cabanas`: listado, publicación y vista previa.
- `/panel/cabanas/nueva`: creación de una cabaña.
- `/panel/cabanas/[id]`: edición de una cabaña existente.
- `components/panel/`: interfaz responsive, formularios, imágenes y confirmaciones.
- `lib/admin-cabins/`: tipos, datos de demostración, repositorio local y preparación de imágenes.

Los cambios del módulo se guardan temporalmente en el navegador. La interfaz `AdminCabinRepository` permite sustituir ese almacenamiento por una base de datos sin mezclar consultas dentro de los componentes.

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

## Estado previo a producción

Los datos del panel siguen siendo locales y simulados. Como protección temporal, `proxy.ts` responde con `404` para `/panel`, todas sus subrutas y `/admin` cuando `NODE_ENV=production`. En desarrollo local las rutas continúan accesibles. Esta protección ocurre en el servidor y no utiliza contraseñas ni secretos en el frontend.

Antes de habilitar el panel en producción todavía se requiere autenticación real del lado del servidor, sesiones seguras, autorización y persistencia conectada a una base de datos. `noindex` se mantiene como protección complementaria, pero no sustituye el control de acceso.

La ruta pública `/` no contiene enlaces hacia `/panel` o `/admin` ni expone parámetros de vista o versión.

## Contacto temporal

El teléfono y el enlace de WhatsApp públicos se leen exclusivamente desde `lib/site-config.ts`. El contacto autorizado se conserva de forma temporal hasta que el cliente confirme el número definitivo. Antes de la entrega final debe actualizarse esa única configuración y verificarse nuevamente la llamada telefónica y el enlace de WhatsApp; no debe duplicarse el número directamente en componentes.
