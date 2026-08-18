"use client"

import { useMemo, useState } from "react"
import {
  Home,
  FileText,
  Users,
  DollarSign,
  BookMarked,
  TrendingUp,
  Plus,
  MessageCircle,
  X,
} from "lucide-react"
import type { PlatformVersion } from "@/lib/platform-types"
import type { Cabin, CabinStatus, ClientRequest, RequestStatus, ReservationStatus } from "@/lib/demo-data"
import type { AdminPanelInitialData } from "@/lib/admin-panel-data"
import { formatCurrency as currency } from "@/lib/admin-presentational"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { CabinsTable } from "./cabins-table"
import { OccupancyCalendar } from "./occupancy-calendar"
import { MetricCard } from "@/components/shared/metric-card"
import { DonutChart } from "@/components/shared/donut-chart"
import { AreaLineChart } from "@/components/shared/line-chart"
import {
  RecentRequestsPanel,
  QuickActionsPanel,
  OccupancyDonutPanel,
  RecentActivityPanel,
  PendingTasksPanel,
  UpcomingArrivalsPanel,
  QuickActionsGridPanel,
} from "./side-panels"
import type { SectionKey } from "./nav-config"
import { proNav, startNav } from "./nav-config"
import {
  CabinEditorDialog,
  CommissionsSection,
  OperationsSection,
  OwnersSection,
  PaymentsSection,
  PricingSection,
  PromotionsSection,
  ReportsSection,
  RequestsSection,
  ReservationsSection,
  type OperationTask,
  type Season,
} from "./admin-sections"

const statusCycle: CabinStatus[] = ["por-confirmar", "propietario-contactado", "confirmada", "no-disponible"]
const revenueSeries = [22, 28, 25, 34, 30, 42, 38, 52, 48, 63, 58, 74, 70, 88, 96]

