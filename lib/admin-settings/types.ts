export type AdminSiteSettings = {
  id: boolean
  businessName: string
  subtitle: string
  tagline: string
  logoUrl: string
  heroAssetId: string
  heroImageUrl: string
  whatsappNumber: string
  phoneDisplay: string
  email: string
  generalLocation: string
  businessHours: string
  officeAddress: string
  officeMapsUrl: string
  timezone: string
  currency: string
  updatedAt: string
}

export type AdminSiteSettingsInput = {
  businessName: string
  subtitle: string
  tagline: string
  heroAssetId: string
  whatsappNumber: string
  phoneDisplay: string
  email: string
  generalLocation: string
  businessHours: string
  officeAddress: string
  officeMapsUrl: string
}

export function normalizeWhatsappNumber(value: string) {
  const normalized = value.replace(/\D/g, "")
  if (normalized.length <= 12 && normalized.length >= 8) {
    const bare = normalized.length === 12 ? normalized.slice(2) : normalized
    return `52${bare}`
  }
  return normalized
}

export function isSafeHttpUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function validateSiteSettings(input: AdminSiteSettingsInput) {
  const errors: Partial<Record<keyof AdminSiteSettingsInput, string>> = {}

  if (!input.businessName.trim()) errors.businessName = "Agrega el nombre del negocio."
  if (input.businessName.trim().length > 80) errors.businessName = "El nombre no puede superar 80 caracteres."
  if (input.subtitle.trim().length > 160) errors.subtitle = "El subtítulo no puede superar 160 caracteres."
  if (input.tagline.trim().length > 120) errors.tagline = "La frase no puede superar 120 caracteres."

  const whatsapp = normalizeWhatsappNumber(input.whatsappNumber)
  if (!/^52\d{10}$/.test(whatsapp)) errors.whatsappNumber = "Usa un número de WhatsApp con 10 dígitos (prefijo +52)."
  if (input.phoneDisplay.trim().length < 6 || input.phoneDisplay.trim().length > 30) errors.phoneDisplay = "Agrega un teléfono visible válido."
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = "Revisa el correo de contacto."
  if (!input.generalLocation.trim()) errors.generalLocation = "Agrega la ubicación general."
  if (input.businessHours.trim().length > 80) errors.businessHours = "El horario no puede superar 80 caracteres."
  if (input.officeAddress.trim().length > 200) errors.officeAddress = "La dirección no puede superar 200 caracteres."
  if (!isSafeHttpUrl(input.officeMapsUrl)) errors.officeMapsUrl = "Usa un enlace web válido (https)."

  return errors
}