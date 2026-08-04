"use client"

import { X } from "lucide-react"
import type { AdminPromotion } from "@/lib/admin-promotions/types"
import { PublicPromotionCard } from "@/components/promotions/public-promotion-card"

export function PromotionPreviewDialog({ promotion, onClose }: { promotion: AdminPromotion | null; onClose: () => void }) {
  if (!promotion) return null
  const publicPromotion = promotion.image ? {
    id: promotion.id,
    name: promotion.name || "Promoción sin nombre",
    imageUrl: promotion.image.url,
    imageAlt: promotion.imageAlt || "Vista previa de la promoción",
    shortDescription: promotion.shortDescription,
    ctaLabel: promotion.ctaLabel,
    href: promotion.href,
  } : null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Vista previa de ${promotion.name || "promoción"}`}>
      <section className="max-h-[100dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-card p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[92vh] sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Vista previa pública</p><h2 className="mt-1 text-xl font-semibold text-foreground">Así aparecerá la promoción</h2></div><button type="button" onClick={onClose} aria-label="Cerrar vista previa" className="inline-flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-muted"><X className="size-5" aria-hidden /></button></div>
        {publicPromotion ? <PublicPromotionCard promotion={publicPromotion} preview /> : <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">Agrega una imagen para ver la promoción.</div>}
        <button type="button" onClick={onClose} className="mt-5 min-h-12 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Cerrar vista previa</button>
      </section>
    </div>
  )
}
