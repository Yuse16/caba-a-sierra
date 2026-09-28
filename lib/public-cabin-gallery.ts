import type { PublicCabinImage } from "./public-cabins"

function isSafePublicImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true
  try {
    const url = new URL(value)
    return url.protocol === "https:" || (url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost"))
  } catch {
    return false
  }
}

export function parsePublicCabinGallery(value: unknown, coverUrl: string, cabinName: string): PublicCabinImage[] {
  const parsed = Array.isArray(value) ? value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    const url = typeof row.url === "string" ? row.url.trim() : ""
    if (!url || !isSafePublicImageUrl(url)) return []
    const position = typeof row.position === "number" && Number.isInteger(row.position) && row.position > 0 ? row.position : index + 1
    return [{
      id: typeof row.id === "string" && row.id ? row.id : `${index + 1}-${url}`,
      url,
      altText: typeof row.alt_text === "string" && row.alt_text.trim() ? row.alt_text.trim() : `Fotografía de ${cabinName}`,
      position,
      isCover: row.is_cover === true,
    } satisfies PublicCabinImage]
  }) : []

  const unique = [...new Map(parsed.map((image) => [image.url, image])).values()]
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  if (!unique.length) {
    return [{ id: `${cabinName}-cover`, url: isSafePublicImageUrl(coverUrl) ? coverUrl : "/placeholder.svg", altText: `Fotografía de ${cabinName}`, position: 1, isCover: true }]
  }

  const coverIndex = unique.findIndex((image) => image.isCover || image.url === coverUrl)
  const selectedCover = coverIndex >= 0 ? coverIndex : 0
  return unique.map((image, index) => ({ ...image, isCover: index === selectedCover }))
}
