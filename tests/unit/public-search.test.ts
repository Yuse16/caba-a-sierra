import { describe, expect, it } from "vitest"
import {
  buildSearchOptions,
  initialClientSearch,
  searchQueryToState,
  searchStateToQuery,
} from "@/lib/public-search"

describe("búsqueda pública de cabañas", () => {
  it("deriva camas, tipos de cama y capacidad desde las cabañas disponibles", () => {
    const options = buildSearchOptions([
      {
        bedrooms: 2,
        beds: 3,
        bedDistribution: { individual: 2, king: 1 },
        maxGuests: 5,
        maxPrice: 3200,
        type: "familiar",
        amenities: ["Chimenea", "WiFi"],
        zone: "San Antonio",
        pool: "none",
      },
      {
        bedrooms: 1,
        beds: 2,
        bedDistribution: { matrimonial: 1, "sofa-cama": 1 },
        maxGuests: 4,
        maxPrice: 2400,
        type: "romantica",
        amenities: ["WiFi"],
        zone: "Los Lirios",
        pool: "heated",
      },
    ])

    expect(options.maxBeds).toBe(3)
    expect(options.maxGuests).toBe(5)
    expect(options.maxBedrooms).toBe(2)
    expect(options.bedTypes).toEqual(["individual", "king", "matrimonial", "sofa-cama"])
    expect(options.amenities).toEqual(["Chimenea", "WiFi"])
  })

  it("conserva filtros de cantidad y tipo de cama en la URL", () => {
    const query = searchStateToQuery({
      ...initialClientSearch,
      minBeds: 3,
      bedType: "king",
      bedrooms: 2,
    })

    expect(query).toContain("camas=3")
    expect(query).toContain("tipoCama=king")
    expect(searchQueryToState(Object.fromEntries(new URLSearchParams(query)))).toMatchObject({
      minBeds: 3,
      bedType: "king",
      bedrooms: 2,
    })
  })

  it("mantiene los filtros de cama neutrales cuando no se solicitan", () => {
    const state = searchQueryToState({})
    expect(state.minBeds).toBe(0)
    expect(state.bedType).toBe("todas")
  })
})
