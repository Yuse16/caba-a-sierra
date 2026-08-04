import { describe, expect, it } from "vitest"
import { getEffectivePromotionStatus, isPromotionPublic, sanitizePromotionInput, sortPromotions, toPublicPromotion } from "@/lib/admin-promotions/service"
import { validatePromotion } from "@/lib/admin-promotions/validation"
import type { AdminPromotion } from "@/lib/admin-promotions/types"

const base: AdminPromotion = {
  id: "promotion-test", name: "Escapada", image: { url: "/image.webp", name: "image.webp", size: 100, type: "image/webp" },
  shortDescription: "Texto", imageAlt: "Cabaña entre pinos", startDate: "", endDate: "", status: "active", order: 1,
  ctaLabel: "Ver cabañas", href: "#cabanas", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
}
const now = new Date("2026-07-28T12:00:00-06:00")

describe("estados de promociones", () => {
  it("deriva programada, activa y vencida por fecha", () => {
    expect(getEffectivePromotionStatus({ ...base, startDate: "2026-07-29" }, now)).toBe("scheduled")
    expect(getEffectivePromotionStatus({ ...base, startDate: "2026-07-28", endDate: "2026-07-28" }, now)).toBe("active")
    expect(getEffectivePromotionStatus({ ...base, endDate: "2026-07-27" }, now)).toBe("expired")
  })

  it("nunca publica borradores, ocultas o registros incompletos", () => {
    expect(isPromotionPublic({ ...base, status: "draft" }, now)).toBe(false)
    expect(isPromotionPublic({ ...base, status: "hidden" }, now)).toBe(false)
    expect(isPromotionPublic({ ...base, image: null }, now)).toBe(false)
  })

  it("construye un DTO público sin campos administrativos", () => {
    expect(toPublicPromotion(base)).toEqual({ id: base.id, name: base.name, imageUrl: base.image?.url, imageAlt: base.imageAlt, shortDescription: base.shortDescription, ctaLabel: base.ctaLabel, href: base.href })
  })

  it("ordena establemente y sanitiza texto y enlaces", () => {
    const sorted = sortPromotions([{ ...base, id: "b", order: 2 }, { ...base, id: "a", order: 1 }])
    expect(sorted.map((item) => item.id)).toEqual(["a", "b"])
    expect(sanitizePromotionInput({ ...base, name: "  Oferta\n especial  ", href: "javascript:alert(1)" })).toMatchObject({ name: "Oferta especial", href: "" })
  })
})

describe("validación de promociones", () => {
  it("exige nombre, imagen y texto alternativo al publicar", () => {
    const errors = validatePromotion({ ...base, name: "", image: null, imageAlt: "" }, true)
    expect(errors.name).toBeTruthy()
    expect(errors.image).toBeTruthy()
  })

  it("rechaza una fecha final igual o anterior", () => {
    expect(validatePromotion({ ...base, startDate: "2026-08-10", endDate: "2026-08-10" }, true).endDate).toBeTruthy()
    expect(validatePromotion({ ...base, startDate: "2026-08-10", endDate: "2026-08-09" }, true).endDate).toBeTruthy()
  })

  it("exige que CTA y destino aparezcan juntos", () => {
    expect(validatePromotion({ ...base, href: "" }, true).href).toBeTruthy()
    expect(validatePromotion({ ...base, ctaLabel: "" }, true).ctaLabel).toBeTruthy()
  })
})
