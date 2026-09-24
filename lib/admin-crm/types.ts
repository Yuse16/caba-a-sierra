import type { Database } from "@/lib/supabase/database.types"

export type InquiryStatus = Database["public"]["Enums"]["inquiry_status"]
export type CustomerStatus = Database["public"]["Enums"]["customer_commercial_status"]

export type CrmEvent = { id: number; type: string; fromStatus: InquiryStatus | null; toStatus: InquiryStatus | null; details: Record<string, unknown>; createdAt: string }
export type CrmNote = { id: string; body: string; createdAt: string }
export type CrmInquiry = {
  id: string; cabinId: string; cabinName: string; customerId: string; customerName: string; phoneDisplay: string; phoneE164: string;
  checkIn: string; checkOut: string; guests: number; message: string; status: InquiryStatus; version: number; createdAt: string;
  updatedAt: string; lastContactAt: string | null; events: CrmEvent[]; notes: CrmNote[]
  eventPage?: PageInfo; notePage?: PageInfo
}
export type CrmCustomer = {
  id: string; name: string; phoneDisplay: string; phoneE164: string; email: string | null; status: CustomerStatus; version: number;
  firstInquiryAt: string | null; lastInquiryAt: string | null; inquiryCount: number; lastInteractionAt: string | null;
  inquiries: Array<Pick<CrmInquiry, "id" | "cabinName" | "checkIn" | "checkOut" | "status" | "createdAt">>; notes: CrmNote[]
  historyPage?: PageInfo; notePage?: PageInfo
}
export type PublishedCabinOption = { id: string; name: string; slug: string }
export type PagedResult<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number }
export type PageInfo = Omit<PagedResult<never>, "items">

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "Nueva", contacted: "Contactado", pending: "Pendiente", confirmed: "Confirmada", unavailable: "No disponible",
  no_response: "Sin respuesta", cancelled: "Cancelada", completed: "Finalizada",
  available: "Disponible (anterior)", converted: "Confirmada (anterior)", closed: "Sin respuesta (anterior)",
}
export const customerStatusLabels: Record<CustomerStatus, string> = { prospect: "Prospecto", customer: "Cliente", repeat: "Recurrente", inactive: "Inactivo" }
export const activeInquiryStatuses: InquiryStatus[] = ["new", "contacted", "pending", "available"]
