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
          data-promotion-landscape="premium"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.16]"
        >
          <svg viewBox="0 0 900 506" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g
              data-topographic-lines="true"
              stroke="#315f46"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.72"
            >
              <path d="M-40 106C78 54 176 56 267 100C352 141 420 137 500 102C595 61 693 66 940 130" />
              <path d="M-55 137C59 91 164 91 257 129C350 168 423 164 514 128C612 90 728 96 953 158" />
              <path d="M-66 170C47 131 159 128 250 160C352 197 435 196 527 163C628 127 744 130 965 191" />
              <path d="M-76 204C43 171 153 167 246 194C346 224 442 228 542 198C648 166 768 166 978 224" />
              <path d="M-92 239C34 214 151 208 248 231C356 257 452 261 555 235C672 206 794 206 994 258" />
              <path d="M-96 281C20 260 138 256 245 274C357 293 464 300 575 280C690 259 816 256 998 300" />
            </g>

            <g stroke="#315f46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 365C78 331 135 318 198 321C246 323 285 301 324 267C365 231 405 199 449 207C490 214 524 260 557 281C600 309 640 296 680 258C720 221 760 206 799 224C834 241 865 278 900 294" />
              <path d="M0 404C93 377 177 365 264 372C348 378 431 362 515 340C607 315 697 318 900 359" opacity="0.78" />
              <path d="M0 443C122 418 240 416 346 428C476 443 592 430 704 406C777 391 840 390 900 400" opacity="0.55" />
              <path d="M86 418L109 359L132 418M96 393L109 366L123 393M103 378L109 365L116 378M109 359V438" />
              <path d="M153 434L175 376L198 434M164 408L175 382L187 408M169 394L175 381L182 394M175 376V449" />
              <path d="M720 423L743 363L767 423M731 397L743 370L756 397M737 383L743 369L750 383M743 363V442" />
              <path d="M794 439L815 383L837 439M805 414L815 389L827 414M810 400L815 388L821 400M815 383V452" />
              <path d="M244 421C254 406 269 397 286 397C303 397 319 406 329 420C334 427 336 437 333 446M246 421C242 428 241 438 244 447M263 444L261 463M314 442L318 461M254 406C247 398 242 389 242 380M252 405C245 393 240 382 238 371M242 380L232 374M242 380L250 371M238 371L229 367M238 371L245 361M329 420C339 418 349 421 356 427" />
              <path d="M356 427C350 430 346 436 345 443" />
              <path d="M400 171C420 156 440 154 460 169M452 171C470 157 489 157 507 171" opacity="0.8" />
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
