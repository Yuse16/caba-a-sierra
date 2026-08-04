import type { AdminCabin, AdminCabinInput, AdminCabinStatus } from "./types"

export interface AdminCabinRepository {
  list(): Promise<AdminCabin[]>
  findById(id: string): Promise<AdminCabin | null>
  save(input: AdminCabinInput, actorId: string, id?: string): Promise<AdminCabin>
  setStatus(id: string, status: AdminCabinStatus, actorId: string): Promise<AdminCabin | null>
  archive(id: string, actorId: string): Promise<boolean>
}
