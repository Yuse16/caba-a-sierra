import { describe, expect, it } from "vitest"
import { getPanelBackHref, panelNavigationLinks } from "@/lib/panel-navigation"

describe("navegación común del panel", () => {
  it("vuelve al listado desde alta/edición y al inicio desde secciones", () => {
    expect(getPanelBackHref("/panel/cabanas/nueva")).toBe("/panel/cabanas")
    expect(getPanelBackHref("/panel/cabanas/abc-123")).toBe("/panel/cabanas")
    expect(getPanelBackHref("/panel/promociones/abc-123")).toBe("/panel/promociones")
    expect(getPanelBackHref("/panel/solicitudes")).toBe("/panel")
    expect(getPanelBackHref("/panel/cabanas")).toBe("/panel")
    expect(getPanelBackHref("/panel")).toBe("/")
  })

  it("el menú de escritorio enlaza rutas reales del panel", () => {
    expect(panelNavigationLinks.map(link => link.href)).toEqual([
      "/panel", "/panel/cabanas", "/panel/promociones",
      "/panel/solicitudes", "/panel/clientes", "/panel/configuracion",
    ])
  })
})
