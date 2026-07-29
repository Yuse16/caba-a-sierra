import { cabins } from "@/lib/demo-data"
import { siteContact } from "@/lib/site-config"
import type { AdminCabin } from "./types"

const createdAt = "2026-07-22T12:00:00.000Z"

export const demoAdminCabins: AdminCabin[] = cabins.slice(0, 6).map((cabin, index) => ({
  id: cabin.id,
  name: cabin.name,
  shortDescription: cabin.description.split(".")[0] + ".",
  description: cabin.description,
  nightlyPrice: cabin.price,
  maxGuests: cabin.maxGuests,
  bedrooms: cabin.bedrooms,
  beds: Math.max(cabin.bedrooms, Math.ceil(cabin.maxGuests / 2)),
  bathrooms: cabin.bathrooms,
  services: [...cabin.amenities],
  rules: ["No fumar dentro de la cabaña", "Respetar el horario de descanso"],
  checkInTime: "15:00",
  checkOutTime: "11:00",
  acceptsPets: cabin.categories.includes("pet-friendly"),
  location: cabin.location,
  whatsapp: siteContact.whatsappNumber,
  status: index === 4 ? "draft" : "published",
  images: [
    {
      id: `${cabin.id}-cover`,
      url: cabin.image,
      name: `${cabin.slug}.png`,
      size: 0,
      type: "image/png",
      isCover: true,
    },
  ],
  createdAt,
  updatedAt: createdAt,
}))