function SectionStub({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

const sectionMeta: Record<string, { title: string; desc: string }> = {
  calendario: { title: "Calendario", desc: "Vista completa de disponibilidad y reservaciones por cabaña y fecha." },
  reservaciones: { title: "Reservaciones", desc: "Gestiona las 42 reservaciones: confirmadas, pendientes y canceladas." },
  clientes: { title: "Clientes", desc: "Directorio de clientes con historial de estancias y contacto." },
  pagos: { title: "Pagos", desc: "Cobros, pagos pendientes y reembolsos de todas las reservaciones." },
  solicitudes: { title: "Solicitudes", desc: "Solicitudes de información y cotizaciones recibidas desde la página pública." },
  propietarios: { title: "Propietarios", desc: "Directorio de dueños y condiciones de intermediación." },
  confirmaciones: { title: "Confirmaciones", desc: "Consultas pendientes de respuesta por parte de propietarios." },
  comisiones: { title: "Comisiones", desc: "Cálculos simulados por reservación, propietario y plataforma." },
  mensajes: { title: "Mensajes", desc: "Conversaciones con clientes en un solo lugar." },
  limpieza: { title: "Limpieza", desc: "Tareas de limpieza asignadas al personal por cabaña y turno." },
  mantenimiento: { title: "Mantenimiento", desc: "Órdenes de mantenimiento y su prioridad por cabaña." },
  inventario: { title: "Inventario", desc: "Control de blancos, amenidades y suministros con alertas de stock bajo." },
  personal: { title: "Personal", desc: "Equipo de limpieza, mantenimiento y recepción con turnos." },
  precios: { title: "Precios y temporadas", desc: "Configura tarifas base y modificadores por temporada." },
  promociones: { title: "Promociones", desc: "Descuentos y campañas activas para la página de clientes." },
  servicios: { title: "Servicios y amenidades", desc: "Catálogo de amenidades disponibles por cabaña." },
  paginas: { title: "Páginas y contenido", desc: "Edita el contenido de tu página pública." },
  configuracion: { title: "Configuración general", desc: "Ajustes de la cuenta, notificaciones e integraciones." },
  perfil: { title: "Perfil", desc: "Información de tu cuenta de administrador." },
  ayuda: { title: "Ayuda", desc: "Guías y soporte para sacar el máximo provecho de tu panel." },
  reportes: { title: "Reportes", desc: "Indicadores e informes simulados del desempeño del negocio." },
}

export function AdminPanel({
  version,
  initialData,
  onManageCabins,
  onManagePromotions,
  onCreateCabin,
  onEditCabin,
}: {
  version: PlatformVersion
  initialData: AdminPanelInitialData
  onManageCabins?: () => void
  onManagePromotions?: () => void
  onCreateCabin?: () => void
  onEditCabin?: (cabin: Cabin) => void
}) {
  const isPro = version === "pro"
  const { owners } = initialData
  const [active, setActive] = useState<SectionKey>("dashboard")
  const [cabins, setCabins] = useState<Cabin[]>(initialData.cabins)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editor, setEditor] = useState<{ open: boolean; cabin: Cabin | null }>({ open: false, cabin: null })
  const [requests, setRequests] = useState(() => initialData.requests.map((item) => ({ ...item })))
  const [reservations, setReservations] = useState(() => initialData.reservations.map((item) => ({ ...item })))
  const [payments, setPayments] = useState(() => initialData.payments.map((item) => ({ ...item })))
  const [cleaning, setCleaning] = useState<OperationTask[]>(() => initialData.cleaningTasks.map((item) => ({ id: item.id, cabin: item.cabin, detail: `Responsable: ${item.assignee}`, when: item.when, status: item.status, meta: item.assignee })))
  const [maintenance, setMaintenance] = useState<OperationTask[]>(() => initialData.maintenanceTasks.map((item) => ({ id: item.id, cabin: item.cabin, detail: item.issue, when: item.when, status: item.status, meta: `Prioridad ${item.priority}` })))
  const [promotions, setPromotions] = useState(() => initialData.promotions.map((item) => ({ ...item })))
  const [seasons, setSeasons] = useState<Season[]>(() => initialData.seasons.map((item) => ({ ...item })))
  const [notice, setNotice] = useState<string | null>(null)

  const availableSections = (isPro ? proNav : startNav).flatMap((group) => group.items.map((item) => item.key))
  const visibleActive = availableSections.includes(active) ? active : "dashboard"

  const counts = useMemo(() => {
    const disponible = cabins.filter((c) => c.status === "confirmada").length
    const ocupada = cabins.filter((c) => ["por-confirmar", "alta-demanda", "propietario-contactado"].includes(c.status)).length
    const noDisp = cabins.filter((c) => c.status === "no-disponible").length
    const total = cabins.length
    const pct = (n: number) => `${n} (${total ? Math.round((n / total) * 100) : 0}%)`
    return { disponible, ocupada, noDisp, total, pct }
  }, [cabins])

  const cycleStatus = (id: string) =>
    setCabins((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: statusCycle[(statusCycle.indexOf(c.status) + 1) % statusCycle.length] }
          : c,
      ),
    )

  const occupancySegments = [
    { label: "Confirmadas", count: counts.disponible, percent: counts.pct(counts.disponible), color: "var(--chart-1)" },
    { label: "Por confirmar", count: counts.ocupada, percent: counts.pct(counts.ocupada), color: "var(--chart-3)" },
    { label: "No disponibles", count: counts.noDisp, percent: counts.pct(counts.noDisp), color: "var(--muted-foreground)" },
  ]

  const handleSelect = (key: SectionKey) => {
    if (key === "cabanas" && onManageCabins) {
      setDrawerOpen(false)
      onManageCabins()
      return
    }
    if (key === "promociones" && onManagePromotions) {
      setDrawerOpen(false)
      onManagePromotions()
      return
    }
    setActive(key)
    setDrawerOpen(false)
  }

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3000)
  }

  const openAddCabin = () => onCreateCabin ? onCreateCabin() : setEditor({ open: true, cabin: null })
  const openEditCabin = (cabin: Cabin) => onEditCabin ? onEditCabin(cabin) : setEditor({ open: true, cabin })

  const saveCabin = (values: Pick<Cabin, "name" | "location" | "price" | "maxGuests" | "status">) => {
    if (editor.cabin) {
      setCabins((current) => current.map((cabin) => cabin.id === editor.cabin?.id ? { ...cabin, ...values } : cabin))
      showNotice("La información de la cabaña fue actualizada.")
    } else {
      const baseCabin = initialData.cabins[0]
      if (!baseCabin) { showNotice("No hay una plantilla disponible para crear la cabaña."); return }
      const id = `cab-demo-${Date.now()}`
      setCabins((current) => [...current, { ...baseCabin, ...values, id, slug: id, minGuests: 1 }])
      showNotice("La cabaña fue agregada a la demo.")
    }
    setEditor({ open: false, cabin: null })
  }

  const advanceTask = (setter: React.Dispatch<React.SetStateAction<OperationTask[]>>, id: string) =>
    setter((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "Pendiente" || item.status === "Programada" ? "En proceso" : "Completada" } : item))

  const adjustSeason = (id: string, direction: number) => setSeasons((items) => items.map((item) => {
    if (item.id !== id) return item
    const current = item.modifier === "Base" ? 0 : Number.parseInt(item.modifier, 10)
    const next = current + direction
    return { ...item, modifier: next === 0 ? "Base" : `${next > 0 ? "+" : ""}${next}%` }
  }))

  return (
    <div className="flex min-h-screen bg-background">
      {notice && <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-forest-dark px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow-xl" role="status">{notice}</div>}
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border lg:block">
        <AdminSidebar version={version} active={visibleActive} onSelect={handleSelect} />
      </aside>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/40"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-sidebar-border bg-sidebar shadow-xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="size-5" aria-hidden />
            </button>
            <AdminSidebar version={version} active={visibleActive} onSelect={handleSelect} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <AdminHeader
          title={visibleActive === "dashboard" ? "Dashboard" : (sectionMeta[visibleActive]?.title ?? "Dashboard")}
          subtitle={visibleActive === "dashboard" ? "Resumen general de tu negocio" : "Panel administrativo"}
          dateLabel={isPro ? "22 jul – 22 ago 2026" : "22 de julio, 2026"}
          showUser={!isPro}
          onMenu={() => setDrawerOpen(true)}
          onDate={() => handleSelect("calendario")}
          onProfile={() => handleSelect("perfil")}
        />

        <div className="mt-6">
          {visibleActive === "dashboard" ? (
            isPro ? (
              <ProDashboard
                initialData={initialData}
                cabins={cabins}
                requests={requests}
                onRequestStatus={(id, status) => setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item))}
                onNavigate={handleSelect}
                onAdd={openAddCabin}
              />
            ) : (
              <StartDashboard
                initialData={initialData}
                cabins={cabins}
                onEdit={openEditCabin}
                onCycleStatus={cycleStatus}
                occupancySegments={occupancySegments}
                onNavigate={handleSelect}
                onAdd={openAddCabin}
              />
            )
          ) : visibleActive === "cabanas" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Administra tus cabañas</h2>
                <button type="button" onClick={openAddCabin} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Plus className="size-4" aria-hidden /> Agregar cabaña
                </button>
              </div>
              <CabinsTable cabins={cabins} onEdit={openEditCabin} onCycleStatus={cycleStatus} />
            </div>
          ) : visibleActive === "calendario" ? (
            <OccupancyCalendar days={initialData.calendarDays} cabins={initialData.calendarCabins} bookings={initialData.calendarBookings} />
          ) : visibleActive === "propietarios" ? (
            <OwnersSection owners={owners} cabins={cabins} requests={requests} reservations={reservations} />
          ) : visibleActive === "solicitudes" ? (
            <RequestsSection items={requests} cabins={cabins} mode={isPro ? "pro" : "start"} onStatusChange={(id, status: RequestStatus) => setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item))} />
          ) : visibleActive === "confirmaciones" ? (
            <RequestsSection title="Confirmaciones con propietarios" items={requests.filter((item) => ["nueva", "pendiente-propietario", "propietario-contactado"].includes(item.status))} cabins={cabins} mode={isPro ? "pro" : "start"} onStatusChange={(id, status: RequestStatus) => setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item))} />
          ) : visibleActive === "reservaciones" ? (
            <ReservationsSection items={reservations} onStatusChange={(id, status: ReservationStatus) => setReservations((items) => items.map((item) => item.id === id ? { ...item, status } : item))} />
          ) : visibleActive === "pagos" ? (
            <PaymentsSection items={payments} onMarkPaid={(id) => { setPayments((items) => items.map((item) => item.id === id ? { ...item, status: "pagado" } : item)); showNotice("Pago simulado registrado correctamente.") }} />
          ) : visibleActive === "comisiones" ? (
            <CommissionsSection reservations={reservations} cabins={cabins} />
          ) : visibleActive === "limpieza" ? (
            <OperationsSection title="Tareas de limpieza" description="Asigna y actualiza el avance de cada turno." items={cleaning} onAdvance={(id) => advanceTask(setCleaning, id)} />
          ) : visibleActive === "mantenimiento" ? (
            <OperationsSection title="Mantenimiento" description="Seguimiento simulado de incidencias por cabaña." items={maintenance} onAdvance={(id) => advanceTask(setMaintenance, id)} />
          ) : visibleActive === "promociones" ? (
            <PromotionsSection
              items={promotions}
              onToggle={(id) => setPromotions((items) => items.map((item) => item.id === id ? { ...item, active: !item.active } : item))}
              onAdd={() => {
                setPromotions((items) => [...items, { id: `promo-demo-${Date.now()}`, title: "Promoción de temporada", discount: "10%", detail: "Campaña creada en la demo", active: true }])
                showNotice("Promoción simulada creada.")
              }}
            />
          ) : visibleActive === "precios" ? (
            <PricingSection items={seasons} onAdjust={adjustSeason} />
          ) : visibleActive === "reportes" ? (
            <ReportsSection />
          ) : (
            <SectionStub
              title={sectionMeta[visibleActive]?.title ?? "Sección"}
              desc={sectionMeta[visibleActive]?.desc ?? "Contenido de demostración."}
            />
          )}
        </div>
      </main>
      {editor.open && <CabinEditorDialog key={editor.cabin?.id ?? "new"} cabin={editor.cabin} onClose={() => setEditor({ open: false, cabin: null })} onSave={saveCabin} />}
    </div>
  )
}

