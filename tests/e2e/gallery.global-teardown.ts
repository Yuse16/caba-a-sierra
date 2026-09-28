import fs from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { cleanupGalleryRun, galleryFixturePath, readGalleryFixture } from "./gallery-fixture"

export default async function globalTeardown() {
  const fixture = await readGalleryFixture().catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null
    throw error
  })
  if (!fixture) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) throw new Error("No se pudo limpiar la galería: faltan credenciales server-only.")
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  // Fail closed: keep both identity and manifest if any cleanup step fails.
  await cleanupGalleryRun(supabase, fixture.admin.id, fixture.runId)
  // A second pass must be a no-op, including after partially completed retries.
  await cleanupGalleryRun(supabase, fixture.admin.id, fixture.runId)
  const assetDir = path.join(process.cwd(), "test-results", `gallery-assets-${fixture.runId}`)
  if (path.dirname(fixture.images.a.path) !== assetDir) throw new Error("Directorio E2E no canónico.")
  await fs.rm(assetDir, { recursive: true, force: true })
  const { error: profileError } = await supabase.from("admin_profiles").delete().eq("user_id", fixture.admin.id)
  if (profileError) throw profileError
  // Immutable audit logs retain their actor; only invalidate the QA identity.
  const { error: userError } = await supabase.auth.admin.deleteUser(fixture.admin.id, true)
  if (userError) throw userError
  await fs.rm(galleryFixturePath, { force: true })
}
