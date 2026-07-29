import { demoAdminCabins } from "./demo-data"
import type { AdminCabin, AdminCabinInput, AdminCabinStatus } from "./types"

const STORAGE_KEY = "cabanas-sierra-norte:admin-cabins:v1"

export interface AdminCabinRepository {
  list(): Promise<AdminCabin[]>
  findById(id: string): Promise<AdminCabin | null>
  save(input: AdminCabinInput, id?: string): Promise<AdminCabin>
  setStatus(id: string, status: AdminCabinStatus): Promise<AdminCabin | null>
}

function cloneCabins(cabins: AdminCabin[]) {
  return cabins.map((cabin) => ({
    ...cabin,
    services: [...cabin.services],
    rules: [...cabin.rules],
    images: cabin.images.map((image) => ({ ...image })),
  }))
}

function isStoredCabin(value: unknown): value is AdminCabin {
  if (typeof value !== "object" || value === null) return false
  const cabin = value as Partial<AdminCabin>
  return (
    typeof cabin.id === "string" &&
    typeof cabin.name === "string" &&
    typeof cabin.nightlyPrice === "number" &&
    Array.isArray(cabin.services) &&
    Array.isArray(cabin.rules) &&
    Array.isArray(cabin.images) &&
    (cabin.status === "draft" || cabin.status === "published")
  )
}

class BrowserAdminCabinRepository implements AdminCabinRepository {
  private read(): AdminCabin[] {
    if (typeof window === "undefined") return cloneCabins(demoAdminCabins)

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) return cloneCabins(demoAdminCabins)
      const parsed: unknown = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.every(isStoredCabin)
        ? cloneCabins(parsed)
        : cloneCabins(demoAdminCabins)
    } catch {
      return cloneCabins(demoAdminCabins)
    }
  }

  private write(cabins: AdminCabin[]) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cabins))
    }
  }

  async list() {
    return this.read()
  }

  async findById(id: string) {
    return this.read().find((cabin) => cabin.id === id) ?? null
  }

  async save(input: AdminCabinInput, id?: string) {
    const cabins = this.read()
    const now = new Date().toISOString()
    const current = id ? cabins.find((cabin) => cabin.id === id) : undefined
    const saved: AdminCabin = {
      ...input,
      id: current?.id ?? `cab-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    const next = current
      ? cabins.map((cabin) => (cabin.id === current.id ? saved : cabin))
      : [saved, ...cabins]
    this.write(next)
    return saved
  }

  async setStatus(id: string, status: AdminCabinStatus) {
    const cabins = this.read()
    const current = cabins.find((cabin) => cabin.id === id)
    if (!current) return null
    const saved = { ...current, status, updatedAt: new Date().toISOString() }
    this.write(cabins.map((cabin) => (cabin.id === id ? saved : cabin)))
    return saved
  }
}

export const adminCabinRepository: AdminCabinRepository = new BrowserAdminCabinRepository()
