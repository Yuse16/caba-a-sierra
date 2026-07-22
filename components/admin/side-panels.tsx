"use client"

import {
  Bell,
  Home,
  FileText,
  MessageSquare,
  Globe,
  Settings,
  CheckCircle2,
  Clock,
  Sparkles,
  Megaphone,
  BarChart3,
  CreditCard,
  Wrench,
} from "lucide-react"
import { StatusBadge, requestStatusTone } from "@/components/shared/status-badge"
import {
  requests,
  requestStatusLabel,
  recentActivity,
  pendingTasks,
  upcomingArrivals,
  initials,
} from "@/lib/demo-data"
import type { SectionKey } from "./nav-config"

function PanelCard({
  title,
  action,
  onAction,
  children,
}: {
  title: string
  action?: string
  onAction?: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action ? (
          <button type="button" onClick={onAction} className="text-xs font-medium text-primary hover:underline">{action}</button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials(name)}
    </span>
  )
}

/* ---------- START panels ---------- */

export function RecentRequestsPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <PanelCard title="Solicitudes recientes" action="Ver todas" onAction={onOpen}>
      <ul className="flex flex-col gap-4">
        {requests.map((r) => (
          <li key={r.id} className="flex items-center gap-3">
            <Avatar name={r.client} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.client}</p>
              <p className="truncate text-xs text-muted-foreground">{r.cabin}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>
            <StatusBadge tone={requestStatusTone[r.status]}>
              {requestStatusLabel[r.status]}
            </StatusBadge>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

const quickActionsStart: { icon: typeof Home; label: string; key: SectionKey | "add"; badge?: number }[] = [
  { icon: Home, label: "Agregar nueva cabaña", key: "add" },
  { icon: FileText, label: "Ver todas las solicitudes", key: "solicitudes", badge: 8 },
  { icon: MessageSquare, label: "Enviar mensaje a cliente", key: "mensajes" },
  { icon: Globe, label: "Editar página principal", key: "paginas" },
  { icon: Settings, label: "Configuración general", key: "configuracion" },
]

export function QuickActionsPanel({ onAction }: { onAction: (key: SectionKey | "add") => void }) {
  return (
    <PanelCard title="Acciones rápidas">
      <ul className="flex flex-col gap-2">
        {quickActionsStart.map((a) => (
          <li key={a.label}>
            <button type="button" onClick={() => onAction(a.key)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent">
              <a.icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1">{a.label}</span>
              {a.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold/25 px-1.5 text-xs font-semibold text-gold-foreground">
                  {a.badge}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

export function OccupancyDonutPanel({
  segments,
}: {
  segments: { label: string; count: number; percent: string; color: string }[]
}) {
  const total = segments.reduce((s, x) => s + x.count, 0)
  const radius = 42
  const circ = 2 * Math.PI * radius
  return (
    <PanelCard title="Estado de consultas (hoy)">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
          {segments.map((s, index) => {
            const len = (s.count / total) * circ
            const offset = segments
              .slice(0, index)
              .reduce((sum, segment) => sum + (segment.count / total) * circ, 0)
            return (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            )
          })}
        </svg>
        <ul className="flex flex-1 flex-col gap-2.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-muted-foreground">{s.label}</span>
              <span className="font-medium text-foreground">{s.percent}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelCard>
  )
}

/* ---------- PRO panels ---------- */

const activityIcons: Record<string, typeof Bell> = {
  reservation: CheckCircle2,
  payment: CreditCard,
  request: MessageSquare,
  cleaning: Sparkles,
  maintenance: Wrench,
}

export function RecentActivityPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <PanelCard title="Actividad reciente" action="Ver todas" onAction={onOpen}>
      <ul className="flex flex-col gap-4">
        {recentActivity.map((a) => {
          const Icon = activityIcons[a.type] ?? Bell
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-foreground">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{a.time}</span>
            </li>
          )
        })}
      </ul>
    </PanelCard>
  )
}

export function PendingTasksPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <PanelCard title="Tareas pendientes" action="Ver todas" onAction={onOpen}>
      <ul className="flex flex-col gap-3">
        {pendingTasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              {t.title === "Limpieza" ? (
                <Sparkles className="size-4" aria-hidden />
              ) : t.title === "Mantenimiento" ? (
                <Wrench className="size-4" aria-hidden />
              ) : (
                <Clock className="size-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {t.title} – {t.cabin}
              </p>
              <p className="truncate text-xs text-muted-foreground">{t.when}</p>
            </div>
            <StatusBadge tone={t.status === "Pendiente" ? "warning" : "info"}>
              {t.status}
            </StatusBadge>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

export function UpcomingArrivalsPanel({ onOpen }: { onOpen: () => void }) {
  return (
    <PanelCard title="Próximas llegadas" action="Ver todas" onAction={onOpen}>
      <ul className="flex flex-col gap-4">
        {upcomingArrivals.map((a) => (
          <li key={a.id} className="flex items-center gap-3">
            <Avatar name={a.client} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{a.client}</p>
              <p className="truncate text-xs text-muted-foreground">{a.cabin}</p>
              <p className="text-xs text-muted-foreground">{a.dates}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">{a.guests} pers.</span>
              <StatusBadge tone="success">{a.status}</StatusBadge>
            </div>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

const quickActionsPro: { icon: typeof Home; label: string; key: SectionKey | "add" }[] = [
  { icon: Home, label: "Agregar cabaña", key: "add" },
  { icon: Megaphone, label: "Nueva promoción", key: "promociones" },
  { icon: MessageSquare, label: "Enviar mensaje", key: "mensajes" },
  { icon: BarChart3, label: "Generar reporte", key: "reportes" },
]

export function QuickActionsGridPanel({ onAction }: { onAction: (key: SectionKey | "add") => void }) {
  return (
    <PanelCard title="Acciones rápidas">
      <div className="grid grid-cols-4 gap-2">
        {quickActionsPro.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => onAction(a.key)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-3 text-center transition-colors hover:bg-accent"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <a.icon className="size-4" aria-hidden />
            </span>
            <span className="text-xs font-medium leading-tight text-foreground">{a.label}</span>
          </button>
        ))}
      </div>
    </PanelCard>
  )
}
