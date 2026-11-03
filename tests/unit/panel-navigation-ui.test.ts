import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import {
  PanelDesktopMenuButton,
  PanelMobileBackLink,
  PanelNavigationProvider,
  PanelSubpageFrame,
} from "@/components/panel/panel-navigation"

vi.mock("next/navigation", () => ({
  usePathname: () => "/panel/cabanas",
}))

describe("controles de navegación del panel", () => {
  it("muestra la flecha de regreso y el menú plegable con etiquetas accesibles", () => {
    const html = renderToStaticMarkup(
      createElement(PanelNavigationProvider, null,
        createElement(PanelSubpageFrame, null,
          createElement(PanelMobileBackLink),
          createElement(PanelDesktopMenuButton),
        ),
      ),
    )

    expect(html).toContain('aria-label="Volver atrás"')
    expect(html).toContain('href="/panel"')
    expect(html).toContain('aria-label="Ocultar menú lateral"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-label="Menú lateral del panel"')
    expect(html).toContain('aria-current="page"')
  })
})
