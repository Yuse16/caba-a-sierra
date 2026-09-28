import "server-only"

import { demoAdminCabins } from "./demo-data"
import type { AdminCabinRepository } from "./repository"
import type { AdminCabin, AdminCabinImage, AdminCabinInput, AdminCabinStatus } from "./types"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import type { Tables } from "@/lib/supabase/database.types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createDevelopmentJsonStore } from "@/lib/development-json-store.server"
import { buildCabinImageSyncPayload } from "./gallery-sync"

type CabinRow = Tables<"cabins">
type CabinImageRow = Tables<"cabin_images">
type MediaAssetRow = Tables<"media_assets">

function cloneCabins(cabins: AdminCabin[]) {
  return cabins.map((cabin) => ({
    ...cabin,
    services: [...cabin.services],
    rules: [...cabin.rules],
    bedDistribution: { ...cabin.bedDistribution },
    owner: cabin.owner ? { ...cabin.owner } : null,
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
    if (!items.some((cabin) => cabin.id === id && !cabin.archivedAt)) return false
    await developmentStore.write(items.map((cabin) => cabin.id === id ? { ...cabin, archivedAt: new Date().toISOString(), status: "draft" } : cabin))
    return true
  }

  async restore(id: string, actorId: string) {
    void actorId
    const items = await developmentStore.read()
    const current = items.find((cabin) => cabin.id === id && cabin.archivedAt)
    if (!current) return null
    const restored = { ...current, archivedAt: null, status: "draft" as const, updatedAt: new Date().toISOString() }
    await developmentStore.write(items.map((cabin) => cabin.id === id ? restored : cabin))
    return cloneCabins([restored])[0]
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
  if (asset.canonical_public_url) return asset.canonical_public_url
  if (storedUrl) return storedUrl
  if (!asset.public_bucket || !asset.public_path) return ""
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(asset.public_bucket)}/${asset.public_path.split("/").map(encodeURIComponent).join("/")}`
}

class SupabaseAdminCabinRepository implements AdminCabinRepository {
  async list() {
    const supabase = await createSupabaseServerClient()
    const { data: cabins, error: cabinsError } = await supabase.from("cabins").select("*").order("display_order").order("created_at")
    assertNoError(cabinsError, "No se pudieron cargar las cabañas")
    if (!cabins?.length) return []

    const cabinIds = cabins.map((cabin) => cabin.id)
    const [imagesResult, joinsResult, assignmentsResult] = await Promise.all([
      supabase.from("cabin_images").select("*").in("cabin_id", cabinIds).is("deleted_at", null).order("position"),
      supabase.from("cabin_services").select("cabin_id, service_id").in("cabin_id", cabinIds),
      supabase.from("cabin_owner_assignments").select("cabin_id, owner_id").in("cabin_id", cabinIds).eq("is_primary", true).eq("is_active", true),
    ])
    assertNoError(imagesResult.error, "No se pudieron cargar las imágenes")
    assertNoError(joinsResult.error, "No se pudieron cargar los servicios")
    assertNoError(assignmentsResult.error, "No se pudieron cargar las asignaciones de propietarios")

    const ownerIds = [...new Set((assignmentsResult.data ?? []).map((assignment) => assignment.owner_id))]

    const assetIds = [...new Set((imagesResult.data ?? []).map((image) => image.asset_id))]
    const serviceIds = [...new Set((joinsResult.data ?? []).map((join) => join.service_id))]
    const [assetsResult, servicesResult, ownersResult, contactsResult] = await Promise.all([
      assetIds.length ? supabase.from("media_assets").select("*").in("id", assetIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
      serviceIds.length ? supabase.from("services").select("id, name").in("id", serviceIds) : Promise.resolve({ data: [], error: null }),
      ownerIds.length ? supabase.from("owners").select("id,name,preferred_contact,notes,contact_hours").in("id", ownerIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
      ownerIds.length ? supabase.from("owner_contacts").select("owner_id,contact_type,display_value").in("owner_id", ownerIds).is("deleted_at", null) : Promise.resolve({ data: [], error: null }),
    ])
    assertNoError(assetsResult.error, "No se pudieron cargar los assets")
    assertNoError(servicesResult.error, "No se pudieron cargar los servicios")
    assertNoError(ownersResult.error, "No se pudieron cargar los propietarios")
    assertNoError(contactsResult.error, "No se pudieron cargar los contactos de propietarios")

    const assetById = new Map((assetsResult.data ?? []).map((asset) => [asset.id, asset]))
    const serviceById = new Map((servicesResult.data ?? []).map((service) => [service.id, service.name]))
    const ownerById = new Map((ownersResult.data ?? []).map((owner) => [owner.id, owner]))
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""

    return cabins.map((cabin) => this.toDomain(
      cabin,
      (imagesResult.data ?? []).filter((image) => image.cabin_id === cabin.id),
      assetById,
      (joinsResult.data ?? []).filter((join) => join.cabin_id === cabin.id).map((join) => serviceById.get(join.service_id)).filter((name): name is string => Boolean(name)),
      supabaseUrl,
      (() => {
        const assignment = (assignmentsResult.data ?? []).find((item) => item.cabin_id === cabin.id)
        const owner = assignment ? ownerById.get(assignment.owner_id) : undefined
        if (!owner) return null
        const contact = (type: "phone" | "whatsapp" | "email") => (contactsResult.data ?? []).find((item) => item.owner_id === owner.id && item.contact_type === type)?.display_value ?? ""
        return { id: owner.id, name: owner.name, phone: contact("phone"), whatsapp: contact("whatsapp"), email: contact("email"), preferredContact: owner.preferred_contact, notes: owner.notes, contactHours: owner.contact_hours }
      })(),
    ))
  }

  async findById(id: string) {
    return (await this.list()).find((cabin) => cabin.id === id) ?? null
  }

  private toDomain(row: CabinRow, images: CabinImageRow[], assets: Map<string, MediaAssetRow>, services: string[], supabaseUrl: string, owner: AdminCabin["owner"]): AdminCabin {
    return {
      id: row.id,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      nightlyPrice: row.nightly_price,
      maxGuests: row.max_guests,
      bedrooms: row.bedrooms,
      beds: row.beds,
      bedDistribution: (row.bed_distribution && typeof row.bed_distribution === "object" && !Array.isArray(row.bed_distribution) ? row.bed_distribution : {}) as AdminCabin["bedDistribution"],
      bathrooms: row.bathrooms,
      services,
      rules: [...row.rules],
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      acceptsPets: row.accepts_pets,
      location: row.location,
      address: row.address,
      zone: row.zone,
      latitude: row.latitude,
      longitude: row.longitude,
      mapsUrl: row.maps_url,
      poolType: row.pool_type as AdminCabin["poolType"],
      whatsapp: row.contact_whatsapp,
      owner,
      archivedAt: row.deleted_at,
      status: row.publication_state === "published" ? "published" : "draft",
      images: images.flatMap((image) => {
        const asset = assets.get(image.asset_id)
        if (!asset) return []
        const url = imageUrl(asset, image.public_url, supabaseUrl)
        if (!url) return []
        return [{ id: image.id, assetId: asset.id, url, name: asset.original_name, size: asset.byte_size, type: asset.mime_type, isCover: image.is_cover, altText: image.alt_text }]
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
      bed_distribution: input.bedDistribution, address: input.address.trim(), zone: input.zone.trim(),
      latitude: input.latitude, longitude: input.longitude, maps_url: input.mapsUrl.trim(), pool_type: input.poolType,
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
      await this.syncImages(supabase, cabinId, input.images)
      await this.syncOwner(supabase, cabinId, input.owner)
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

  private async syncImages(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, cabinId: string, images: AdminCabinImage[]) {
    const payload = buildCabinImageSyncPayload(images)
    const { data, error } = await supabase.rpc("sync_cabin_images", { target_cabin_id: cabinId, images: payload })
    assertNoError(error, "No se pudieron sincronizar las fotografías")
    if (!Array.isArray(data) || data.length !== payload.length || data.some((row, index) =>
      row.asset_id !== payload[index]?.asset_id || row.is_cover !== payload[index]?.is_cover || row.position !== index + 1
    )) {
      throw new Error("La galería no pudo verificarse después de guardarla.")
    }
  }

  private async syncOwner(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, cabinId: string, owner: AdminCabin["owner"]) {
    const ownerPayload = owner ? {
      id: owner.id, name: owner.name.trim(), phone: owner.phone.trim(), whatsapp: owner.whatsapp.trim(), email: owner.email.trim(),
      preferred_contact: owner.preferredContact, notes: owner.notes.trim(), contact_hours: owner.contactHours.trim(),
    } : null
    const { error } = await supabase.rpc("sync_cabin_owner", { target_cabin_id: cabinId, owner_payload: ownerPayload })
    assertNoError(error, "No se pudo sincronizar el propietario")
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
    void actorId
    const { data, error } = await supabase.rpc("archive_cabin_with_images", { target_cabin_id: id })
    assertNoError(error, "No se pudo archivar la cabaña")
    return data === true
  }

  async restore(id: string, actorId: string) {
    const supabase = await createSupabaseServerClient()
    void actorId
    const { data, error } = await supabase.rpc("restore_archived_cabin", { target_cabin_id: id })
    assertNoError(error, "No se pudo restaurar la cabaña")
    return data === true ? this.findById(id) : null
  }
}

export function createAdminCabinRepository(): AdminCabinRepository {
  if (hasSupabaseConfig()) return new SupabaseAdminCabinRepository()
  if (process.env.NODE_ENV !== "production") return new DevelopmentAdminCabinRepository()
  throw new Error("La persistencia de cabañas no está configurada.")
}
