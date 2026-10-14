"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Phone, Search, X } from "lucide-react"
import type { Cabin } from "@/lib/demo-data"

type OwnerContact = {
  ownerId: string
  ownerName: string
  ownerPhone: string
  ownerWhatsApp: string
  cabinNames: string[]
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es-MX")
}

export function OwnerContactSearch({ cabins }: { cabins: Cabin[] }) {
  const [query, setQuery] = useState("")

  const owners = useMemo(() => {
    const grouped = new Map<string, OwnerContact>()
    for (const cabin of cabins) {
      if (!cabin.ownerId || !cabin.ownerName) continue
      const current = grouped.get(cabin.ownerId)
      if (current) {
        if (!current.cabinNames.includes(cabin.name)) current.cabinNames.push(cabin.name)
        continue
      }
      grouped.set(cabin.ownerId, {
        ownerId: cabin.ownerId,
        ownerName: cabin.ownerName,
        ownerPhone: cabin.ownerPhone,
        ownerWhatsApp: cabin.ownerWhatsApp,
        cabinNames: [cabin.name],
      })
    }
    return Array.from(grouped.values()).sort((a, b) => a.ownerName.localeCompare(b.ownerName, "es-MX"))
  }, [cabins])

  const normalizedQuery = normalize(query)
  const results = useMemo(() => {
    if (!normalizedQuery) return []
    return owners.filter((owner) =>
      [owner.ownerName, owner.ownerPhone, owner.ownerWhatsApp, ...owner.cabinNames]
        .some((value) => normalize(value).includes(normalizedQuery)),
    )
  }, [normalizedQuery, owners])

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Buscar propietario o cabaña</h2>
            <p className="text-xs text-muted-foreground">Encuentra rápido el contacto para llamar o mandar WhatsApp.</p>
          </div>

          <div className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. nombre de cabaña o propietario"
              aria-label="Buscar propietario o cabaña"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          {normalizedQuery && (
            <div className="mt-4 space-y-3">
              {results.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No encontramos una cabaña o propietario con ese nombre.
                </p>
              ) : (
                results.map((owner) => (
                  <article key={owner.ownerId} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{owner.ownerName}</p>
                        <p className="mt-0.5 text-sm text-foreground">{owner.ownerPhone}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{owner.cabinNames.join(" · ")}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex">
                        {owner.ownerPhone ? (
                          <a
                            href={`tel:${owner.ownerPhone.replace(/[^\d+]/g, "")}`}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            <Phone className="size-4" aria-hidden />
                            Llamar
                          </a>
                        ) : null}
                        {owner.ownerWhatsApp ? (
                          <a
                            href={`https://wa.me/${owner.ownerWhatsApp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <MessageCircle className="size-4" aria-hidden />
                            WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
