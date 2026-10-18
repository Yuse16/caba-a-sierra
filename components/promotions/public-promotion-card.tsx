import Image from "next/image"
import { ArrowRight } from "lucide-react"
import type { PublicPromotion } from "@/lib/public-promotions"

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"

export function PublicPromotionCard({ promotion, preview = false }: { promotion: PublicPromotion; preview?: boolean }) {
  const content = (
    <article className="group">
      <div
        data-promotion-media="true"
        className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-forest-dark/10 bg-secondary shadow-[0_12px_36px_rgba(31,60,43,0.1)]"
      >
        <Image
          src={promotion.imageUrl}
          alt={promotion.imageAlt}
          fill
          unoptimized={promotion.imageUrl.startsWith("data:")}
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-contain"
        />
      </div>

      <div
        data-promotion-content="true"
        className="mt-3 rounded-2xl border border-forest-dark/10 bg-white p-5 shadow-[0_10px_28px_rgba(31,60,43,0.08)] sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b6b1f]">Promoción especial</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-forest-dark sm:text-3xl">{promotion.name}</h3>
        {promotion.shortDescription && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{promotion.shortDescription}</p>}
        {promotion.ctaLabel && promotion.href && (
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f0c66a] px-4 py-2 text-sm font-bold text-[#203628] shadow-sm transition-colors group-hover:bg-[#e7b94f]">
            {promotion.ctaLabel}<ArrowRight className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </article>
  )

  if (preview || !promotion.ctaLabel || !promotion.href) return content
  return <a href={promotion.href} className={`block rounded-2xl ${focusClasses}`}>{content}</a>
}
