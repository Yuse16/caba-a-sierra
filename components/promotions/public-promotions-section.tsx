"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PublicPromotion } from "@/lib/public-promotions"
import { PublicPromotionCard } from "./public-promotion-card"

export function PublicPromotionsSection({ promotions }: { promotions: PublicPromotion[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (promotions.length === 0) return null

  const move = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>("[data-promotion-card]")
    const distance = (card?.offsetWidth ?? track.clientWidth) + 24
    track.scrollBy({ left: direction * distance, behavior: "smooth" })
  }

  return (
    <section aria-labelledby="promotions-title" className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Para tu próxima estancia</p>
            <h2 id="promotions-title" className="mt-2 font-serif text-3xl font-semibold text-forest-dark sm:text-4xl">Promociones</h2>
            {promotions.length > 1 && <p className="mt-2 text-sm text-muted-foreground">Desliza o usa las flechas para ver todas las promociones.</p>}
          </div>
          {promotions.length > 1 && (
            <div className="hidden shrink-0 gap-2 sm:flex" aria-label="Controles del carrusel de promociones">
              <button type="button" onClick={() => move(-1)} aria-label="Promoción anterior" className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => move(1)} aria-label="Promoción siguiente" className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          )}
        </div>

        <div ref={trackRef} className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0" aria-label="Promociones disponibles">
          {promotions.map((promotion) => (
            <div key={promotion.id} data-promotion-card className="w-[88%] shrink-0 snap-start sm:w-[72%] lg:w-[calc(50%-0.75rem)]">
              <PublicPromotionCard promotion={promotion} />
            </div>
          ))}
        </div>

        {promotions.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 sm:hidden">
            <button type="button" onClick={() => move(-1)} aria-label="Promoción anterior" className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Promoción siguiente" className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
