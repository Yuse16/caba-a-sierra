import { describe, expect, it } from "vitest"
import { buildCabinImageSyncPayload } from "@/lib/admin-cabins/gallery-sync"
import { parsePublicCabinGallery } from "@/lib/public-cabin-gallery"
import type { AdminCabinImage } from "@/lib/admin-cabins/types"

function image(assetId: string, isCover = false): AdminCabinImage {
  return { id: assetId, assetId, url: `https://images.test/${assetId}.webp`, name: `${assetId}.webp`, size: 100, type: "image/webp", isCover, altText: `Vista ${assetId}` }
}

describe("contrato de galería de cabañas", () => {
  it("conserva tres assets, orden y una sola portada al sincronizar", () => {
    const payload = buildCabinImageSyncPayload([image("a"), image("b", true), image("c")])
    expect(payload.map((item) => item.asset_id)).toEqual(["a", "b", "c"])
    expect(payload.filter((item) => item.is_cover)).toEqual([expect.objectContaining({ asset_id: "b" })])
  })

  it("cambiar portada, eliminar y agregar no descarta las imágenes restantes", () => {
    const original = [image("a", true), image("b"), image("c")]
    const changedCover = original.map((item) => ({ ...item, isCover: item.assetId === "c" }))
    expect(buildCabinImageSyncPayload(changedCover)).toHaveLength(3)
    const removed = changedCover.filter((item) => item.assetId !== "b")
    expect(buildCabinImageSyncPayload(removed).map((item) => item.asset_id)).toEqual(["a", "c"])
    const restored = [...removed, image("d")]
    expect(buildCabinImageSyncPayload(restored).map((item) => item.asset_id)).toEqual(["a", "c", "d"])
  })

  it("rechaza assets duplicados o múltiples portadas", () => {
    expect(() => buildCabinImageSyncPayload([image("a", true), image("a")])).toThrow(/únicos/)
    expect(() => buildCabinImageSyncPayload([image("a", true), image("b", true)])).toThrow(/exactamente una/)
  })

  it("mapea toda la galería pública y conserva la portada", () => {
    const gallery = parsePublicCabinGallery([
      { id: "one", url: "https://images.test/a.webp", alt_text: "Exterior", position: 2, is_cover: false },
      { id: "two", url: "https://images.test/b.webp", alt_text: "Interior", position: 1, is_cover: true },
      { id: "three", url: "https://images.test/c.webp", alt_text: "Terraza", position: 3, is_cover: false },
    ], "https://images.test/b.webp", "Cabaña Pino")
    expect(gallery).toHaveLength(3)
    expect(gallery.map((item) => item.id)).toEqual(["two", "one", "three"])
    expect(gallery.filter((item) => item.isCover)).toEqual([expect.objectContaining({ id: "two" })])
  })

  it("rechaza URLs públicas inseguras y conserva soporte para Supabase local", () => {
    const gallery = parsePublicCabinGallery([
      { id: "unsafe", url: "//evil.example/image.webp", position: 1, is_cover: true },
      { id: "http", url: "http://evil.example/image.webp", position: 2, is_cover: false },
      { id: "local", url: "http://127.0.0.1:54321/storage/v1/object/public/public-media/image.webp", position: 3, is_cover: false },
    ], "//evil.example/cover.webp", "Cabaña segura")
    expect(gallery).toHaveLength(1)
    expect(gallery[0]).toEqual(expect.objectContaining({ id: "local", isCover: true }))
  })
})
