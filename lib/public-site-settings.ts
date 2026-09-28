export type PublicSiteSettings = {
  businessName: string
  subtitle: string
  tagline: string
  logoUrl: string
  heroImageUrl: string
  whatsappNumber: string
  whatsappUrl: string
  phoneDisplay: string
  phoneHref: string
  email: string
  generalLocation: string
  businessHours: string
  officeAddress: string
  officeMapsUrl: string
  currency: string
  timezone: string
}

const WHATSAPP_NUMBER = "528444556929"
export const defaultPublicSiteSettings: PublicSiteSettings = {
  businessName: "DUPEZ",
  subtitle: "Renta de cabañas en toda la Sierra de Arteaga",
  tagline: "Respira el bosque. Vive la sierra.",
  logoUrl: "",
  heroImageUrl: "/cabins/hero.png",
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  phoneDisplay: "844 455 6929",
  phoneHref: "tel:+528444556929",
  email: "cabanasdupez@gmail.com",
  generalLocation: "Arteaga, Coahuila, México",
  businessHours: "Lunes a domingo · 8:00 a 21:00 h",
  officeAddress: "",
  officeMapsUrl: "",
  currency: "MXN",
  timezone: "America/Monterrey",
}

export function officeMapsValid(url: string) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}