import { describe, expect, it } from "vitest"
import {
  buildSearchOptions,
  initialClientSearch,
  searchQueryToState,
  searchStateToQuery,
} from "@/lib/public-search"

describe("búsqueda pública de cabañas", () => {
  it("deriva camas, amenidades, capacidad, alberca y rango de precios desde las cabañas publicadas", () => {
    const options = buildSearchOptions([
      {
        bedrooms: 2,
        beds: 3,
        bedDistribution: { individual: 2, king: 1 },
        maxGuests: 5,
        price: 3200,
        type: "familiar",
        amenities: ["Chimenea", "WiFi"],
        zone: "San Antonio",
        poolType: "none",
      },
      {
        bedrooms: 1,
        beds: 2,
        bedDistribution: { matrimonial: 1, "sofa-cama": 1 },
        maxGuests: 4,
        price: 1600,
        type: "romantica",
        amenities: ["WiFi", "Jacuzzi"],
        zone: "Los Lirios",
        poolType: "heated",
      },
    ])

    expect(options.maxBeds).toBe(3)
    expect(options.maxGuests).toBe(5)
    expect(options.maxBedrooms).toBe(2)
    expect(options.bedTypes).toEqual(["individual", "king", "matrimonial", "sofa-cama"])
    expect(options.amenities).toEqual(["Chimenea", "Jacuzzi", "WiFi"])
    expect(options.poolOptions).toEqual(["none", "heated"])
    expect(options.minPrice).toBe(1600)
    expect(options.maxPrice).toBe(3200)
  })

  it("actualiza el mínimo automáticamente cuando cambia la cabaña publicada más barata", () => {
    expect(buildSearchOptions([{ price: 1500 }, { price: 2300 }]).minPrice).toBe(1500)
    expect(buildSearchOptions([{ price: 1800 }, { price: 2300 }]).minPrice).toBe(1800)
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

  it("conserva varias amenidades y el rango de precios en la URL", () => {
    const query = searchStateToQuery({
      ...initialClientSearch,
      minPrice: 1600,
      maxPrice: 3500,
      amenities: ["Alberca", "Clima", "Fogatero"],
    })
    const params = new URLSearchParams(query)
    const parsed = searchQueryToState({
      precioMin: params.get("precioMin") ?? undefined,
      precioMax: params.get("precioMax") ?? undefined,
      amenidad: params.getAll("amenidad"),
    })

    expect(params.getAll("amenidad")).toEqual(["Alberca", "Clima", "Fogatero"])
    expect(parsed).toMatchObject({
      minPrice: 1600,
      maxPrice: 3500,
      amenities: ["Alberca", "Clima", "Fogatero"],
    })
  })

  it("mantiene filtros neutrales cuando no se solicitan", () => {
    const state = searchQueryToState({})
    expect(state.minBeds).toBe(0)
    expect(state.bedType).toBe("todas")
    expect(state.minPrice).toBe(0)
    expect(state.maxPrice).toBe(0)
    expect(state.amenities).toEqual([])
  })
})
