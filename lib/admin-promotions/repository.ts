import type { AdminPromotion, AdminPromotionInput, AdminPromotionStatus } from "./types"

export interface AdminPromotionRepository {
  list(): Promise<AdminPromotion[]>
  findById(id: string): Promise<AdminPromotion | null>
  save(input: AdminPromotionInput, actorId: string, id?: string): Promise<AdminPromotion>
  setStatus(id: string, status: AdminPromotionStatus, actorId: string): Promise<AdminPromotion | null>
  remove(id: string, actorId: string): Promise<boolean>
  reorder(ids: string[], actorId: string): Promise<AdminPromotion[]>
}
