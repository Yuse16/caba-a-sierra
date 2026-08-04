export type AdminPromotionStatus = "draft" | "scheduled" | "active" | "expired" | "hidden"

export type AdminPromotionImage = {
  assetId?: string | null
  url: string
  name: string
  size: number
  type: string
  pendingUpload?: boolean
}

export type AdminPromotion = {
  id: string
  name: string
  image: AdminPromotionImage | null
  shortDescription: string
  imageAlt: string
  startDate: string
  endDate: string
  status: AdminPromotionStatus
  order: number
  ctaLabel: string
  href: string
  createdAt: string
  updatedAt: string
}

export type AdminPromotionInput = Omit<AdminPromotion, "id" | "createdAt" | "updatedAt">

export const emptyAdminPromotion: AdminPromotionInput = {
  name: "",
  image: null,
  shortDescription: "",
  imageAlt: "",
  startDate: "",
  endDate: "",
  status: "draft",
  order: 1,
  ctaLabel: "",
  href: "",
}

export const promotionStatusLabel: Record<AdminPromotionStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  active: "Activa",
  expired: "Vencida",
  hidden: "Oculta",
}
