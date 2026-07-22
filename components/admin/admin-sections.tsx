"use client"

import { useState } from "react"
import { BarChart3, Check, CreditCard, FileText, Plus, Save, X } from "lucide-react"
import type {
  Cabin,
  CabinStatus,
  ClientRequest,
  Payment,
  Promotion,
  RequestStatus,
  Reservation,
  ReservationStatus,
} from "@/lib/demo-data"
import {
  currency,
  requestStatusLabel,
  reservationStatusLabel,
} from "@/lib/demo-data"
import {
  requestStatusTone,
  StatusBadge,
} from "@/components/shared/status-badge"
import { AreaLineChart } from "@/components/shared/line-chart"

const panelClass = "rounded-xl border border-border bg-card p-4 sm:p-5"
const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function RequestsSection({
  items,
  onStatusChange,
}: {
  items: ClientRequest[]
  onStatusChange: (id: string, status: RequestStatus) => void
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "")
  const selected = items.find((item) => item.id === selectedId) ?? items[0]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={panelClass}>
        <SectionHeading title="Solicitudes" description="Abre una solicitud y actualiza su seguimiento." />
        <div className="space-y-2">
          {items.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => setSelectedId(request.id)}
              className={`flex w-full flex-wrap items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selected?.id === request.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                {request.client.split(" ").map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{request.client}</span>
                <span className="block truncate text-xs text-muted-foreground">{request.cabin} · {request.date}</span>
              </span>
              <StatusBadge tone={requestStatusTone[request.status]}>{requestStatusLabel[request.status]}</StatusBadge>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <aside className={`${panelClass} h-fit xl:sticky xl:top-16`}>
          <SectionHeading title={selected.client} description={selected.id} />
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted-foreground">Cabaña</dt><dd className="font-medium">{selected.cabin}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Contacto</dt><dd>{selected.email}<br />{selected.phone}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Huéspedes</dt><dd>{selected.guests}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Mensaje</dt><dd className="rounded-lg bg-secondary/60 p-3 leading-relaxed">{selected.message}</dd></div>
          </dl>
          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            Estado de seguimiento
            <select
              value={selected.status}
              onChange={(event) => onStatusChange(selected.id, event.target.value as RequestStatus)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="nueva">Nueva</option>
              <option value="en-revision">En revisión</option>
              <option value="respondida">Respondida</option>
            </select>
          </label>
        </aside>
      )}
    </div>
  )
}

export function ReservationsSection({
  items,
  onStatusChange,
}: {
  items: Reservation[]
  onStatusChange: (id: string, status: ReservationStatus) => void
}) {
  return (
    <section className={panelClass}>
      <SectionHeading title="Reservaciones" description="Gestión simulada de estancias y estados." />
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Reserva</th><th className="p-3">Cliente</th><th className="p-3">Estancia</th><th className="p-3">Total</th><th className="p-3">Estado</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((reservation) => (
              <tr key={reservation.id}>
                <td className="p-3 font-medium">{reservation.id}<span className="block text-xs font-normal text-muted-foreground">{reservation.cabin}</span></td>
                <td className="p-3">{reservation.client}<span className="block text-xs text-muted-foreground">{reservation.guests} huéspedes</span></td>
                <td className="p-3">{reservation.checkIn}<span className="block text-xs text-muted-foreground">a {reservation.checkOut}</span></td>
                <td className="p-3 font-medium">${currency(reservation.total)}</td>
                <td className="p-3">
                  <select
                    aria-label={`Estado de ${reservation.id}`}
                    value={reservation.status}
                    onChange={(event) => onStatusChange(reservation.id, event.target.value as ReservationStatus)}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    {Object.entries(reservationStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function PaymentsSection({ items, onMarkPaid }: { items: Payment[]; onMarkPaid: (id: string) => void }) {
  const total = items.filter((item) => item.status === "pagado").reduce((sum, item) => sum + item.amount, 0)
  return (
    <section className={panelClass}>
      <SectionHeading title="Pagos" description={`Ingresos registrados en la demo: $${currency(total)} MXN`} />
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Pago</th><th className="p-3">Cliente</th><th className="p-3">Método</th><th className="p-3">Monto</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr></thead>
          <tbody className="divide-y divide-border">
            {items.map((payment) => (
              <tr key={payment.id}>
                <td className="p-3 font-medium">{payment.id}<span className="block text-xs font-normal text-muted-foreground">{payment.reservation}</span></td>
                <td className="p-3">{payment.client}</td><td className="p-3">{payment.method}</td><td className="p-3 font-medium">${currency(payment.amount)}</td>
                <td className="p-3"><StatusBadge tone={payment.status === "pagado" ? "success" : payment.status === "pendiente" ? "warning" : "muted"}>{payment.status}</StatusBadge></td>
                <td className="p-3"><button type="button" disabled={payment.status !== "pendiente"} onClick={() => onMarkPaid(payment.id)} className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}><CreditCard className="size-4" />Registrar pago</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Los movimientos son simulados; no se procesa ninguna tarjeta ni transferencia.</p>
    </section>
  )
}

export type OperationTask = {
  id: string
  cabin: string
  detail: string
  when: string
  status: string
  meta: string
}

export function OperationsSection({
  title,
  description,
  items,
  onAdvance,
}: {
  title: string
  description: string
  items: OperationTask[]
  onAdvance: (id: string) => void
}) {
  return (
    <section className={panelClass}>
      <SectionHeading title={title} description={description} />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((task) => (
          <article key={task.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-medium">{task.cabin}</h3><p className="text-sm text-muted-foreground">{task.detail}</p></div><StatusBadge tone={task.status === "Completada" ? "success" : task.status === "En proceso" ? "info" : "warning"}>{task.status}</StatusBadge></div>
            <p className="mt-3 text-xs text-muted-foreground">{task.when} · {task.meta}</p>
            <button type="button" onClick={() => onAdvance(task.id)} disabled={task.status === "Completada"} className={`${secondaryButtonClass} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40`}><Check className="size-4" />Actualizar tarea</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PromotionsSection({ items, onToggle, onAdd }: { items: Promotion[]; onToggle: (id: string) => void; onAdd: () => void }) {
  return (
    <section className={panelClass}>
      <SectionHeading title="Promociones" description="Activa o pausa campañas visibles en la página Pro." action={<button type="button" onClick={onAdd} className={buttonClass}><Plus className="size-4" />Nueva promoción</button>} />
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((promotion) => (
          <article key={promotion.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{promotion.title}</h3><StatusBadge tone={promotion.active ? "success" : "muted"}>{promotion.active ? "Activa" : "Pausada"}</StatusBadge></div>
            <p className="mt-3 text-3xl font-bold text-primary">{promotion.discount}</p><p className="text-sm text-muted-foreground">{promotion.detail}</p>
            <button type="button" onClick={() => onToggle(promotion.id)} className={`${secondaryButtonClass} mt-5 w-full`}>{promotion.active ? "Pausar" : "Activar"}</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export type Season = { id: string; name: string; months: string; modifier: string; color: string }

export function PricingSection({ items, onAdjust }: { items: Season[]; onAdjust: (id: string, direction: number) => void }) {
  return (
    <section className={panelClass}>
      <SectionHeading title="Precios y temporadas" description="Ajusta modificadores simulados por periodo." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((season) => (
          <article key={season.id} className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">{season.name}</p><p className="text-xs text-muted-foreground">{season.months}</p><p className="my-4 text-2xl font-bold text-primary">{season.modifier}</p><div className="flex gap-2"><button type="button" onClick={() => onAdjust(season.id, -5)} className={`${secondaryButtonClass} flex-1`}>− 5%</button><button type="button" onClick={() => onAdjust(season.id, 5)} className={`${secondaryButtonClass} flex-1`}>+ 5%</button></div></article>
        ))}
      </div>
    </section>
  )
}

export function ReportsSection() {
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className={`${panelClass} lg:col-span-2`}>
        <SectionHeading title="Reporte de ingresos" description="Tendencia simulada de los últimos 12 meses." action={<button type="button" onClick={() => setGeneratedAt(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }))} className={buttonClass}><BarChart3 className="size-4" />Generar reporte</button>} />
        <div className="h-64"><AreaLineChart data={[32, 38, 35, 47, 51, 49, 62, 68, 72, 78, 86, 96]} height={240} /></div>
      </section>
      <section className={panelClass}><FileText className="size-8 text-primary" /><h3 className="mt-3 font-semibold">Resumen operativo</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Ocupación</dt><dd className="font-semibold">68%</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Reservaciones</dt><dd className="font-semibold">42</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Ingresos</dt><dd className="font-semibold">$128,450</dd></div></dl>{generatedAt && <p className="mt-5 rounded-lg bg-success/10 p-3 text-xs text-success" role="status">Reporte simulado generado a las {generatedAt}.</p>}</section>
    </div>
  )
}

export function CabinEditorDialog({
  cabin,
  onClose,
  onSave,
}: {
  cabin: Cabin | null | undefined
  onClose: () => void
  onSave: (values: Pick<Cabin, "name" | "location" | "price" | "maxGuests" | "status">) => void
}) {
  const isEditing = cabin !== undefined && cabin !== null
  const [name, setName] = useState(cabin?.name ?? "")
  const [location, setLocation] = useState(cabin?.location ?? "Arteaga, Coahuila")
  const [price, setPrice] = useState(cabin?.price ?? 2500)
  const [maxGuests, setMaxGuests] = useState(cabin?.maxGuests ?? 4)
  const [status, setStatus] = useState<CabinStatus>(cabin?.status ?? "disponible")

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={isEditing ? "Editar cabaña" : "Agregar cabaña"} onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => { event.preventDefault(); onSave({ name, location, price, maxGuests, status }) }}
      >
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{isEditing ? "Editar cabaña" : "Agregar cabaña"}</h2><p className="text-sm text-muted-foreground">Los cambios se conservan durante esta sesión de demo.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Cerrar"><X className="size-5" /></button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Nombre<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Ubicación<input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-medium">Precio por noche<input required min={1} type="number" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-medium">Capacidad máxima<input required min={1} max={30} type="number" value={maxGuests} onChange={(event) => setMaxGuests(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Estado<select value={status} onChange={(event) => setStatus(event.target.value as CabinStatus)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3"><option value="disponible">Disponible</option><option value="ocupada">Ocupada</option><option value="no-disponible">No disponible</option></select></label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancelar</button><button type="submit" className={buttonClass}><Save className="size-4" />Guardar cambios</button></div>
      </form>
    </div>
  )
}
