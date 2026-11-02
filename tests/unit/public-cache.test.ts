import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = fileURLToPath(new URL("../..", import.meta.url))
const read = (relativePath: string) => readFileSync(`${root}/${relativePath}`, "utf8")

describe("public data cache invalidation", () => {
  it("caches public cabins and promotions with explicit tags", () => {
    const source = read("lib/public-content.server.ts")
    expect(source).toContain('unstable_cache')
    expect(source).toContain('tags: ["public-cabins"]')
    expect(source).toContain('tags: ["public-promotions"]')
  })

  it("caches public site settings with an explicit tag", () => {
    const source = read("lib/public-site-settings.server.ts")
    expect(source).toContain('unstable_cache')
    expect(source).toContain('tags: ["public-site-config"]')
  })

  it("invalidates cabin and promotion tags after admin mutations", () => {
    const cabins = read("app/panel/cabanas/actions.ts")
    const promotions = read("app/panel/promociones/actions.ts")
    expect(cabins).toContain('revalidateTag("public-cabins", "max")')
    expect(promotions).toContain('revalidateTag("public-promotions", "max")')
  })
})
