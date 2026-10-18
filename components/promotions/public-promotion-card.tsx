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
          data-promotion-landscape="vector"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.16]"
        >
          <svg
            viewBox="0 0 900 506"
            className="h-full w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              data-vector-mountains="true"
              stroke="#315f46"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M-30 384L52 322L108 357L168 286L226 347L283 304" />
              <path d="M617 337L676 288L731 332L790 270L852 328L930 291" />
              <path d="M-18 438C74 411 150 414 225 435C300 455 357 460 431 447" />
              <path d="M469 449C548 463 607 458 678 439C752 419 824 415 922 438" />
              <path d="M42 322L52 300L62 322M158 286L168 257L180 286M780 270L790 240L802 270M842 328L852 302L864 328" />
            </g>

            <g
              data-vector-fauna="true"
              stroke="#315f46"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M92 415C103 398 122 391 141 395C159 399 172 411 175 427C178 441 170 453 157 459C143 466 124 463 111 455C98 447 88 432 92 415Z" />
              <path d="M110 455L107 478M157 454L161 478M96 413L78 402M170 412L186 401" />
              <path d="M118 397L108 378M132 394L132 371M145 398L157 380M108 378L96 373M108 378L103 365M132 371L123 359M132 371L141 358M157 380L168 375M157 380L161 365" />

              <path d="M744 417C755 401 773 393 792 397C810 401 824 413 827 429C830 443 822 455 808 461C794 467 776 465 763 456C749 447 740 433 744 417Z" />
              <path d="M761 456L757 479M810 456L814 479M748 416L733 405M824 415L840 403" />
              <circle cx="828" cy="401" r="13" />
              <path d="M823 388L819 375M834 390L844 378" />

              <path d="M56 168C72 151 91 150 107 166M107 166C123 150 142 150 158 168" />
              <path d="M742 150C758 133 777 132 793 148M793 148C809 132 828 132 844 150" />
            </g>
          </svg>
        </div>

        <Image
          data-promotion-artwork="true"
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
