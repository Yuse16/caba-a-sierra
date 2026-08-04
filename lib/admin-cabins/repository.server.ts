import "server-only"

import { demoAdminCabins } from "./demo-data"
import type { AdminCabinRepository } from "./repository"
import type { AdminCabin, AdminCabinImage, AdminCabinInput, AdminCabinStatus } from "./types"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import type { Tables } from "@/lib/supabase/database.types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createDevelopmentJsonStore } from "@/lib/development-json-store.server"

type CabinRow = Tables<"cabins">
type CabinImageRow = Tables<"cabin_images">
type MediaAssetRow = Tables<"media_assets">

function cloneCabins(cabins: AdminCabin[]) {
  return cabins.map((cabin) => ({
    ...cabin,
    services: [...cabin.services],
    rules: [...cabin.rules],
    images: cabin.images.map((image) => ({ ...image })),
  }))
}

const developmentStore = createDevelopmentJsonStore("cabins", () => demoAdminCabins, cloneCabins)

function assertSafeDevelopmentImages(images: AdminCabinImage[]) {
  if (images.some((image) => !image.assetId?.startsWith("dev:") || (!image.url.startsWith("data:") && !image.url.startsWith("/")))) {
    throw new Error("Una imagen no pasó la validación de seguridad. Vuelve a subirla.")
  }
}

class DevelopmentAdminCabinRepository implements AdminCabinRepository {
  async list() {
    return developmentStore.read()
  }

  async findById(id: string) {
    return (await developmentStore.read()).find((cabin) => cabin.id === id) ?? null
  }

  async save(input: AdminCabinInput, _actorId: string, id?: string) {
    assertSafeDevelopmentImages(input.images)
    const items = await developmentStore.read()
    const current = id ? items.find((cabin) => cabin.id === id) : undefined
    const now = new Date().toISOString()
    const saved: AdminCabin = {
      ...input,
      images: input.images.map((image) => ({ ...image })),
      id: current?.id ?? crypto.randomUUID(),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }
    const next = current
      ? items.map((cabin) => cabin.id === current.id ? saved : cabin)
      : [saved, ...items]
    await developmentStore.write(next)
    return cloneCabins([saved])[0]
  }

  async setStatus(id: string, status: AdminCabinStatus, actorId: string) {
    void actorId
    const items = await developmentStore.read()
    const current = items.find((cabin) => cabin.id === id)
    if (!current) return null
    const saved = { ...current, status, updatedAt: new Date().toISOString() }
    await developmentStore.write(items.map((cabin) => cabin.id === id ? saved : cabin))
    return cloneCabins([saved])[0]
  }

  async archive(id: string, actorId: string) {
    void actorId
    const items = await developmentStore.read()
    if (!items.some((cabin) => cabin.id === id)) return false
    await developmentStore.write(items.filter((cabin) => cabin.id !== id))
    return true
  }
}

function slugify(value: string) {
  const slug = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return slug || "cabana"
}

function assertNoError(error: { message: string } | null, operation: string) {
  if (error) throw new Error(`${operation}: ${error.message}`)
}

