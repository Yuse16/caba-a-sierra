"use client"

import Image from "next/image"
import { Eye, MessageCircle, Phone, Users } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Cabin } from "@/lib/demo-data"
import { cabinStatusLabel as statusLabel, cabinStatusTone, formatCurrency as currency } from "@/lib/admin-presentational"

export function CabinsTable({ cabins, onEdit, onCycleStatus }: { cabins: Cabin[]; onEdit: (cabin: Cabin) => void; onCycleStatus: (id: string) => void }) {
  return (
    <div>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="min-w-[940px] w-full text-sm">
          <thead><tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-3">Cabaña</th><th className="px-4 py-3">Propietario</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Tarifa y capacidad</th><th className="px-4 py-3">Estado de consulta</th><th className="px-4 py-3">Acciones</th></tr></thead>
          <tbody className="divide-y divide-border">
            {cabins.map((cabin) => (
              <tr key={cabin.id} className="bg-card hover:bg-secondary/20">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="relative size-11 shrink-0 overflow-hidden rounded-lg"><Image src={cabin.image || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" /></div><div><p className="font-medium">{cabin.name}</p><p className="text-xs text-muted-foreground">{cabin.location}</p></div></div></td>
                <td className="px-4 py-3"><p className="font-medium">{cabin.ownerName}</p><p className="text-xs text-muted-foreground">Comisión {cabin.agreedCommission}%</p></td>
                <td className="px-4 py-3"><p>{cabin.ownerPhone}</p><p className="text-xs text-muted-foreground">Prefiere {cabin.preferredContactMethod}</p></td>
                <td className="px-4 py-3"><p className="font-medium">${currency(cabin.price)} MXN</p><p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" />{cabin.minGuests}-{cabin.maxGuests} personas</p></td>
                <td className="px-4 py-3"><button type="button" onClick={() => onCycleStatus(cabin.id)} aria-label={`Cambiar estado de ${cabin.name}`}><StatusBadge tone={cabinStatusTone[cabin.status]}>{statusLabel[cabin.status]}</StatusBadge></button><p className="mt-1 text-xs text-muted-foreground">Última consulta: {cabin.lastAvailabilityCheck}</p></td>
                <td className="px-4 py-3"><div className="flex gap-1"><a href={`tel:${cabin.ownerPhone.replace(/\s/g, "")}`} aria-label={`Llamar a ${cabin.ownerName}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Phone className="size-4" /></a><a href={`https://wa.me/${cabin.ownerWhatsApp}`} aria-label={`WhatsApp a ${cabin.ownerName}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><MessageCircle className="size-4" /></a><button type="button" onClick={() => onEdit(cabin)} aria-label={`Ver ficha de ${cabin.name}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><Eye className="size-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {cabins.map((cabin) => (
          <article key={cabin.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex gap-3"><div className="relative size-14 shrink-0 overflow-hidden rounded-lg"><Image src={cabin.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" /></div><div className="min-w-0 flex-1"><p className="font-medium">{cabin.name}</p><p className="text-xs text-muted-foreground">{cabin.ownerName} · {cabin.ownerPhone}</p><button type="button" onClick={() => onCycleStatus(cabin.id)} className="mt-1"><StatusBadge tone={cabinStatusTone[cabin.status]}>{statusLabel[cabin.status]}</StatusBadge></button></div></div>
            <div className="mt-3 grid grid-cols-3 gap-2"><a href={`tel:${cabin.ownerPhone.replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium"><Phone className="size-3.5" />Llamar</a><a href={`https://wa.me/${cabin.ownerWhatsApp}`} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium"><MessageCircle className="size-3.5" />WhatsApp</a><button type="button" onClick={() => onEdit(cabin)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium"><Eye className="size-3.5" />Ficha</button></div>
          </article>
        ))}
      </div>
    </div>
  )
}
