export type AdminMediaScope = "cabins" | "promotions" | "settings"

export type AdminMediaUploadInput = {
  dataUrl: string
  originalName: string
  scope: AdminMediaScope
}

export type AdminMediaUpload = {
  assetId: string
  url: string
  name: string
  size: number
  type: "image/jpeg" | "image/png" | "image/webp"
  width: number
  height: number
  pendingUpload: boolean
}
