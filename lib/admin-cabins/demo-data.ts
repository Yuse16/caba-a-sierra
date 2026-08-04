import { siteContact } from "@/lib/site-config"
import type { AdminCabin } from "./types"

const createdAt = "2026-07-22T12:00:00.000Z"

const publicCabinSeeds = [
  { id: "cab-01", slug: "bosque-real", name: "Cabaña Bosque Real", image: "/cabins/bosque-real.png", description: "Una cabaña acogedora entre pinos con chimenea de leña, terraza de madera y vistas al bosque.", price: 2800, maxGuests: 6, bedrooms: 2, bathrooms: 1, amenities: ["Chimenea", "WiFi", "Asador"], pets: false },
  { id: "cab-02", slug: "refugio-pino", name: "Refugio del Pino", image: "/cabins/refugio-pino.png", description: "Refugio íntimo tipo A-frame perfecto para una estancia tranquila entre el bosque.", price: 2200, maxGuests: 4, bedrooms: 1, bathrooms: 1, amenities: ["Chimenea", "Cocina", "Vista"], pets: false },
  { id: "cab-03", slug: "mirador", name: "Cabaña Mirador", image: "/cabins/mirador.png", description: "Amplia cabaña con grandes ventanales y una terraza panorámica sobre la sierra.", price: 3900, maxGuests: 8, bedrooms: 3, bathrooms: 2, amenities: ["Vista", "Terraza", "WiFi", "Asador"], pets: false },
  { id: "cab-04", slug: "valle-escondido", name: "Valle Escondido", image: "/cabins/valle-escondido.png", description: "Lodge de madera en un valle rodeado de pinos, con espacios amplios para compartir.", price: 4900, maxGuests: 10, bedrooms: 4, bathrooms: 3, amenities: ["Chimenea", "Asador", "Jacuzzi"], pets: false },
  { id: "cab-05", slug: "los-encinos", name: "Cabaña Los Encinos", image: "/cabins/los-encinos.png", description: "Cabaña rústica entre encinos y pinos con espacios cómodos para viajar con mascota.", price: 3200, maxGuests: 6, bedrooms: 2, bathrooms: 2, amenities: ["WiFi", "Pet friendly"], pets: true },
  { id: "cab-06", slug: "sierra-alta", name: "Refugio Sierra Alta", image: "/cabins/sierra-alta.png", description: "Refugio amplio en lo alto de la sierra con jacuzzi y vistas a las montañas.", price: 6500, maxGuests: 12, bedrooms: 5, bathrooms: 3, amenities: ["Chimenea", "Jacuzzi", "Vista"], pets: false },
] as const

export const demoAdminCabins: AdminCabin[] = publicCabinSeeds.map((cabin, index) => ({
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
  acceptsPets: cabin.pets,
  location: "Arteaga, Coahuila",
  whatsapp: siteContact.whatsappNumber,
  status: index === 4 ? "draft" : "published",
  images: [
    {
      id: `${cabin.id}-cover`,
      assetId: `dev:${cabin.id}:cover`,
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
