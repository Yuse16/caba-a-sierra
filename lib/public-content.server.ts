import "server-only"

import type { PublicCabin } from "@/lib/public-cabins"
import type { PublicPromotion } from "@/lib/public-promotions"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabasePublicClient } from "@/lib/supabase/public.server"
import { parsePublicCabinGallery } from "@/lib/public-cabin-gallery"

export async function getPublicCabins(): Promise<PublicCabin[]> {
  if (!hasSupabaseConfig()) {
    return []
  }

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from("public_cabins")
    .select("id,slug,name,description,location,nightly_price,old_price,min_guests,max_guests,bedrooms,beds,bed_distribution,bathrooms,cabin_type,display_order,image_url,gallery,amenities,categories,check_in_time,check_out_time,accepts_pets,rules,address,zone,latitude,longitude,maps_url,pool_type")
    .order("display_order")

  if (error || !Array.isArray(data)) {
    console.error("No pudimos consultar las cabañas publicadas.", error)
    return []
  }
  return data.flatMap((row) => {
    if (!row.id || !row.slug || !row.name || !row.image_url) return []
    const services = row.amenities ?? []
    const categories = row.categories ?? []
    const maxGuests = Number(row.max_guests ?? 1)
    const categoryValues = categories.filter((code): code is PublicCabin["categories"][number] => ["parejas", "familiar", "grupos", "chimenea", "pet-friendly", "bosque"].includes(String(code)))
    const cabinType = row.cabin_type ?? ""
    const images = parsePublicCabinGallery(row.gallery, row.image_url, row.name)
    return [{
      id: row.id, name: row.name, slug: row.slug, location: row.location ?? "",
      image: images.find((image) => image.isCover)?.url ?? row.image_url, images, status: "consultar" as const,
      price: Number(row.nightly_price ?? 0), oldPrice: row.old_price == null ? undefined : Number(row.old_price),
      discountPct: row.old_price && Number(row.old_price) > Number(row.nightly_price) ? Math.round((1 - Number(row.nightly_price) / Number(row.old_price)) * 100) : undefined,
      minGuests: Number(row.min_guests ?? 1), maxGuests, bedrooms: Number(row.bedrooms ?? 0), beds: Number(row.beds ?? 0),
      bedDistribution: row.bed_distribution && typeof row.bed_distribution === "object" && !Array.isArray(row.bed_distribution) ? row.bed_distribution as Record<string, number> : {},
      bathrooms: Number(row.bathrooms ?? 0), acceptsPets: Boolean(row.accepts_pets), checkInTime: row.check_in_time ?? "", checkOutTime: row.check_out_time ?? "",
      rules: (row.rules ?? []).filter((rule): rule is string => typeof rule === "string"), address: row.address ?? "", zone: row.zone ?? "",
      latitude: row.latitude == null ? undefined : Number(row.latitude), longitude: row.longitude == null ? undefined : Number(row.longitude), mapsUrl: row.maps_url || undefined,
      poolType: (["none", "standard", "heated"].includes(row.pool_type ?? "") ? row.pool_type : "none") as PublicCabin["poolType"],
      amenities: services.filter((name): name is string => typeof name === "string" && Boolean(name)), categories: categoryValues,
      description: row.description ?? "",
      type: ["romantica", "familiar", "grupal", "premium"].includes(cabinType) ? cabinType as PublicCabin["type"] : maxGuests <= 4 ? "romantica" : "familiar",
    } satisfies PublicCabin]
  })
}

export async function getPublicPromotions(): Promise<PublicPromotion[]> {
  if (!hasSupabaseConfig()) {
    return []
  }

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from("public_promotions")
    .select("id,name,short_description,image_alt_text,cta_label,href,display_order,image_url")
    .order("display_order")

  if (error || !Array.isArray(data)) {
    console.error("No pudimos consultar las promociones publicadas.", error)
    return []
  }
  return data.flatMap((row) => row.id && row.name && row.image_url
    ? [{ id: row.id, name: row.name, imageUrl: row.image_url, imageAlt: row.image_alt_text ?? "", shortDescription: row.short_description ?? "", ctaLabel: row.cta_label ?? "", href: row.href ?? "" } satisfies PublicPromotion]
    : [])
}
