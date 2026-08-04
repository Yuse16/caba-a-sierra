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

test("página pública, filtros, modal y consulta por WhatsApp", async ({ page }, testInfo) => {
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

  await page.getByRole("button", { name: "Consultar disponibilidad" }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Nombre").fill("Cliente QA")
  await dialog.getByLabel("Teléfono").fill("8441234567")
  await dialog.getByLabel("Huéspedes").fill("2")
  await dialog.getByRole("button", { name: "Consultar disponibilidad" }).click()
  await expect(dialog.getByText("Tu consulta está lista")).toBeVisible()
  await expect(dialog.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/528441234567\?text=/)
  await dialog.locator("button").filter({ hasText: /^Cerrar$/ }).click()
  await expect(dialog).toBeHidden()

  await expectNoHorizontalOverflow(page)
  expect(runtimeErrors).toEqual([])
})

test("modal cierra con Escape y el panel local sigue disponible solo en desarrollo", async ({ page }) => {
  const runtimeErrors = captureRuntimeErrors(page)
  await page.goto("/")
  await page.getByRole("button", { name: "Ver detalles" }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()

  await page.goto("/panel")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Cerrar sesión" }).first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  expect(runtimeErrors).toEqual([])
})
