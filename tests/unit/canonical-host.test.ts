import { describe, expect, it } from "vitest"
import { canonicalWwwRedirect } from "@/lib/routing/canonical-host"

describe("canonical www redirect", () => {
  it("redirige www.dupez.uk al dominio raíz preservando ruta y query", () => {
    expect(canonicalWwwRedirect("www.dupez.uk", "/login", "?next=%2Fpanel")).toBe(
      "https://dupez.uk/login?next=%2Fpanel",
    )
  })

  it.each(["dupez.uk", "panel.dupez.uk", "blueviolet-chicken-453176.hostingersite.com"])(
    "no redirige otros hosts: %s",
    (host) => {
      expect(canonicalWwwRedirect(host, "/", "")).toBeNull()
    },
  )
})
