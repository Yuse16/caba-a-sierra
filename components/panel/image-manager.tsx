"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react"
import {
  MAX_CABIN_IMAGES,
  prepareCabinImage,
  validateImageFiles,
} from "@/lib/admin-cabins/image-processing"
import type { AdminCabinImage } from "@/lib/admin-cabins/types"
import { discardAdminMediaAction, uploadAdminMediaAction } from "@/app/panel/media/actions"
import { ConfirmDialog } from "./confirm-dialog"

function readableSize(size: number) {
  if (size === 0) return "Imagen de demostración"
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function ImageManager({
  images,
  onChange,
  error,
}: {
  images: AdminCabinImage[]
  onChange: (images: AdminCabinImage[]) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<AdminCabinImage | null>(null)

  const handleFiles = async (files: File[]) => {
    const result = validateImageFiles(files, images.length)
    setUploadErrors(result.errors)
    if (result.valid.length === 0) return

    setProcessing(true)
    try {
      const prepared = await Promise.all(
        result.valid.map((file, index) => prepareCabinImage(file, images.length === 0 && index === 0)),
      )
      const uploaded: Array<{ image: AdminCabinImage } | { message: string }> = await Promise.all(prepared.map(async (image) => {
        const upload = await uploadAdminMediaAction({ dataUrl: image.url, originalName: image.name, scope: "cabins" })
        if (!upload.ok) return { message: `${image.name}: ${upload.message}` }
        return {
          image: {
            id: upload.data.assetId,
            assetId: upload.data.assetId,
            url: upload.data.url,
            name: upload.data.name,
            size: upload.data.size,
            type: upload.data.type,
            isCover: image.isCover,
            pendingUpload: upload.data.pendingUpload,
          } satisfies AdminCabinImage,
        }
      }))
      const successful = uploaded.flatMap((item) => "image" in item ? [item.image] : [])
      const failed = uploaded.flatMap((item) => "message" in item ? [item.message] : [])
      if (successful.length) onChange([...images, ...successful])
      if (failed.length) setUploadErrors((current) => [...current, ...failed])
    } catch {
      setUploadErrors((current) => [...current, "No pudimos preparar una de las imágenes. Intenta con otra fotografía."])
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const setCover = (id: string) => {
    onChange(images.map((image) => ({ ...image, isCover: image.id === id })))
  }

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= images.length) return
    const next = [...images]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    onChange(next)
  }

  const removePendingImage = () => {
    if (!pendingDelete) return
    if (pendingDelete.pendingUpload && pendingDelete.assetId) {
      void discardAdminMediaAction([pendingDelete.assetId], "cabins").then((result) => {
        if (!result.ok) setUploadErrors((current) => [...current, result.message])
      })
    }
    const remaining = images.filter((image) => image.id !== pendingDelete.id)
    if (pendingDelete.isCover && remaining.length > 0) remaining[0] = { ...remaining[0], isCover: true }
    onChange(remaining)
    setPendingDelete(null)
  }

  return (
    <section aria-labelledby="images-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="images-title" className="text-lg font-semibold text-foreground">Fotografías</h2>
          <p className="mt-1 text-sm text-muted-foreground">Agrega hasta {MAX_CABIN_IMAGES} imágenes JPG, PNG o WebP de máximo 5 MB.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing || images.length >= MAX_CABIN_IMAGES}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {processing ? "Subiendo…" : "Agregar imágenes"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Seleccionar imágenes"
          onChange={(event) => void handleFiles(Array.from(event.target.files ?? []))}
        />
      </div>

      <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Ajustamos el tamaño de las fotografías automáticamente cuando ayuda a que carguen más rápido.
      </p>

      {(error || uploadErrors.length > 0) && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error && <p>{error}</p>}
          {uploadErrors.map((message) => <p key={message}>{message}</p>)}
        </div>
      )}

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center text-foreground hover:bg-muted"
        >
          <ImagePlus className="size-8 text-primary" aria-hidden />
          <span className="mt-3 text-sm font-semibold">Selecciona las fotografías de la cabaña</span>
          <span className="mt-1 text-xs text-muted-foreground">La primera será la portada; podrás cambiarla después.</span>
        </button>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <article key={image.id} className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="relative aspect-[4/3]">
                <Image src={image.url} alt={`Vista previa de ${image.name}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                {image.isCover && <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Portada</span>}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-foreground">{image.name}</p>
                <p className="text-xs text-muted-foreground">{readableSize(image.size)}</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover ${image.name} a la izquierda`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-35">
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={`Mover ${image.name} a la derecha`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-35">
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setCover(image.id)} disabled={image.isCover} aria-label={`Usar ${image.name} como portada`} className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:bg-primary/10 disabled:text-primary">
                    <Star className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setPendingDelete(image)} aria-label={`Eliminar ${image.name}`} className="inline-flex size-11 items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="¿Eliminar esta fotografía?"
        description="La imagen dejará de formar parte de la cabaña. Las demás fotografías se conservarán."
        confirmLabel="Eliminar fotografía"
        onCancel={() => setPendingDelete(null)}
        onConfirm={removePendingImage}
      />
    </section>
  )
}
