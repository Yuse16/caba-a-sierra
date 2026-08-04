"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react"
import { preparePromotionImage, validatePromotionImage } from "@/lib/admin-promotions/image-processing"
import type { AdminPromotionImage } from "@/lib/admin-promotions/types"
import { discardAdminMediaAction, uploadAdminMediaAction } from "@/app/panel/media/actions"
import { ConfirmDialog } from "./confirm-dialog"

function readableSize(size: number) {
  if (size === 0) return "Imagen incluida"
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function PromotionImageField({ image, onChange, error }: { image: AdminPromotionImage | null; onChange: (image: AdminPromotionImage | null) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const selectFile = async (file?: File) => {
    if (!file) return
    const validationError = validatePromotionImage(file)
    setUploadError(validationError)
    if (validationError) return
    setProcessing(true)
    try {
      const prepared = await preparePromotionImage(file)
      const result = await uploadAdminMediaAction({ dataUrl: prepared.url, originalName: prepared.name, scope: "promotions" })
      if (!result.ok) {
        setUploadError(result.message)
        return
      }
      if (image?.pendingUpload && image.assetId) await discardAdminMediaAction([image.assetId], "promotions")
      onChange({
        assetId: result.data.assetId,
        url: result.data.url,
        name: result.data.name,
        size: result.data.size,
        type: result.data.type,
        pendingUpload: result.data.pendingUpload,
      })
      setUploadError(null)
    } catch {
      setUploadError("No pudimos preparar la imagen. Intenta con otro archivo.")
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <section aria-labelledby="promotion-image-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="promotion-image-title" className="text-lg font-semibold text-foreground">Imagen principal</h2>
          <p className="mt-1 text-sm text-muted-foreground">JPG, PNG o WebP de máximo 5 MB. Recomendado: 1600 × 900 px.</p>
        </div>
        <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
          {processing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : image ? <RefreshCw className="size-4" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {processing ? "Subiendo…" : image ? "Reemplazar imagen" : "Seleccionar imagen"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Seleccionar imagen principal" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </div>

      <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">La convertimos a WebP únicamente cuando el archivo resultante pesa menos. La proporción original se conserva.</p>
      {(error || uploadError) && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error || uploadError}</div>}

      {image ? (
        <article className="mt-5 overflow-hidden rounded-xl border border-border bg-background">
          <div className="relative aspect-[16/9] bg-secondary">
            <Image src={image.url} alt="Vista previa de la promoción" fill unoptimized={image.url.startsWith("data:")} sizes="(max-width: 768px) 100vw, 800px" className="object-contain" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{image.name}</p><p className="text-xs text-muted-foreground">{readableSize(image.size)} · {image.type || "imagen"}</p></div>
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden />Eliminar</button>
          </div>
        </article>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center text-foreground hover:bg-muted">
          <ImagePlus className="size-8 text-primary" aria-hidden /><span className="mt-3 text-sm font-semibold">Sube la imagen de la promoción</span><span className="mt-1 text-xs text-muted-foreground">La vista previa aparecerá aquí.</span>
        </button>
      )}

      <ConfirmDialog open={confirmDelete} title="¿Eliminar esta imagen?" description="La promoción conservará sus demás datos, pero no podrá publicarse sin una imagen." confirmLabel="Eliminar imagen" onCancel={() => setConfirmDelete(false)} onConfirm={() => {
        if (image?.pendingUpload && image.assetId) {
          void discardAdminMediaAction([image.assetId], "promotions").then((result) => {
            if (!result.ok) setUploadError(result.message)
          })
        }
        onChange(null)
        setConfirmDelete(false)
      }} />
    </section>
  )
}
