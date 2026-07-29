export type PublicCabinCategory =
  | "parejas"
  | "familiar"
  | "grupos"
  | "chimenea"
  | "pet-friendly"
  | "bosque"

export type PublicCabinStatus = "consultar" | "alta-demanda" | "otras-fechas"

export type PublicCabin = {
  id: string
  name: string
  slug: string
  location: string
  image: string
  status: PublicCabinStatus
  price: number
  oldPrice?: number
  discountPct?: number
  minGuests: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  categories: PublicCabinCategory[]
  rating: number
  reviews: number
  badge?: "popular" | "oferta"
  description: string
  type: "romantica" | "familiar" | "grupal" | "premium"
}

export const publicCabinStatusLabel: Record<PublicCabinStatus, string> = {
  consultar: "Consulta tus fechas",
  "alta-demanda": "Alta demanda",
  "otras-fechas": "Consulta otras fechas",
}

export const publicCabinStatusTone = {
  consultar: "info",
  "alta-demanda": "gold",
  "otras-fechas": "muted",
} as const

export const currency = (value: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value)
