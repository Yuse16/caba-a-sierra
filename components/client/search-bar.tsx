"use client"

import { useState } from "react"
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  DollarSign,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react"

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

const controlClass =
  "h-10 w-full min-w-0 rounded-lg border-0 bg-transparent px-0 text-sm font-semibold text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus-visible:ring-0"

const selectClass = `${controlClass} appearance-none pr-7`

const actionFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  )
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 hover:border-primary/30">
      {children}
    </div>
  )
}

export function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: ClientSearchState
  onChange: (next: ClientSearchState) => void
  onSearch: () => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const update = <K extends keyof ClientSearchState>(key: K, nextValue: ClientSearchState[K]) =>
    onChange({ ...value, [key]: nextValue })

  const reset = () => {
    onChange(initialClientSearch)
    setAdvancedOpen(false)
  }

  return (
    <div className="rounded-2xl border border-forest-dark/10 bg-card p-3 shadow-[0_18px_55px_rgba(22,52,36,0.14)] sm:p-4">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.35fr_0.85fr_0.85fr_0.82fr_auto] xl:items-stretch">
        <FieldShell>
          <label>
            <FieldLabel icon={<MapPin className="size-3.5" aria-hidden />}>Destino</FieldLabel>
            <input
              value={value.query}
              onChange={(event) => update("query", event.target.value)}
              placeholder="Arteaga, cabaña o amenidad"
              className={controlClass}
            />
          </label>
        </FieldShell>

        <FieldShell>
          <label>
            <FieldLabel icon={<CalendarDays className="size-3.5" aria-hidden />}>Entrada</FieldLabel>
            <input
              type="date"
              value={value.checkIn}
              max={value.checkOut}
              onChange={(event) => update("checkIn", event.target.value)}
              className={controlClass}
            />
          </label>
        </FieldShell>

        <FieldShell>
          <label>
            <FieldLabel icon={<CalendarDays className="size-3.5" aria-hidden />}>Salida</FieldLabel>
            <input
              type="date"
              value={value.checkOut}
              min={value.checkIn}
              onChange={(event) => update("checkOut", event.target.value)}
              className={controlClass}
            />
          </label>
        </FieldShell>

        <FieldShell>
          <div>
            <FieldLabel icon={<Users className="size-3.5" aria-hidden />}>Huéspedes</FieldLabel>
            <div className="flex h-10 items-center justify-between gap-2">
              <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                {value.guests} {value.guests === 1 ? "huésped" : "huéspedes"}
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Reducir huéspedes"
                  onClick={() => update("guests", Math.max(1, value.guests - 1))}
                  className={`inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary ${actionFocus}`}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="Agregar huésped"
                  onClick={() => update("guests", Math.min(16, value.guests + 1))}
                  className={`inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary ${actionFocus}`}
                >
                  +
                </button>
              </span>
            </div>
          </div>
        </FieldShell>

        <button
          type="button"
          onClick={onSearch}
          className={`inline-flex min-h-[66px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-forest-dark md:col-span-2 xl:col-span-1 ${actionFocus}`}
        >
          <Search className="size-4" aria-hidden />
          Buscar cabañas
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="filtros-avanzados"
          onClick={() => setAdvancedOpen((open) => !open)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/8 ${actionFocus}`}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Más filtros
          <ChevronDown
            className={`size-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={reset}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${actionFocus}`}
        >
          <X className="size-3.5" aria-hidden />
          Limpiar filtros
        </button>
      </div>

      {advancedOpen && (
        <div
          id="filtros-avanzados"
          className="mt-3 grid gap-2 rounded-xl border border-border bg-secondary/45 p-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FieldShell>
            <label>
              <FieldLabel icon={<Home className="size-3.5" aria-hidden />}>Tipo de cabaña</FieldLabel>
              <span className="relative block">
                <select
                  value={value.cabinType}
                  onChange={(event) =>
                    update("cabinType", event.target.value as ClientSearchState["cabinType"])
                  }
                  className={selectClass}
                >
                  <option value="todas">Cualquiera</option>
                  <option value="romantica">Romántica</option>
                  <option value="familiar">Familiar</option>
                  <option value="grupal">Para grupos</option>
                  <option value="premium">Premium</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>

          <FieldShell>
            <label>
              <FieldLabel icon={<DollarSign className="size-3.5" aria-hidden />}>Precio máximo</FieldLabel>
              <span className="relative block">
                <select
                  value={value.maxPrice}
                  onChange={(event) => update("maxPrice", Number(event.target.value))}
                  className={selectClass}
                >
                  <option value={3000}>$3,000 MXN</option>
                  <option value={4500}>$4,500 MXN</option>
                  <option value={7000}>$7,000 MXN</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>

          <FieldShell>
            <label>
              <FieldLabel icon={<Sparkles className="size-3.5" aria-hidden />}>Amenidad</FieldLabel>
              <span className="relative block">
                <select
                  value={value.amenity}
                  onChange={(event) => update("amenity", event.target.value)}
                  className={selectClass}
                >
                  <option value="todas">Todas</option>
                  <option value="Chimenea">Chimenea</option>
                  <option value="WiFi">WiFi</option>
                  <option value="Jacuzzi">Jacuzzi</option>
                  <option value="Pet friendly">Pet friendly</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>

          <FieldShell>
            <label>
              <FieldLabel icon={<BedDouble className="size-3.5" aria-hidden />}>Habitaciones</FieldLabel>
              <span className="relative block">
                <select
                  value={value.bedrooms}
                  onChange={(event) => update("bedrooms", Number(event.target.value))}
                  className={selectClass}
                >
                  <option value={0}>Cualquiera</option>
                  <option value={1}>1 o más</option>
                  <option value={2}>2 o más</option>
                  <option value={3}>3 o más</option>
                  <option value={4}>4 o más</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>
        </div>
      )}
    </div>
  )
}
