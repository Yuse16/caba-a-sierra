export type AdminCabinStatus = "draft" | "published"
export type CabinPoolType = "none" | "standard" | "heated"
export type BedType = "individual" | "matrimonial" | "king" | "queen" | "litera" | "sofa-cama" | "otro"
export type BedDistribution = Partial<Record<BedType, number>>

export type AdminCabinOwner = {
  id: string | null
  name: string
  phone: string
  whatsapp: string
  email: string
  preferredContact: "whatsapp" | "phone" | "message" | "email"
  notes: string
  contactHours: string
}

export type AdminCabinImage = {
  id: string
  assetId?: string | null
  url: string
  name: string
  size: number
  type: string
  isCover: boolean
  altText?: string
  pendingUpload?: boolean
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
  bedDistribution: BedDistribution
  bathrooms: number
  services: string[]
  rules: string[]
  checkInTime: string
  checkOutTime: string
  acceptsPets: boolean
  location: string
  address: string
  zone: string
  latitude: number | null
  longitude: number | null
  mapsUrl: string
  poolType: CabinPoolType
  whatsapp: string
  owner: AdminCabinOwner | null
  archivedAt: string | null
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
  maxGuests: 0,
  bedrooms: 0,
  beds: 0,
  bedDistribution: {},
  bathrooms: 0,
  services: [],
  rules: [],
  checkInTime: "15:00",
  checkOutTime: "11:00",
  acceptsPets: false,
  location: "",
  address: "",
  zone: "",
  latitude: null,
  longitude: null,
  mapsUrl: "",
  poolType: "none",
  whatsapp: "",
  owner: null,
  archivedAt: null,
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
