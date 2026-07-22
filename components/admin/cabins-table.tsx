"use client"

import Image from "next/image"
import { Users, Pencil, Eye, MoreVertical } from "lucide-react"
import { StatusBadge, cabinStatusTone } from "@/components/shared/status-badge"
import { statusLabel, currency, type Cabin } from "@/lib/demo-data"

export function CabinsTable({
  cabins,
  onEdit,
  onCycleStatus,
}: {
  cabins: Cabin[]
  onEdit: (cabin: Cabin) => void
  onCycleStatus: (id: string) => void
}) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Cabaña</th>
              <th className="px-4 py-3 font-semibold">Capacidad</th>
              <th className="px-4 py-3 font-semibold">Precio / noche</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cabins.map((c) => (
              <tr key={c.id} className="bg-card hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                      <Image src={c.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden />
                    {c.minGuests} - {c.maxGuests} personas
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">${currency(c.price)} MXN</td>
                <td className="px-4 py-3">
                  <button onClick={() => onCycleStatus(c.id)} aria-label="Cambiar estado">
                    <StatusBadge tone={cabinStatusTone[c.status]}>{statusLabel[c.status]}</StatusBadge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      aria-label={`Editar ${c.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => onEdit(c)}
                      aria-label={`Ver ${c.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => onCycleStatus(c.id)}
                      aria-label="Más opciones"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {cabins.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                <Image src={c.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.minGuests}-{c.maxGuests} personas · ${currency(c.price)} MXN
                </p>
              </div>
              <button onClick={() => onCycleStatus(c.id)}>
                <StatusBadge tone={cabinStatusTone[c.status]}>{statusLabel[c.status]}</StatusBadge>
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onEdit(c)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Pencil className="size-3.5" aria-hidden /> Editar
              </button>
              <button
                onClick={() => onEdit(c)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Eye className="size-3.5" aria-hidden /> Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
