import "server-only"

import {
  cabins,
  owners,
  requests,
  reservations,
  payments,
  cleaningTasks,
  maintenanceTasks,
  promotions,
  seasons,
  recentActivity,
  pendingTasks,
  upcomingArrivals,
  calendarDays,
  calendarCabins,
  calendarBookings,
} from "@/lib/demo-data"
import type { AdminPanelInitialData } from "./admin-panel-data"
import type { Cabin, ClientRequest, Owner, PreferredContactMethod, RequestStatus, Reservation, ReservationStatus } from "./demo-data"
import { createAdminCabinRepository } from "./admin-cabins/repository.server"
import type { PanelSession } from "./auth/session"
import { hasSupabaseConfig } from "./supabase/config"
import { createSupabaseServerClient } from "./supabase/server"

function emptyPanelData(catalogCabins: Cabin[] = []): AdminPanelInitialData {
  return {
    cabins: catalogCabins, owners: [], requests: [], reservations: [], payments: [], cleaningTasks: [], maintenanceTasks: [],
    promotions: [], seasons: [], recentActivity: [], pendingTasks: [], upcomingArrivals: [], calendarDays: [],
    calendarCabins: catalogCabins.map((cabin) => ({ id: cabin.id, name: cabin.name, image: cabin.image, capacity: `${cabin.maxGuests} huéspedes` })),
    calendarBookings: {},
  }
}

function withoutPrivateDemoData(): AdminPanelInitialData {
  const safeCabins = cabins.slice(0, 6).map((cabin) => ({
    ...cabin,
    ownerId: "", ownerName: "", ownerPhone: "", ownerWhatsApp: "", ownerNotes: "", agreedCommission: 0,
    lastAvailabilityCheck: "", preferredContactMethod: "Mensaje" as const,
  }))
  return emptyPanelData(safeCabins)
}

export function getDevelopmentAdminPanelData(session?: PanelSession): AdminPanelInitialData {
  if (session?.role === "editor") return withoutPrivateDemoData()
  return {
    cabins: cabins.slice(0, 6), owners: [...owners], requests: [...requests], reservations: [...reservations], payments: [...payments],
    cleaningTasks: [...cleaningTasks], maintenanceTasks: [...maintenanceTasks], promotions: [...promotions], seasons: [...seasons],
    recentActivity: [...recentActivity], pendingTasks: [...pendingTasks], upcomingArrivals: [...upcomingArrivals],
    calendarDays: [...calendarDays], calendarCabins: [...calendarCabins], calendarBookings,
  }
}

