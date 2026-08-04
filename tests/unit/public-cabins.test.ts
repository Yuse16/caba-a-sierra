import { describe, expect, it } from "vitest"
import { toPublicCabin } from "@/lib/public-cabins-mapper"
import type { Cabin } from "@/lib/demo-data"

const privateCabin = {
  id: "cab-test", name: "Cabaña", slug: "cabana", location: "Arteaga", image: "/cabins/hero.png", status: "confirmada",
  price: 1000, minGuests: 1, maxGuests: 2, bedrooms: 1, bathrooms: 1, amenities: ["WiFi"], categories: ["parejas"],
  rating: 4.5, reviews: 5, description: "Descripción", type: "romantica", ownerId: "owner-secret", ownerName: "Nombre privado",
  ownerPhone: "555", ownerWhatsApp: "52555", ownerNotes: "Nota privada", agreedCommission: 10, lastAvailabilityCheck: "hoy", preferredContactMethod: "WhatsApp",
} satisfies Cabin

describe("DTO público de cabaña", () => {
  it("omite toda información privada del propietario", () => {
    const dto = toPublicCabin(privateCabin)
    expect(dto.name).toBe("Cabaña")
    expect(Object.keys(dto)).not.toContain("ownerName")
    expect(JSON.stringify(dto)).not.toContain("Nombre privado")
    expect(JSON.stringify(dto)).not.toContain("Nota privada")
  })
})
