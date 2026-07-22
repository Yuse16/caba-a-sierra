"use client"

import Image from "next/image"
import { Heart, MapPin, Users, Bed, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge, cabinStatusTone } from "@/components/shared/status-badge"
import { statusLabel, currency, type Cabin } from "@/lib/demo-data"
import type { Version } from "@/components/demo/demo-context"

export function CabinCard({
  cabin,
  version,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
}: {
  cabin: Cabin
  version: Version
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onViewDetails: (cabin: Cabin) => void
}) {
  const isPro = version === "pro"

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={cabin.image || "/placeholder.svg"}
          alt={`Foto de ${cabin.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        {/* status / badge top-left */}
        <div className="absolute left-3 top-3 flex gap-2">
          {isPro && cabin.badge === "popular" && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Más popular
            </span>
          )}
          {isPro && cabin.badge === "oferta" && (
            <span className="rounded-full bg-[oklch(0.6_0.16_30)] px-2.5 py-0.5 text-xs font-semibold text-white">
              Oferta
            </span>
          )}
          <StatusBadge tone={cabinStatusTone[cabin.status]} className="shadow-sm">
            {isPro ? statusLabel[cabin.status] : "Disponibilidad por confirmar"}
          </StatusBadge>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(cabin.id)}
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
        >
          <Heart
            className={cn("size-4", isFavorite && "fill-destructive text-destructive")}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{cabin.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {cabin.location}
            </p>
          </div>
          {isPro && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
              <Star className="size-3.5 fill-gold text-gold" aria-hidden />
              {cabin.rating}
              <span className="text-muted-foreground">({cabin.reviews})</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            {cabin.minGuests}-{cabin.maxGuests}
          </span>
          <span className="flex items-center gap-1">
            <Bed className="size-3.5" aria-hidden />
            {cabin.bedrooms}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {cabin.amenities.map((a) => (
            <span
              key={a}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {a}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-foreground">
                ${currency(cabin.price)}
              </span>
              <span className="text-xs text-muted-foreground">MXN</span>
              {isPro && cabin.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ${currency(cabin.oldPrice)}
                </span>
              )}
              {isPro && cabin.discountPct && (
                <span className="rounded bg-[oklch(0.6_0.16_30)]/12 px-1.5 py-0.5 text-[11px] font-semibold text-[oklch(0.55_0.16_30)]">
                  -{cabin.discountPct}%
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">por noche</p>
          </div>
        </div>

        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onViewDetails(cabin)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Consultar disponibilidad
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(cabin)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  )
}
