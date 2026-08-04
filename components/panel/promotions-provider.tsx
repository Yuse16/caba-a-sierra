"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  deleteAdminPromotionAction,
  loadAdminPromotionsAction,
  reorderAdminPromotionsAction,
  saveAdminPromotionAction,
  setAdminPromotionStatusAction,
} from "@/app/panel/promociones/actions"
import type { AdminPromotion, AdminPromotionInput, AdminPromotionStatus } from "@/lib/admin-promotions/types"

type PromotionMutationResult = { ok: boolean; message: string; promotion?: AdminPromotion }
type PromotionsContextValue = {
  promotions: AdminPromotion[]
  ready: boolean
  error: string | null
  reload: () => Promise<void>
  findPromotion: (id: string) => AdminPromotion | undefined
  savePromotion: (input: AdminPromotionInput, id?: string) => Promise<PromotionMutationResult>
  setPromotionStatus: (id: string, status: AdminPromotionStatus) => Promise<PromotionMutationResult>
  deletePromotion: (id: string) => Promise<PromotionMutationResult>
  movePromotion: (id: string, direction: -1 | 1) => Promise<PromotionMutationResult>
}

const PromotionsContext = createContext<PromotionsContextValue | null>(null)

export function PromotionsProvider({ children }: { children: React.ReactNode }) {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setReady(false)
    setError(null)
    try {
      const result = await loadAdminPromotionsAction()
      if (result.ok) setPromotions(result.data)
      else setError(result.message)
    } catch {
      setError("No pudimos cargar las promociones. Revisa tu conexión e intenta nuevamente.")
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadAdminPromotionsAction().then((result) => {
      if (!active) return
      if (result.ok) setPromotions(result.data)
      else setError(result.message)
    }).catch(() => {
      if (active) setError("No pudimos cargar las promociones. Revisa tu conexión e intenta nuevamente.")
    }).finally(() => {
      if (active) setReady(true)
    })
    return () => { active = false }
  }, [])
  const findPromotion = useCallback((id: string) => promotions.find((item) => item.id === id), [promotions])

  const savePromotion = useCallback(async (input: AdminPromotionInput, id?: string): Promise<PromotionMutationResult> => {
    try {
      const result = await saveAdminPromotionAction(input, id)
      if (!result.ok || !result.data) return result
      setPromotions((current) => [...current.filter((item) => item.id !== result.data?.id), result.data as AdminPromotion].sort((a, b) => a.order - b.order))
      setError(null)
      return { ok: true, promotion: result.data, message: result.message }
    } catch {
      return { ok: false, message: "No pudimos guardar la promoción. Intenta nuevamente." }
    }
  }, [])

  const setPromotionStatus = useCallback(async (id: string, status: AdminPromotionStatus): Promise<PromotionMutationResult> => {
    try {
      const result = await setAdminPromotionStatusAction(id, status)
      if (!result.ok || !result.data) return result
      setPromotions((items) => items.map((item) => item.id === id ? result.data as AdminPromotion : item))
      setError(null)
      return { ok: true, promotion: result.data, message: result.message }
    } catch {
      return { ok: false, message: "No pudimos cambiar la visibilidad. Intenta nuevamente." }
    }
  }, [])

  const deletePromotion = useCallback(async (id: string): Promise<PromotionMutationResult> => {
    try {
      const result = await deleteAdminPromotionAction(id)
      if (!result.ok) return result
      setPromotions((items) => items.filter((item) => item.id !== id))
      return result
    } catch {
      return { ok: false, message: "No pudimos eliminar la promoción. Intenta nuevamente." }
    }
  }, [])

  const movePromotion = useCallback(async (id: string, direction: -1 | 1): Promise<PromotionMutationResult> => {
    const index = promotions.findIndex((item) => item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= promotions.length) return { ok: false, message: "La promoción ya está en esa posición." }
    const ids = promotions.map((item) => item.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(nextIndex, 0, moved)
    try {
      const result = await reorderAdminPromotionsAction(ids)
      if (!result.ok) return result
      setPromotions(result.data)
      return { ok: true, message: result.message ?? "El orden de las promociones fue actualizado." }
    } catch {
      return { ok: false, message: "No pudimos cambiar el orden. Intenta nuevamente." }
    }
  }, [promotions])

  const value = useMemo(() => ({ promotions, ready, error, reload, findPromotion, savePromotion, setPromotionStatus, deletePromotion, movePromotion }), [promotions, ready, error, reload, findPromotion, savePromotion, setPromotionStatus, deletePromotion, movePromotion])
  return <PromotionsContext.Provider value={value}>{children}</PromotionsContext.Provider>
}

export function useAdminPromotions() {
  const context = useContext(PromotionsContext)
  if (!context) throw new Error("useAdminPromotions debe usarse dentro de PromotionsProvider")
  return context
}
