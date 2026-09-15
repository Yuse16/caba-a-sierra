"use server"

import { requirePermission } from "@/lib/auth/session"
import type { AdminCabinOwner } from "@/lib/admin-cabins/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function loadCabinOwnersAction(): Promise<{ ok: true; data: AdminCabinOwner[] } | { ok: false; message: string }> {
  try {
    await requirePermission("owners.read_sensitive")
    const supabase = await createSupabaseServerClient()
    const [ownersResult, contactsResult] = await Promise.all([
      supabase.from("owners").select("id,name,preferred_contact,notes,contact_hours").is("deleted_at", null).eq("is_active", true).order("name"),
      supabase.from("owner_contacts").select("owner_id,contact_type,display_value").is("deleted_at", null),
    ])
    if (ownersResult.error || contactsResult.error) throw ownersResult.error ?? contactsResult.error
    const contact = (ownerId: string, type: "phone" | "whatsapp" | "email") => contactsResult.data?.find((item) => item.owner_id === ownerId && item.contact_type === type)?.display_value ?? ""
    return { ok: true, data: (ownersResult.data ?? []).map((owner) => ({ id: owner.id, name: owner.name, phone: contact(owner.id, "phone"), whatsapp: contact(owner.id, "whatsapp"), email: contact(owner.id, "email"), preferredContact: owner.preferred_contact, notes: owner.notes, contactHours: owner.contact_hours })) }
  } catch {
    return { ok: false, message: "No se pudo cargar el directorio de propietarios." }
  }
}
