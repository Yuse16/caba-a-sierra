"use client"

import {
  MapPin,
  Users,
  Home,
  CalendarDays,
  Search,
  SlidersHorizontal,
  Tag,
  DollarSign,
  Sparkles,
  BedDouble,
  X,
} from "lucide-react"
import type { Version } from "@/components/demo/demo-context"

type Field = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function FieldBox({ field }: { field: Field }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2">
      <span className="text-primary">{field.icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-muted-foreground">{field.label}</span>
        <span className="block truncate text-sm font-medium text-foreground">{field.value}</span>
      </span>
    </div>
  )
}

export function SearchBar({
  version,
  guests,
  onGuestsChange,
  onSearch,
}: {
  version: Version
  guests: number
  onGuestsChange: (n: number) => void
  onSearch: () => void
}) {
  const isPro = version === "pro"

  const startFields: Field[] = [
    { icon: <MapPin className="size-4" aria-hidden />, label: "Ubicación", value: "Arteaga, Coahuila" },
    {
      icon: <Users className="size-4" aria-hidden />,
      label: "Huéspedes",
      value: `${guests} huéspedes`,
    },
    { icon: <Home className="size-4" aria-hidden />, label: "Tipo de cabaña", value: "Cualquiera" },
  ]

  const proFields: Field[] = [
    { icon: <MapPin className="size-4" aria-hidden />, label: "Ubicación", value: "Arteaga, Coahuila" },
    { icon: <CalendarDays className="size-4" aria-hidden />, label: "Entrada", value: "14 jun 2025" },
    { icon: <CalendarDays className="size-4" aria-hidden />, label: "Salida", value: "16 jun 2025" },
    {
      icon: <Users className="size-4" aria-hidden />,
      label: "Huéspedes",
      value: `${guests} huéspedes`,
    },
  ]

  const fields = isPro ? proFields : startFields

  return (
    <div className="rounded-2xl bg-card p-3 shadow-lg ring-1 ring-border">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col divide-y divide-border md:flex-row md:divide-x md:divide-y-0">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <FieldBox field={f} />
              {f.label === "Huéspedes" && (
                <div className="flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    aria-label="Menos huéspedes"
                    onClick={() => onGuestsChange(Math.max(1, guests - 1))}
                    className="inline-flex size-6 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="Más huéspedes"
                    onClick={() => onGuestsChange(Math.min(16, guests + 1))}
                    className="inline-flex size-6 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Search className="size-4" aria-hidden />
          {isPro ? "Buscar disponibilidad" : "Buscar cabañas"}
        </button>
      </div>

      {isPro && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {[
            { icon: <SlidersHorizontal className="size-3.5" aria-hidden />, label: "Filtros avanzados" },
            { icon: <Home className="size-3.5" aria-hidden />, label: "Tipo de cabaña" },
            { icon: <DollarSign className="size-3.5" aria-hidden />, label: "Rango de precio" },
            { icon: <Sparkles className="size-3.5" aria-hidden />, label: "Amenidades" },
            { icon: <BedDouble className="size-3.5" aria-hidden />, label: "Habitaciones" },
          ].map((f) => (
            <button
              key={f.label}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              {f.icon}
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
