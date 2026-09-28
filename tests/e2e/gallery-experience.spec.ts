import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"
import { createHash } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  readGalleryFixture,
  writeGalleryFixture,
  type GalleryFixture,
} from "./gallery-fixture"

type RuntimeIssue = { kind: "console" | "page" | "network"; detail: string }
type DatabaseSnapshot = {
  cabinId: string
  images: Array<{ id: string; asset_id: string; is_cover: boolean; position: number; deleted_at: string | null }>
  assets: Array<{
    id: string
    original_name: string
    processing_status: string
    source_bucket: string
    source_path: string
    public_bucket: string | null
    public_path: string | null
    canonical_public_url: string | null
    sha256: string
    byte_size: number
    width: number | null
    height: number | null
    mime_type: string
    extension: string
  }>
}

const baseURL = requiredEnv("GALLERY_E2E_BASE_URL").replace(/\/$/, "")
const supabaseURL = requiredEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "")
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY")
const anonymousKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const monitoredOrigins = new Set([new URL(baseURL).origin, new URL(supabaseURL).origin])
const responsiveWidths = [320, 360, 375, 390, 412, 768, 1024, 1440] as const

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta ${name}; la regresión de galería no admite omitir prerrequisitos.`)
  return value
}

function serviceClient() {
  return createClient(supabaseURL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function anonymousClient() {
  return createClient(supabaseURL, anonymousKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function fixturePhone(runId: string) {
  const suffix = (Number.parseInt(runId.replaceAll("-", "").slice(0, 12), 16) % 10_000_000).toString().padStart(7, "0")
  return `844${suffix}`
}

function monitorPage(page: Page) {
  const issues: RuntimeIssue[] = []
  page.on("console", (message) => {
    if (message.type() === "error") issues.push({ kind: "console", detail: message.text() })
  })
  page.on("pageerror", (error) => issues.push({ kind: "page", detail: error.message }))
  page.on("response", (response) => {
    const url = new URL(response.url())
    if (monitoredOrigins.has(url.origin) && response.status() >= 400) {
      issues.push({ kind: "network", detail: `${response.status()} ${url.origin}${url.pathname}` })
    }
  })
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    const reason = request.failure()?.errorText ?? "network request failed"
    // Image changes and navigations may cancel obsolete requests deliberately.
    if (monitoredOrigins.has(url.origin) && !reason.includes("ERR_ABORTED")) {
      issues.push({ kind: "network", detail: `${reason} ${url.origin}${url.pathname}` })
    }
  })
  return () => expect(issues, "No debe haber errores de consola, página ni red 4xx/5xx.").toEqual([])
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth, `scrollWidth ${overflow.scrollWidth} excede clientWidth ${overflow.clientWidth}`).toBeLessThanOrEqual(overflow.clientWidth)
}

async function expectVisibleImagesDecoded(scope: Page | Locator) {
  const images = scope.locator("img")
  await expect(images.first()).toBeAttached()
  await images.first().scrollIntoViewIfNeeded()
  await expect.poll(async () => scope.locator("img").evaluateAll((images) => images
    .filter((image) => {
      const rect = image.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
    })
    .every((image) => {
      const element = image as HTMLImageElement
      return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0
    }))).toBe(true)
}

async function login(page: Page, fixture: GalleryFixture) {
  await page.goto("/login")
  await page.getByLabel("Correo").fill(fixture.admin.email)
  await page.getByLabel("Contraseña").fill(fixture.admin.password)
  await page.getByRole("button", { name: "Iniciar sesión" }).click()
  await expect(page).toHaveURL(/\/panel(?:\/cabanas)?$/)
}

function imageManager(page: Page) {
  return page.locator('section[aria-labelledby="images-title"]')
}

async function expectAdminImageCount(page: Page, count: number) {
  await expect(imageManager(page).getByRole("article")).toHaveCount(count)
}

async function expectAdminImageOrder(page: Page, names: string[]) {
  const articles = imageManager(page).getByRole("article")
  await expect(articles).toHaveCount(names.length)
  for (const [index, name] of names.entries()) await expect(articles.nth(index)).toContainText(name)
}

async function fillNewCabin(page: Page, fixture: GalleryFixture) {
  await page.goto("/panel/cabanas/nueva")
  await page.getByLabel("Nombre", { exact: true }).fill(fixture.cabinName)
  await page.getByLabel("Descripción corta").fill("Regresión automática de persistencia para una galería extensa.")
  await page.getByLabel("Descripción completa").fill("Cabaña efímera creada sólo en el entorno autorizado para comprobar carga, portada y navegación pública.")
  await page.getByLabel("Nombre público de la ubicación").fill("Sierra de Arteaga, Coahuila")
  await page.getByLabel("Zona").fill("San Antonio de las Alazanas")
  await page.getByLabel("Dirección").fill("Camino QA 27, Arteaga")
  await page.getByLabel("Latitud").fill("25.450000")
  await page.getByLabel("Longitud").fill("-100.850000")
  await page.getByLabel("URL de Google Maps u OpenStreetMap").fill("https://maps.google.com/?q=25.45,-100.85")
  await page.getByLabel("Precio por noche").fill("2780")
  await page.getByLabel("Número de WhatsApp").fill("528441234567")
  await page.getByLabel("Capacidad máxima").fill("50")
  await page.getByLabel("Habitaciones").fill("12")
  await page.getByLabel("Individual", { exact: true }).fill("4")
  await page.getByLabel("Matrimonial", { exact: true }).fill("6")
  await page.getByLabel("King size", { exact: true }).fill("3")
  await page.getByLabel("Baños").fill("2")
  await page.getByLabel("Alberca").selectOption("heated")
  await page.getByLabel("Servicios").fill("WiFi\nChimenea\nAsador")
  await page.getByLabel("Reglas").fill("No fumar\nRespetar horarios")
  await page.getByRole("button", { name: "Agregar propietario" }).click()
  const internal = page.locator("section").filter({ has: page.getByRole("heading", { name: "Información interna" }) })
  await internal.getByLabel("Nombre", { exact: true }).fill(`Propietario privado ${fixture.runId}`)
  await internal.getByLabel("Teléfono", { exact: true }).fill("8442779001")
  await internal.getByLabel("WhatsApp", { exact: true }).fill("528442779001")
  await internal.getByLabel("Correo opcional").fill(`privado-${fixture.runId}@example.test`)
  await internal.getByLabel("Notas privadas").fill(`MARCADOR-PRIVADO-${fixture.runId}`)
}

async function saveDraft(page: Page, message: string | RegExp) {
  await page.getByRole("button", { name: "Guardar borrador" }).click()
  await expect(page.getByRole("status")).toHaveText(message)
}

async function databaseSnapshot(supabase: SupabaseClient, cabinName: string, expectedCount: number): Promise<DatabaseSnapshot> {
  const { data: cabin, error: cabinError } = await supabase
    .from("cabins")
    .select("id")
    .eq("name", cabinName)
    .is("deleted_at", null)
    .single()
  expect(cabinError).toBeNull()
  expect(cabin).not.toBeNull()
  if (!cabin) throw new Error(`No se encontró la cabaña efímera ${cabinName}.`)

  const { data: images, error: imagesError } = await supabase
    .from("cabin_images")
    .select("id, asset_id, is_cover, position, deleted_at")
    .eq("cabin_id", cabin.id)
    .is("deleted_at", null)
    .order("position")
  expect(imagesError).toBeNull()
  expect(images).toHaveLength(expectedCount)
  expect((images ?? []).map(({ position }) => position)).toEqual(Array.from({ length: expectedCount }, (_, index) => index + 1))
  expect((images ?? []).filter(({ is_cover }) => is_cover)).toHaveLength(1)
  expect(new Set((images ?? []).map(({ asset_id }) => asset_id)).size).toBe(expectedCount)

  const assetIds = (images ?? []).map(({ asset_id }) => asset_id)
  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("id, original_name, processing_status, source_bucket, source_path, public_bucket, public_path, canonical_public_url, sha256, byte_size, width, height, mime_type, extension")
    .in("id", assetIds)
    .is("deleted_at", null)
  expect(assetsError).toBeNull()
  expect(assets).toHaveLength(expectedCount)
  expect(new Set((assets ?? []).map(({ sha256 }) => sha256)).size).toBe(expectedCount)
  for (const asset of assets ?? []) {
    expect(asset.processing_status).toBe("ready")
    expect(asset.public_bucket).toBe("public-media")
    expect(asset.public_path).toBeTruthy()
    expect(asset.canonical_public_url).toMatch(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/public-media\//)
    expect(asset.byte_size).toBeGreaterThan(0)
    expect(asset.width).toBe(960)
    expect(asset.height).toBe(640)
    expect(["image/jpeg", "image/png", "image/webp"]).toContain(asset.mime_type)
    expect(["jpg", "jpeg", "png", "webp"]).toContain(asset.extension)
  }

  return {
    cabinId: cabin.id,
    images: images ?? [],
    assets: assets ?? [],
  }
}

async function expectStoredObjects(supabase: SupabaseClient, snapshot: DatabaseSnapshot) {
  for (const asset of snapshot.assets) {
    const source = await supabase.storage.from(asset.source_bucket).download(asset.source_path)
    expect(source.error, `Falta el original privado ${asset.source_path}`).toBeNull()
    expect(source.data?.size).toBe(asset.byte_size)
    expect(asset.public_bucket).toBeTruthy()
    expect(asset.public_path).toBeTruthy()
    const published = await supabase.storage.from(asset.public_bucket as string).download(asset.public_path as string)
    expect(published.error, `Falta el objeto público ${asset.public_path}`).toBeNull()
    expect(published.data?.size).toBe(asset.byte_size)
    const sourceBytes = Buffer.from(await (source.data as Blob).arrayBuffer())
    const publicBytes = Buffer.from(await (published.data as Blob).arrayBuffer())
    expect(createHash("sha256").update(sourceBytes).digest("hex")).toBe(asset.sha256)
    expect(createHash("sha256").update(publicBytes).digest("hex")).toBe(asset.sha256)
  }
}

async function expectInternalCabinContract(supabase: SupabaseClient, cabinId: string, fixture: GalleryFixture) {
  const { data: cabin, error: cabinError } = await supabase.from("cabins")
    .select("max_guests,bedrooms,beds,bed_distribution,address,zone,latitude,longitude,maps_url,pool_type")
    .eq("id", cabinId).single()
  expect(cabinError).toBeNull()
  expect(cabin).toMatchObject({
    max_guests: 50, bedrooms: 12, beds: 13,
    bed_distribution: { individual: 4, matrimonial: 6, king: 3 },
    address: "Camino QA 27, Arteaga", zone: "San Antonio de las Alazanas",
    maps_url: "https://maps.google.com/?q=25.45,-100.85", pool_type: "heated",
  })
  expect(Number(cabin?.latitude)).toBe(25.45)
  expect(Number(cabin?.longitude)).toBe(-100.85)

  const { data: assignment, error: assignmentError } = await supabase.from("cabin_owner_assignments")
    .select("owner_id").eq("cabin_id", cabinId).eq("is_primary", true).eq("is_active", true).single()
  expect(assignmentError).toBeNull()
  const { data: owner, error: ownerError } = await supabase.from("owners")
    .select("name,notes,preferred_contact,contact_hours").eq("id", assignment?.owner_id as string).single()
  expect(ownerError).toBeNull()
  expect(owner).toMatchObject({ name: `Propietario privado ${fixture.runId}`, notes: `MARCADOR-PRIVADO-${fixture.runId}`, preferred_contact: "whatsapp", contact_hours: "" })
  const { data: contacts, error: contactsError } = await supabase.from("owner_contacts")
    .select("contact_type,display_value").eq("owner_id", assignment?.owner_id as string).is("deleted_at", null)
  expect(contactsError).toBeNull()
  expect(Object.fromEntries((contacts ?? []).map((contact) => [contact.contact_type, contact.display_value]))).toEqual({
    phone: "8442779001", whatsapp: "528442779001", email: `privado-${fixture.runId}@example.test`,
  })
  return assignment?.owner_id as string
}

function assetByName(snapshot: DatabaseSnapshot, name: string) {
  const asset = snapshot.assets.find((candidate) => candidate.original_name === name)
  expect(asset, `No se encontró el asset ${name}`).toBeTruthy()
  return asset as DatabaseSnapshot["assets"][number]
}

function coverAsset(snapshot: DatabaseSnapshot) {
  const cover = snapshot.images.find(({ is_cover }) => is_cover)
  expect(cover).toBeTruthy()
  const asset = snapshot.assets.find(({ id }) => id === cover?.asset_id)
  expect(asset).toBeTruthy()
  return asset as DatabaseSnapshot["assets"][number]
}

async function expectPublicContract(supabase: SupabaseClient, snapshot: DatabaseSnapshot, expectedCount: number) {
  const { data, error } = await supabase
    .from("public_cabins")
    .select("id, image_url, gallery")
    .eq("id", snapshot.cabinId)
    .single()
  expect(error).toBeNull()
  expect(data?.image_url).toBe(coverAsset(snapshot).canonical_public_url)
  expect(Array.isArray(data?.gallery)).toBe(true)
  expect(data?.gallery).toHaveLength(expectedCount)
  const gallery = data?.gallery as Array<{ position: number; is_cover: boolean; url: string }>
  expect(gallery.map(({ position }) => position)).toEqual(Array.from({ length: expectedCount }, (_, index) => index + 1))
  expect(gallery.filter(({ is_cover }) => is_cover)).toHaveLength(1)
  expect(gallery.find(({ is_cover }) => is_cover)?.url).toBe(data?.image_url)
  for (const image of gallery) {
    expect(Object.keys(image).sort()).toEqual(["alt_text", "id", "is_cover", "position", "url"])
  }
}

function publicCabinCard(page: Page, cabinName: string) {
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name: cabinName, exact: true }) })
}

function unoptimizedImageURL(src: string) {
  const resolved = new URL(src, baseURL)
  if (resolved.pathname === "/_next/image") return resolved.searchParams.get("url") ?? src
  return resolved.toString()
}

async function expectCardUsesCover(page: Page, fixture: GalleryFixture, snapshot: DatabaseSnapshot) {
  const card = publicCabinCard(page, fixture.cabinName)
  await expect(card).toHaveCount(1)
  // The editor controls alt_text, so the cover assertion must follow the URL
  // contract rather than coupling the test to one particular accessible name.
  const src = await card.locator("img").first().getAttribute("src")
  expect(src).toBeTruthy()
  expect(unoptimizedImageURL(src as string)).toBe(coverAsset(snapshot).canonical_public_url)
}

async function expectGalleryNavigation(dialog: Locator, expectedUrls: string[]) {
  const gallery = dialog.getByTestId("cabin-gallery")
  await expect(gallery).toBeVisible()
  await expect(gallery.getByText(`1 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
  const activeImage = gallery.getByRole("img")
  await expect.poll(async () => unoptimizedImageURL(await activeImage.getAttribute("src") ?? "")).toBe(expectedUrls[0])
  const next = gallery.getByRole("button", { name: "Fotografía siguiente" })
  const previous = gallery.getByRole("button", { name: "Fotografía anterior" })
  await next.click()
  await expect(gallery.getByText(`2 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
  await expect.poll(async () => unoptimizedImageURL(await activeImage.getAttribute("src") ?? "")).toBe(expectedUrls[1])
  await next.click()
  await expect(gallery.getByText(`3 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
  await expect.poll(async () => unoptimizedImageURL(await activeImage.getAttribute("src") ?? "")).toBe(expectedUrls[2])
  await previous.click()
  await expect(gallery.getByText(`2 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
  await expect.poll(async () => unoptimizedImageURL(await activeImage.getAttribute("src") ?? "")).toBe(expectedUrls[1])
  await previous.press("ArrowRight")
  await expect(gallery.getByText(`3 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
  await expect.poll(async () => unoptimizedImageURL(await activeImage.getAttribute("src") ?? "")).toBe(expectedUrls[2])
  await previous.press("ArrowLeft")
  await expect(gallery.getByText(`2 / ${expectedUrls.length}`, { exact: true })).toBeVisible()
}

async function swipeGallery(page: Page, gallery: Locator) {
  const box = await gallery.boundingBox()
  expect(box).not.toBeNull()
  const session = await page.context().newCDPSession(page)
  const y = (box as NonNullable<typeof box>).y + (box as NonNullable<typeof box>).height / 2
  const startX = (box as NonNullable<typeof box>).x + (box as NonNullable<typeof box>).width * 0.8
  const endX = (box as NonNullable<typeof box>).x + (box as NonNullable<typeof box>).width * 0.2
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] })
  for (let step = 1; step <= 5; step += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX + ((endX - startX) * step) / 5, y }],
    })
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await session.detach()
}

