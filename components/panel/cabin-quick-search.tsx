"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { MapPin, Search, UserRound, X } from "lucide-react"
import { useAdminCabins } from "./cabins-provider"

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim()
}

export function CabinQuickSearch() {
  const { cabins, ready, error } = useAdminCabins()
  const [query, setQuery] = useState("")
  const normalizedQuery = normalizeSearch(query)

  const matches = useMemo(() => {
    if (!normalizedQuery) return []

    return cabins
      .filter((cabin) => !cabin.archivedAt)
      .filter((cabin) =>
        normalizeSearch([
          cabin.name,
          cabin.location,
          cabin.zone,
          cabin.owner?.name ?? "",
        ].join(" ")).includes(normalizedQuery),
      )
      .slice(0, 8)
  }, [cabins, normalizedQuery])

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8" aria-label="Buscar cabaña">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label htmlFor="panel-cabin-search" className="text-sm font-semibold text-foreground">
          Buscar cabaña
        </label>
        <p className="mt-1 text-xs text-muted-foreground">Escribe el nombre, zona, ubicación o propietario para abrirla directamente.</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="panel-cabin-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. El Pinar"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-11 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {normalizedQuery && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background" role="region" aria-live="polite">
            {!ready && <p className="p-4 text-sm text-muted-foreground">Buscando cabañas…</p>}
            {ready && error && <p className="p-4 text-sm text-destructive">No pudimos consultar las cabañas.</p>}
            {ready && !error && matches.length === 0 && <p className="p-4 text-sm text-muted-foreground">No encontramos una cabaña activa con “{query.trim()}”.</p>}
            {ready && !error && matches.map((cabin) => (
              <Link
                key={cabin.id}
                href={`/panel/cabanas/${cabin.id}`}
                className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{cabin.name}</span>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {(cabin.zone || cabin.location) && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{cabin.zone || cabin.location}</span>}
                    {cabin.owner?.name && <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" aria-hidden />{cabin.owner.name}</span>}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-primary">Abrir ficha</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
