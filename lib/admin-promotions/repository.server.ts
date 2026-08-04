import "server-only"

import { demoAdminPromotions } from "./demo-data"
import type { AdminPromotionRepository } from "./repository"
import { sanitizePromotionInput, sortPromotions } from "./service"
import type { AdminPromotion, AdminPromotionInput, AdminPromotionStatus } from "./types"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import type { Tables } from "@/lib/supabase/database.types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createDevelopmentJsonStore } from "@/lib/development-json-store.server"

type PromotionRow = Tables<"promotions">
type PromotionImageRow = Tables<"promotion_images">
type MediaAssetRow = Tables<"media_assets">
function clone(items: AdminPromotion[]) {
  return items.map((item) => ({ ...item, image: item.image ? { ...item.image } : null }))
}

const developmentStore = createDevelopmentJsonStore("promotions", () => demoAdminPromotions, clone)

function assertSafeDevelopmentImage(input: AdminPromotionInput) {
  if (input.image && (!input.image.assetId?.startsWith("dev:") || (!input.image.url.startsWith("data:") && !input.image.url.startsWith("/")))) {
    throw new Error("La imagen no pasó la validación de seguridad. Vuelve a subirla.")
  }
}

class DevelopmentAdminPromotionRepository implements AdminPromotionRepository {
  async list() { return sortPromotions(await developmentStore.read()) }
  async findById(id: string) { return (await developmentStore.read()).find((item) => item.id === id) ?? null }

  async save(input: AdminPromotionInput, actorId: string, id?: string) {
    void actorId
    assertSafeDevelopmentImage(input)
    const items = await developmentStore.read()
    const current = id ? items.find((item) => item.id === id) : undefined
    const now = new Date().toISOString()
    const saved: AdminPromotion = { ...sanitizePromotionInput(input), id: current?.id ?? crypto.randomUUID(), createdAt: current?.createdAt ?? now, updatedAt: now }
    await developmentStore.write(current ? items.map((item) => item.id === current.id ? saved : item) : [...items, saved])
    return clone([saved])[0]
  }

  async setStatus(id: string, status: AdminPromotionStatus, actorId: string) {
    void actorId
    const items = await developmentStore.read()
    const current = items.find((item) => item.id === id)
    if (!current) return null
    const saved = { ...current, status, updatedAt: new Date().toISOString() }
    await developmentStore.write(items.map((item) => item.id === id ? saved : item))
    return clone([saved])[0]
  }

  async remove(id: string, actorId: string) {
    void actorId
    const items = await developmentStore.read()
    if (!items.some((item) => item.id === id)) return false
    await developmentStore.write(items.filter((item) => item.id !== id))
    return true
  }

  async reorder(ids: string[], actorId: string) {
    void actorId
    const positions = new Map(ids.map((id, index) => [id, index + 1]))
    const items = await developmentStore.read()
    await developmentStore.write(items.map((item) => ({ ...item, order: positions.get(item.id) ?? item.order, updatedAt: new Date().toISOString() })))
    return this.list()
  }
}

