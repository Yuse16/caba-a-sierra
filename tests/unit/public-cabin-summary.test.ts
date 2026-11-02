import { describe, expect, it } from "vitest"
import type { PublicCabin } from "@/lib/public-cabins"
import { toPublicCabinSummary } from "@/lib/public-cabin-summary"

const cabin: PublicCabin = {
  id: "cab-1", name: "Bosque", slug: "bosque", location: "Arteaga", image: "https://img.test/cover.webp",
  images: [
    { id: "1", url: "https://img.test/cover.webp", altText: "Exterior", position: 1, isCover: true },
    { id: "2", url: "https://img.test/sala.webp", altText: "Sala", position: 2, isCover: false },
    { id: "3", url: "https://img.test/terraza.webp", altText: "Terraza", position: 3, isCover: false },
  ],
  status: "consultar", price: 3200, oldPrice: 3500, discountPct: 9, minGuests: 2, maxGuests: 8,
  bedrooms: 3, beds: 5, bedDistribution: { matrimonial: 2, individual: 3 }, bathrooms: 2,
  acceptsPets: true, checkInTime: "15:00", checkOutTime: "12:00", rules: ["No fumar", "Sin fiestas"],
  address: "Dirección privada de operación", zone: "Los Lirios", latitude: 25.1, longitude: -100.6,
  mapsUrl: "https://maps.example/test", poolType: "heated", amenities: ["WiFi", "Chimenea", "Asador"],
  categories: ["familiar", "chimenea", "pet-friendly"], description: "Cabaña amplia entre pinos con terraza.", type: "familiar",
}

describe("PublicCabinSummary", () => {
  it("conserva solo los datos requeridos por búsqueda y tarjeta", () => {
    const summary = toPublicCabinSummary(cabin)
    expect(summary).toMatchObject({ id: "cab-1", name: "Bosque", imageCount: 3, price: 3200, maxGuests: 8, zone: "Los Lirios" })
    expect(summary.bedDistribution).toEqual({ matrimonial: 2, individual: 3 })
    expect(summary.amenities).toEqual(["WiFi", "Chimenea", "Asador"])
    expect(summary.categories).toEqual(["familiar", "chimenea", "pet-friendly"])
  })

  it("no serializa galería ni campos exclusivos del detalle", () => {
    const summary = toPublicCabinSummary(cabin) as unknown as Record<string, unknown>
    for (const field of ["images", "rules", "address", "latitude", "longitude", "mapsUrl", "checkInTime", "checkOutTime", "bathrooms"]) {
      expect(summary).not.toHaveProperty(field)
    }
  })

  it("reduce de forma material el payload para un catálogo grande", () => {
    const fullPayload = JSON.stringify(Array.from({ length: 46 }, (_, index) => ({ ...cabin, id: `cab-${index}` })))
    const summaryPayload = JSON.stringify(Array.from({ length: 46 }, (_, index) => toPublicCabinSummary({ ...cabin, id: `cab-${index}` })))
    expect(summaryPayload.length).toBeLessThan(fullPayload.length * 0.65)
  })
})
