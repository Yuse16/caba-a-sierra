import type { Cabin, CabinStatus } from "@/lib/demo-data"
import type { PublicCabin, PublicCabinStatus } from "@/lib/public-cabins"

function toPublicStatus(status: CabinStatus): PublicCabinStatus {
  if (status === "alta-demanda") return "alta-demanda"
  if (status === "no-disponible") return "otras-fechas"
  return "consultar"
}

export function toPublicCabin(cabin: Cabin): PublicCabin {
  const cover = { id: `${cabin.id}-cover`, url: cabin.image, altText: `Fotografía de ${cabin.name}`, position: 1, isCover: true }
  return {
    id: cabin.id, name: cabin.name, slug: cabin.slug, location: cabin.location, image: cabin.image, images: [cover],
    status: toPublicStatus(cabin.status), price: cabin.price, oldPrice: cabin.oldPrice, discountPct: cabin.discountPct,
    minGuests: cabin.minGuests, maxGuests: cabin.maxGuests, bedrooms: cabin.bedrooms, beds: cabin.bedrooms,
    bedDistribution: {}, bathrooms: cabin.bathrooms, acceptsPets: cabin.categories.includes("pet-friendly"),
    checkInTime: "", checkOutTime: "", rules: [], address: "", zone: cabin.location,
    mapsUrl: undefined, poolType: "none",
    amenities: cabin.amenities, categories: cabin.categories, rating: cabin.rating, reviews: cabin.reviews,
    badge: cabin.badge, description: cabin.description, type: cabin.type,
  }
}
