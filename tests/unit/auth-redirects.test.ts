import { describe, expect, it } from "vitest"
import { safeAuthCallbackRedirect, safePanelRedirect, configurationLoginUrl, isPanelRoute } from "@/lib/auth/redirects"

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

describe("configuración ausente: /panel bloqueado con error=configuration", () => {
  it("identifica las rutas privadas del panel", () => {
    expect(isPanelRoute("/panel")).toBe(true)
    expect(isPanelRoute("/panel/cabanas")).toBe(true)
    expect(isPanelRoute("/panel/solicitudes/123")).toBe(true)
    expect(isPanelRoute("/admin")).toBe(true)
    expect(isPanelRoute("/")).toBe(false)
    expect(isPanelRoute("/login")).toBe(false)
    expect(isPanelRoute("/panelista")).toBe(false)
  })

  it("redirige cualquier ruta privada a /login?error=configuration", () => {
    expect(configurationLoginUrl("/panel")).toBe("/login?error=configuration")
    expect(configurationLoginUrl("/panel/solicitudes")).toBe("/login?error=configuration")
    expect(configurationLoginUrl("/admin")).toBe("/login?error=configuration")
  })

  it("deja pasar las rutas públicas sin configuración", () => {
    expect(configurationLoginUrl("/")).toBeNull()
    expect(configurationLoginUrl("/login")).toBeNull()
    expect(configurationLoginUrl("/favicon.svg")).toBeNull()
  })
})
