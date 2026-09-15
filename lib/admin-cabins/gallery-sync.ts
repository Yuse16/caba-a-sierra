import type { AdminCabinImage } from "./types"

export type CabinImageSyncItem = {
  asset_id: string
  is_cover: boolean
  alt_text: string
}

export function buildCabinImageSyncPayload(images: AdminCabinImage[]): CabinImageSyncItem[] {
  const assetIds = images.map((image) => image.assetId).filter((assetId): assetId is string => Boolean(assetId))
  if (assetIds.length !== images.length || new Set(assetIds).size !== assetIds.length) {
    throw new Error("Las fotografías deben corresponder a archivos únicos y seguros.")
  }
  if (images.length > 0 && images.filter((image) => image.isCover).length !== 1) {
    throw new Error("Selecciona exactamente una fotografía de portada.")
  }
  return images.map((image) => ({
    asset_id: image.assetId as string,
    is_cover: image.isCover,
    alt_text: (image.altText?.trim() || image.name.trim()).slice(0, 300),
  }))
}
