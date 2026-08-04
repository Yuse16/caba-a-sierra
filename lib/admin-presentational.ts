import type { CabinCategory, CabinStatus, RequestStatus, ReservationStatus } from "@/lib/demo-data"
import type { Tone } from "@/components/shared/status-badge"

export const cabinStatusTone: Record<CabinStatus, Tone> = {
  "por-confirmar": "warning",
  "alta-demanda": "gold",
  "propietario-contactado": "info",
  confirmada: "success",
  "no-disponible": "muted",
}

export const requestStatusTone: Record<RequestStatus, Tone> = {
  nueva: "gold",
  "pendiente-propietario": "warning",
  "propietario-contactado": "info",
  "disponible-confirmada": "success",
  "no-disponible": "danger",
  "alternativa-ofrecida": "gold",
  "cliente-no-respondio": "muted",
  "esperando-anticipo": "warning",
  "reservacion-confirmada": "success",
  "en-estancia": "info",
  finalizada: "muted",
  cancelada: "danger",
}

export const reservationStatusTone: Record<ReservationStatus, Tone> = {
  pendiente: "warning",
  confirmada: "success",
  "en-uso": "info",
  finalizada: "muted",
  cancelada: "danger",
}

export const cabinStatusLabel: Record<CabinStatus, string> = {
  "por-confirmar": "Disponibilidad por confirmar",
  "alta-demanda": "Alta demanda",
  "propietario-contactado": "Propietario consultado",
  confirmada: "Disponible confirmado",
  "no-disponible": "No disponible temporalmente",
}

export const cabinCategoryLabel: Record<CabinCategory, string> = {
  parejas: "Para parejas",
  familiar: "Familiar",
  grupos: "Grupos",
  chimenea: "Con chimenea",
  "pet-friendly": "Pet friendly",
  bosque: "Cerca del bosque",
}

export const requestStatusLabel: Record<RequestStatus, string> = {
  nueva: "Nueva solicitud",
  "pendiente-propietario": "Pendiente de consultar propietario",
  "propietario-contactado": "Propietario contactado",
  "disponible-confirmada": "Disponible confirmada",
  "no-disponible": "No disponible",
  "alternativa-ofrecida": "Alternativa ofrecida",
  "cliente-no-respondio": "Cliente no respondió",
  "esperando-anticipo": "Esperando anticipo",
  "reservacion-confirmada": "Reservación confirmada",
  "en-estancia": "En estancia",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  "en-uso": "En uso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

export const formatCurrency = (value: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value)

export const initials = (name: string) => name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase()
