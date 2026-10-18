import { readFileSync } from "node:fs"
import { join } from "node:path"
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

    expect(html).toContain('data-promotion-artwork="true"')
    expect(html).toContain("object-contain z-10")
    expect(html).toContain('data-promotion-media="true"')
    expect(html).toContain('data-promotion-content="true"')
    expect(html.indexOf('data-promotion-media="true"')).toBeLessThan(html.indexOf('data-promotion-content="true"'))
    expect(html).not.toContain("bg-gradient-to-t")
  })

  it("uses a subdued DUPEZ-green vector mountain-and-fauna backdrop without a stretched bitmap", () => {
    const source = readFileSync(join(process.cwd(), "components/promotions/public-promotion-card.tsx"), "utf8")

    expect(source).toContain('data-promotion-landscape="vector"')
    expect(source).toContain('aria-hidden="true"')
    expect(source).toContain('opacity-[0.16]')
    expect(source).toContain('stroke="#315f46"')
    expect(source).toContain('strokeWidth="7"')
    expect(source).toContain('data-vector-mountains="true"')
    expect(source).toContain('data-vector-fauna="true"')
    expect(source).toContain('<svg')
    expect(source).not.toContain('/promotions/dupez-reference-bg.jpg')
    expect(source).not.toContain('mix-blend-screen')
    expect(source).not.toContain('object-cover')
    expect(source).toContain('data-promotion-artwork="true"')
    expect(source).toContain('object-contain z-10')
    expect(source.indexOf('data-promotion-landscape="vector"')).toBeLessThan(source.indexOf('data-promotion-artwork="true"'))
  })
})