async function newResponsiveContext(browser: Browser, width: number, storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>) {
  return browser.newContext({
    baseURL,
    viewport: { width, height: width <= 412 ? 844 : width === 768 ? 1024 : 900 },
    hasTouch: width <= 768,
    isMobile: width < 768,
    storageState,
  })
}

test.describe("regresión completa de múltiples fotografías", () => {
  test.describe.configure({ mode: "serial" })

  test("15 fotos persisten, quedan 14, crece a 34 y funciona en segundo navegador", async ({ page, browser }) => {
    const fixture = await readGalleryFixture()
    const supabase = serviceClient()
    const publicSupabase = anonymousClient()
    const assertNoIssues = monitorPage(page)

    await login(page, fixture)
    await fillNewCabin(page, fixture)
    await page.getByLabel("Seleccionar imágenes").setInputFiles(fixture.initialImages.map((image) => image.path))
    await expectAdminImageCount(page, 15)
    await saveDraft(page, "La cabaña se creó correctamente.")
    await expect(page).toHaveURL(/\/panel\/cabanas\/(?!nueva(?:\?|$))[^?]+$/)
    fixture.cabinUrl = page.url()

    const initial = await databaseSnapshot(supabase, fixture.cabinName, 15)
    fixture.cabinId = initial.cabinId
    await writeGalleryFixture(fixture)
    await expectStoredObjects(supabase, initial)
    const ownerId = await expectInternalCabinContract(supabase, initial.cabinId, fixture)
    expect(coverAsset(initial).original_name).toBe(fixture.images.a.name)
    expect(initial.images.map(({ asset_id }) => initial.assets.find(({ id }) => id === asset_id)?.original_name)).toEqual(fixture.initialImages.map((image) => image.name))

    await page.reload()
    await expectAdminImageOrder(page, fixture.initialImages.map((image) => image.name))

    const secondContext = await browser.newContext({ baseURL })
    const secondPage = await secondContext.newPage()
    const assertSecondNoIssues = monitorPage(secondPage)
    await login(secondPage, fixture)
    await secondPage.goto(fixture.cabinUrl)
    await expectAdminImageCount(secondPage, 15)

    await imageManager(secondPage)
      .getByRole("button", { name: `Usar ${fixture.images.b.name} como portada` })
      .click()
    await saveDraft(secondPage, "Los cambios se guardaron.")
    await expectAdminImageCount(secondPage, 15)
    const coverChanged = await databaseSnapshot(supabase, fixture.cabinName, 15)
    expect(coverAsset(coverChanged).original_name).toBe(fixture.images.b.name)

    await page.reload()
    await expectAdminImageOrder(page, fixture.initialImages.map((image) => image.name))
    const coverArticle = imageManager(page).getByRole("article").filter({ hasText: fixture.images.b.name })
    await expect(coverArticle.getByText("Portada", { exact: true })).toBeVisible()

    const removedAsset = assetByName(coverChanged, fixture.images.a.name)
    await imageManager(page).getByRole("button", { name: `Eliminar ${fixture.images.a.name}` }).click()
    await page.getByRole("button", { name: "Eliminar fotografía" }).click()
    await expectAdminImageCount(page, 14)
    await saveDraft(page, "Los cambios se guardaron.")
    const afterDelete = await databaseSnapshot(supabase, fixture.cabinName, 14)
    expect(afterDelete.assets.map(({ original_name }) => original_name)).not.toContain(fixture.images.a.name)
    const { data: removedRow, error: removedRowError } = await supabase
      .from("media_assets")
      .select("processing_status, deleted_at")
      .eq("id", removedAsset.id)
      .maybeSingle()
    expect(removedRowError).toBeNull()
    if (removedRow) {
      // Removing a saved photo soft-deletes the relation immediately. The
      // asset itself may remain ready during the cleanup grace period.
      expect(["ready", "pending_delete", "deleted"]).toContain(removedRow.processing_status)
    }
    const { data: removedAssociations, error: removedAssociationsError } = await supabase
      .from("cabin_images")
      .select("deleted_at")
      .eq("cabin_id", coverChanged.cabinId)
      .eq("asset_id", removedAsset.id)
    expect(removedAssociationsError).toBeNull()
    expect(removedAssociations).toHaveLength(1)
    expect(removedAssociations?.[0]?.deleted_at).toBeTruthy()

    await page.getByLabel("Seleccionar imágenes").setInputFiles(fixture.additionalImages.map((image) => image.path))
    await expectAdminImageCount(page, 34)
    const movedName = fixture.additionalImages.at(-1)?.name as string
    await imageManager(page).getByRole("button", { name: `Mover ${movedName} a la izquierda` }).click()
    await saveDraft(page, "Los cambios se guardaron.")
    const afterAdd = await databaseSnapshot(supabase, fixture.cabinName, 34)
    const expectedNames = fixture.initialImages.slice(1).map((image) => image.name).concat(fixture.additionalImages.map((image) => image.name))
    const lastIndex = expectedNames.length - 1
    ;[expectedNames[lastIndex - 1], expectedNames[lastIndex]] = [expectedNames[lastIndex], expectedNames[lastIndex - 1]]
    expect(afterAdd.assets.map(({ original_name }) => original_name).sort()).toEqual(expectedNames.toSorted())
    expect(afterAdd.images.map(({ asset_id }) => afterAdd.assets.find(({ id }) => id === asset_id)?.original_name)).toEqual(expectedNames)
    expect(coverAsset(afterAdd).original_name).toBe(fixture.images.b.name)
    await expectStoredObjects(supabase, afterAdd)
    await page.reload()
    await expectAdminImageOrder(page, expectedNames)
    await expect(imageManager(page).getByRole("article").filter({ hasText: fixture.images.b.name }).getByText("Portada", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect(page.getByRole("status")).toHaveText("El contenido ya está publicado.")
    const published = await databaseSnapshot(supabase, fixture.cabinName, 34)
    await expectPublicContract(publicSupabase, published, 34)

    const publicContext = await browser.newContext({ baseURL })
    const publicPage = await publicContext.newPage()
    const assertPublicNoIssues = monitorPage(publicPage)
    await publicPage.addInitScript(() => { window.open = () => null })
    await publicPage.goto("/")
    await expect(publicPage.locator("main[data-hydrated='true']")).toBeVisible()
    const publicCheckIn = publicPage.getByLabel("Entrada")
    const publicCheckOut = publicPage.getByLabel("Salida")
    await publicCheckIn.fill("2030-10-18")
    await expect(publicCheckIn).toHaveValue("2030-10-18")
    await publicCheckOut.fill("2030-10-21")
    await expect(publicCheckIn).toHaveValue("2030-10-18")
    await expect(publicCheckOut).toHaveValue("2030-10-21")
    for (let guests = 2; guests < 50; guests += 1) await publicPage.getByRole("button", { name: "Agregar huésped" }).click()
    await expect(publicPage.getByText("50 huéspedes", { exact: true })).toBeVisible()
    await expectCardUsesCover(publicPage, fixture, published)
    const publicCard = publicCabinCard(publicPage, fixture.cabinName)
    await expect(publicCard.getByText("1 / 34", { exact: true })).toBeVisible()
    await publicCard.getByRole("button", { name: `Fotografía siguiente de ${fixture.cabinName}` }).click()
    await expect(publicCard.getByText("2 / 34", { exact: true })).toBeVisible()
    await publicCard.getByRole("button", { name: `Fotografía anterior de ${fixture.cabinName}` }).click()
    await expect(publicCard.getByText("1 / 34", { exact: true })).toBeVisible()
    await publicCard.getByRole("button", { name: "Ver detalles" }).click()
    const dialog = publicPage.getByRole("dialog", { name: `Detalles y reserva para ${fixture.cabinName}` })
    await expect(dialog).toBeVisible()
    const orderedPublicUrls = published.images.map(({ asset_id }) => published.assets.find(({ id }) => id === asset_id)?.canonical_public_url)
    expect(orderedPublicUrls.every(Boolean)).toBe(true)
    expect(orderedPublicUrls).not.toContain(removedAsset.canonical_public_url)
    await expectGalleryNavigation(dialog, orderedPublicUrls as string[])
    await expectNoHorizontalOverflow(publicPage)

    const customerName = `E2E Cliente ${fixture.runId}`
    const customerPhone = fixturePhone(fixture.runId)
    await expect(dialog.getByLabel("Entrada")).toHaveValue("2030-10-18")
    await expect(dialog.getByLabel("Salida")).toHaveValue("2030-10-21")
    await expect(dialog.getByLabel("Huéspedes")).toHaveValue("50")
    await dialog.getByLabel("Nombre").fill(customerName)
    await dialog.getByLabel("Teléfono").fill(customerPhone)
    await dialog.getByLabel("Comentarios").fill(`Consulta E2E ${fixture.runId}`)
    await dialog.getByRole("button", { name: "Consultar disponibilidad" }).click()
    await expect(dialog.getByText("Tu solicitud quedó registrada")).toBeVisible()
    const whatsappHref = await dialog.getByRole("link", { name: "Abrir WhatsApp" }).getAttribute("href")
    const whatsappMessage = new URL(whatsappHref as string).searchParams.get("text")
    expect(whatsappMessage).toContain("Entrada: 2030-10-18")
    expect(whatsappMessage).toContain("Salida: 2030-10-21")
    expect(whatsappMessage).toContain("Huéspedes: 50")

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, name, phone_display, phone_e164")
      .eq("name", customerName)
      .single()
    expect(customerError).toBeNull()
    expect(customer).toMatchObject({ name: customerName, phone_display: customerPhone, phone_e164: `+52${customerPhone}` })
    const { data: inquiry, error: inquiryError } = await supabase
      .from("booking_inquiries")
      .select("id, cabin_id, customer_id, check_in, check_out, guests, message, origin, status")
      .eq("cabin_id", published.cabinId)
      .eq("customer_id", customer?.id as string)
      .eq("guests", 50)
      .single()
    expect(inquiryError).toBeNull()
    expect(inquiry).toMatchObject({
      cabin_id: published.cabinId,
      customer_id: customer?.id,
      check_in: "2030-10-18",
      check_out: "2030-10-21",
      guests: 50,
      message: `Consulta E2E ${fixture.runId}`,
      origin: "website",
      status: "new",
    })

    for (const guests of [11, 27]) {
      await dialog.getByRole("button", { name: "Cerrar", exact: true }).last().click()
      await publicCard.getByRole("button", { name: "Ver detalles" }).click()
      const nextDialog = publicPage.getByRole("dialog", { name: `Detalles y reserva para ${fixture.cabinName}` })
      await nextDialog.getByLabel("Nombre").fill(customerName)
      await nextDialog.getByLabel("Teléfono").fill(customerPhone)
      await nextDialog.getByLabel("Huéspedes").fill(String(guests))
      await nextDialog.getByLabel("Comentarios").fill(`Consulta E2E ${fixture.runId} huéspedes ${guests}`)
      await nextDialog.getByRole("button", { name: "Consultar disponibilidad" }).click()
      await expect(nextDialog.getByText("Tu solicitud quedó registrada")).toBeVisible()
    }
    const { data: guestInquiries, error: guestInquiriesError } = await supabase.from("booking_inquiries").select("guests").eq("cabin_id", published.cabinId).eq("customer_id", customer?.id as string)
    expect(guestInquiriesError).toBeNull()
    expect((guestInquiries ?? []).map((item) => item.guests).toSorted((a, b) => a - b)).toEqual([11, 27, 50])

    const publicMarkup = await publicPage.content()
    expect(publicMarkup).not.toContain(`Propietario privado ${fixture.runId}`)
    expect(publicMarkup).not.toContain(`privado-${fixture.runId}@example.test`)
    expect(publicMarkup).not.toContain(`MARCADOR-PRIVADO-${fixture.runId}`)

    const alternativeId = crypto.randomUUID()
    const alternativeName = `E2E Alternativa ${fixture.runId}`
    const alternativeSlug = `e2e-alternativa-${fixture.runId}`
    const { error: alternativeError } = await supabase.from("cabins").insert({ id: alternativeId, slug: alternativeSlug, name: alternativeName, short_description: "Alternativa QA", description: "Alternativa publicada para el flujo CRM.", location: "Arteaga", nightly_price: 2500, max_guests: 100, bedrooms: 10, bathrooms: 4, contact_whatsapp: "528441234567", publication_state: "published", published_at: new Date().toISOString(), created_by: fixture.admin.id, updated_by: fixture.admin.id })
    expect(alternativeError).toBeNull()
    const sharedCover = published.images.find((image) => image.is_cover)
    const { error: alternativeImageError } = await supabase.from("cabin_images").insert({ cabin_id: alternativeId, asset_id: sharedCover?.asset_id as string, public_url: published.assets.find((asset) => asset.id === sharedCover?.asset_id)?.canonical_public_url, alt_text: alternativeName, position: 1, is_cover: true })
    expect(alternativeImageError).toBeNull()
    fixture.alternativeCabinId = alternativeId
    await writeGalleryFixture(fixture)

    await secondPage.goto(`/panel/solicitudes?selected=${inquiry?.id}`)
    await expect(secondPage.getByRole("heading", { name: "Solicitudes" })).toBeVisible()
    await expect(secondPage.getByText(customerName, { exact: true }).first()).toBeVisible()
    const whatsappLink = secondPage.getByRole("link", { name: "Abrir WhatsApp" })
    await expect(whatsappLink).toHaveAttribute("href", new RegExp(`wa.me\\/${customer?.phone_e164?.replace(/\D/g, "")}`))
    await secondPage.getByLabel("Nueva nota interna").fill(`Nota CRM ${fixture.runId}`)
    await secondPage.getByRole("button", { name: "Agregar nota" }).click()
    await expect(secondPage.getByText(`Nota CRM ${fixture.runId}`)).toBeVisible()
    const labelToStatus = { "Contactado": "contacted", "Pendiente": "pending", "Confirmada": "confirmed" } as const
    for (const label of ["Contactado", "Pendiente", "Confirmada"]) {
      await secondPage.getByRole("button", { name: label, exact: true }).click()
      await expect.poll(async () => {
        const { data } = await supabase.from("booking_inquiries").select("status").eq("id", inquiry?.id as string).single()
        return data?.status ?? null
      }, { timeout: 20_000 }).toBe(labelToStatus[label as keyof typeof labelToStatus])
      await secondPage.reload()
    }
    await secondPage.getByLabel("Cabaña alternativa").selectOption(alternativeId)
    await expect(secondPage.getByLabel("Mensaje de WhatsApp")).toHaveValue(new RegExp(alternativeName))
    await whatsappLink.click({ modifiers: ["Alt"] })
    await expect.poll(async () => (await supabase.from("inquiry_events").select("id", { count: "exact", head: true }).eq("inquiry_id", inquiry?.id as string).eq("event_type", "alternative_offered")).count).toBe(1)
    await secondPage.reload()
    await expect(secondPage.getByText(`Nota CRM ${fixture.runId}`)).toBeVisible()
    await expect(secondPage.getByRole("button", { name: "Confirmada", exact: true })).toBeDisabled()
    await secondPage.goto(`/panel/clientes?selected=${customer?.id}`)
    await expect(secondPage.getByRole("heading", { name: "Clientes" })).toBeVisible()
    await expect(secondPage.getByText(customerName, { exact: true }).first()).toBeVisible()
    await expect(secondPage.getByText("3 solicitudes", { exact: false }).first()).toBeVisible()
    await secondPage.getByLabel("Nueva nota del cliente").fill(`Perfil CRM ${fixture.runId}`)
    await secondPage.getByRole("button", { name: "Agregar nota" }).click()
    await expect(secondPage.getByText(`Perfil CRM ${fixture.runId}`)).toBeVisible()

    await page.goto(fixture.cabinUrl)
    await page.getByLabel("Propietario existente").selectOption("")
    await saveDraft(page, "Los cambios se guardaron.")
    const { count: unassignedCount } = await supabase.from("cabin_owner_assignments").select("id", { count: "exact", head: true }).eq("cabin_id", published.cabinId).eq("is_active", true)
    expect(unassignedCount).toBe(0)
    await page.getByLabel("Propietario existente").selectOption(ownerId)
    await saveDraft(page, "Los cambios se guardaron.")
    await expectInternalCabinContract(supabase, published.cabinId, fixture)

    await page.goto("/panel/cabanas")
    const cabinRow = page.getByRole("article").filter({ has: page.getByRole("heading", { name: fixture.cabinName, exact: true }) })
    await cabinRow.getByRole("button", { name: "Archivar" }).click()
    await page.getByRole("button", { name: "Archivar cabaña" }).click()
    await expect.poll(async () => {
      const { data } = await supabase.from("cabins").select("deleted_at,publication_state").eq("id", published.cabinId).single()
      return data ?? null
    }, { timeout: 20_000 }).toEqual({ deleted_at: expect.any(String), publication_state: "draft" })
    await expect(cabinRow).toHaveCount(0)
    const { data: archivedImages } = await supabase.from("cabin_images").select("is_cover,position,deleted_at").eq("cabin_id", published.cabinId).is("deleted_at", null).order("position")
    expect(archivedImages).toHaveLength(34)
    expect(archivedImages?.filter((image) => image.is_cover)).toHaveLength(1)
    await publicPage.reload()
    await expect(publicCabinCard(publicPage, fixture.cabinName)).toHaveCount(0)

    await page.getByRole("button", { name: /archivadas$/ }).click()
    const archivedRow = page.getByRole("article").filter({ has: page.getByRole("heading", { name: fixture.cabinName, exact: true }) })
    await archivedRow.getByRole("button", { name: "Restaurar como borrador" }).click()
    await expect.poll(async () => {
      const { data } = await supabase.from("cabins").select("deleted_at,publication_state").eq("id", published.cabinId).single()
      return data ?? null
    }, { timeout: 20_000 }).toEqual({ deleted_at: null, publication_state: "draft" })
    await expect(archivedRow).toHaveCount(0)
    await page.goto(fixture.cabinUrl)
    await expectAdminImageCount(page, 34)
    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await expect.poll(async () => {
      const { data } = await supabase.from("cabins").select("publication_state").eq("id", published.cabinId).single()
      return data?.publication_state ?? null
    }, { timeout: 20_000 }).toBe("published")
    await page.reload()
    await expect(page.getByText("Publicada", { exact: true }).first()).toBeVisible()

    await secondPage.goto(fixture.cabinUrl)
    await expectAdminImageCount(secondPage, 34)
    await expect(imageManager(secondPage).getByRole("article").filter({ hasText: fixture.images.b.name }).getByText("Portada", { exact: true })).toBeVisible()

    assertPublicNoIssues()
    assertSecondNoIssues()
    assertNoIssues()
    await publicContext.close()
    await secondContext.close()
  })

  test("galería pública y administrador son responsivos en 320–1440 sin overflow ni errores", async ({ browser }) => {
    const fixture = await readGalleryFixture()
    if (!fixture.cabinUrl || !fixture.cabinId) throw new Error("La prueba principal no dejó una cabaña publicada para responsive.")

    const authContext = await browser.newContext({ baseURL })
    const authPage = await authContext.newPage()
    await login(authPage, fixture)
    const storageState = await authContext.storageState()
    await authContext.close()

    for (const width of responsiveWidths) {
      const adminContext = await newResponsiveContext(browser, width, storageState)
      const adminPage = await adminContext.newPage()
      const assertAdminNoIssues = monitorPage(adminPage)
      await adminPage.goto(fixture.cabinUrl)
      await expectAdminImageCount(adminPage, 34)
      await expect(imageManager(adminPage).getByText("Portada", { exact: true })).toHaveCount(1)
      await expectVisibleImagesDecoded(imageManager(adminPage))
      await expectNoHorizontalOverflow(adminPage)
      assertAdminNoIssues()
      await adminContext.close()

      const publicContext = await newResponsiveContext(browser, width)
      const publicPage = await publicContext.newPage()
      const assertPublicNoIssues = monitorPage(publicPage)
      await publicPage.goto("/")
      const card = publicCabinCard(publicPage, fixture.cabinName)
      await expect(card).toHaveCount(1)
      await card.getByRole("button", { name: "Ver detalles" }).click()
      const dialog = publicPage.getByRole("dialog", { name: `Detalles y reserva para ${fixture.cabinName}` })
      const gallery = dialog.getByTestId("cabin-gallery")
      await expect(gallery).toBeVisible()
      await expectVisibleImagesDecoded(gallery)
      await expect(gallery.getByText("1 / 34", { exact: true })).toBeVisible()
      if (width <= 768) {
        await swipeGallery(publicPage, gallery)
        await expect(gallery.getByText("2 / 34", { exact: true })).toBeVisible()
      }
      await expect(dialog.getByRole("button", { name: "Cerrar" })).toBeVisible()
      await expectNoHorizontalOverflow(publicPage)
      assertPublicNoIssues()
      await publicContext.close()
    }
  })
})
