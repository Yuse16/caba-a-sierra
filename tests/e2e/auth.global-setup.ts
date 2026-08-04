import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { fixturePath, type AuthFixture } from "./auth-fixture"

export default async function globalSetup() {
  if (process.env.E2E_AUTH_REQUIRED !== "1") throw new Error("La suite F2 debe ejecutarse con scripts/run-auth-e2e.mjs.")
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Faltan las credenciales server-only de Supabase local para fixtures F2.")

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError
  const staleUserIds = existing.users.filter(({ email }) => email?.startsWith("pack01-e2e-")).map(({ id }) => id)
  if (staleUserIds.length) {
    const { error } = await supabase.from("admin_profiles").update({
      is_active: false,
      disabled_at: new Date().toISOString(),
    }).in("user_id", staleUserIds)
    if (error) throw error
  }

  const runId = randomUUID()
  const password = `LocalOnly!${randomUUID()}aA1`
  const roles = ["admin", "editor", "inactive"] as const
  const created: Partial<AuthFixture> = {
    promotionLegacyId: `e2e-permissions-${runId}`,
    promotionName: `Promoción E2E ${runId}`,
  }

  const { error: stalePromotionError } = await supabase.from("promotions").delete().like("legacy_id", "e2e-permissions-%")
  if (stalePromotionError) throw stalePromotionError

  for (const role of roles) {
    const email = `pack01-e2e-${role}-${runId}@example.test`
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
    if (error || !data.user) throw error ?? new Error(`No se pudo crear fixture ${role}.`)
    const isActive = role !== "inactive"
    const { error: profileError } = await supabase.from("admin_profiles").upsert({
      user_id: data.user.id,
      display_name: `E2E ${role}`,
      role: role === "admin" ? "admin" : "editor",
      is_active: isActive,
      disabled_at: isActive ? null : new Date().toISOString(),
    })
    if (profileError) throw profileError
    created[role] = { id: data.user.id, email, password }
  }

  const fixture = created as AuthFixture
  const { error: promotionError } = await supabase.from("promotions").insert({
    legacy_id: fixture.promotionLegacyId,
    name: fixture.promotionName,
    short_description: "Fixture local temporal",
    publication_state: "draft",
    display_order: 999,
    created_by: fixture.admin.id,
    updated_by: fixture.admin.id,
  })
  if (promotionError) throw promotionError

  await fs.mkdir(path.dirname(fixturePath), { recursive: true })
  await fs.writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 })
}
