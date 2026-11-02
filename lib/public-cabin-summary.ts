import type { PublicCabin } from "@/lib/public-cabins"

export type PublicCabinSummary = Pick<
  PublicCabin,
  | "id"
  | "name"
  | "location"
  | "image"
  | "status"
  | "price"
  | "oldPrice"
  | "discountPct"
  | "minGuests"
  | "maxGuests"
  | "bedrooms"
  | "beds"
  | "bedDistribution"
  | "acceptsPets"
  | "zone"
  | "poolType"
  | "amenities"
  | "categories"
  | "rating"
  | "reviews"
  | "badge"
  | "description"
  | "type"
> & {
  imageCount: number
}

export function toPublicCabinSummary(cabin: PublicCabin): PublicCabinSummary {
  return {
    id: cabin.id,
    name: cabin.name,
    location: cabin.location,
    image: cabin.image,
    imageCount: Math.max(1, cabin.images.length),
    status: cabin.status,
    price: cabin.price,
    oldPrice: cabin.oldPrice,
    discountPct: cabin.discountPct,
    minGuests: cabin.minGuests,
    maxGuests: cabin.maxGuests,
    bedrooms: cabin.bedrooms,
    beds: cabin.beds,
    bedDistribution: cabin.bedDistribution,
    acceptsPets: cabin.acceptsPets,
    zone: cabin.zone,
    poolType: cabin.poolType,
    amenities: cabin.amenities,
    categories: cabin.categories,
    rating: cabin.rating,
    reviews: cabin.reviews,
    badge: cabin.badge,
    description: cabin.description,
    type: cabin.type,
  }
}
