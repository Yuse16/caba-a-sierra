import type { AdminPromotion } from "./types"

const createdAt = "2026-07-28T12:00:00.000Z"

export const demoAdminPromotions: AdminPromotion[] = [
  {
    id: "promo-escapada-sierra",
    name: "Escápate a la Sierra",
    image: {
      assetId: "dev:promo-escapada-sierra:cover",
      url: "/cabins/sierra-alta.png",
      name: "escapada-sierra.png",
      size: 0,
      type: "image/png",
    },
    shortDescription: "Encuentra una cabaña para desconectar entre pinos y montañas.",
    imageAlt: "Cabaña iluminada entre pinos en la Sierra de Arteaga",
    startDate: "2026-07-01",
    endDate: "2026-12-31",
    status: "active",
    order: 1,
    ctaLabel: "Ver cabañas",
    href: "#cabanas",
    createdAt,
    updatedAt: createdAt,
  },
]
