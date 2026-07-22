"use client"

import { Calendar, ChevronDown, Menu } from "lucide-react"

export function AdminHeader({
  title,
  subtitle,
  dateLabel,
  showUser,
  onMenu,
  onDate,
  onProfile,
}: {
  title: string
  subtitle: string
  dateLabel: string
  showUser?: boolean
  onMenu?: () => void
  onDate?: () => void
  onProfile?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg border border-border p-2 text-foreground lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onDate} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {dateLabel}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {showUser ? (
          <button type="button" onClick={onProfile} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 hover:bg-accent">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              JS
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-foreground">Jorge Sierra</span>
              <span className="block text-xs text-muted-foreground">Administrador</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
