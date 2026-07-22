"use client"

import { useState } from "react"
import {
  BedDouble,
  CalendarDays,
  DollarSign,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import type { Version } from "@/components/demo/demo-context"

export type ClientSearchState = {
  query: string
  checkIn: string
  checkOut: string
  guests: number
  cabinType: "todas" | "romantica" | "familiar" | "grupal" | "premium"
  maxPrice: number
  amenity: string
  bedrooms: number
}

export const initialClientSearch: ClientSearchState = {
  query: "Arteaga, Coahuila",
  checkIn: "2026-08-14",
  checkOut: "2026-08-16",
  guests: 2,
  cabinType: "todas",
  maxPrice: 7000,
  amenity: "todas",
  bedrooms: 0,
}

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  )
}

const inputClass =
  "h-9 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus:border-ring focus:bg-background"

export function SearchBar({
  version,
  value,
  onChange,
  onSearch,
}: {
  version: Version
  value: ClientSearchState
  onChange: (next: ClientSearchState) => void
  onSearch: () => void
}) {
  const isPro = version === "pro"
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const update = <K extends keyof ClientSearchState>(key: K, nextValue: ClientSearchState[K]) =>
    onChange({ ...value, [key]: nextValue })

  const reset = () => {
    onChange(initialClientSearch)
    setAdvancedOpen(false)
  }

  return (
    <div className="rounded-2xl bg-card p-3 shadow-lg ring-1 ring-border">
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <label className="min-w-0 rounded-xl px-2 py-1">
          <FieldLabel icon={<MapPin className="size-4" aria-hidden />}>Ubicación o cabaña</FieldLabel>
          <input
            value={value.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="Arteaga, cabaña o amenidad"
            className={inputClass}
          />
        </label>

        {isPro ? (
          <>
            <label className="min-w-0 rounded-xl px-2 py-1">
              <FieldLabel icon={<CalendarDays className="size-4" aria-hidden />}>Entrada</FieldLabel>
              <input
                type="date"
                value={value.checkIn}
                max={value.checkOut}
                onChange={(event) => update("checkIn", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="min-w-0 rounded-xl px-2 py-1">
              <FieldLabel icon={<CalendarDays className="size-4" aria-hidden />}>Salida</FieldLabel>
              <input
                type="date"
                value={value.checkOut}
                min={value.checkIn}
                onChange={(event) => update("checkOut", event.target.value)}
                className={inputClass}
              />
            </label>
          </>
        ) : (
          <label className="min-w-0 rounded-xl px-2 py-1 md:col-span-2">
            <FieldLabel icon={<Home className="size-4" aria-hidden />}>Tipo de cabaña</FieldLabel>
            <select
              value={value.cabinType}
              onChange={(event) => update("cabinType", event.target.value as ClientSearchState["cabinType"])}
              className={inputClass}
            >
              <option value="todas">Cualquiera</option>
              <option value="romantica">Romántica</option>
              <option value="familiar">Familiar</option>
              <option value="grupal">Para grupos</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Search className="size-4" aria-hidden />
          {isPro ? "Buscar disponibilidad" : "Buscar cabañas"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Users className="size-3.5 text-primary" aria-hidden />
          <span className="text-xs font-medium text-foreground">{value.guests} huéspedes</span>
          <button
            type="button"
            aria-label="Menos huéspedes"
            onClick={() => update("guests", Math.max(1, value.guests - 1))}
            className="inline-flex size-6 items-center justify-center rounded-md border border-border hover:bg-muted"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Más huéspedes"
            onClick={() => update("guests", Math.min(16, value.guests + 1))}
            className="inline-flex size-6 items-center justify-center rounded-md border border-border hover:bg-muted"
          >
            +
          </button>
        </div>

        {isPro && (
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Filtros avanzados
          </button>
        )}

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
          Limpiar filtros
        </button>
      </div>

      {isPro && advancedOpen && (
        <div className="mt-3 grid gap-3 rounded-xl bg-secondary/40 p-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-muted-foreground">
            <span className="mb-1 flex items-center gap-1"><DollarSign className="size-3.5" />Precio máximo</span>
            <select value={value.maxPrice} onChange={(event) => update("maxPrice", Number(event.target.value))} className={inputClass}>
              <option value={3000}>$3,000 MXN</option>
              <option value={4500}>$4,500 MXN</option>
              <option value={7000}>$7,000 MXN</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            <span className="mb-1 flex items-center gap-1"><Sparkles className="size-3.5" />Amenidad</span>
            <select value={value.amenity} onChange={(event) => update("amenity", event.target.value)} className={inputClass}>
              <option value="todas">Todas</option>
              <option value="Chimenea">Chimenea</option>
              <option value="WiFi">WiFi</option>
              <option value="Jacuzzi">Jacuzzi</option>
              <option value="Pet friendly">Pet friendly</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            <span className="mb-1 flex items-center gap-1"><BedDouble className="size-3.5" />Habitaciones mínimas</span>
            <select value={value.bedrooms} onChange={(event) => update("bedrooms", Number(event.target.value))} className={inputClass}>
              <option value={0}>Cualquiera</option>
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
            </select>
          </label>
        </div>
      )}
    </div>
  )
}
