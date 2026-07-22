"use client"

import { useEffect } from "react"
import Image from "next/image"
import {
  X,
  MapPin,
  Users,
  Bed,
  Bath,
  Star,
  MessageCircle,
  Check,
  CalendarDays,
} from "lucide-react"
import { StatusBadge, cabinStatusTone } from "@/components/shared/status-badge"
import { statusLabel, currency, type Cabin } from "@/lib/demo-data"
import type { Version } from "@/components/demo/demo-context"

export function CabinDetailsModal({
  cabin,
  version,
  onClose,
  onAction,
}: {
  cabin: Cabin | null
  version: Version
  onClose: () => void
  onAction: (cabin: Cabin) => void
}) {
  useEffect(() => {
    if (!cabin) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [cabin, onClose])

  if (!cabin) return null
  const isPro = version === "pro"

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles de ${cabin.name}`}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={cabin.image || "/placeholder.svg"}
            alt={`Foto de ${cabin.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="rounded-t-2xl object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          >
            <X className="size-4" aria-hidden />
          </button>
          <div className="absolute left-3 top-3">
            <StatusBadge tone={cabinStatusTone[cabin.status]} className="shadow-sm">
              {statusLabel[cabin.status]}
            </StatusBadge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{cabin.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                {cabin.location}
              </p>
            </div>
            {isPro && (
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Star className="size-4 fill-gold text-gold" aria-hidden />
                {cabin.rating}
                <span className="text-muted-foreground">({cabin.reviews} reseñas)</span>
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{cabin.description}</p>

          <div className="grid grid-cols-3 gap-3 rounded-xl bg-secondary/60 p-3 text-center text-sm">
            <div className="flex flex-col items-center gap-1">
              <Users className="size-4 text-primary" aria-hidden />
              <span className="font-medium text-foreground">
                {cabin.minGuests}-{cabin.maxGuests}
              </span>
              <span className="text-xs text-muted-foreground">Huéspedes</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bed className="size-4 text-primary" aria-hidden />
              <span className="font-medium text-foreground">{cabin.bedrooms}</span>
              <span className="text-xs text-muted-foreground">Habitaciones</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bath className="size-4 text-primary" aria-hidden />
              <span className="font-medium text-foreground">{cabin.bathrooms}</span>
              <span className="text-xs text-muted-foreground">Baños</span>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Amenidades</h3>
            <div className="flex flex-wrap gap-2">
              {cabin.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  <Check className="size-3.5 text-success" aria-hidden />
                  {a}
                </span>
              ))}
            </div>
          </div>

          {isPro && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Entrada
                <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden />
                  14 ago 2026
                </span>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Salida
                <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden />
                  16 ago 2026
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-foreground">${currency(cabin.price)}</span>
              <span className="text-sm text-muted-foreground">MXN / noche</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/528441234567?text=${encodeURIComponent(
                  `Hola, me interesa la cabaña ${cabin.name}`,
                )}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => onAction(cabin)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {isPro ? "Reservar ahora" : "Solicitar información"}
              </button>
            </div>
          </div>
          {isPro && (
            <p className="text-center text-xs text-muted-foreground">
              Demo: la reservación y el pago no se procesan realmente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
