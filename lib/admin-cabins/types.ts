export type AdminCabinStatus = "draft" | "published"

export type AdminCabinImage = {
  id: string
  url: string
  name: string
  size: number
  type: string
  isCover: boolean
}

export type AdminCabin = {
  id: string
  name: string
  shortDescription: string
  description: string
  nightlyPrice: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  services: string[]
  rules: string[]
  checkInTime: string
  checkOutTime: string
  acceptsPets: boolean
  location: string
  whatsapp: string
  status: AdminCabinStatus
  images: AdminCabinImage[]
  createdAt: string
  updatedAt: string
}

export type AdminCabinInput = Omit<AdminCabin, "id" | "createdAt" | "updatedAt">

export const emptyAdminCabin: AdminCabinInput = {
  name: "",
  shortDescription: "",
  description: "",
  nightlyPrice: 0,
  maxGuests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  services: [],
  rules: [],
  checkInTime: "15:00",
  checkOutTime: "11:00",
  acceptsPets: false,
  location: "",
  whatsapp: "",
  status: "draft",
  images: [],
}

export const publicationFieldLabels = {
  name: "Nombre",
  shortDescription: "Descripción corta",
  description: "Descripción completa",
  nightlyPrice: "Precio por noche",
  maxGuests: "Capacidad máxima",
  bedrooms: "Habitaciones",
  beds: "Camas",
  bathrooms: "Baños",
  services: "Servicios",
  rules: "Reglas",
  checkInTime: "Horario de entrada",
  checkOutTime: "Horario de salida",
  location: "Ubicación o zona",
  whatsapp: "Número de WhatsApp",
  images: "Al menos una fotografía",
} as const

export type PublicationField = keyof typeof publicationFieldLabels

export function getMissingPublicationFields(cabin: AdminCabinInput): PublicationField[] {
  const missing: PublicationField[] = []

  if (!cabin.name.trim()) missing.push("name")
  if (!cabin.shortDescription.trim()) missing.push("shortDescription")
  if (!cabin.description.trim()) missing.push("description")
  if (cabin.nightlyPrice <= 0) missing.push("nightlyPrice")
  if (cabin.maxGuests <= 0) missing.push("maxGuests")
  if (cabin.bedrooms <= 0) missing.push("bedrooms")
  if (cabin.beds <= 0) missing.push("beds")
  if (cabin.bathrooms <= 0) missing.push("bathrooms")
  if (cabin.services.length === 0) missing.push("services")
  if (cabin.rules.length === 0) missing.push("rules")
  if (!cabin.checkInTime) missing.push("checkInTime")
  if (!cabin.checkOutTime) missing.push("checkOutTime")
  if (!cabin.location.trim()) missing.push("location")
  if (!/^\d{10,15}$/.test(cabin.whatsapp.replace(/\D/g, ""))) missing.push("whatsapp")
  if (cabin.images.length === 0 || !cabin.images.some((image) => image.isCover)) missing.push("images")

  return missing
}
