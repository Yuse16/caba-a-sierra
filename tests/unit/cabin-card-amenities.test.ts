import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CabinCard } from "@/components/client/cabin-card"
import type { PublicCabin } from "@/lib/public-cabins"

const cabin: PublicCabin = {
  id: "cabin-amenities",
  name: "Bosques de Monterreal",
  slug: "bosques-de-monterreal",
  location: "Arteaga",
  image: "/placeholder.jpg",
  images: [],
  status: "consultar",
  price: 7500,
  minGuests: 2,
  maxGuests: 14,
  bedrooms: 4,
  beds: 8,
  bedDistribution: {},
  bathrooms: 3,
  acceptsPets: true,
  checkInTime: "15:00",
  checkOutTime: "12:00",
  rules: [],
  address: "",
  zone: "Sierra de Arteaga",
  poolType: "none",
  amenities: ["Chimenea", "Fogatero", "Cocina equipada", "Asador", "Terraza", "Wi-Fi", "Agua caliente", "Pet friendly"],
  categories: ["bosque"],
  description: "Cabaña de prueba",
  type: "familiar",
}

describe("public cabin card amenities", () => {
  it("shows only a compact amenities summary and a remaining-count chip", () => {
    const html = renderToStaticMarkup(React.createElement(CabinCard, {
      cabin,
      isFavorite: false,
      onToggleFavorite: () => undefined,
      onViewDetails: () => undefined,
    }))

    for (const amenity of cabin.amenities.slice(0, 5)) expect(html).toContain(amenity)
    expect(html).toContain("+3 amenidades")
    expect(html).not.toContain("Wi-Fi")
    expect(html).not.toContain("Agua caliente")
    expect(html).not.toContain("Pet friendly")
  })
})
