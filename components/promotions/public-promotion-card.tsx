import Image from "next/image"
import { ArrowRight } from "lucide-react"
import type { PublicPromotion } from "@/lib/public-promotions"

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"

export function PublicPromotionCard({ promotion, preview = false }: { promotion: PublicPromotion; preview?: boolean }) {
  const content = (
    <article className="group overflow-hidden rounded-2xl border border-forest-dark/10 bg-white shadow-[0_12px_36px_rgba(31,60,43,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(31,60,43,0.16)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <Image
          src={promotion.imageUrl}
          alt={promotion.imageAlt}
          fill
          unoptimized={promotion.imageUrl.startsWith("data:")}
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f4d58b]">Promoción especial</p>
          <h3 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{promotion.name}</h3>
          {promotion.shortDescription && <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">{promotion.shortDescription}</p>}
          {promotion.ctaLabel && promotion.href && (
            <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f0c66a] px-4 py-2 text-sm font-bold text-[#203628]">
              {promotion.ctaLabel}<ArrowRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </article>
  )

  if (preview || !promotion.ctaLabel || !promotion.href) return content
  return <a href={promotion.href} className={`block rounded-2xl ${focusClasses}`}>{content}</a>
}
