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
  X,
} from "lucide-react"
import type { Version } from "@/components/demo/demo-context"
import {
  cabins as initialCabins,
  currency,
  type Cabin,
  type CabinStatus,
} from "@/lib/demo-data"
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

const statusCycle: CabinStatus[] = ["disponible", "ocupada", "no-disponible"]
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
}

export function AdminPanel({ version }: { version: Version }) {
  const isPro = version === "pro"
  const [active, setActive] = useState<SectionKey>("dashboard")
  const [cabins, setCabins] = useState<Cabin[]>(initialCabins.slice(0, 6))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const counts = useMemo(() => {
    const disponible = cabins.filter((c) => c.status === "disponible").length
    const ocupada = cabins.filter((c) => c.status === "ocupada").length
    const noDisp = cabins.filter((c) => c.status === "no-disponible").length
    const total = cabins.length
    const pct = (n: number) => `${n} (${Math.round((n / total) * 100)}%)`
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
    { label: "Disponibles", count: counts.disponible, percent: counts.pct(counts.disponible), color: "var(--chart-1)" },
    { label: "Ocupadas", count: counts.ocupada, percent: counts.pct(counts.ocupada), color: "var(--chart-3)" },
    { label: "No disponibles", count: counts.noDisp, percent: counts.pct(counts.noDisp), color: "var(--muted-foreground)" },
  ]

  const handleSelect = (key: SectionKey) => {
    setActive(key)
    setDrawerOpen(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-40px)] bg-background">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-10 hidden h-[calc(100vh-40px)] w-64 shrink-0 border-r border-sidebar-border lg:block">
        <AdminSidebar version={version} active={active} onSelect={handleSelect} />
      </aside>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/40"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-sidebar-border bg-sidebar shadow-xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="size-5" aria-hidden />
            </button>
            <AdminSidebar version={version} active={active} onSelect={handleSelect} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <AdminHeader
          title={active === "dashboard" ? "Dashboard" : (sectionMeta[active]?.title ?? "Dashboard")}
          subtitle={active === "dashboard" ? "Resumen general de tu negocio" : "Panel administrativo"}
          dateLabel={isPro ? "22 jul – 22 ago 2025" : "22 de julio, 2025"}
          showUser={!isPro}
          onMenu={() => setDrawerOpen(true)}
        />

        <div className="mt-6">
          {active === "dashboard" ? (
            isPro ? (
              <ProDashboard
                cabins={cabins}
                onEdit={() => {}}
                onCycleStatus={cycleStatus}
                occupancySegments={occupancySegments}
              />
            ) : (
              <StartDashboard
                cabins={cabins}
                onEdit={() => {}}
                onCycleStatus={cycleStatus}
                occupancySegments={occupancySegments}
              />
            )
          ) : active === "cabanas" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Administra tus cabañas</h2>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Plus className="size-4" aria-hidden /> Agregar cabaña
                </button>
              </div>
              <CabinsTable cabins={cabins} onEdit={() => {}} onCycleStatus={cycleStatus} />
            </div>
          ) : active === "calendario" ? (
            <OccupancyCalendar />
          ) : (
            <SectionStub
              title={sectionMeta[active]?.title ?? "Sección"}
              desc={sectionMeta[active]?.desc ?? "Contenido de demostración."}
            />
          )}
        </div>
      </main>
    </div>
  )
}

/* ---------------- START dashboard ---------------- */

function StartDashboard({
  cabins,
  onEdit,
  onCycleStatus,
  occupancySegments,
}: {
  cabins: Cabin[]
  onEdit: (c: Cabin) => void
  onCycleStatus: (id: string) => void
  occupancySegments: { label: string; count: number; percent: string; color: string }[]
}) {
  const active = cabins.filter((c) => c.status !== "no-disponible").length
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Home} label="Cabañas activas" value={String(active)} sub="En operación" action="Ver todas" />
          <MetricCard icon={FileText} iconClassName="bg-gold/20 text-gold-foreground" label="Solicitudes nuevas" value="8" sub="Sin responder" action="Ver solicitudes" />
          <MetricCard icon={Users} iconClassName="bg-[oklch(0.9_0.04_240)] text-[oklch(0.45_0.12_255)]" label="Solicitudes este mes" value="32" sub="+12 vs. mes anterior" action="Ver historial" />
          <MetricCard icon={DollarSign} iconClassName="bg-primary/10 text-primary" label="Ingresos potenciales" value={`$${currency(98450)}`} suffix="MXN" sub="En solicitudes activas" action="Ver detalle" />
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Cabañas</h2>
              <p className="text-sm text-muted-foreground">Administra tus cabañas</p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" aria-hidden /> Agregar cabaña
            </button>
          </div>
          <CabinsTable cabins={cabins} onEdit={onEdit} onCycleStatus={onCycleStatus} />
          <p className="mt-4 text-xs text-muted-foreground">Mostrando 1 a {cabins.length} de {cabins.length} cabañas</p>
        </section>
      </div>

      <div className="space-y-6">
        <RecentRequestsPanel />
        <QuickActionsPanel />
        <OccupancyDonutPanel segments={occupancySegments} />
      </div>
    </div>
  )
}

/* ---------------- PRO dashboard ---------------- */

function ProDashboard({
  cabins,
  onEdit,
  onCycleStatus,
  occupancySegments,
}: {
  cabins: Cabin[]
  onEdit: (c: Cabin) => void
  onCycleStatus: (id: string) => void
  occupancySegments: { label: string; count: number; percent: string; color: string }[]
}) {
  const activeCount = cabins.filter((c) => c.status !== "no-disponible").length
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={DollarSign} label="Ingresos confirmados" value={`$${currency(128450)}`} suffix="MXN" trend="+18.6% vs. mes anterior" action="Ver reporte financiero" />
          <MetricCard icon={BookMarked} iconClassName="bg-gold/20 text-gold-foreground" label="Reservaciones" value="42" sub="24 confirmadas · 10 pendientes · 8 canceladas" action="Ver reservaciones" />
          <MetricCard icon={Users} iconClassName="bg-[oklch(0.9_0.04_240)] text-[oklch(0.45_0.12_255)]" label="Ocupación promedio" value="68%" trend="+9% vs. mes anterior" action="Ver calendario" />
          <MetricCard icon={Home} iconClassName="bg-primary/10 text-primary" label="Cabañas activas" value={`${activeCount} / ${cabins.length}`} sub="Gestión de inventario" action="Gestionar cabañas" />
        </div>

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
                  { label: "Disponibles", value: 30, color: "var(--chart-2)" },
                  { label: "No disponibles", value: 8, color: "var(--chart-3)" },
                ]}
              />
              <ul className="flex flex-col gap-2 text-xs">
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-1)]" />Reservadas 68%</li>
                <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--chart-2)]" />Disponibles 32%</li>
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
        <OccupancyCalendar />
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <RecentActivityPanel />
        <PendingTasksPanel />
        <UpcomingArrivalsPanel />
        <QuickActionsGridPanel />
      </div>
    </div>
  )
}
