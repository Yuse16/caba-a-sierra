import "server-only"

import { cabins as fallbackCabins } from "@/lib/demo-data"
import { demoAdminCabins } from "@/lib/admin-cabins/demo-data"
import { demoAdminPromotions } from "@/lib/admin-promotions/demo-data"
import { toPublicPromotion } from "@/lib/admin-promotions/service"
import { toPublicCabin } from "@/lib/public-cabins.server"
import type { PublicCabin } from "@/lib/public-cabins"
import type { PublicPromotion } from "@/lib/public-promotions"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabasePublicClient } from "@/lib/supabase/public.server"

const publishedFallbackCabinIds = new Set(
  demoAdminCabins.filter((cabin) => cabin.status === "published").map((cabin) => cabin.id),
)

function fallbackPublicCabins() {
  return fallbackCabins.filter((cabin) => publishedFallbackCabinIds.has(cabin.id)).map(toPublicCabin)
}

function fallbackPublicPromotions() {
  return demoAdminPromotions.map(toPublicPromotion).filter((promotion): promotion is PublicPromotion => promotion !== null)
}

export async function getPublicCabins(): Promise<PublicCabin[]> {
  if (!hasSupabaseConfig()) {
    return process.env.NODE_ENV === "production" ? [] : fallbackPublicCabins()
  }

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from("public_cabins")
    .select("id,slug,name,description,location,nightly_price,old_price,min_guests,max_guests,bedrooms,bathrooms,cabin_type,display_order,image_url,amenities,categories")
    .order("display_order")

  if (error || !Array.isArray(data)) throw new Error("No pudimos consultar las cabañas publicadas.")
  return data.flatMap((row) => {
    if (!row.id || !row.slug || !row.name || !row.image_url) return []
    const services = row.amenities ?? []
    const categories = row.categories ?? []
    const maxGuests = Number(row.max_guests ?? 1)
    const categoryValues = categories.filter((code): code is PublicCabin["categories"][number] => ["parejas", "familiar", "grupos", "chimenea", "pet-friendly", "bosque"].includes(String(code)))
    const cabinType = row.cabin_type ?? ""
    return [{
      id: row.id, name: row.name, slug: row.slug, location: row.location ?? "",
      image: row.image_url, status: "consultar" as const,
      price: Number(row.nightly_price ?? 0), oldPrice: row.old_price == null ? undefined : Number(row.old_price),
      discountPct: row.old_price && Number(row.old_price) > Number(row.nightly_price) ? Math.round((1 - Number(row.nightly_price) / Number(row.old_price)) * 100) : undefined,
      minGuests: Number(row.min_guests ?? 1), maxGuests, bedrooms: Number(row.bedrooms ?? 0), bathrooms: Number(row.bathrooms ?? 0),
      amenities: services.filter((name): name is string => typeof name === "string" && Boolean(name)), categories: categoryValues,
      description: row.description ?? "",
      type: ["romantica", "familiar", "grupal", "premium"].includes(cabinType) ? cabinType as PublicCabin["type"] : maxGuests <= 4 ? "romantica" : "familiar",
    } satisfies PublicCabin]
  })
}

export async function getPublicPromotions(): Promise<PublicPromotion[]> {
  if (!hasSupabaseConfig()) {
    return process.env.NODE_ENV === "production" ? [] : fallbackPublicPromotions()
  }

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from("public_promotions")
    .select("id,name,short_description,image_alt_text,cta_label,href,display_order,image_url")
    .order("display_order")

  if (error || !Array.isArray(data)) throw new Error("No pudimos consultar las promociones publicadas.")
  return data.flatMap((row) => row.id && row.name && row.image_url
    ? [{ id: row.id, name: row.name, imageUrl: row.image_url, imageAlt: row.image_alt_text ?? "", shortDescription: row.short_description ?? "", ctaLabel: row.cta_label ?? "", href: row.href ?? "" } satisfies PublicPromotion]
    : [])
}
