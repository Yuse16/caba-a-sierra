export type PetFilter = "todas" | "admitidas" | "no-admitidas"

export type ClientSearchState = {
  query: string
  checkIn: string
  checkOut: string
  guests: number
  cabinType: string
  maxPrice: number
  amenity: string
  bedrooms: number
  pool: "todas" | "none" | "standard" | "heated"
  pets: PetFilter
  zone: string
}

export type SearchOptions = {
  cabinTypes: string[]
  amenities: string[]
  zones: string[]
  poolOptions: Array<"none" | "standard" | "heated">
  maxBedrooms: number
  maxGuests: number
  maxPrice: number
}

export const initialClientSearch: ClientSearchState = {
  query: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  cabinType: "todas",
  maxPrice: 0,
  amenity: "todas",
  bedrooms: 0,
  pool: "todas",
  pets: "todas",
  zone: "todas",
}

export function dateGapIsValid(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return true
  return checkOut > checkIn
}

export function buildSearchOptions(entries: { bedrooms?: number; maxGuests?: number; maxPrice?: number; type?: string; amenities?: string[]; zone?: string; pool?: "none" | "standard" | "heated" }[]): SearchOptions {
  const cabinTypes = new Set<string>()
  const amenities = new Set<string>()
  const zones = new Set<string>()
  const pools = new Set<"none" | "standard" | "heated">()
  let maxBedrooms = 0
  let maxGuests = 1
  let maxPrice = 0

  for (const entry of entries) {
    if (entry.type) cabinTypes.add(entry.type)
    for (const amenity of entry.amenities ?? []) if (amenity) amenities.add(amenity)
    if (entry.zone) zones.add(entry.zone)
    if (entry.pool) pools.add(entry.pool)
    maxBedrooms = Math.max(maxBedrooms, entry.bedrooms ?? 0)
    maxGuests = Math.max(maxGuests, entry.maxGuests ?? 1)
    maxPrice = Math.max(maxPrice, entry.maxPrice ?? 0)
  }

  return {
    cabinTypes: [...cabinTypes].sort((a, b) => a.localeCompare(b, "es")),
    amenities: [...amenities].sort((a, b) => a.localeCompare(b, "es")),
    zones: [...zones].sort((a, b) => a.localeCompare(b, "es")),
    poolOptions: pools.size ? (["none", "standard", "heated"] as const).filter((pool) => pools.has(pool)) : [],
    maxBedrooms,
    maxGuests,
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
  if (search.maxPrice > 0) params.set("precio", String(search.maxPrice))
  if (search.amenity !== "todas") params.set("amenidad", search.amenity)
  if (search.bedrooms > 0) params.set("cuartos", String(search.bedrooms))
  if (search.pool !== "todas") params.set("alberca", search.pool)
  if (search.pets !== "todas") params.set("mascotas", search.pets === "no-admitidas" ? "no" : "si")
  if (search.zone !== "todas") params.set("zona", search.zone)
  const query = params.toString()
  return query ? `?${query}` : ""
}

function readGuests(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(60, Math.floor(parsed)) : initialClientSearch.guests
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

export function searchQueryToState(params: Record<string, string | string[] | undefined>): ClientSearchState {
  const state: ClientSearchState = {
    query: readToken(params.q),
    checkIn: readToken(params.in),
    checkOut: readToken(params.out),
    guests: readGuests(params.g),
    cabinType: readToken(params.tipo) || "todas",
    maxPrice: readPositive(params.precio),
    amenity: readToken(params.amenidad) || "todas",
    bedrooms: readPositive(params.cuartos),
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