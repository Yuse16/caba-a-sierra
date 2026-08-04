import { expect, test, type Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import path from "node:path"
import { readAuthFixture, type AuthFixture } from "./auth-fixture"

let fixture: AuthFixture
const imagePath = path.resolve("public/cabins/refugio-pino.png")

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Correo").fill(email)
  await page.getByLabel("Contraseña").fill(password)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("La suite F2 requiere Supabase local y su llave server-only.")
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function setProfileActive(userId: string, active: boolean) {
  const { error } = await serviceClient().from("admin_profiles").update({
    is_active: active,
    disabled_at: active ? null : new Date().toISOString(),
  }).eq("user_id", userId)
  if (error) throw error
}

async function recoveryLinkFor(email: string) {
  const mailpitUrl = process.env.E2E_MAILPIT_URL
  if (!mailpitUrl) throw new Error("Falta E2E_MAILPIT_URL para validar recuperación.")

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const listResponse = await fetch(`${mailpitUrl}/api/v1/messages`)
    if (!listResponse.ok) throw new Error(`Mailpit respondió ${listResponse.status}.`)
    const list = await listResponse.json() as { messages: Array<{ ID: string; To: Array<{ Address: string }> }> }
    const message = list.messages.find(({ To }) => To.some(({ Address }) => Address === email))
    if (message) {
      const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`)
      const detail = await detailResponse.json() as { Text: string }
      const match = detail.Text.match(/https?:\/\/[^\s)]+/)
      if (match) return match[0]
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error("No llegó el correo de recuperación al buzón local.")
}

async function cleanupContent(cabinName: string, promotionName: string) {
  const supabase = serviceClient()
  const [{ data: cabins }, { data: promotions }] = await Promise.all([
    supabase.from("cabins").select("id").eq("name", cabinName),
    supabase.from("promotions").select("id").eq("name", promotionName),
  ])
  const cabinIds = (cabins ?? []).map(({ id }) => id)
  const promotionIds = (promotions ?? []).map(({ id }) => id)
  const [{ data: cabinImages }, { data: promotionImages }] = await Promise.all([
    cabinIds.length ? supabase.from("cabin_images").select("asset_id").in("cabin_id", cabinIds) : Promise.resolve({ data: [] }),
    promotionIds.length ? supabase.from("promotion_images").select("asset_id").in("promotion_id", promotionIds) : Promise.resolve({ data: [] }),
  ])
  const assetIds = [...new Set([...(cabinImages ?? []), ...(promotionImages ?? [])].map(({ asset_id }) => asset_id))]
  const { data: assets } = assetIds.length
    ? await supabase.from("media_assets").select("source_bucket, source_path, public_bucket, public_path").in("id", assetIds)
    : { data: [] }

  if (cabinIds.length) await supabase.from("cabins").delete().in("id", cabinIds)
  if (promotionIds.length) await supabase.from("promotions").delete().in("id", promotionIds)
  if (assetIds.length) await supabase.from("media_assets").delete().in("id", assetIds)
  for (const asset of assets ?? []) {
    await supabase.storage.from(asset.source_bucket).remove([asset.source_path])
    if (asset.public_bucket && asset.public_path) await supabase.storage.from(asset.public_bucket).remove([asset.public_path])
  }
}

test.describe("autenticación y autorización con Supabase", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeAll(async () => {
    expect(process.env.E2E_AUTH_REQUIRED).toBe("1")
    fixture = await readAuthFixture()
  })

  test("visitante, administrador, cookies seguras y logout", async ({ page, context }) => {
    await page.goto("/panel/cabanas")
    await expect(page).toHaveURL(/\/login\?next=%2Fpanel%2Fcabanas$/)

    await login(page, fixture.admin.email, fixture.admin.password)
    await expect(page).toHaveURL(/\/panel$/)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()

    const authCookies = (await context.cookies()).filter((cookie) => cookie.name.includes("auth-token"))
    expect(authCookies.length).toBeGreaterThan(0)
    expect(authCookies.every((cookie) => cookie.sameSite === "Lax" && cookie.httpOnly)).toBe(true)
    expect(authCookies.every((cookie) => !cookie.secure)).toBe(true)

    await page.getByRole("button", { name: "Cerrar sesión" }).first().click()
    await expect(page).toHaveURL(/\/login$/)
    expect((await context.cookies()).filter((cookie) => cookie.name.includes("auth-token"))).toHaveLength(0)
  })

  test("una cuenta desactivada durante su sesión pierde acceso sin bucle", async ({ page, context }) => {
    await login(page, fixture.admin.email, fixture.admin.password)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    expect((await context.cookies()).some((cookie) => cookie.name.includes("auth-token"))).toBe(true)

    await setProfileActive(fixture.admin.id, false)
    try {
      await page.goto("/panel/cabanas")
      await expect(page).toHaveURL(/\/login\?error=access$/)
      await expect(page.getByText("Tu sesión venció o la cuenta no tiene acceso activo.", { exact: true })).toBeVisible()
    } finally {
      await setProfileActive(fixture.admin.id, true)
    }
  })

  test("credenciales inválidas no crean sesión", async ({ page }) => {
    await login(page, fixture.admin.email, "contraseña-inválida")
    await expect(page.getByText("No pudimos iniciar sesión con esos datos.", { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("editor no recibe dashboard ni controles de borrado", async ({ page }) => {
    await login(page, fixture.editor.email, fixture.editor.password)
    await expect(page).toHaveURL(/\/panel\/cabanas$/)
    await expect(page.getByRole("heading", { name: "Tus cabañas" })).toBeVisible()

    await page.goto("/panel")
    await expect(page).toHaveURL(/\/panel\/cabanas$/)
    await page.goto("/panel/promociones")
    await expect(page.getByRole("heading", { name: "Promociones" })).toBeVisible()
    await expect(page.getByRole("heading", { name: fixture.promotionName, exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0)
  })

  test("uploads reales persisten y aparecen desde otro navegador", async ({ page, browser }) => {
    test.setTimeout(120_000)
    const suffix = Date.now().toString(36)
    const cabinName = `Carga E2E cabaña ${suffix}`
    const promotionName = `Carga E2E promoción ${suffix}`

    try {
      await login(page, fixture.admin.email, fixture.admin.password)
      await expect(page).toHaveURL(/\/panel$/)
      await page.goto("/panel/cabanas/nueva")
      await page.getByLabel("Nombre", { exact: true }).fill(cabinName)
      await page.getByLabel(/Descripción corta/).fill("Validación de persistencia real entre navegadores.")
      await page.getByLabel("Descripción completa").fill("Contenido temporal para comprobar Supabase Storage y el repositorio productivo.")
      await page.getByLabel("Ubicación o zona").fill("Arteaga, Coahuila")
      await page.getByLabel("Precio por noche").fill("2500")
      await page.getByLabel(/Número de WhatsApp/).fill("528441234567")
      await page.getByLabel("Capacidad máxima").fill("4")
      await page.getByLabel("Habitaciones").fill("2")
      await page.getByLabel("Camas").fill("2")
      await page.getByLabel("Baños").fill("1")
      await page.getByLabel("Servicios").fill("WiFi\nChimenea")
      await page.getByLabel("Reglas").fill("No fumar")
      await page.getByLabel("Seleccionar imágenes").setInputFiles(imagePath)
      await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
      await page.getByRole("button", { name: "Publicar", exact: true }).click()
      await expect(page.getByRole("status")).toHaveText("La cabaña se creó correctamente.")
      await expect(page).toHaveURL(/\/panel\/cabanas\/(?!nueva(?:\?|$))[^?]+$/)
      const cabinUrl = page.url()

      await page.goto("/panel/promociones/nueva")
      await page.getByLabel("Nombre de la promoción").fill(promotionName)
      await page.getByLabel("Texto alternativo de la imagen").fill("Cabaña iluminada entre árboles")
      await page.getByLabel("Seleccionar imagen principal").setInputFiles(imagePath)
      await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
      await page.getByRole("button", { name: "Publicar", exact: true }).click()
      await expect(page.getByRole("status")).toHaveText("La promoción se creó correctamente.")
      await expect(page).toHaveURL(/\/panel\/promociones\/(?!nueva(?:\?|$))[^?]+$/)
      const promotionUrl = page.url()

      const secondContext = await browser.newContext()
      const secondPage = await secondContext.newPage()
      try {
        await login(secondPage, fixture.admin.email, fixture.admin.password)
        await expect(secondPage).toHaveURL(/\/panel$/)
        await secondPage.goto(cabinUrl)
        await expect(secondPage.getByText("refugio-pino.png", { exact: true })).toBeVisible()
        await expect(secondPage.getByLabel("Nombre", { exact: true })).toHaveValue(cabinName)
        await secondPage.goto(promotionUrl)
        await expect(secondPage.getByText("refugio-pino.png", { exact: true })).toBeVisible()
        await expect(secondPage.getByLabel("Nombre de la promoción")).toHaveValue(promotionName)
      } finally {
        await secondContext.close()
      }

      const publicPage = await browser.newPage()
      try {
        await publicPage.goto("/")
        await expect(publicPage.getByText(cabinName, { exact: true })).toBeVisible()
        await expect(publicPage.getByText(promotionName, { exact: true })).toBeVisible()
      } finally {
        await publicPage.close()
      }
    } finally {
      await cleanupContent(cabinName, promotionName)
    }
  })

  test("perfil inactivo termina en acceso y no en bucle", async ({ page }) => {
    await login(page, fixture.inactive.email, fixture.inactive.password)
    await expect(page).toHaveURL(/\/login\?error=access$/)
    await expect(page.getByText("Tu sesión venció o la cuenta no tiene acceso activo.", { exact: true })).toBeVisible()
  })

  test("recuperación PKCE cambia la contraseña y el enlace no se reutiliza", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/recuperar-contrasena")
    await page.getByLabel("Correo").fill(fixture.admin.email)
    await page.getByRole("button", { name: "Enviar instrucciones" }).click()
    await expect(page.getByRole("status")).toContainText("Si existe una cuenta autorizada")

    const recoveryLink = await recoveryLinkFor(fixture.admin.email)
    await page.goto(recoveryLink)
    await expect(page).toHaveURL(/\/actualizar-contrasena$/)

    await page.getByLabel("Nueva contraseña").fill("corta")
    await page.getByLabel("Confirmar contraseña").fill("corta")
    await page.getByRole("button", { name: "Guardar contraseña" }).click()
    await expect(page.getByLabel("Nueva contraseña")).toBeFocused()

    await page.getByLabel("Nueva contraseña").fill("ContraseñaNueva!2026")
    await page.getByLabel("Confirmar contraseña").fill("NoCoincide!2026")
    await page.getByRole("button", { name: "Guardar contraseña" }).click()
    await expect(page.getByText("Las contraseñas no coinciden.", { exact: true })).toBeVisible()

    const newPassword = "ContraseñaNueva!2026"
    await page.getByLabel("Nueva contraseña").fill(newPassword)
    await page.getByLabel("Confirmar contraseña").fill(newPassword)
    await page.getByRole("button", { name: "Guardar contraseña" }).click()
    await expect(page).toHaveURL(/\/panel$/)
    await page.getByRole("button", { name: "Cerrar sesión" }).first().click()
    await expect(page).toHaveURL(/\/login$/)
    await login(page, fixture.admin.email, newPassword)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()

    await page.context().clearCookies()
    await page.goto(recoveryLink)
    await expect(page).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("error") === "callback" && url.hash.includes("otp_expired"))
    await page.goto("/auth/callback?code=no-es-un-codigo")
    await expect(page).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("error") === "callback")
  })
})