function imageUrl(asset: MediaAssetRow, storedUrl: string | null, supabaseUrl: string) {
  if (storedUrl) return storedUrl
  if (!asset.public_bucket || !asset.public_path) return ""
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(asset.public_bucket)}/${asset.public_path.split("/").map(encodeURIComponent).join("/")}`
}

class SupabaseAdminCabinRepository implements AdminCabinRepository {
  async list() {
    const supabase = await createSupabaseServerClient()
    const { data: cabins, error: cabinsError } = await supabase.from("cabins").select("*").is("deleted_at", null).order("display_order").order("created_at")
    assertNoError(cabinsError, "No se pudieron cargar las cabañas")
    if (!cabins?.length) return []

    const cabinIds = cabins.map((cabin) => cabin.id)
    const [imagesResult, joinsResult] = await Promise.all([
      supabase.from("cabin_images").select("*").in("cabin_id", cabinIds).is("deleted_at", null).order("position"),
      supabase.from("cabin_services").select("cabin_id, service_id").in("cabin_id", cabinIds),
    ])
    assertNoError(imagesResult.error, "No se pudieron cargar las imágenes")
    assertNoError(joinsResult.error, "No se pudieron cargar los servicios")

    const assetIds = [...new Set((imagesResult.data ?? []).map((image) => image.asset_id))]
    const serviceIds = [...new Set((joinsResult.data ?? []).map((join) => join.service_id))]
    const [assetsResult, servicesResult] = await Promise.all([
      assetIds.length ? supabase.from("media_assets").select("*").in("id", assetIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
      serviceIds.length ? supabase.from("services").select("id, name").in("id", serviceIds) : Promise.resolve({ data: [], error: null }),
    ])
    assertNoError(assetsResult.error, "No se pudieron cargar los assets")
    assertNoError(servicesResult.error, "No se pudieron cargar los servicios")

    const assetById = new Map((assetsResult.data ?? []).map((asset) => [asset.id, asset]))
    const serviceById = new Map((servicesResult.data ?? []).map((service) => [service.id, service.name]))
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""

    return cabins.map((cabin) => this.toDomain(
      cabin,
      (imagesResult.data ?? []).filter((image) => image.cabin_id === cabin.id),
      assetById,
      (joinsResult.data ?? []).filter((join) => join.cabin_id === cabin.id).map((join) => serviceById.get(join.service_id)).filter((name): name is string => Boolean(name)),
      supabaseUrl,
    ))
  }

  async findById(id: string) {
    return (await this.list()).find((cabin) => cabin.id === id) ?? null
  }

  private toDomain(row: CabinRow, images: CabinImageRow[], assets: Map<string, MediaAssetRow>, services: string[], supabaseUrl: string): AdminCabin {
    return {
      id: row.id,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      nightlyPrice: row.nightly_price,
      maxGuests: row.max_guests,
      bedrooms: row.bedrooms,
      beds: row.beds,
      bathrooms: row.bathrooms,
      services,
      rules: [...row.rules],
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      acceptsPets: row.accepts_pets,
      location: row.location,
      whatsapp: row.contact_whatsapp,
      status: row.publication_state === "published" ? "published" : "draft",
      images: images.flatMap((image) => {
        const asset = assets.get(image.asset_id)
        if (!asset) return []
        const url = imageUrl(asset, image.public_url, supabaseUrl)
        if (!url) return []
        return [{ id: image.id, assetId: asset.id, url, name: asset.original_name, size: asset.byte_size, type: asset.mime_type, isCover: image.is_cover }]
      }),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async save(input: AdminCabinInput, actorId: string, id?: string) {
    if (input.images.some((image) => image.url.startsWith("data:") || !image.assetId)) {
      throw new Error("Una imagen no tiene un archivo seguro asociado. Vuelve a subirla.")
    }

    const supabase = await createSupabaseServerClient()
    const now = new Date().toISOString()
    const state = input.status === "published" ? "published" as const : "draft" as const
    const fields = {
      name: input.name.trim(), short_description: input.shortDescription.trim(), description: input.description.trim(),
      nightly_price: input.nightlyPrice, max_guests: input.maxGuests, bedrooms: input.bedrooms, beds: input.beds,
      bathrooms: input.bathrooms, rules: input.rules.map((rule) => rule.trim()).filter(Boolean), check_in_time: input.checkInTime,
      check_out_time: input.checkOutTime, accepts_pets: input.acceptsPets, location: input.location.trim(),
      contact_whatsapp: input.whatsapp.replace(/\D/g, ""), publication_state: "draft" as const,
      published_at: null, updated_by: actorId,
    }

    let cabinId = id
    let created = false
    if (id) {
      const { error } = await supabase.from("cabins").update(fields).eq("id", id).is("deleted_at", null)
      assertNoError(error, "No se pudo actualizar la cabaña")
    } else {
      const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`
      const { data, error } = await supabase.from("cabins").insert({ ...fields, name: fields.name, slug, created_by: actorId }).select("id").single()
      assertNoError(error, "No se pudo crear la cabaña")
      cabinId = data?.id
      created = Boolean(cabinId)
    }
    if (!cabinId) throw new Error("No se pudo identificar la cabaña guardada.")

    try {
      await this.syncServices(supabase, cabinId, input.services)
      await this.syncImages(supabase, cabinId, input.images, now)
      const { error: publicationError } = await supabase.from("cabins").update({
        publication_state: state,
        published_at: state === "published" ? now : null,
        updated_by: actorId,
      }).eq("id", cabinId).is("deleted_at", null)
      assertNoError(publicationError, "No se pudo actualizar el estado final de la cabaña")
    } catch (error) {
      if (created) await supabase.from("cabins").update({ deleted_at: new Date().toISOString(), publication_state: "draft" }).eq("id", cabinId)
      throw error
    }
    const saved = await this.findById(cabinId)
    if (!saved) throw new Error("La cabaña fue guardada, pero no pudo volver a cargarse.")
    return saved
  }

  private async syncServices(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, cabinId: string, names: string[]) {
    const cleanNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    const { data: existingServices, error: servicesError } = await supabase.from("services").select("id, name")
    assertNoError(servicesError, "No se pudo consultar el catálogo de servicios")
    const byName = new Map((existingServices ?? []).map((service) => [service.name.toLocaleLowerCase("es"), service.id]))
    const ids: string[] = []
    for (const name of cleanNames) {
      let serviceId = byName.get(name.toLocaleLowerCase("es"))
      if (!serviceId) {
        const { data, error } = await supabase.from("services").insert({ name, code: `${slugify(name)}-${crypto.randomUUID().slice(0, 8)}` }).select("id").single()
        assertNoError(error, `No se pudo crear el servicio ${name}`)
        serviceId = data?.id
      }
      if (serviceId) ids.push(serviceId)
    }
    const { data: currentJoins, error: currentError } = await supabase.from("cabin_services").select("service_id").eq("cabin_id", cabinId)
    assertNoError(currentError, "No se pudieron consultar los servicios actuales")
    const currentIds = new Set((currentJoins ?? []).map((join) => join.service_id))
    const desiredIds = new Set(ids)
    const removedIds = [...currentIds].filter((serviceId) => !desiredIds.has(serviceId))
    const addedIds = ids.filter((serviceId) => !currentIds.has(serviceId))
    if (removedIds.length) {
      const { error } = await supabase.from("cabin_services").delete().eq("cabin_id", cabinId).in("service_id", removedIds)
      assertNoError(error, "No se pudieron retirar los servicios")
      const { data: remaining, error: verifyError } = await supabase.from("cabin_services").select("service_id").eq("cabin_id", cabinId).in("service_id", removedIds)
      assertNoError(verifyError, "No se pudo verificar la actualización de servicios")
      if (remaining?.length) throw new Error("Tu rol no permite retirar servicios de una cabaña. Solicita el ajuste de la política RLS.")
    }
    if (addedIds.length) {
      const { error } = await supabase.from("cabin_services").insert(addedIds.map((serviceId) => ({ cabin_id: cabinId, service_id: serviceId })))
      assertNoError(error, "No se pudieron asociar los servicios")
    }
  }

  private async syncImages(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, cabinId: string, images: AdminCabinImage[], now: string) {
    const assetIds = images.map((image) => image.assetId).filter((assetId): assetId is string => Boolean(assetId))
    const { data: assets, error: assetsError } = assetIds.length
      ? await supabase.from("media_assets").select("*").in("id", assetIds).eq("processing_status", "ready").is("deleted_at", null)
      : { data: [], error: null }
    assertNoError(assetsError, "No se pudieron validar las imágenes")
    if ((assets ?? []).length !== new Set(assetIds).size) throw new Error("Una imagen no corresponde a un asset listo y seguro.")

    const { data: current, error: currentError } = await supabase.from("cabin_images").select("*").eq("cabin_id", cabinId)
    assertNoError(currentError, "No se pudieron consultar las imágenes actuales")
    const currentByAsset = new Map((current ?? []).map((image) => [image.asset_id, image]))
    const requestedAssetIds = new Set(assetIds)
    const requestedCover = images.find((image) => image.isCover)?.assetId
    if (requestedCover && (current ?? []).some((image) => image.deleted_at === null && image.is_cover && image.asset_id !== requestedCover)) {
      const { error } = await supabase.from("cabin_images").update({ is_cover: false }).eq("cabin_id", cabinId).is("deleted_at", null).eq("is_cover", true)
      assertNoError(error, "No se pudo actualizar la fotografía de portada")
    }
    const assetsById = new Map((assets ?? []).map((asset) => [asset.id, asset]))
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
    for (const [position, image] of images.entries()) {
      const asset = assetsById.get(image.assetId as string)
      if (!asset) continue
      const currentImage = currentByAsset.get(asset.id)
      const values = { alt_text: image.name, is_cover: image.isCover, position: position + 1, deleted_at: null, public_url: imageUrl(asset, currentImage?.public_url ?? null, supabaseUrl) || null }
      const result = currentImage
        ? await supabase.from("cabin_images").update(values).eq("id", currentImage.id)
        : await supabase.from("cabin_images").insert({ ...values, cabin_id: cabinId, asset_id: asset.id })
      assertNoError(result.error, "No se pudo asociar una imagen")
    }
    const removedIds = (current ?? []).filter((image) => image.deleted_at === null && !requestedAssetIds.has(image.asset_id)).map((image) => image.id)
    if (removedIds.length) {
      const { error } = await supabase.from("cabin_images").update({ deleted_at: now, is_cover: false }).in("id", removedIds)
      assertNoError(error, "No se pudieron retirar las fotografías reemplazadas")
    }
  }

  async setStatus(id: string, status: AdminCabinStatus, actorId: string) {
    const now = new Date().toISOString()
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("cabins").update({ publication_state: status === "published" ? "published" : "draft", published_at: status === "published" ? now : null, updated_by: actorId }).eq("id", id).is("deleted_at", null)
    assertNoError(error, "No se pudo cambiar el estado de la cabaña")
    return this.findById(id)
  }

  async archive(id: string, actorId: string) {
    const supabase = await createSupabaseServerClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase.from("cabins")
      .update({ deleted_at: now, publication_state: "draft", published_at: null, updated_by: actorId })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle()
    assertNoError(error, "No se pudo archivar la cabaña")
    if (!data) return false
    const { error: imagesError } = await supabase.from("cabin_images").update({ deleted_at: now }).eq("cabin_id", id).is("deleted_at", null)
    assertNoError(imagesError, "La cabaña se archivó, pero no se pudieron retirar sus imágenes")
    return true
  }
}

export function createAdminCabinRepository(): AdminCabinRepository {
  if (hasSupabaseConfig()) return new SupabaseAdminCabinRepository()
  if (process.env.NODE_ENV !== "production") return new DevelopmentAdminCabinRepository()
  throw new Error("La persistencia de cabañas no está configurada.")
}
