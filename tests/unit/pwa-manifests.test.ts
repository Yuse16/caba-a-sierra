import { describe, expect, it } from "vitest"
import { GET as getPublicManifest } from "@/app/manifest.webmanifest/route"
import { GET as getPanelManifest } from "@/app/panel/manifest.webmanifest/route"

describe("PWA manifests", () => {
  it("mantiene la PWA pública independiente", async () => {
    const request = new Request("https://dupez.uk/manifest.webmanifest", { headers: { host: "dupez.uk" } })
    const response = getPublicManifest(request as never)
    const manifest = await response.json()
    expect(manifest.id).toBe("dupez-public")
    expect(manifest.start_url).toBe("/")
    expect(manifest.scope).toBe("/")
  })

  it("la PWA del panel arranca en /panel y conserva login dentro del scope", async () => {
    const response = getPanelManifest()
    const manifest = await response.json()
    expect(manifest.id).toBe("dupez-panel")
    expect(manifest.start_url).toBe("/panel")
    expect(manifest.scope).toBe("/")
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/panel-icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/panel-icon-512.png", sizes: "512x512" }),
    ]))
  })
})
