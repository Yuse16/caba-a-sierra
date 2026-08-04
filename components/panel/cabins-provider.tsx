"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { archiveAdminCabinAction, loadAdminCabinsAction, saveAdminCabinAction, setAdminCabinStatusAction } from "@/app/panel/cabanas/actions"
import type { AdminCabin, AdminCabinInput, AdminCabinStatus } from "@/lib/admin-cabins/types"

type MutationResult = { ok: boolean; message: string; cabin?: AdminCabin }

type CabinsContextValue = {
  cabins: AdminCabin[]
  ready: boolean
  error: string | null
  reload: () => Promise<void>
  findCabin: (id: string) => AdminCabin | undefined
  saveCabin: (input: AdminCabinInput, id?: string) => Promise<MutationResult>
  setCabinStatus: (id: string, status: AdminCabinStatus) => Promise<MutationResult>
  archiveCabin: (id: string) => Promise<MutationResult>
}

const CabinsContext = createContext<CabinsContextValue | null>(null)

export function CabinsProvider({ children }: { children: React.ReactNode }) {
  const [cabins, setCabins] = useState<AdminCabin[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setReady(false)
    setError(null)
    try {
      const result = await loadAdminCabinsAction()
      if (result.ok) setCabins(result.data)
      else setError(result.message)
    } catch {
      setError("No pudimos cargar las cabañas. Revisa tu conexión e intenta nuevamente.")
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadAdminCabinsAction().then((result) => {
      if (!active) return
      if (result.ok) setCabins(result.data)
      else setError(result.message)
    }).catch(() => {
      if (active) setError("No pudimos cargar las cabañas. Revisa tu conexión e intenta nuevamente.")
    }).finally(() => {
      if (active) setReady(true)
    })
    return () => { active = false }
  }, [])

  const findCabin = useCallback((id: string) => cabins.find((cabin) => cabin.id === id), [cabins])

  const saveCabin = useCallback(async (input: AdminCabinInput, id?: string): Promise<MutationResult> => {
    try {
      const result = await saveAdminCabinAction(input, id)
      if (!result.ok) return result
      setCabins((current) => current.some((cabin) => cabin.id === result.data.id)
        ? current.map((cabin) => cabin.id === result.data.id ? result.data : cabin)
        : [result.data, ...current])
      setError(null)
      return { ok: true, cabin: result.data, message: result.message }
    } catch {
      return { ok: false, message: "No pudimos guardar los cambios. Intenta nuevamente." }
    }
  }, [])

  const setCabinStatus = useCallback(async (id: string, status: AdminCabinStatus): Promise<MutationResult> => {
    try {
      const result = await setAdminCabinStatusAction(id, status)
      if (!result.ok) return result
      setCabins((items) => items.map((cabin) => cabin.id === id ? result.data : cabin))
      setError(null)
      return { ok: true, cabin: result.data, message: result.message }
    } catch {
      return { ok: false, message: "No pudimos cambiar el estado. Intenta nuevamente." }
    }
  }, [])

  const archiveCabin = useCallback(async (id: string): Promise<MutationResult> => {
    try {
      const result = await archiveAdminCabinAction(id)
      if (!result.ok) return result
      setCabins((items) => items.filter((cabin) => cabin.id !== id))
      setError(null)
      return result
    } catch {
      return { ok: false, message: "No pudimos archivar la cabaña. Intenta nuevamente." }
    }
  }, [])

  const value = useMemo(() => ({ cabins, ready, error, reload, findCabin, saveCabin, setCabinStatus, archiveCabin }), [cabins, ready, error, reload, findCabin, saveCabin, setCabinStatus, archiveCabin])
  return <CabinsContext.Provider value={value}>{children}</CabinsContext.Provider>
}

export function useAdminCabins() {
  const context = useContext(CabinsContext)
  if (!context) throw new Error("useAdminCabins debe usarse dentro de CabinsProvider")
  return context
}
