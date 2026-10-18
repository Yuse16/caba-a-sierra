import Image from "next/image"
import { ArrowRight } from "lucide-react"
import type { PublicPromotion } from "@/lib/public-promotions"

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"

export function PublicPromotionCard({ promotion, preview = false }: { promotion: PublicPromotion; preview?: boolean }) {
  const content = (
    <article className="group">
      <div
        data-promotion-media="true"
        className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-forest-dark/10 bg-[#f4f0e7] shadow-[0_12px_36px_rgba(31,60,43,0.1)]"
      >
        <div
          data-promotion-landscape="true"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-end text-forest-dark opacity-[0.12]"
        >
          <svg viewBox="0 0 900 506" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 350L110 255L190 315L285 205L365 295L445 238L540 322L650 220L760 300L840 252L900 304" />
              <path d="M0 400C135 365 215 392 322 366C445 337 525 385 648 360C749 340 820 357 900 342" />
              <path d="M0 440C132 418 228 442 347 420C494 392 591 437 716 410C786 395 849 397 900 389" />
              <path d="M90 395L105 351L120 395M98 376L105 357L113 376M155 410L171 356L188 410M164 386L171 365L179 386M720 395L737 340L755 395M728 370L737 349L747 370M790 412L805 364L821 412M797 389L805 372L814 389" />
              <path d="M222 399C236 380 252 380 266 399C270 406 270 417 264 426M222 399C216 407 216 418 223 427M233 427V447M256 427V447M239 386L232 374M249 386L256 373M232 374L225 370M256 373L263 368" />
              <path d="M621 424C612 413 610 399 618 389C625 381 638 381 646 388C654 397 654 410 647 419M621 424L618 446M647 419L650 446M630 387L624 377M642 386L647 376M623 377L617 374M648 376L654 372" />
              <path d="M420 405C432 392 447 389 461 396C472 402 477 414 472 424C467 434 454 440 440 437C426 434 416 422 420 405ZM432 398L425 388M458 396L466 386" />
              <path d="M365 160C380 148 395 148 410 160M387 159C399 148 412 148 423 159" />
            </g>
          </svg>
        </div>
        <Image
          src={promotion.imageUrl}
          alt={promotion.imageAlt}
          fill
          unoptimized={promotion.imageUrl.startsWith("data:")}
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-contain z-10"
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
