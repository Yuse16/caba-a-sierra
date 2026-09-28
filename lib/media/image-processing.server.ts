import "server-only"

import { createHash } from "node:crypto"
import { MAX_MEDIA_DIMENSION, MAX_MEDIA_PIXELS, validateImageEnvelope } from "./image-validation"

export type ProcessedImage = {
  bytes: Buffer
  mime: "image/jpeg" | "image/png" | "image/webp"
  extension: "jpg" | "png" | "webp"
  width: number
  height: number
  sha256: string
}

function readUInt16BE(bytes: Buffer, offset: number) {
  return bytes.readUInt16BE(offset)
}

function readUInt24LE(bytes: Buffer, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function imageDimensions(bytes: Buffer, mime: ProcessedImage["mime"]): { width: number; height: number } | null {
  try {
    if (mime === "image/png") {
      return bytes.length >= 24 ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : null
    }
    if (mime === "image/jpeg") {
      let offset = 2
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) { offset += 1; continue }
        const marker = bytes[offset + 1]
        if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue }
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
          return { height: readUInt16BE(bytes, offset + 5), width: readUInt16BE(bytes, offset + 7) }
        }
        const segmentLength = readUInt16BE(bytes, offset + 2)
        if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) return null
        offset += 2 + segmentLength
      }
      return null
    }
    if (bytes.length < 30) return null
    const variant = bytes.toString("ascii", 12, 16)
    if (variant === "VP8X") return { width: 1 + readUInt24LE(bytes, 24), height: 1 + readUInt24LE(bytes, 27) }
    if (variant === "VP8L") {
      const bits = bytes.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (variant === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
    return null
  } catch {
    return null
  }
}

export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  const source = Buffer.from(await file.arrayBuffer())
  const envelope = validateImageEnvelope({ name: file.name, type: file.type, size: file.size, bytes: source })
  const dimensions = imageDimensions(source, envelope.mime)
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width * dimensions.height > MAX_MEDIA_PIXELS) {
    throw new Error("La imagen tiene dimensiones no permitidas.")
  }
  if (dimensions.width > MAX_MEDIA_DIMENSION || dimensions.height > MAX_MEDIA_DIMENSION) {
    throw new Error("La imagen no pudo optimizarse al tamaño permitido. Intenta con otra fotografía.")
  }
  return {
    bytes: source,
    mime: envelope.mime,
    extension: envelope.mime === "image/png" ? "png" : envelope.mime === "image/webp" ? "webp" : "jpg",
    width: dimensions.width,
    height: dimensions.height,
    sha256: createHash("sha256").update(source).digest("hex"),
  }
}
