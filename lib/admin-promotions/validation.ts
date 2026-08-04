import type { AdminPromotionInput } from "./types"

export type PromotionField = "name" | "image" | "imageAlt" | "startDate" | "endDate" | "order" | "ctaLabel" | "href"
export type PromotionValidationErrors = Partial<Record<PromotionField, string>>

const allowedPublicLinks = new Set(["#cabanas", "#como-reservar", "#contacto", "#inicio", "/"])

export function sanitizePromotionText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export function sanitizePromotionLink(value: string) {
  const link = value.trim()
  return allowedPublicLinks.has(link) ? link : ""
}

export function isAllowedPromotionLink(value: string) {
  return value.trim() === "" || allowedPublicLinks.has(value.trim())
}

export function validatePromotion(input: AdminPromotionInput, publishing: boolean): PromotionValidationErrors {
  const errors: PromotionValidationErrors = {}

  if (publishing && !input.name.trim()) errors.name = "Escribe el nombre de la promoción."
  if (publishing && !input.image) errors.image = "Agrega una imagen antes de publicar."
  if (publishing && input.image && !input.imageAlt.trim()) errors.imageAlt = "Describe brevemente la imagen."
  if (input.startDate && input.endDate && input.endDate <= input.startDate) {
    errors.endDate = "La fecha final debe ser posterior a la fecha inicial."
  }
  if (!Number.isFinite(input.order) || input.order < 1) errors.order = "El orden debe ser mayor a cero."
  if (publishing && input.ctaLabel.trim() && !input.href.trim()) errors.href = "Selecciona a dónde llevará el botón."
  if (publishing && input.href.trim() && !input.ctaLabel.trim()) errors.ctaLabel = "Escribe el texto del botón."
  if (!isAllowedPromotionLink(input.href)) errors.href = "El enlace debe dirigir a una sección pública disponible."

  return errors
}
