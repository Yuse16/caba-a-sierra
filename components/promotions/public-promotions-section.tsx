import type { PublicPromotion } from "@/lib/public-promotions"
import { PublicPromotionCard } from "./public-promotion-card"

export function PublicPromotionsSection({ promotions }: { promotions: PublicPromotion[] }) {
  if (promotions.length === 0) return null

  return (
    <section aria-labelledby="promotions-title" className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Para tu próxima estancia</p>
          <h2 id="promotions-title" className="mt-2 font-serif text-3xl font-semibold text-forest-dark sm:text-4xl">Promociones</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {promotions.map((promotion) => <PublicPromotionCard key={promotion.id} promotion={promotion} />)}
        </div>
      </div>
    </section>
  )
}
