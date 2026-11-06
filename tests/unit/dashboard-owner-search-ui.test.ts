import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DashboardOwnerSearch } from "@/components/admin/dashboard-owner-search"
import type { Cabin, Owner } from "@/lib/demo-data"

describe("barra de propietarios del dashboard", () => {
  it("muestra un campo visible y accesible en el dashboard, sin exponer contactos por defecto", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardOwnerSearch, {
        owners: [{
          id: "secret", name: "Contacto privado", phone: "8441234567",
          whatsapp: "", notes: "", email: "", agreedCommission: 0,
          lastContact: "", preferredContactMethod: "Llamada",
        } satisfies Owner],
        cabins: [] as Cabin[],
      }),
    )
    expect(html).toContain("Buscar propietarios")
    expect(html).toContain('aria-label="Buscar propietario y sus cabañas"')
    expect(html).toContain('type="search"')
    expect(html).not.toContain("Contacto privado")
    expect(html).not.toContain("8441234567")
  })
})
