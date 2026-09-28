import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import {
  cleanupGalleryRun,
  galleryFixturePath,
  writeGalleryFixture,
  type GalleryFixture,
} from "./gallery-fixture"

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta ${name} para preparar la regresión de galería.`)
  return value
}

export default async function globalSetup() {
  if (process.env.GALLERY_E2E_REQUIRED !== "1") {
    throw new Error("La suite de galería debe ejecutarse con pnpm test:e2e:gallery.")
  }
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const existingUsers = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    existingUsers.push(...data.users)
    if (data.users.length < 1000) break
  }
  for (const user of existingUsers.filter(({ email }) => email?.startsWith("gallery-e2e-"))) {
    const runId = user.email?.slice("gallery-e2e-".length, -"@example.test".length)
    if (!runId || user.email !== `gallery-e2e-${runId}@example.test`) {
      throw new Error(`La limpieza se negó a interpretar un usuario no canónico: ${user.id}.`)
    }
    await cleanupGalleryRun(supabase, user.id, runId)
    const { error: profileError } = await supabase.from("admin_profiles").delete().eq("user_id", user.id)
    if (profileError) throw profileError
    // Los audit logs son inmutables y conservan el actor. El borrado suave
    // invalida/anonymiza la cuenta de QA sin intentar reescribir ese historial.
    const { error: userError } = await supabase.auth.admin.deleteUser(user.id, true)
    if (userError) throw userError
  }

  const runId = randomUUID()
  const password = `LocalOnly!${randomUUID()}aA1`
  const email = `gallery-e2e-${runId}@example.test`
  const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createUserError || !created.user) throw createUserError ?? new Error("No se pudo crear el usuario efímero de galería.")
  const assetDir = path.join(process.cwd(), "test-results", `gallery-assets-${runId}`)
  try {
    const { error: profileError } = await supabase.from("admin_profiles").insert({
      user_id: created.user.id,
      display_name: `E2E Galería ${runId}`,
      role: "admin",
      is_active: true,
    })
    if (profileError) throw profileError

    await fs.mkdir(assetDir, { recursive: true })
    const definitions = {
      a: { name: `foto-a-${runId}.png`, source: "public/cabins/valle-escondido.png" },
      b: { name: `foto-b-${runId}.png`, source: "public/cabins/bosque-real.png" },
      c: { name: `foto-c-${runId}.png`, source: "public/cabins/mirador.png" },
      d: { name: `foto-d-${runId}.png`, source: "public/cabins/los-encinos.png" },
    } as const
    const images = {} as GalleryFixture["images"]
    for (const [key, definition] of Object.entries(definitions) as Array<[keyof typeof definitions, (typeof definitions)[keyof typeof definitions]]>) {
      const filePath = path.join(assetDir, definition.name)
      await sharp(path.join(process.cwd(), definition.source))
        .rotate()
        .resize(960, 640, { fit: "cover" })
        .png({ compressionLevel: 6 })
        .toFile(filePath)
      images[key] = { name: definition.name, path: filePath }
    }

    const generatedImages: Array<{ name: string; path: string }> = []
    for (let index = 1; index <= 31; index += 1) {
      const name = `foto-lote-${String(index).padStart(2, "0")}-${runId}.png`
      const filePath = path.join(assetDir, name)
      await sharp({ create: { width: 960, height: 640, channels: 3, background: { r: (index * 47) % 255, g: (index * 83) % 255, b: (index * 131) % 255 } } })
        .png({ compressionLevel: 6 })
        .toFile(filePath)
      generatedImages.push({ name, path: filePath })
    }

    const fixture: GalleryFixture = {
      runId,
      admin: { id: created.user.id, email, password },
      cabinName: `E2E Galería multifoto ${runId}`,
      images,
      initialImages: [images.a, images.b, images.c, images.d, ...generatedImages.slice(0, 11)],
      additionalImages: generatedImages.slice(11),
    }
    await writeGalleryFixture(fixture)

    // The fixture includes a password and must never persist with permissive mode.
    await fs.chmod(galleryFixturePath, 0o600)
  } catch (error) {
    await cleanupGalleryRun(supabase, created.user.id, runId)
    await supabase.from("admin_profiles").delete().eq("user_id", created.user.id)
    await supabase.auth.admin.deleteUser(created.user.id)
    await fs.rm(assetDir, { recursive: true, force: true })
    await fs.rm(galleryFixturePath, { force: true })
    throw error
  }
}
