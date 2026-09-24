# DUPEZ — Checklist de entrega

Fecha de corte: 2026-09-24

## Estado actual

La plataforma nueva continúa en `fix/client-feedback-pwa`. Producción (`main`) todavía no se modifica.

### Completado
- Panel de cabañas, propietarios, promociones, solicitudes y clientes.
- Flujo público de solicitudes y alta automática de clientes.
- Galería de cabañas con flechas, swipe y apertura de detalles desde la imagen.
- Promociones en carrusel con flechas y swipe.
- Vista previa de promociones con recorte 16:9 igual al público.
- Filtros por huéspedes, habitaciones, camas mínimas, tipo de cama, zona, alberca, mascotas y amenidades.
- PWA Android + instrucciones de instalación para iPhone/iPad.
- Perfil, cambio y recuperación de contraseña.
- Limpieza de los datos de prueba de la reunión en staging.
- QR final preparado para `https://dupez.uk`.
- Vercel Preview compilando en estado READY.

### Pendiente antes del merge a main
1. Crear las cuentas definitivas de Osiel y Perla con sus correos reales.
2. Hacer smoke test físico en Android/iPhone:
   - login;
   - crear borrador;
   - subir varias fotos;
   - publicar;
   - verificar filtros;
   - crear solicitud;
   - revisar Solicitudes/Clientes;
   - WhatsApp;
   - carrusel de promociones;
   - instalación PWA.
3. Configurar Supabase Auth para el dominio final:
   - Site URL: `https://dupez.uk`
   - Redirect permitido: `https://dupez.uk/auth/callback`
4. Cambiar las variables de producción de Vercel a la base nueva.
5. Cambiar `NEXT_PUBLIC_SITE_URL` de producción a `https://dupez.uk`.
6. Merge final a `main`.
7. Validar `dupez.uk`, `/login`, recuperación de contraseña y PWA en producción.
8. Desactivar/eliminar la cuenta técnica Editor QA después del Gate final.

## Datos de staging

Los datos comerciales de prueba quedaron en cero:
- cabañas: 0
- promociones: 0
- clientes: 0
- solicitudes: 0
- propietarios: 0
- reservaciones: 0
- media_assets: 0

Los audit logs no se eliminan porque la base los protege como append-only por diseño.

Los archivos físicos de prueba que ya habían sido enviados a Storage pueden permanecer como objetos internos hasta ejecutar una limpieza con la API de Storage; no aparecen en la web ni están vinculados a registros de negocio.

## Regla de liberación

No cambiar producción ni fusionar a `main` hasta completar el smoke test final y confirmar los dos usuarios definitivos.
