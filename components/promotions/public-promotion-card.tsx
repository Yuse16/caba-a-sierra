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
          data-promotion-landscape="petroglyph"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.28]"
        >
          <svg viewBox="0 0 900 506" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g
              data-petroglyph-mountains="true"
              stroke="#315f46"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M-25 360L92 256L162 314L278 194L370 300L454 226L552 318L665 205L754 292L842 232L930 315" />
              <path d="M-20 404C92 372 185 383 278 356C372 328 455 335 548 366C644 398 742 365 930 350" />
              <path d="M72 274L92 256L111 274M256 217L278 194L299 218M642 229L665 205L688 231M822 254L842 232L862 254" />
            </g>

            <g
              data-petroglyph-fauna="true"
              stroke="#315f46"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M116 396C132 374 162 369 187 382C207 392 217 411 210 430C202 451 174 460 148 450C125 441 109 420 116 396Z" />
              <path d="M137 447L132 475M190 447L195 475M116 399L97 390M206 399L225 386" />
              <path d="M145 377L132 353M158 373L156 344M171 377L185 351M132 353L117 347M132 353L126 336M156 344L146 331M156 344L166 329M185 351L199 345M185 351L191 333" />

              <path d="M690 403C707 381 744 378 767 394C785 407 791 431 779 448C766 467 730 468 706 452C685 439 678 418 690 403Z" />
              <path d="M704 451L700 474M761 449L766 474M686 406L673 395M779 404L795 392" />
              <circle cx="781" cy="394" r="16" />
              <path d="M775 379L769 364M790 382L802 369" />

              <path d="M420 118C439 95 468 95 486 117M486 117C505 95 534 95 551 118" />
              <path d="M486 117L486 143" />

              <path d="M318 436C328 424 344 419 360 423C375 427 386 438 389 452M318 436L306 448M389 452L402 443" />
              <path d="M334 428L331 408M365 428L370 408" />
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
