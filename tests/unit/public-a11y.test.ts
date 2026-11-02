import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = fileURLToPath(new URL("../..", import.meta.url))
const read = (relativePath: string) => readFileSync(`${root}/${relativePath}`, "utf8")

describe("public accessibility regressions", () => {
  it("keeps the visible DUPEZ brand text inside the accessible name of home links", () => {
    const header = read("components/client/public-header.tsx")
    const footer = read("components/client/footer.tsx")

    expect(header).not.toContain('aria-label={`${businessName}, ir al inicio`}')
    expect(footer).not.toContain('aria-label={`${settings.businessName}, volver al inicio`}')
  })

  it("keeps step numbers above the WCAG large-text contrast threshold", () => {
    const clientPage = read("components/client/client-page.tsx")

    expect(clientPage).not.toContain("text-gold-foreground/45")
    expect(clientPage).toContain("text-gold-foreground/60")
  })
})
