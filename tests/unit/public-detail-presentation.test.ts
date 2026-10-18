import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
vi.mock("@/app/actions/booking-inquiries", () => ({ createBookingInquiryAction: vi.fn() }))

import { CabinDetailsModal } from "@/components/client/cabin-details-modal"
import { PublicPromotionCard } from "@/components/promotions/public-promotion-card"
import type { PublicCabin } from "@/lib/public-cabins"
import { defaultPublicSiteSettings } from "@/lib/public-site-settings"

const cabin: PublicCabin = {
  id: "cabin-test",
  name: "Cabaña prueba",
  slug: "cabana-prueba",
  location: "Arteaga, Coahuila",
  image: "/placeholder.jpg",
  images: [],
  status: "consultar",
  price: 2500,
  minGuests: 2,
  maxGuests: 6,
  bedrooms: 2,
  beds: 3,
  bedDistribution: {},
  bathrooms: 1,
  acceptsPets: false,
  checkInTime: "15:17",
  checkOutTime: "11:23",
  rules: [],
  address: "",
  zone: "Sierra de Arteaga",
  poolType: "none",
  amenities: ["Chimenea"],
  categories: ["bosque"],
  description: "Cabaña de prueba",
  type: "familiar",
}

describe("public cabin detail presentation", () => {
  it("shows the cabin check-in and check-out times inside the detail modal", () => {
    const html = renderToStaticMarkup(React.createElement(CabinDetailsModal, {
      cabin,
      bookingDefaults: { checkIn: "", checkOut: "", guests: 2 },
      settings: defaultPublicSiteSettings,
      onClose: () => undefined,
      onAction: () => undefined,
    }))

    expect(html).toContain("3:17")
    expect(html).toContain("11:23")
  })
})

describe("public promotion image presentation", () => {
  it("shows the full promotion image without cover-cropping it", () => {
    const html = renderToStaticMarkup(React.createElement(PublicPromotionCard, {
      promotion: {
        id: "promo-test",
        name: "Promoción prueba",
        imageUrl: "/placeholder.jpg",
        imageAlt: "Promoción de prueba",
        shortDescription: "Texto",
        ctaLabel: "Ver cabañas",
        href: "#cabanas",
      },
      preview: true,
    }))

    expect(html).toContain("object-contain")
    expect(html).not.toContain("object-cover")
  })
})
