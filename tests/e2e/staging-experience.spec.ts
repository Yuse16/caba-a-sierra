import { expect, test, type Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import path from "node:path"

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta ${name} para ejecutar la validación de staging.`)
  return value
}

const previewUrl = requiredEnv("STAGING_PREVIEW_URL").replace(/\/$/, "")
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "")
const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const adminEmail = requiredEnv("STAGING_ADMIN_EMAIL")
const adminPassword = requiredEnv("STAGING_ADMIN_PASSWORD")
const editorEmail = requiredEnv("STAGING_EDITOR_EMAIL")
const editorPassword = requiredEnv("STAGING_EDITOR_PASSWORD")
const imagePath = path.resolve("public/cabins/refugio-pino.png")
const observedOrigins = new Set([new URL(previewUrl).origin, new URL(supabaseUrl).origin])

type ObservedIssue = { kind: "console" | "page" | "network"; detail: string }

function monitorPage(page: Page) {
  const issues: ObservedIssue[] = []

  page.on("console", (message) => {
    if (message.type() === "error") issues.push({ kind: "console", detail: message.text() })
  })
  page.on("pageerror", (error) => issues.push({ kind: "page", detail: error.message }))
  page.on("response", (response) => {
    const url = new URL(response.url())
    if (observedOrigins.has(url.origin) && response.status() >= 400) {
      issues.push({ kind: "network", detail: `${response.status()} ${url.origin}${url.pathname}` })
    }
  })

  return () => expect(issues, "No debe haber errores de consola ni respuestas 4xx/5xx inesperadas.").toEqual([])
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Correo").fill(email)
  await page.getByLabel("Contraseña").fill(password)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
}

async function logout(page: Page) {
  const buttons = page.getByRole("button", { name: "Cerrar sesión" })
  expect(await buttons.count()).toBeGreaterThan(0)
  await buttons.first().click()
  await expect(page).toHaveURL(/\/login$/)
}

test.describe("Preview conectado a Supabase staging", () => {
  test.describe.configure({ mode: "serial" })

  test("protección de rutas, login, logout, recuperación y rol editor", async ({ page }) => {
    const assertNoIssues = monitorPage(page)

    await page.goto("/panel/cabanas")
    await expect(page).toHaveURL(/\/login\?next=%2Fpanel%2Fcabanas$/)

    await login(page, adminEmail, adminPassword)
    await expect(page).toHaveURL(/\/panel$/)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await logout(page)

    await page.goto("/recuperar-contrasena")
    await page.getByLabel("Correo").fill(adminEmail)
    await page.getByRole("button", { name: "Enviar instrucciones" }).click()
    await expect(page.getByRole("status")).toContainText("Si existe una cuenta autorizada")

    await login(page, editorEmail, editorPassword)
    await expect(page).toHaveURL(/\/panel\/cabanas$/)
    await expect(page.getByRole("heading", { name: "Tus cabañas" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Archivar" })).toHaveCount(0)
    await page.goto("/panel")
    await expect(page).toHaveURL(/\/panel\/cabanas$/)
    await page.goto("/panel/promociones")
    await expect(page.getByRole("heading", { name: "Promociones" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0)
    await logout(page)

    assertNoIssues()
  })

  test("cabañas, imágenes y promociones persisten entre navegadores", async ({ page, browser }) => {
    test.setTimeout(240_000)
    const assertNoIssues = monitorPage(page)
    const suffix = Date.now().toString(36)
    const cabinName = `QA staging cabaña ${suffix}`
    const updatedDescription = `Actualizada desde el segundo navegador ${suffix}`
    const promotionName = `QA staging promoción ${suffix}`
    const futureStart = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)
    const futureEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

    await login(page, adminEmail, adminPassword)
    await expect(page).toHaveURL(/\/panel$/)

    await page.goto("/panel/cabanas/nueva")
    await page.getByLabel("Nombre", { exact: true }).fill(cabinName)
    await page.getByLabel("Descripción corta").fill("Validación remota de persistencia entre navegadores.")
    await page.getByLabel("Descripción completa").fill("Contenido temporal de staging para comprobar Supabase Database y Storage.")
    await page.getByLabel("Ubicación o zona").fill("Arteaga, Coahuila")
    await page.getByLabel("Precio por noche").fill("2450")
    await page.getByLabel("Número de WhatsApp").fill("528441234567")
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

    const publicContext = await browser.newContext()
    const publicPage = await publicContext.newPage()
    const assertPublicNoIssues = monitorPage(publicPage)
    await publicPage.goto("/")
    await expect(publicPage.getByText(cabinName, { exact: true })).toBeVisible()

    const secondContext = await browser.newContext()
    const secondPage = await secondContext.newPage()
    const assertSecondNoIssues = monitorPage(secondPage)
    await login(secondPage, adminEmail, adminPassword)
    await secondPage.goto(cabinUrl)
    await expect(secondPage.getByText("refugio-pino.png", { exact: true })).toBeVisible()
    await secondPage.getByLabel("Descripción corta").fill(updatedDescription)
    await secondPage.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect(secondPage.getByRole("status")).toHaveText("El contenido ya está publicado.")

    await page.goto(cabinUrl)
    await expect(page.getByLabel("Descripción corta")).toHaveValue(updatedDescription)
    await secondPage.goto("/panel/cabanas")
    const cabinCard = secondPage.locator("article").filter({ hasText: cabinName })
    await expect(cabinCard).toHaveCount(1)
    await cabinCard.getByRole("switch", { name: `Ocultar ${cabinName}` }).click()
    await expect(secondPage.getByRole("status")).toHaveText("La cabaña quedó oculta.")
    await publicPage.reload()
    await expect(publicPage.getByText(cabinName, { exact: true })).toHaveCount(0)

    await cabinCard.getByRole("button", { name: "Archivar" }).click()
    await secondPage.getByRole("button", { name: "Archivar cabaña" }).click()
    await expect(secondPage.getByRole("status")).toHaveText("La cabaña fue archivada.")

    await secondPage.goto("/panel/promociones/nueva")
    await secondPage.getByLabel("Nombre de la promoción").fill(promotionName)
    await secondPage.getByLabel("Descripción corta opcional").fill("Promoción temporal para validar programación y visibilidad.")
    await secondPage.getByLabel("Texto alternativo de la imagen").fill("Cabaña iluminada entre árboles")
    await secondPage.getByLabel("Seleccionar imagen principal").setInputFiles(imagePath)
    await expect(secondPage.getByText("refugio-pino.png", { exact: true })).toBeVisible()
    await secondPage.getByLabel("Fecha de inicio opcional").fill(futureStart)
    await secondPage.getByLabel("Fecha de finalización opcional").fill(futureEnd)
    await secondPage.getByLabel("Estado").selectOption("scheduled")
    await secondPage.getByRole("button", { name: "Programar", exact: true }).click()
    await expect(secondPage.getByRole("status")).toHaveText("La promoción se creó correctamente.")
    await expect(secondPage).toHaveURL(/\/panel\/promociones\/(?!nueva(?:\?|$))[^?]+$/)
    const promotionUrl = secondPage.url()
    await expect(secondPage.getByText("Programada", { exact: true })).toBeVisible()
    await publicPage.reload()
    await expect(publicPage.getByText(promotionName, { exact: true })).toHaveCount(0)

    await page.goto(promotionUrl)
    await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
    await page.getByLabel("Fecha de inicio opcional").fill("")
    await page.getByLabel("Fecha de finalización opcional").fill("")
    await page.getByLabel("Estado").selectOption("active")
    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect(page.getByRole("status")).toHaveText("El contenido ya está publicado.")
    await publicPage.reload()
    await expect(publicPage.getByText(promotionName, { exact: true })).toBeVisible()

    await page.goto("/panel/promociones")
    const promotionCard = page.locator("article").filter({ hasText: promotionName })
    await expect(promotionCard).toHaveCount(1)
    await promotionCard.getByRole("button", { name: "Ocultar" }).click()
    await expect(page.getByRole("status")).toHaveText("La promoción fue ocultada.")
    await publicPage.reload()
    await expect(publicPage.getByText(promotionName, { exact: true })).toHaveCount(0)

    await promotionCard.getByRole("button", { name: "Eliminar" }).click()
    await page.getByRole("button", { name: "Eliminar promoción" }).click()
    await expect(page.getByRole("status")).toHaveText("La promoción fue eliminada.")

    assertSecondNoIssues()
    assertPublicNoIssues()
    assertNoIssues()
    await secondContext.close()
    await publicContext.close()
  })

  test("contratos públicos y RLS no exponen datos administrativos", async () => {
    const anon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: publicCabins, error: publicError } = await anon.from("public_cabins").select("*").limit(5)
    expect(publicError).toBeNull()
    for (const cabin of publicCabins ?? []) {
      expect(cabin).not.toHaveProperty("legacy_id")
      expect(cabin).not.toHaveProperty("created_by")
      expect(cabin).not.toHaveProperty("updated_by")
      expect(cabin).not.toHaveProperty("published_at")
    }

    const { error: privateReadError } = await anon.from("cabins").select("id").limit(1)
    expect(privateReadError).not.toBeNull()
    const { error: privateStorageError } = await anon.storage.from("admin-media").list()
    expect(privateStorageError).not.toBeNull()

    const editor = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: editorSession, error: loginError } = await editor.auth.signInWithPassword({
      email: editorEmail,
      password: editorPassword,
    })
    expect(loginError).toBeNull()
    expect(editorSession.user).not.toBeNull()

    const { data: profiles, error: profileError } = await editor.from("admin_profiles").select("user_id, role, is_active")
    expect(profileError).toBeNull()
    expect(profiles).toEqual([
      expect.objectContaining({ user_id: editorSession.user?.id, role: "editor", is_active: true }),
    ])

    const { data: owners, error: ownersError } = await editor.from("owners").select("id")
    expect(ownersError).toBeNull()
    expect(owners).toEqual([])
    const { error: ownerWriteError } = await editor.from("owners").insert({ name: "Intento RLS staging" })
    expect(ownerWriteError).not.toBeNull()
    await editor.auth.signOut()
  })
})
