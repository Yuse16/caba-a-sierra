import { expect, test, type Page } from "@playwright/test"

function captureRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.open = () => null
  })
})

test("página pública, filtros y datos de reservación", async ({ page }, testInfo) => {
  const runtimeErrors = captureRuntimeErrors(page)
  await page.goto("/")

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Cabañas para tu próxima pausa" })).toBeVisible()
  await expect(page.locator("#cabanas article")).toHaveCount(5)
  await expect(page.locator("body")).not.toContainText(/propietario|intermediario|seguimiento manual/i)

  if (testInfo.project.name === "desktop-chromium") {
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Cómo funciona" }).click()
  } else {
    await page.getByRole("button", { name: "Abrir menú" }).click()
    await expect(page.getByRole("navigation", { name: "Navegación móvil" })).toBeVisible()
    await page.getByRole("navigation", { name: "Navegación móvil" }).getByRole("link", { name: "Cómo funciona" }).click()
  }
  await expect(page).toHaveURL(/#como-reservar$/)
  await expect(page.getByRole("heading", { name: "Cómo reservar" })).toBeInViewport()
  await expect(page.locator("#como-reservar li")).toHaveCount(3)

  await page.getByRole("link", { name: "Ver cabañas" }).last().click()
  await expect(page).toHaveURL(/#cabanas$/)

  await page.getByRole("button", { name: "Para parejas" }).click()
  await expect(page.locator("#cabanas article")).toHaveCount(1)
  await page.getByRole("button", { name: "Todos" }).click()
  await expect(page.locator("#cabanas article")).toHaveCount(5)

  await page.getByLabel("Entrada").fill("2030-10-18")
  await page.getByLabel("Salida").fill("2030-10-21")
  await page.getByRole("button", { name: "Agregar huésped" }).click()

  await page.getByRole("button", { name: "Consultar disponibilidad" }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel("Entrada")).toHaveValue("2030-10-18")
  await expect(dialog.getByLabel("Salida")).toHaveValue("2030-10-21")
  await expect(dialog.getByLabel("Huéspedes")).toHaveValue("3")
  await dialog.getByRole("button", { name: "Cerrar" }).first().click()
  await expect(dialog).toBeHidden()

  await expectNoHorizontalOverflow(page)
  expect(runtimeErrors).toEqual([])
})

test("modal cierra con Escape y el panel permanece protegido sin sesión", async ({ page }) => {
  const runtimeErrors = captureRuntimeErrors(page)
  await page.goto("/")
  await page.getByRole("button", { name: "Ver detalles" }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()

  await page.goto("/panel")
  await expect(page).toHaveURL(/\/login\?next=%2Fpanel$/)
  await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible()
  await expect(page.locator("body")).not.toContainText(/Dashboard|Gestionar cabañas|Panel PRO/i)
  await expect(page.getByLabel("Contraseña")).toBeVisible()
  await expectNoHorizontalOverflow(page)
  expect(runtimeErrors).toEqual([])
})