/* ---------------- START dashboard ---------------- */

function StartDashboard({
  initialData,
  cabins,
  onEdit,
  onCycleStatus,
  occupancySegments,
  onNavigate,
  onAdd,
}: {
  initialData: AdminPanelInitialData
  cabins: Cabin[]
  onEdit: (c: Cabin) => void
  onCycleStatus: (id: string) => void
  occupancySegments: { label: string; count: number; percent: string; color: string }[]
  onNavigate: (key: SectionKey) => void
  onAdd: () => void
}) {
  const active = cabins.filter((c) => c.status !== "no-disponible").length
  const newRequests = initialData.requests.filter((request) => request.status === "nueva").length
  const pendingOwners = initialData.requests.filter((request) => request.status === "pendiente-propietario").length
  const confirmedRequests = initialData.requests.filter((request) => request.status === "disponible-confirmada").length
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Home} label="Cabañas asociadas" value={String(active)} sub="Disponibles para consulta" action="Ver catálogo" onAction={() => onNavigate("cabanas")} />
          <MetricCard icon={FileText} iconClassName="bg-gold/20 text-gold-foreground" label="Solicitudes nuevas" value={String(newRequests)} sub="Sin responder" action="Ver solicitudes" onAction={() => onNavigate("solicitudes")} />
          <MetricCard icon={Users} iconClassName="bg-[oklch(0.9_0.04_240)] text-[oklch(0.45_0.12_255)]" label="Pendientes de propietario" value={String(pendingOwners)} sub="Requieren contacto" action="Ver confirmaciones" onAction={() => onNavigate("confirmaciones")} />
          <MetricCard icon={DollarSign} iconClassName="bg-primary/10 text-primary" label="Disponibilidad confirmada" value={String(confirmedRequests)} sub="Solicitudes actualizadas" action="Ver seguimiento" onAction={() => onNavigate("solicitudes")} />
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Catálogo de cabañas asociadas</h2>
              <p className="text-sm text-muted-foreground">Propietarios, contacto, comisión y estado de consulta.</p>
            </div>
            <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" aria-hidden /> Agregar cabaña
            </button>
          </div>
          <CabinsTable cabins={cabins} onEdit={onEdit} onCycleStatus={onCycleStatus} />
          <p className="mt-4 text-xs text-muted-foreground">Mostrando 1 a {cabins.length} de {cabins.length} cabañas</p>
        </section>
      </div>

      <div className="min-w-0 space-y-6">
        <RecentRequestsPanel items={initialData.requests} onOpen={() => onNavigate("solicitudes")} />
        <QuickActionsPanel onAction={(key) => key === "add" ? onAdd() : onNavigate(key)} />
        <OccupancyDonutPanel segments={occupancySegments} />
      </div>
    </div>
  )
}

