"use server"
import { requirePanelSession } from "@/lib/auth/session"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CustomerStatus } from "@/lib/admin-crm/types"
async function requireAdmin() { const session = await requirePanelSession(); if (session.role !== "admin") throw new Error("FORBIDDEN") }
const fail = (error: unknown) => ({ ok: false as const, message: typeof error === "object" && error !== null && "message" in error && String(error.message).includes("STALE_WRITE") ? "El cliente cambió en otra sesión. Recarga la página." : "No pudimos guardar el cambio." })
export async function setCustomerStatusAction(id: string, status: CustomerStatus, version: number) { try { await requireAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("set_customer_commercial_status", { p_customer_id: id, p_status: status, p_expected_version: version }); if (error) throw error; return { ok: true as const } } catch (error) { return fail(error) } }
export async function addCustomerNoteAction(id: string, body: string) { try { await requireAdmin(); const supabase = await createSupabaseServerClient(); const { error } = await supabase.rpc("add_customer_note", { p_customer_id: id, p_body: body }); if (error) throw error; return { ok: true as const } } catch (error) { return fail(error) } }
