import { describe, expect, it } from "vitest"
import { safeAuthCallbackRedirect, safePanelRedirect } from "@/lib/auth/redirects"

describe("redirecciones de autenticación", () => {
  it("acepta únicamente rutas internas del panel", () => {
    expect(safePanelRedirect("/panel/promociones?estado=active")).toBe("/panel/promociones?estado=active")
  })

  it.each(["https://evil.example", "//evil.example/panel", "/login", "javascript:alert(1)", null])("rechaza destinos externos o ajenos: %s", (value) => {
    expect(safePanelRedirect(value)).toBe("/panel")
  })

  it("permite la ruta exacta de actualización de contraseña en el callback PKCE", () => {
    expect(safeAuthCallbackRedirect("/actualizar-contrasena")).toBe("/actualizar-contrasena")
  })

  it.each(["/actualizar-contrasena/falsa", "/login", "//evil.example", "https://evil.example"])('rechaza callback no autorizado: %s', (value) => {
    expect(safeAuthCallbackRedirect(value)).toBe("/panel")
  })
})
