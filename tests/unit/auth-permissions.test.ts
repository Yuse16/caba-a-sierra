import { describe, expect, it } from "vitest"
import { hasPermission } from "@/lib/auth/permissions"

describe("permisos administrativos", () => {
  it("permite al editor administrar contenido publicado", () => {
    expect(hasPermission("editor", "catalog.write")).toBe(true)
    expect(hasPermission("editor", "promotions.publish")).toBe(true)
  })

  it("impide al editor leer propietarios o eliminar contenido", () => {
    expect(hasPermission("editor", "owners.read_sensitive")).toBe(false)
    expect(hasPermission("editor", "content.delete")).toBe(false)
    expect(hasPermission("editor", "users.manage")).toBe(false)
  })

  it("reserva las capacidades sensibles al administrador", () => {
    expect(hasPermission("admin", "owners.read_sensitive")).toBe(true)
    expect(hasPermission("admin", "audit.read")).toBe(true)
    expect(hasPermission("admin", "settings.manage")).toBe(true)
  })
})
