"use server"

import { requirePanelSession } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { InquiryStatus } from "@/lib/admin-crm/types"
import type { RequestStatus } from "@/lib/demo-data"

async function requireCrmAdmin() { const session = await requirePanelSession(); if (session.role !== "admin") throw new Error("FORBIDDEN") }
const legacyStatus: Partial<Record<RequestStatus, InquiryStatus>> = { nueva: "new", "pendiente-propietario": "pending", "propietario-contactado": "contacted", "disponible-confirmada": "pending", "no-disponible": "unavailable", "reservacion-confirmada": "confirmed", "cliente-no-respondio": "no_response" }
const failure = (error: unknown) => ({ ok: false as const, message: typeof error === "object" && error !== null && "message" in error && String(error.message).includes("STALE_WRITE") ? "La solicitud cambió en otra sesión. Recarga antes de volver a intentarlo." : "No pudimos guardar el cambio." })

export async function transitionInquiryAction(id: string, status: InquiryStatus, expectedVersion: number) {
  try { await requireCrmAdmin(); const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.rpc("transition_booking_inquiry", { p_inquiry_id: id, p_status: status, p_expected_version: expectedVersion }); if (error) throw error; return { ok: true as const, version: data } } catch (error) { return failure(error) }
}
export async function addInquiryNoteAction(id: string, body: string) {
  try { await requireCrmAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("add_inquiry_note", { p_inquiry_id: id, p_body: body }); if (error) throw error; return { ok: true as const } } catch (error) { return failure(error) }
}
export async function recordInquiryContactAction(id: string, type: "whatsapp_opened" | "alternative_offered", details: Record<string, string> = {}) {
  try { await requireCrmAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("record_inquiry_contact_event", { p_inquiry_id: id, p_event_type: type, p_details: details }); if (error) throw error; return { ok: true as const } } catch (error) { return failure(error) }
}
export async function updateBookingInquiryStatusAction(id: string, status: RequestStatus) {
  try { await requireCrmAdmin(); const supabase = await createSupabaseServerClient(); const { data: inquiry, error } = await supabase.from("booking_inquiries").select("version").eq("id", id).single(); if (error) throw error; return transitionInquiryAction(id, legacyStatus[status] ?? "pending", inquiry.version) } catch (error) { return failure(error) }
}
