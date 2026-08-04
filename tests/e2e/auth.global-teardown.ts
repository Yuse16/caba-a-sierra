import fs from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"
import { fixturePath, readAuthFixture } from "./auth-fixture"

export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return
  const fixture = await readAuthFixture().catch(() => null)
  if (!fixture) return

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  await supabase.from("promotions").delete().eq("legacy_id", fixture.promotionLegacyId)
  await supabase.from("admin_profiles").update({
    is_active: false,
    disabled_at: new Date().toISOString(),
  }).in("user_id", [fixture.admin.id, fixture.editor.id, fixture.inactive.id])
  await fs.rm(fixturePath, { force: true })
}