export async function getAdminPanelData(session: PanelSession): Promise<AdminPanelInitialData> {
  if (!hasSupabaseConfig()) {
    if (process.env.NODE_ENV === "production") return emptyPanelData()
    return getDevelopmentAdminPanelData(session)
  }

  try {
    const catalog = await createAdminCabinRepository().list()
    const safeCabins: Cabin[] = catalog.map((cabin) => ({
      id: cabin.id, name: cabin.name, slug: cabin.id, location: cabin.location, image: cabin.images.find((image) => image.isCover)?.url ?? cabin.images[0]?.url ?? "",
      status: cabin.status === "published" ? "confirmada" : "por-confirmar", price: cabin.nightlyPrice, minGuests: 1,
      maxGuests: cabin.maxGuests, bedrooms: cabin.bedrooms, bathrooms: cabin.bathrooms, amenities: [...cabin.services], categories: [],
      rating: 0, reviews: 0, description: cabin.description, type: "familiar",
      ownerId: "", ownerName: "", ownerPhone: "", ownerWhatsApp: "", ownerNotes: "", agreedCommission: 0,
      lastAvailabilityCheck: "", preferredContactMethod: "Mensaje",
    }))
    if (session.role !== "admin") return emptyPanelData(safeCabins)

    const supabase = await createSupabaseServerClient()
    const [ownersResult, contactsResult, assignmentsResult, inquiriesResult, customersResult, reservationsResult, notesResult] = await Promise.all([
      supabase.from("owners").select("*").is("deleted_at", null).order("name"),
      supabase.from("owner_contacts").select("*").is("deleted_at", null).order("is_primary", { ascending: false }),
      supabase.from("cabin_owner_assignments").select("*").eq("is_active", true).order("is_primary", { ascending: false }),
      supabase.from("booking_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").is("deleted_at", null),
      supabase.from("reservations").select("*").order("created_at", { ascending: false }),
      supabase.from("internal_notes").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    ])
    const firstError = [ownersResult.error, contactsResult.error, assignmentsResult.error, inquiriesResult.error, customersResult.error, reservationsResult.error, notesResult.error].find(Boolean)
    if (firstError) throw new Error(firstError.message)

    const ownerRows = ownersResult.data ?? []
    const contactRows = contactsResult.data ?? []
    const assignmentRows = assignmentsResult.data ?? []
    const customerById = new Map((customersResult.data ?? []).map((customer) => [customer.id, customer]))
    const cabinById = new Map(safeCabins.map((cabin) => [cabin.id, cabin]))
    const ownerById = new Map(ownerRows.map((owner) => [owner.id, owner]))
    const primaryAssignmentByCabin = new Map(assignmentRows.map((assignment) => [assignment.cabin_id, assignment]))
    const contactValue = (ownerId: string, type: "phone" | "whatsapp") => contactRows.find((contact) => contact.owner_id === ownerId && contact.contact_type === type)?.display_value ?? ""
    const preferredContact = (value: "whatsapp" | "phone" | "message" | "email"): PreferredContactMethod => value === "phone" ? "Llamada" : value === "whatsapp" ? "WhatsApp" : "Mensaje"
    const latestOwnerNote = (ownerId: string) => (notesResult.data ?? []).find((note) => note.owner_id === ownerId)
    const ownerNotes = (ownerId: string, notes: string) => [notes, latestOwnerNote(ownerId)?.body].filter(Boolean).join("\n")

    const ownersData: Owner[] = ownerRows.map((owner) => ({
      id: owner.id, name: owner.name, phone: contactValue(owner.id, "phone"), whatsapp: contactValue(owner.id, "whatsapp"),
      notes: ownerNotes(owner.id, owner.notes), agreedCommission: assignmentRows.find((assignment) => assignment.owner_id === owner.id)?.agreed_commission ?? 0,
      lastContact: formatAdminDate(latestOwnerNote(owner.id)?.created_at || owner.updated_at), preferredContactMethod: preferredContact(owner.preferred_contact),
    }))

    const adminCabins = safeCabins.map((cabin) => {
      const assignment = primaryAssignmentByCabin.get(cabin.id)
      const owner = assignment ? ownerById.get(assignment.owner_id) : undefined
      return {
        ...cabin, ownerId: owner?.id ?? "", ownerName: owner?.name ?? "", ownerPhone: owner ? contactValue(owner.id, "phone") : "",
        ownerWhatsApp: owner ? contactValue(owner.id, "whatsapp") : "", ownerNotes: owner ? ownerNotes(owner.id, owner.notes) : "",
        agreedCommission: assignment?.agreed_commission ?? 0, lastAvailabilityCheck: owner ? formatAdminDate(latestOwnerNote(owner.id)?.created_at || owner.updated_at) : "",
        preferredContactMethod: owner ? preferredContact(owner.preferred_contact) : "Mensaje" as const,
      }
    })

    const requestsData: ClientRequest[] = (inquiriesResult.data ?? []).map((inquiry) => {
      const customer = customerById.get(inquiry.customer_id)
      const cabin = cabinById.get(inquiry.cabin_id)
      const assignment = primaryAssignmentByCabin.get(inquiry.cabin_id)
      const owner = assignment ? ownerById.get(assignment.owner_id) : undefined
      return {
        id: inquiry.id, client: customer?.name ?? "Cliente", cabinId: inquiry.cabin_id, cabin: cabin?.name ?? "Cabaña",
        date: formatAdminDate(inquiry.created_at), checkIn: formatAdminDate(inquiry.check_in), checkOut: formatAdminDate(inquiry.check_out),
        status: inquiryStatus(inquiry.status), guests: inquiry.guests, message: inquiry.message, email: customer?.email ?? "",
        phone: customer?.phone_display ?? "", ownerId: owner?.id ?? "", ownerName: owner?.name ?? "", ownerPhone: owner ? contactValue(owner.id, "phone") : "",
      }
    })

    const reservationsData: Reservation[] = (reservationsResult.data ?? []).map((reservation) => {
      const customer = customerById.get(reservation.customer_id)
      const checkIn = new Date(`${reservation.check_in}T00:00:00Z`)
      const checkOut = new Date(`${reservation.check_out}T00:00:00Z`)
      return {
        id: reservation.folio, client: customer?.name ?? "Cliente", cabin: cabinById.get(reservation.cabin_id)?.name ?? "Cabaña",
        checkIn: formatAdminDate(reservation.check_in), checkOut: formatAdminDate(reservation.check_out), guests: reservation.guests,
        nights: Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000)), total: reservation.estimated_total,
        status: reservationStatus(reservation.status, reservation.check_in, reservation.check_out), paid: false,
      }
    })

    return { ...emptyPanelData(adminCabins), owners: ownersData, requests: requestsData, reservations: reservationsData }
  } catch (error) {
    console.error("getAdminPanelData", error)
    return emptyPanelData()
  }
}

function formatAdminDate(value: string) {
  if (!value) return ""
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed)
}

function inquiryStatus(status: "new" | "pending" | "contacted" | "available" | "unavailable" | "converted" | "closed"): RequestStatus {
  const statuses: Record<typeof status, RequestStatus> = {
    new: "nueva", pending: "pendiente-propietario", contacted: "propietario-contactado", available: "disponible-confirmada",
    unavailable: "no-disponible", converted: "reservacion-confirmada", closed: "cliente-no-respondio",
  }
  return statuses[status]
}

function reservationStatus(status: "new" | "pending" | "held" | "confirmed" | "cancelled" | "completed", checkIn: string, checkOut: string): ReservationStatus {
  if (status === "cancelled") return "cancelada"
  if (status === "completed") return "finalizada"
  if (status !== "confirmed") return "pendiente"
  const today = new Date().toISOString().slice(0, 10)
  return checkIn <= today && today < checkOut ? "en-uso" : "confirmada"
}