function assertNoError(error: { message: string } | null, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

function effectiveStatus(row: PromotionRow): AdminPromotionStatus {
  if (row.publication_state === "draft" || row.publication_state === "hidden") return row.publication_state
  const today = new Date().toISOString().slice(0, 10)
  if (row.ends_on && row.ends_on < today) return "expired"
  if (row.starts_on && row.starts_on > today) return "scheduled"
  return "active"
}

function publicationState(status: AdminPromotionStatus) {
  if (status === "draft" || status === "hidden") return status
  return "published" as const
}

function assetPublicUrl(asset: MediaAssetRow, storedUrl: string | null) {
  if (storedUrl) return storedUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
  if (!supabaseUrl || !asset.public_bucket || !asset.public_path) return ""
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(asset.public_bucket)}/${asset.public_path.split("/").map(encodeURIComponent).join("/")}`
}

class SupabaseAdminPromotionRepository implements AdminPromotionRepository {
  async list() {
    const supabase = await createSupabaseServerClient()
    const { data: promotions, error } = await supabase.from("promotions").select("*").is("deleted_at", null).order("display_order").order("created_at")
    assertNoError(error, "No se pudieron cargar las promociones")
    if (!promotions?.length) return []

    const promotionIds = promotions.map((promotion) => promotion.id)
    const { data: images, error: imagesError } = await supabase.from("promotion_images").select("*").in("promotion_id", promotionIds).is("deleted_at", null)
    assertNoError(imagesError, "No se pudieron cargar las imágenes de promociones")
    const assetIds = [...new Set((images ?? []).map((image) => image.asset_id))]
    const { data: assets, error: assetsError } = assetIds.length
      ? await supabase.from("media_assets").select("*").in("id", assetIds).is("deleted_at", null)
      : { data: [], error: null }
    assertNoError(assetsError, "No se pudieron cargar los assets")
    const assetById = new Map((assets ?? []).map((asset) => [asset.id, asset]))

    return promotions.map((promotion) => this.toDomain(promotion, (images ?? []).find((image) => image.promotion_id === promotion.id), assetById))
  }

  async findById(id: string) { return (await this.list()).find((item) => item.id === id) ?? null }

  private toDomain(row: PromotionRow, image: PromotionImageRow | undefined, assets: Map<string, MediaAssetRow>): AdminPromotion {
    const asset = image ? assets.get(image.asset_id) : undefined
    const url = asset && image ? assetPublicUrl(asset, image.public_url) : ""
    return {
      id: row.id,
      name: row.name,
      image: asset && url ? { assetId: asset.id, url, name: asset.original_name, size: asset.byte_size, type: asset.mime_type } : null,
      shortDescription: row.short_description,
      imageAlt: row.image_alt,
      startDate: row.starts_on ?? "",
      endDate: row.ends_on ?? "",
      status: effectiveStatus(row),
      order: row.display_order,
      ctaLabel: row.cta_label,
      href: row.href,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async save(input: AdminPromotionInput, actorId: string, id?: string) {
    if (input.image && (input.image.url.startsWith("data:") || !input.image.assetId)) {
      throw new Error("La imagen no tiene un archivo seguro asociado. Vuelve a subirla.")
    }
    const clean = sanitizePromotionInput(input)
    const supabase = await createSupabaseServerClient()
    const desiredPublicationState = publicationState(clean.status)
    const fields = {
      name: clean.name, short_description: clean.shortDescription, image_alt: clean.imageAlt,
      starts_on: clean.startDate || null, ends_on: clean.endDate || null, publication_state: "draft" as const,
      display_order: clean.order, cta_label: clean.ctaLabel, href: clean.href, updated_by: actorId,
    }
    let promotionId = id
    let created = false
    if (id) {
      const { error } = await supabase.from("promotions").update(fields).eq("id", id).is("deleted_at", null)
      assertNoError(error, "No se pudo actualizar la promoción")
    } else {
      const { data, error } = await supabase.from("promotions").insert({ ...fields, name: fields.name, created_by: actorId }).select("id").single()
      assertNoError(error, "No se pudo crear la promoción")
      promotionId = data?.id
      created = Boolean(promotionId)
    }
    if (!promotionId) throw new Error("No se pudo identificar la promoción guardada.")
    try {
      await this.syncImage(supabase, promotionId, clean)
      const { error: publicationError } = await supabase.from("promotions").update({ publication_state: desiredPublicationState, updated_by: actorId }).eq("id", promotionId).is("deleted_at", null)
      assertNoError(publicationError, "No se pudo actualizar el estado final de la promoción")
    } catch (error) {
      if (created) await supabase.from("promotions").update({ deleted_at: new Date().toISOString(), publication_state: "draft" }).eq("id", promotionId)
      throw error
    }
    const saved = await this.findById(promotionId)
    if (!saved) throw new Error("La promoción fue guardada, pero no pudo volver a cargarse.")
    return saved
  }

  private async syncImage(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, promotionId: string, input: AdminPromotionInput) {
    const now = new Date().toISOString()
    const { data: current, error: currentError } = await supabase.from("promotion_images").select("*").eq("promotion_id", promotionId)
    assertNoError(currentError, "No se pudo consultar la imagen actual")
    const active = (current ?? []).find((image) => image.deleted_at === null)
    if (!input.image) {
      if (active) {
        const { error } = await supabase.from("promotion_images").update({ deleted_at: now }).eq("promotion_id", promotionId).is("deleted_at", null)
        assertNoError(error, "No se pudo retirar la imagen")
      }
      return
    }
    const { data: asset, error: assetError } = await supabase.from("media_assets").select("*").eq("id", input.image.assetId as string).eq("processing_status", "ready").is("deleted_at", null).maybeSingle()
    assertNoError(assetError, "No se pudo validar la imagen")
    if (!asset) throw new Error("La imagen no corresponde a un asset listo y seguro.")
    const storedUrl = active?.asset_id === asset.id ? active.public_url : null
    const values = { asset_id: asset.id, alt_text: input.imageAlt, public_url: assetPublicUrl(asset, storedUrl) || null, deleted_at: null }
    const result = active
      ? await supabase.from("promotion_images").update(values).eq("id", active.id)
      : await supabase.from("promotion_images").insert({ ...values, promotion_id: promotionId, asset_id: asset.id })
    assertNoError(result.error, "No se pudo asociar la imagen")
  }

  async setStatus(id: string, status: AdminPromotionStatus, actorId: string) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("promotions").update({ publication_state: publicationState(status), updated_by: actorId }).eq("id", id).is("deleted_at", null)
    assertNoError(error, "No se pudo cambiar el estado de la promoción")
    return this.findById(id)
  }

  async remove(id: string, actorId: string) {
    const supabase = await createSupabaseServerClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase.from("promotions").update({ deleted_at: now, publication_state: "draft", updated_by: actorId }).eq("id", id).is("deleted_at", null).select("id").maybeSingle()
    assertNoError(error, "No se pudo eliminar la promoción")
    if (data) {
      const { error: imageError } = await supabase.from("promotion_images").update({ deleted_at: now }).eq("promotion_id", id).is("deleted_at", null)
      assertNoError(imageError, "La promoción se eliminó, pero no se pudo retirar su imagen")
    }
    return Boolean(data)
  }

  async reorder(ids: string[], actorId: string) {
    void actorId
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.rpc("reorder_promotions", { ordered_ids: ids })
    assertNoError(error, "No se pudo reordenar las promociones")
    return this.list()
  }
}

export function createAdminPromotionRepository(): AdminPromotionRepository {
  if (hasSupabaseConfig()) return new SupabaseAdminPromotionRepository()
  if (process.env.NODE_ENV !== "production") return new DevelopmentAdminPromotionRepository()
  throw new Error("La persistencia de promociones no está configurada.")
}
