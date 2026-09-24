"use client"

import { useState } from "react"
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  Home,
  MapPin,
  PawPrint,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Waves,
  X,
} from "lucide-react"
import { type ClientSearchState, type SearchOptions } from "@/lib/public-search"

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
  options,
  onChange,
  onSearch,
  onReset,
  dateError,
  resultCount,
}: {
  value: ClientSearchState
  options: SearchOptions
  onChange: (next: Partial<ClientSearchState>) => void
  onSearch: () => void
  onReset: () => void
  dateError: string | null
  resultCount: number
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const update = <K extends keyof ClientSearchState>(key: K, nextValue: ClientSearchState[K]) =>
    onChange({ [key]: nextValue })

  const reset = () => {
    setAdvancedOpen(false)
    onReset()
  }

  const poolLabel: Record<ClientSearchState["pool"], string> = {
    todas: "Cualquiera",
    none: "Sin alberca",
    standard: "Alberca",
    heated: "Alberca climatizada",
  }

  const petsLabel: Record<ClientSearchState["pets"], string> = {
    todas: "Cualquiera",
    admitidas: "Pet friendly",
    "no-admitidas": "Sin mascotas",
  }

  const bedTypeLabel: Record<string, string> = {
    individual: "Individual",
    matrimonial: "Matrimonial",
    king: "King size",
    queen: "Queen",
    litera: "Litera",
    "sofa-cama": "Sofá cama",
    otro: "Otro",
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
              placeholder="Arteaga, cabaña, zona o amenidad"
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
              max={value.checkOut || undefined}
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
              min={value.checkIn || undefined}
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
                  className={`inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary ${actionFocus}`}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="Agregar huésped"
                  onClick={() => update("guests", Math.min(options.maxGuests, value.guests + 1))}
                  className={`inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-base font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary ${actionFocus}`}
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

      {dateError && (
        <p className="mt-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">
          {dateError}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
          {resultCount} {resultCount === 1 ? "cabaña" : "cabañas"} disponibles
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="filtros-avanzados"
          onClick={() => setAdvancedOpen((open) => !open)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/8 ${actionFocus}`}
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
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${actionFocus}`}
        >
          <X className="size-3.5" aria-hidden />
          Limpiar filtros
        </button>
      </div>

      {advancedOpen && (
        <div
          id="filtros-avanzados"
          className="mt-3 grid gap-2 rounded-xl border border-border bg-secondary/45 p-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {options.cabinTypes.length > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<Home className="size-3.5" aria-hidden />}>Tipo de cabaña</FieldLabel>
                <span className="relative block">
                  <select
                    value={value.cabinType}
                    onChange={(event) => update("cabinType", event.target.value)}
                    className={selectClass}
                  >
                    <option value="todas">Cualquiera</option>
                    {options.cabinTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}

          <FieldShell>
            <label>
              <FieldLabel icon={<BedDouble className="size-3.5" aria-hidden />}>Habitaciones exactas</FieldLabel>
              <span className="relative block">
                <select
                  value={String(value.bedrooms)}
                  onChange={(event) => update("bedrooms", Number(event.target.value))}
                  className={selectClass}
                >
                  <option value={0}>Cualquiera</option>
                  {Array.from({ length: Math.max(0, options.maxBedrooms) }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "habitación" : "habitaciones"}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>

          {options.maxBeds > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<BedDouble className="size-3.5" aria-hidden />}>Camas mínimas</FieldLabel>
                <span className="relative block">
                  <select
                    value={String(value.minBeds)}
                    onChange={(event) => update("minBeds", Number(event.target.value))}
                    className={selectClass}
                  >
                    <option value={0}>Cualquiera</option>
                    {Array.from({ length: options.maxBeds }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>Al menos {count} {count === 1 ? "cama" : "camas"}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}

          {options.bedTypes.length > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<BedDouble className="size-3.5" aria-hidden />}>Tipo de cama</FieldLabel>
                <span className="relative block">
                  <select value={value.bedType} onChange={(event) => update("bedType", event.target.value)} className={selectClass}>
                    <option value="todas">Cualquier tipo</option>
                    {options.bedTypes.map((type) => <option key={type} value={type}>{bedTypeLabel[type] ?? type}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}

          {options.zones.length > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<MapPin className="size-3.5" aria-hidden />}>Zona</FieldLabel>
                <span className="relative block">
                  <select value={value.zone} onChange={(event) => update("zone", event.target.value)} className={selectClass}>
                    <option value="todas">Cualquiera</option>
                    {options.zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}

          {options.poolOptions.length > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<Waves className="size-3.5" aria-hidden />}>Alberca</FieldLabel>
                <span className="relative block">
                  <select value={value.pool} onChange={(event) => update("pool", event.target.value as ClientSearchState["pool"])} className={selectClass}>
                    {(["todas", ...options.poolOptions] as Array<ClientSearchState["pool"]>).map((pool) => (
                      <option key={pool} value={pool}>{poolLabel[pool]}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}

          <FieldShell>
            <label>
              <FieldLabel icon={<PawPrint className="size-3.5" aria-hidden />}>Mascotas</FieldLabel>
              <span className="relative block">
                <select value={value.pets} onChange={(event) => update("pets", event.target.value as ClientSearchState["pets"])} className={selectClass}>
                  {(Object.keys(petsLabel) as Array<ClientSearchState["pets"]>).map((pets) => (
                    <option key={pets} value={pets}>{petsLabel[pets]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
              </span>
            </label>
          </FieldShell>

          {options.amenities.length > 0 && (
            <FieldShell>
              <label>
                <FieldLabel icon={<Sparkles className="size-3.5" aria-hidden />}>Amenidad</FieldLabel>
                <span className="relative block">
                  <select value={value.amenity} onChange={(event) => update("amenity", event.target.value)} className={selectClass}>
                    <option value="todas">Todas</option>
                    {options.amenities.map((amenity) => <option key={amenity} value={amenity}>{amenity}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1 top-3 size-4 text-muted-foreground" aria-hidden />
                </span>
              </label>
            </FieldShell>
          )}
        </div>
      )}
    </div>
  )
}