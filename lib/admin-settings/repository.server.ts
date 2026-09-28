import "server-only"

import { hasSupabaseConfig } from "@/lib/supabase/config"
import type { Tables } from "@/lib/supabase/database.types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminSiteSettings, AdminSiteSettingsInput } from "./types"

type SettingsRow = Tables<"public_site_settings">

const defaultSettings: AdminSiteSettings = {
  id: true,
  businessName: "DUPEZ",
  subtitle: "",
  tagline: "",
  logoUrl: "",
  heroAssetId: "",
  heroImageUrl: "",
  whatsappNumber: "528444556929",
  phoneDisplay: "844 455 6929",
  email: "",
  generalLocation: "Arteaga, Coahuila, México",
  businessHours: "",
  officeAddress: "",
  officeMapsUrl: "",
  timezone: "America/Monterrey",
  currency: "MXN",
  updatedAt: new Date(0).toISOString(),
}

function toDomain(row: SettingsRow, heroAsset: { canonical_public_url: string | null } | null): AdminSiteSettings {
  return {
    id: row.id,
    businessName: row.business_name,
    subtitle: row.subtitle,
    tagline: row.tagline,
    logoUrl: row.logo_url ?? "",
    heroAssetId: row.hero_asset_id ?? "",
    heroImageUrl: heroAsset?.canonical_public_url ?? "",
    whatsappNumber: row.public_whatsapp,
    phoneDisplay: row.public_phone,
    email: row.public_email ?? "",
    generalLocation: row.general_location,
    businessHours: row.business_hours,
    officeAddress: row.office_address,
    officeMapsUrl: row.office_maps_url,
    timezone: row.timezone,
    currency: row.currency,
    updatedAt: row.updated_at,
  }
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  if (!hasSupabaseConfig()) return defaultSettings
  const supabase = await createSupabaseServerClient()
  const { data: row, error } = await supabase
    .from("public_site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()
  if (error || !row) return defaultSettings
  let heroAsset: { canonical_public_url: string | null } | null = null
  if (row.hero_asset_id) {
    const { data: asset } = await supabase
      .from("media_assets")
      .select("canonical_public_url")
      .eq("id", row.hero_asset_id)
      .is("deleted_at", null)
      .maybeSingle()
    heroAsset = asset ?? null
  }
  return toDomain(row, heroAsset)
}

export async function saveAdminSiteSettings(input: AdminSiteSettingsInput, actorId: string): Promise<AdminSiteSettings> {
  const supabase = await createSupabaseServerClient()
  const { data: row, error } = await supabase
    .from("public_site_settings")
    .update({
      business_name: input.businessName.trim(),
      subtitle: input.subtitle.trim(),
      tagline: input.tagline.trim(),
      hero_asset_id: input.heroAssetId || null,
      public_whatsapp: input.whatsappNumber,
      public_phone: input.phoneDisplay.trim(),
      public_email: input.email.trim() || null,
      general_location: input.generalLocation.trim(),
      business_hours: input.businessHours.trim(),
      office_address: input.officeAddress.trim(),
      office_maps_url: input.officeMapsUrl.trim(),
      updated_by: actorId,
    })
    .eq("id", true)
    .select("*")
    .single()
  if (error || !row) throw new Error("No pudimos guardar la configuración. Intenta nuevamente.")

  let heroAsset: { canonical_public_url: string | null } | null = null
  if (row.hero_asset_id) {
    const { data: asset } = await supabase.from("media_assets").select("canonical_public_url").eq("id", row.hero_asset_id).is("deleted_at", null).maybeSingle()
    heroAsset = asset ?? null
  }
  return toDomain(row, heroAsset)
}