"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { demoAdminCabins } from "@/lib/admin-cabins/demo-data"
import { adminCabinRepository } from "@/lib/admin-cabins/repository"
import {
  getMissingPublicationFields,
  type AdminCabin,
  type AdminCabinInput,
  type AdminCabinStatus,
} from "@/lib/admin-cabins/types"

type MutationResult = {
  ok: boolean
  message: string
  cabin?: AdminCabin
}

type CabinsContextValue = {
  cabins: AdminCabin[]
  ready: boolean
  findCabin: (id: string) => AdminCabin | undefined
  saveCabin: (input: AdminCabinInput, id?: string) => Promise<MutationResult>
  setCabinStatus: (id: string, status: AdminCabinStatus) => Promise<MutationResult>
}

const CabinsContext = createContext<CabinsContextValue | null>(null)

function toInput(cabin: AdminCabin): AdminCabinInput {
  return {
    name: cabin.name,
    shortDescription: cabin.shortDescription,
    description: cabin.description,
    nightlyPrice: cabin.nightlyPrice,
    maxGuests: cabin.maxGuests,
    bedrooms: cabin.bedrooms,
    beds: cabin.beds,
    bathrooms: cabin.bathrooms,
    services: [...cabin.services],
    rules: [...cabin.rules],
    checkInTime: cabin.checkInTime,
    checkOutTime: cabin.checkOutTime,
    acceptsPets: cabin.acceptsPets,
    location: cabin.location,
    whatsapp: cabin.whatsapp,
    status: cabin.status,
    images: cabin.images.map((image) => ({ ...image })),
  }
}

export function CabinsProvider({ children }: { children: React.ReactNode }) {
  const [cabins, setCabins] = useState<AdminCabin[]>(demoAdminCabins)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void adminCabinRepository.list().then((items) => {
      if (active) {
        setCabins(items)
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const findCabin = useCallback(
    (id: string) => cabins.find((cabin) => cabin.id === id),
    [cabins],
  )

  const saveCabin = useCallback(async (input: AdminCabinInput, id?: string): Promise<MutationResult> => {
    try {
      const saved = await adminCabinRepository.save(input, id)
      setCabins((current) => {
        const exists = current.some((cabin) => cabin.id === saved.id)
        return exists
          ? current.map((cabin) => (cabin.id === saved.id ? saved : cabin))
          : [saved, ...current]
      })
      return { ok: true, cabin: saved, message: input.status === "published" ? "La cabaña quedó publicada." : "El borrador quedó guardado." }
    } catch {
      return { ok: false, message: "No pudimos guardar los cambios. Intenta nuevamente." }
    }
  }, [])

  const setCabinStatus = useCallback(async (id: string, status: AdminCabinStatus): Promise<MutationResult> => {
    const current = cabins.find((cabin) => cabin.id === id)
    if (!current) return { ok: false, message: "No encontramos esa cabaña." }

    if (status === "published" && getMissingPublicationFields(toInput(current)).length > 0) {
      return { ok: false, message: "Completa la información pendiente antes de publicar." }
    }

    try {
      const saved = await adminCabinRepository.setStatus(id, status)
      if (!saved) return { ok: false, message: "No encontramos esa cabaña." }
      setCabins((items) => items.map((cabin) => (cabin.id === id ? saved : cabin)))
      return { ok: true, cabin: saved, message: status === "published" ? "La cabaña ya está publicada." : "La cabaña quedó oculta." }
    } catch {
      return { ok: false, message: "No pudimos cambiar el estado. Intenta nuevamente." }
    }
  }, [cabins])

  const value = useMemo(
    () => ({ cabins, ready, findCabin, saveCabin, setCabinStatus }),
    [cabins, ready, findCabin, saveCabin, setCabinStatus],
  )

  return <CabinsContext.Provider value={value}>{children}</CabinsContext.Provider>
}

export function useAdminCabins() {
  const context = useContext(CabinsContext)
  if (!context) throw new Error("useAdminCabins debe usarse dentro de CabinsProvider")
  return context
}
