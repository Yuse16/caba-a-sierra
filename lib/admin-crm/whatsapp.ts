import type { CrmInquiry, PublishedCabinOption } from "./types"
export type WhatsAppTemplate = "received" | "available" | "unavailable" | "alternative" | "followup" | "confirmation"
export const templateLabels: Record<WhatsAppTemplate, string> = { received: "Solicitud recibida", available: "Disponible", unavailable: "No disponible", alternative: "Alternativa", followup: "Seguimiento", confirmation: "Confirmación" }
export function formatShortDate(value: string) { return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) }
export function whatsappMessage(template: WhatsAppTemplate, inquiry: CrmInquiry, alternative?: PublishedCabinOption, origin = "") {
  const intro = `Hola, ${inquiry.customerName}. 👋\nGracias por contactar a DUPEZ.`; const stay = `${inquiry.cabinName} del ${formatShortDate(inquiry.checkIn)} al ${formatShortDate(inquiry.checkOut)} para ${inquiry.guests} personas.`
  if (template === "available") return `${intro}\n\nLa cabaña está disponible para las fechas solicitadas.\n\n${stay}\n\n¿Deseas continuar?`
  if (template === "unavailable") return `${intro}\n\nLa opción que consultaste no está disponible para esas fechas. ¿Quieres que te compartamos alternativas?`
  if (template === "alternative" && alternative) return `Hola, ${inquiry.customerName}.\nTenemos otra opción que podría interesarte:\n\n${alternative.name}\n${origin}/?cabana=${encodeURIComponent(alternative.slug)}\n\n¿Quieres que revisemos disponibilidad para tus fechas?`
  if (template === "followup") return `${intro}\n\nQueremos dar seguimiento a tu solicitud para ${stay}\n\n¿Aún te interesa continuar?`
  if (template === "confirmation") return `${intro}\n\nTu solicitud para ${stay} quedó confirmada por nuestro equipo. Te compartiremos los siguientes pasos por este medio.`
  return `${intro}\n\nRecibimos tu solicitud para ${stay}\n\nTe escribimos para continuar con tu reservación.`
}
export function customerWhatsAppUrl(phoneE164: string, message: string) { return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` }
