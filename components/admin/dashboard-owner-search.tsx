"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Home, Mail, MessageCircle, Phone, Search, X } from "lucide-react"
import type { Owner, Cabin } from "@/lib/demo-data"
import { filterDashboardOwners } from "@/lib/dashboard-owner-search"

export function DashboardOwnerSearch({ owners, cabins }: { owners: Owner[]; cabins: Cabin[] }) {
  const [query, setQuery] = useState("")
  const searchInput = useRef<HTMLInputElement>(null)
  const matches = useMemo(() => filterDashboardOwners(owners, cabins, query), [owners, cabins, query])
  const searching = query.trim().length > 0

  return (
    <section aria-label="Buscador de propietarios" className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Buscar propietarios</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Encuentra al propietario, sus datos de contacto y las cabañas que administra.
      </p>

      <div className="mt-4 flex min-w-0 gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar por propietario, cabaña, teléfono, WhatsApp o correo</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, cabaña, teléfono o correo…"
            aria-label="Buscar propietario y sus cabañas"
            aria-controls={searching ? "dashboard-owner-search-results" : undefined}
            autoComplete="off"
            className="min-h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:text-sm"
          />
        </label>
        {searching && (
          <button
            type="button"
            onClick={() => { setQuery(""); searchInput.current?.focus() }}
            aria-label="Limpiar búsqueda de propietarios"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {searching && (
        <div id="dashboard-owner-search-results" className="mt-4">
          <p className="mb-3 text-xs text-muted-foreground" role="status">
            {matches.length} {matches.length === 1 ? "propietario encontrado" : "propietarios encontrados"}
          </p>
          {matches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              No hay coincidencias. Prueba con otro nombre, cabaña o número.
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {matches.map(({ owner, cabins: assignedCabins }) => {
                const phone = owner.phone.replace(/[^\d+]/g, "")
                const whatsapp = owner.whatsapp.replace(/\D/g, "")
                return (
                  <article key={owner.id} className="min-w-0 rounded-xl border border-border bg-background p-4">
                    <h3 className="break-words text-base font-semibold text-foreground">{owner.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {phone && (
                        <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-primary hover:bg-muted">
                          <Phone className="size-4" aria-hidden />Llamar
                        </a>
                      )}
                      {whatsapp && (
                        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-primary hover:bg-muted">
                          <MessageCircle className="size-4" aria-hidden />WhatsApp
                        </a>
                      )}
                      {owner.email && (
                        <a href={`mailto:${owner.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-primary hover:bg-muted">
                          <Mail className="size-4" aria-hidden />Correo
                        </a>
                      )}
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {owner.phone && <div className="break-all"><dt className="inline font-medium text-muted-foreground">Teléfono: </dt><dd className="inline">{owner.phone}</dd></div>}
                      {owner.whatsapp && <div className="break-all"><dt className="inline font-medium text-muted-foreground">WhatsApp: </dt><dd className="inline">{owner.whatsapp}</dd></div>}
                      {owner.email && <div className="break-all"><dt className="inline font-medium text-muted-foreground">Correo: </dt><dd className="inline">{owner.email}</dd></div>}
                      <div><dt className="inline font-medium text-muted-foreground">Contacto preferido: </dt><dd className="inline">{owner.preferredContactMethod}</dd></div>
                      {owner.notes && <div className="break-words"><dt className="font-medium text-muted-foreground">Notas internas</dt><dd className="whitespace-pre-wrap">{owner.notes}</dd></div>}
                    </dl>
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Home className="size-4 text-primary" aria-hidden />
                        {assignedCabins.length} {assignedCabins.length === 1 ? "cabaña asociada" : "cabañas asociadas"}
                      </p>
                      {assignedCabins.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {assignedCabins.map((cabin) => (
                            <li key={cabin.id}>
                              <Link href={`/panel/cabanas/${cabin.id}`} className="inline-flex min-h-10 items-center rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted">
                                {cabin.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-muted-foreground">Sin cabañas vinculadas.</p>}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
