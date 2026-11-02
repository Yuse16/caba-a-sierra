"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Bed, ChevronLeft, ChevronRight, Heart, MapPin, Star, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  currency,
  publicCabinStatusLabel,
  publicCabinStatusTone,
  type PublicCabin,
  type PublicCabinImage,
} from "@/lib/public-cabins"
import type { PublicCabinSummary } from "@/lib/public-cabin-summary"

export function CabinCard({
  cabin,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onLoadDetail,
}: {
  cabin: PublicCabinSummary
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onViewDetails: (id: string) => void
  onLoadDetail: (id: string) => Promise<PublicCabin | null>
}) {
  const coverImage: PublicCabinImage = { id: `${cabin.id}-cover`, url: cabin.image, altText: `Foto de ${cabin.name}`, position: 1, isCover: true }
  const [gallery, setGallery] = useState<PublicCabinImage[]>([coverImage])
  const [galleryLoaded, setGalleryLoaded] = useState(cabin.imageCount <= 1)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const suppressImageClickUntil = useRef(0)
  const activeImage = gallery[Math.min(activeIndex, gallery.length - 1)] ?? coverImage
  const displayedImageCount = galleryLoaded ? gallery.length : cabin.imageCount

  const loadGallery = async () => {
    if (galleryLoaded) return gallery
    setLoadingGallery(true)
    try {
      const detail = await onLoadDetail(cabin.id)
      if (!detail) return gallery
      const nextGallery = detail.images.length ? detail.images : [coverImage]
      setGallery(nextGallery)
      setGalleryLoaded(true)
      return nextGallery
    } finally {
      setLoadingGallery(false)
    }
  }

  const moveGallery = async (direction: -1 | 1) => {
    const targetGallery = await loadGallery()
    if (targetGallery.length < 2) return
    setActiveIndex((current) => (current + direction + targetGallery.length) % targetGallery.length)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-forest-dark/10 bg-card shadow-[0_8px_30px_rgba(31,60,43,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(31,60,43,0.12)]">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null || displayedImageCount < 2) return
          const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
          touchStartX.current = null
          if (Math.abs(distance) >= 40) {
            suppressImageClickUntil.current = Date.now() + 500
            void moveGallery(distance > 0 ? -1 : 1)
          }
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (Date.now() < suppressImageClickUntil.current) return
            onViewDetails(cabin.id)
          }}
          aria-label={`Ver detalles de ${cabin.name}`}
          className="absolute inset-0 z-0 cursor-zoom-in rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
        >
          <Image
            key={activeImage.id}
            src={activeImage.url || "/placeholder.svg"}
            alt={activeImage.altText || `Foto de ${cabin.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </button>
        {displayedImageCount > 1 && <>
          <button type="button" disabled={loadingGallery} onClick={(event) => { event.stopPropagation(); void moveGallery(-1) }} aria-label={`Fotografía anterior de ${cabin.name}`} className="absolute left-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition hover:bg-background disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"><ChevronLeft className="size-5" aria-hidden /></button>
          <button type="button" disabled={loadingGallery} onClick={(event) => { event.stopPropagation(); void moveGallery(1) }} aria-label={`Fotografía siguiente de ${cabin.name}`} className="absolute right-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition hover:bg-background disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"><ChevronRight className="size-5" aria-hidden /></button>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">{activeIndex + 1} / {displayedImageCount}</span>
        </>}
        {/* status / badge top-left */}
        <div className="absolute left-3 right-16 top-3 z-10 flex flex-wrap items-start gap-2">
          {cabin.badge === "popular" && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Más popular
            </span>
          )}
          {cabin.badge === "oferta" && (
            <span className="rounded-full bg-[oklch(0.6_0.16_30)] px-2.5 py-0.5 text-xs font-semibold text-white">
              Oferta
            </span>
          )}
          <StatusBadge
            tone={publicCabinStatusTone[cabin.status]}
            className="border border-border bg-background/95 text-foreground shadow-sm backdrop-blur-sm"
          >
            {publicCabinStatusLabel[cabin.status]}
          </StatusBadge>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(cabin.id)}
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-white text-forest-dark shadow-md transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 sm:size-9"
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
          {typeof cabin.rating === "number" && typeof cabin.reviews === "number" && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
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
              {cabin.oldPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ${currency(cabin.oldPrice)}
                </span>
              )}
              {cabin.discountPct && (
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
            onClick={() => onViewDetails(cabin.id)}
            className="min-h-11 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Consultar disponibilidad
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(cabin.id)}
            className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  )
}
