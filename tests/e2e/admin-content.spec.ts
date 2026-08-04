import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const imagePath = path.resolve("public/cabins/refugio-pino.png")

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
}

test("rutas públicas y privadas responden sin desbordamiento", async ({ page }) => {
  for (const route of ["/", "/panel", "/panel/cabanas", "/panel/promociones"]) {
    await page.goto(route)
    await expect(page.locator("main")).toBeVisible()
    await expectNoHorizontalOverflow(page)
  }
})

test("CRUD local de cabañas y promociones conserva imágenes al recargar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "El flujo mutante se ejecuta una vez; los demás proyectos validan responsive.")

  const suffix = Date.now().toString(36)
  const cabinName = `Cabaña QA ${suffix}`
  await page.goto("/panel/cabanas/nueva")
  await page.getByLabel("Nombre", { exact: true }).fill(cabinName)
  await page.getByLabel(/Descripción corta/).fill("Cabaña creada para validar el flujo persistente del panel.")
  await page.getByLabel("Descripción completa").fill("Descripción completa de prueba para validar creación, edición y publicación.")
  await page.getByLabel("Ubicación o zona").fill("Arteaga, Coahuila")
  await page.getByLabel("Precio por noche").fill("2500")
  await page.getByLabel(/Número de WhatsApp/).fill("528441234567")
  await page.getByLabel("Capacidad máxima").fill("4")
  await page.getByLabel("Habitaciones").fill("2")
  await page.getByLabel("Camas").fill("2")
  await page.getByLabel("Baños").fill("1")
  await page.getByLabel("Servicios").fill("Chimenea\nWiFi")
  await page.getByLabel("Reglas").fill("No fumar\nRespetar horarios")
  await page.getByLabel("Seleccionar imágenes").setInputFiles(imagePath)
  await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Guardar borrador" }).click()
  await expect(page.getByRole("status")).toHaveText("La cabaña se creó correctamente.")
  await expect(page).toHaveURL(/\/panel\/cabanas\/(?!nueva(?:\?|$))[^?]+$/)
  await expect(page).not.toHaveURL(/created=1/)
  await page.reload()
  await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
  await expect(page.getByText("La cabaña se creó correctamente.", { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Publicar", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("El contenido ya está publicado.")
  await page.getByRole("button", { name: "Volver a cabañas" }).click()
  const cabinCard = page.getByRole("article").filter({ hasText: cabinName })
  await expect(cabinCard).toContainText("Publicada")
  await cabinCard.getByRole("switch").click()
  await expect(cabinCard).toContainText("Oculta")
  await cabinCard.getByRole("switch").click()
  await expect(cabinCard).toContainText("Publicada")
  await cabinCard.getByRole("button", { name: "Archivar" }).click()
  await page.getByRole("button", { name: "Archivar cabaña" }).click()
  await expect(cabinCard).toHaveCount(0)

  const promotionName = `Promoción QA ${suffix}`
  await page.goto("/panel/promociones/nueva")
  await page.getByLabel("Nombre de la promoción").fill(promotionName)
  await page.getByLabel(/Descripción corta opcional/).fill("Promoción temporal para validar persistencia.")
  await page.getByLabel("Texto alternativo de la imagen").fill("Cabaña iluminada entre árboles")
  await page.getByLabel("Seleccionar imagen principal").setInputFiles(imagePath)
  await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Guardar borrador" }).click()
  await expect(page.getByRole("status")).toHaveText("La promoción se creó correctamente.")
  await expect(page).toHaveURL(/\/panel\/promociones\/(?!nueva(?:\?|$))[^?]+$/)
  await expect(page).not.toHaveURL(/created=1/)
  await page.reload()
  await expect(page.getByText("refugio-pino.png", { exact: true })).toBeVisible()
  await expect(page.getByText("La promoción se creó correctamente.", { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Publicar", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("El contenido ya está publicado.")
  await page.getByRole("button", { name: "Volver a promociones" }).click()
  const promotionCard = page.getByRole("article").filter({ hasText: promotionName })
  await expect(promotionCard).toContainText("Activa")
  await promotionCard.getByRole("button", { name: "Ocultar" }).click()
  await expect(promotionCard).toContainText("Oculta")
  await promotionCard.getByRole("button", { name: "Activar" }).click()
  await expect(promotionCard).toContainText("Activa")
  await promotionCard.getByRole("button", { name: "Eliminar" }).click()
  await page.getByRole("button", { name: "Eliminar promoción" }).click()
  await expect(promotionCard).toHaveCount(0)
})