/* ---------------- PRO dashboard ---------------- */

function ProDashboard({
  initialData,
  cabins,
  requests,
  onRequestStatus,
  onNavigate,
  onAdd,
}: {
  initialData: AdminPanelInitialData
  cabins: Cabin[]
  requests: ClientRequest[]
  onRequestStatus: (id: string, status: RequestStatus) => void
  onNavigate: (key: SectionKey) => void
  onAdd: () => void
}) {
  const activeCount = cabins.filter((c) => c.status !== "no-disponible").length
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={FileText} label="Solicitudes nuevas" value={String(requests.filter((item) => item.status === "nueva").length)} sub="Recibidas por la plataforma" action="Ver solicitudes" onAction={() => onNavigate("solicitudes")} />
          <MetricCard icon={Users} iconClassName="bg-gold/20 text-gold-foreground" label="Propietarios pendientes" value={String(requests.filter((item) => ["nueva", "pendiente-propietario", "propietario-contactado"].includes(item.status)).length)} sub="Requieren seguimiento" action="Abrir confirmaciones" onAction={() => onNavigate("confirmaciones")} />
          <MetricCard icon={Home} iconClassName="bg-primary/10 text-primary" label="Disponibilidades confirmadas" value={String(cabins.filter((item) => item.status === "confirmada").length)} sub={`${activeCount} cabañas consultables`} action="Gestionar catálogo" onAction={() => onNavigate("cabanas")} />
          <MetricCard icon={BookMarked} iconClassName="bg-[oklch(0.9_0.04_240)] text-[oklch(0.45_0.12_255)]" label="Reservaciones confirmadas" value="24" sub="Con respuesta del propietario" action="Ver reservaciones" onAction={() => onNavigate("reservaciones")} />
          <MetricCard icon={MessageCircle} label="Sin seguimiento" value="4" sub="Clientes por contactar" action="Ver solicitudes" onAction={() => onNavigate("solicitudes")} />
          <MetricCard icon={DollarSign} iconClassName="bg-gold/20 text-gold-foreground" label="Comisión estimada" value={`$${currency(18450)}`} suffix="MXN" sub="Cálculo de la demo" action="Ver comisiones" onAction={() => onNavigate("comisiones")} />
          <MetricCard icon={BookMarked} label="Próximas llegadas" value="6" sub="Siete días siguientes" action="Ver calendario" onAction={() => onNavigate("calendario")} />
          <MetricCard icon={Users} label="Propietarios activos" value="4" sub="Con cabañas asociadas" action="Ver directorio" onAction={() => onNavigate("propietarios")} />
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Confirmaciones pendientes con propietarios</h2><p className="text-sm text-muted-foreground">Actualiza el contacto sin salir del dashboard.</p></div><button type="button" onClick={() => onNavigate("confirmaciones")} className="text-sm font-medium text-primary hover:underline">Ver todas</button></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">{requests.filter((item) => ["nueva", "pendiente-propietario", "propietario-contactado"].includes(item.status)).slice(0, 3).map((request) => <article key={request.id} className="rounded-xl border border-border p-3"><p className="font-medium">{request.cabin}</p><p className="text-xs text-muted-foreground">{request.checkIn} – {request.checkOut} · {request.guests} huéspedes</p><p className="mt-2 text-sm">{request.ownerName}</p><div className="mt-3 flex gap-2"><a href={`tel:${request.ownerPhone.replace(/\s/g, "")}`} onClick={() => onRequestStatus(request.id, "propietario-contactado")} className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted">Contactar</a><button type="button" onClick={() => onRequestStatus(request.id, "disponible-confirmada")} className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Confirmar</button></div></article>)}</div>
        </section>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Ocupación del mes</h3>
            <div className="mt-4 flex items-center gap-4">
              <DonutChart
                size={120}
                thickness={18}
                centerValue="68%"
                centerLabel="Ocupación"
                segments={[
                  { label: "Reservadas", value: 62, color: "var(--chart-1)" },
                  { label: "Por confirmar", value: 30, color: "var(--chart-2)" },
                  { label: "No disponibles", value: 8, color: "var(--chart-3)" },
                ]}
              />
              <ul className="flex flex-col gap-2 text-xs">
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" />Reservadas 68%</li>
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-2)]" />Por confirmar 32%</li>
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-3)]" />No disp. 10%</li>
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Ingresos</h3>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              ${currency(128450)} <span className="text-xs font-normal text-muted-foreground">MXN</span>
            </p>
            <p className="flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="size-3.5" aria-hidden /> +18.6% vs. mes anterior
            </p>
            <div className="mt-2 h-24">
              <AreaLineChart data={revenueSeries} height={96} />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Reservaciones por estado</h3>
            <div className="mt-4 flex items-center gap-4">
              <DonutChart
                size={120}
                thickness={18}
                centerValue="42"
                centerLabel="Total"
                segments={[
                  { label: "Confirmadas", value: 24, color: "var(--chart-1)" },
                  { label: "Pendientes", value: 10, color: "var(--chart-2)" },
                  { label: "Canceladas", value: 8, color: "var(--chart-3)" },
                ]}
              />
              <ul className="flex flex-col gap-2 text-xs">
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" />Confirmadas 24</li>
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-2)]" />Pendientes 10</li>
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-3)]" />Canceladas 8</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Occupancy calendar */}
        <OccupancyCalendar days={initialData.calendarDays} cabins={initialData.calendarCabins} bookings={initialData.calendarBookings} />
      </div>

      {/* Right column */}
      <div className="min-w-0 space-y-6">
        <RecentActivityPanel items={initialData.recentActivity} onOpen={() => onNavigate("reservaciones")} />
        <PendingTasksPanel items={initialData.pendingTasks} onOpen={() => onNavigate("limpieza")} />
        <UpcomingArrivalsPanel items={initialData.upcomingArrivals} onOpen={() => onNavigate("reservaciones")} />
        <QuickActionsGridPanel onAction={(key) => key === "add" ? onAdd() : onNavigate(key)} />
      </div>
    </div>
  )
}
