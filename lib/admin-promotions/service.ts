import type { PublicPromotion } from "@/lib/public-promotions"
import type { AdminPromotion, AdminPromotionInput, AdminPromotionStatus } from "./types"
import { sanitizePromotionLink, sanitizePromotionText } from "./validation"

function todayValue(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getEffectivePromotionStatus(
  promotion: Pick<AdminPromotion, "status" | "startDate" | "endDate">,
  now = new Date(),
): AdminPromotionStatus {
  if (promotion.status === "hidden" || promotion.status === "draft") return promotion.status
  const today = todayValue(now)
  if (promotion.endDate && promotion.endDate < today) return "expired"
  if (promotion.startDate && promotion.startDate > today) return "scheduled"
  return "active"
}

export function isPromotionPublic(promotion: AdminPromotion, now = new Date()) {
  return Boolean(promotion.image && promotion.name.trim()) && getEffectivePromotionStatus(promotion, now) === "active"
}

export function sortPromotions<T extends Pick<AdminPromotion, "order" | "createdAt">>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
}

export function sanitizePromotionInput(input: AdminPromotionInput): AdminPromotionInput {
  return {
    ...input,
    name: sanitizePromotionText(input.name, 100),
    shortDescription: sanitizePromotionText(input.shortDescription, 180),
    imageAlt: sanitizePromotionText(input.imageAlt, 160),
    ctaLabel: sanitizePromotionText(input.ctaLabel, 40),
    href: sanitizePromotionLink(input.href),
    order: Math.max(1, Math.round(input.order || 1)),
  }
}

export function toPublicPromotion(promotion: AdminPromotion): PublicPromotion | null {
  if (!isPromotionPublic(promotion) || !promotion.image) return null
  return {
    id: promotion.id,
    name: promotion.name,
    imageUrl: promotion.image.url,
    imageAlt: promotion.imageAlt,
    shortDescription: promotion.shortDescription,
    ctaLabel: promotion.ctaLabel,
    href: promotion.href,
  }
}
