export type PetFilter = "todas" | "admitidas" | "no-admitidas"

export type ClientSearchState = {
  query: string
  checkIn: string
  checkOut: string
  guests: number
  cabinType: string
  minPrice: number
  maxPrice: number
  amenities: string[]
  bedrooms: number
  minBeds: number
  bedType: string
  pool: "todas" | "none" | "standard" | "heated"
  pets: PetFilter
  zone: string
}

export type SearchOptions = {
  cabinTypes: string[]
  amenities: string[]
  zones: string[]
  bedTypes: string[]
  poolOptions: Array<"none" | "standard" | "heated">
  maxBedrooms: number
  maxBeds: number
  maxGuests: number
  minPrice: number
  maxPrice: number
}

export const initialClientSearch: ClientSearchState = {
  query: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  cabinType: "todas",
  minPrice: 0,
  maxPrice: 0,
  amenities: [],
  bedrooms: 0,
  minBeds: 0,
  bedType: "todas",
  pool: "todas",
  pets: "todas",
  zone: "todas",
}

export function dateGapIsValid(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return true
  return checkOut > checkIn
}

export function buildSearchOptions(entries: {
  bedrooms?: number
  beds?: number
  bedDistribution?: Record<string, number>
  maxGuests?: number
  price?: number
  type?: string
  amenities?: string[]
  zone?: string
  pool?: "none" | "standard" | "heated"
}[]): SearchOptions {
  const cabinTypes = new Set<string>()
  const amenities = new Set<string>()
  const zones = new Set<string>()
  const bedTypes = new Set<string>()
  const pools = new Set<"none" | "standard" | "heated">()
  let maxBedrooms = 0
  let maxBeds = 0
  let maxGuests = 1
  let minPrice = Number.POSITIVE_INFINITY
  let maxPrice = 0

  for (const entry of entries) {
    if (entry.type) cabinTypes.add(entry.type)
    for (const amenity of entry.amenities ?? []) if (amenity) amenities.add(amenity)
    for (const [bedType, amount] of Object.entries(entry.bedDistribution ?? {})) {
      if ((amount ?? 0) > 0) bedTypes.add(bedType)
    }
    if (entry.zone) zones.add(entry.zone)
    if (entry.pool) pools.add(entry.pool)
    maxBedrooms = Math.max(maxBedrooms, entry.bedrooms ?? 0)
    maxBeds = Math.max(maxBeds, entry.beds ?? 0)
    maxGuests = Math.max(maxGuests, entry.maxGuests ?? 1)
    if ((entry.price ?? 0) > 0) {
      minPrice = Math.min(minPrice, entry.price ?? 0)
      maxPrice = Math.max(maxPrice, entry.price ?? 0)
    }
  }

  return {
    cabinTypes: [...cabinTypes].sort((a, b) => a.localeCompare(b, "es")),
    amenities: [...amenities].sort((a, b) => a.localeCompare(b, "es")),
    zones: [...zones].sort((a, b) => a.localeCompare(b, "es")),
    bedTypes: [...bedTypes].sort((a, b) => a.localeCompare(b, "es")),
    poolOptions: pools.size ? (["none", "standard", "heated"] as const).filter((pool) => pools.has(pool)) : [],
    maxBedrooms,
    maxBeds,
    maxGuests,
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
  }
}

export function searchStateToQuery(search: ClientSearchState) {
  const params = new URLSearchParams()
  if (search.query) params.set("q", search.query)
  if (search.checkIn) params.set("in", search.checkIn)
  if (search.checkOut) params.set("out", search.checkOut)
  if (search.guests > 1) params.set("g", String(search.guests))
  if (search.cabinType !== "todas") params.set("tipo", search.cabinType)
  if (search.minPrice > 0) params.set("precioMin", String(search.minPrice))
  if (search.maxPrice > 0) params.set("precioMax", String(search.maxPrice))
  for (const amenity of search.amenities) params.append("amenidad", amenity)
  if (search.bedrooms > 0) params.set("cuartos", String(search.bedrooms))
  if (search.minBeds > 0) params.set("camas", String(search.minBeds))
  if (search.bedType !== "todas") params.set("tipoCama", search.bedType)
  if (search.pool !== "todas") params.set("alberca", search.pool)
  if (search.pets !== "todas") params.set("mascotas", search.pets === "no-admitidas" ? "no" : "si")
  if (search.zone !== "todas") params.set("zona", search.zone)
  return params.toString()
}

function readGuests(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(10000, Math.floor(parsed)) : initialClientSearch.guests
}

function readPositive(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function readToken(value: string | string[] | undefined) {
  if (!value) return ""
  const token = (Array.isArray(value) ? value[0] : value).trim()
  return token
}

function readTokens(value: string | string[] | undefined) {
  if (!value) return []
  const values = Array.isArray(value) ? value : [value]
  return [...new Set(values.flatMap((token) => token.split(",")).map((token) => token.trim()).filter(Boolean))]
}

export function searchQueryToState(params: Record<string, string | string[] | undefined>): ClientSearchState {
  const state: ClientSearchState = {
    query: readToken(params.q),
    checkIn: readToken(params.in),
    checkOut: readToken(params.out),
    guests: readGuests(params.g),
    cabinType: readToken(params.tipo) || "todas",
    minPrice: readPositive(params.precioMin),
    maxPrice: readPositive(params.precioMax ?? params.precio),
    amenities: readTokens(params.amenidad),
    bedrooms: readPositive(params.cuartos),
    minBeds: readPositive(params.camas),
    bedType: readToken(params.tipoCama) || "todas",
    pool: ["none", "standard", "heated"].includes(readToken(params.alberca)) ? readToken(params.alberca) as ClientSearchState["pool"] : "todas",
    pets: readToken(params.mascotas) === "no" ? "no-admitidas" : readToken(params.mascotas) === "si" ? "admitidas" : "todas",
    zone: readToken(params.zona) || "todas",
  }
  if (!dateGapIsValid(state.checkIn, state.checkOut)) {
    state.checkIn = ""
    state.checkOut = ""
  }
  return state
}
