"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { CheckCircle2, ImagePlus, LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react"
import { preparePromotionImage, validatePromotionImage } from "@/lib/admin-promotions/image-processing"
import type { AdminPromotionImage } from "@/lib/admin-promotions/types"
import type { AdminSiteSettings, AdminSiteSettingsInput } from "@/lib/admin-settings/types"
import { saveSiteSettingsAction } from "@/app/panel/configuracion/actions"
import { ConfirmDialog } from "./confirm-dialog"

const controlClass = "mt-1.5 min-h-12 w-full appearance-auto rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:min-h-11 sm:text-sm"

async function apiUpload(dataUrl: string, originalName: string) {
  const resp = await fetch("/api/media/upload-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, originalName, scope: "settings" }),
  })
  return resp.json()
}

async function apiDiscard(assetIds: string[]) {
  if (assetIds.length === 0) return { ok: true }
  const resp = await fetch("/api/media/discard-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetIds }),
  })
  return resp.json()
}

function HeroImageField({
  image,
  onChange,
  error,
}: {
  image: AdminPromotionImage | null
  onChange: (image: AdminPromotionImage | null) => void
  error?: string
}) {
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
      const result = await apiUpload(prepared.url, prepared.name)
      if (!result.ok) {
        setUploadError(result.message)
        return
      }
      if (image?.pendingUpload && image.assetId) await apiDiscard([image.assetId])
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
    <section aria-labelledby="hero-image-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="hero-image-title" className="text-lg font-semibold text-foreground">Imagen principal de portada</h2>
          <p className="mt-1 text-sm text-muted-foreground">JPG, PNG o WebP de máximo 10 MB. Se mostrará en el encabezado de la página pública.</p>
        </div>
        <button type="button" disabled={processing} onClick={() => inputRef.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60">
          {processing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : image ? <RefreshCw className="size-4" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {processing ? "Subiendo…" : image ? "Reemplazar imagen" : "Seleccionar imagen"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Seleccionar imagen de portada" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </div>

      <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">La imagen se optimiza automáticamente para que la página cargue rápido.</p>
      {(error || uploadError) && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error || uploadError}</div>}

      {image ? (
        <article className="mt-5 overflow-hidden rounded-xl border border-border bg-background">
          <div className="relative aspect-[16/9] bg-secondary">
            <Image src={image.url} alt="Vista previa de la portada" fill unoptimized={image.url.startsWith("data:")} sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{image.name}</p><p className="text-xs text-muted-foreground">{Math.max(1, Math.round(image.size / 1024))} KB</p></div>
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden />Quitar</button>
          </div>
        </article>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 text-center text-foreground hover:bg-muted">
          <ImagePlus className="size-8 text-primary" aria-hidden /><span className="mt-3 text-sm font-semibold">Sube la imagen de portada</span><span className="mt-1 text-xs text-muted-foreground">Si no subes una, se usará la imagen por defecto.</span>
        </button>
      )}

      <ConfirmDialog open={confirmDelete} title="¿Quitar la imagen de portada?" description="La página usará la imagen por defecto al guardar los cambios." confirmLabel="Quitar imagen" onCancel={() => setConfirmDelete(false)} onConfirm={() => {
        if (image?.pendingUpload && image.assetId) {
          void apiDiscard([image.assetId]).then((result) => {
            if (!result.ok) setUploadError(result.message)
          })
        }
        onChange(null)
        setConfirmDelete(false)
      }} />
    </section>
  )
}

export function SettingsWorkspace({ settings }: { settings: AdminSiteSettings }) {
  const [form, setForm] = useState<AdminSiteSettingsInput>({
    businessName: settings.businessName,
    subtitle: settings.subtitle,
    tagline: settings.tagline,
    heroAssetId: settings.heroAssetId,
    whatsappNumber: settings.whatsappNumber,
    phoneDisplay: settings.phoneDisplay,
    email: settings.email,
    generalLocation: settings.generalLocation,
    businessHours: settings.businessHours,
    officeAddress: settings.officeAddress,
    officeMapsUrl: settings.officeMapsUrl,
  })
  const [heroImage, setHeroImage] = useState<AdminPromotionImage | null>(
    settings.heroImageUrl
      ? { assetId: settings.heroAssetId || settings.heroImageUrl, url: settings.heroImageUrl, name: "Portada actual", size: 0, type: "image/webp", pendingUpload: false }
      : null,
  )
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null)

  const update = <Key extends keyof AdminSiteSettingsInput>(key: Key, value: AdminSiteSettingsInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice(null)
  }

  const persist = async () => {
    setSaving(true)
    const result = await saveSiteSettingsAction({ ...form, heroAssetId: heroImage?.assetId ?? "" })
    setSaving(false)
    if (!result.ok) { setNotice({ tone: "error", message: result.message }); return }
    setForm((current) => ({ ...current, heroAssetId: heroImage?.assetId ?? "" }))
    setNotice({ tone: "success", message: result.message })
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-44 min-[360px]:pb-32 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Sitio público</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">Configuración</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Estos datos se muestran en la página pública: identidad, contacto y la ubicación de la oficina.</p>
        </div>
      </div>

      {notice && <div className={`mt-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${notice.tone === "success" ? "border-success/30 bg-success/10 text-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : null}<p>{notice.message}</p></div>}

      <form className="mt-6 space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Identidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">La marca que los visitantes ven en la página.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">Nombre del negocio<input value={form.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="Ej. DUPEZ" maxLength={80} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Eslogan o frase corta<input value={form.tagline} onChange={(event) => update("tagline", event.target.value)} placeholder="Ej. Respira el bosque. Vive la sierra." maxLength={120} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground sm:col-span-2">Descripción corta<textarea value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} placeholder="Una línea que describe lo que ofreces" maxLength={160} rows={2} className={`${controlClass} min-h-20 resize-y py-3`} /></label>
          </div>
        </section>

        <HeroImageField image={heroImage} onChange={(image) => { setHeroImage(image); setNotice(null) }} />

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Contacto</h2>
          <p className="mt-1 text-sm text-muted-foreground">Es el mismo dato que se usa en toda la página: portada, tarjetas y pié de página.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">WhatsApp (con 10 dígitos, prefijo +52)<input value={form.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} placeholder="Ej. 8444556929" inputMode="numeric" maxLength={20} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Teléfono visible<input value={form.phoneDisplay} onChange={(event) => update("phoneDisplay", event.target.value)} placeholder="Ej. 844 455 6929" maxLength={30} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Correo de contacto<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Ej. hola@dupez.mx" maxLength={120} className={controlClass} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Ubicación</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dónde está la oficina y cómo llegar.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">Ubicación general<input value={form.generalLocation} onChange={(event) => update("generalLocation", event.target.value)} placeholder="Ej. Arteaga, Coahuila, México" maxLength={120} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Horario de atención<input value={form.businessHours} onChange={(event) => update("businessHours", event.target.value)} placeholder="Ej. Lunes a domingo · 8:00 a 21:00 h" maxLength={80} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Dirección de la oficina<input value={form.officeAddress} onChange={(event) => update("officeAddress", event.target.value)} placeholder="Calle, número y localidad" maxLength={200} className={controlClass} /></label>
            <label className="text-sm font-medium text-foreground">Enlace de Google Maps (opcional)<input value={form.officeMapsUrl} onChange={(event) => update("officeMapsUrl", event.target.value)} placeholder="https://maps.app.goo.gl/..." maxLength={500} className={controlClass} /></label>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[360px]:gap-3">
            <button type="button" disabled={saving} onClick={() => void persist()} className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"><Save className="size-4 shrink-0" aria-hidden /><span className="truncate">{saving ? "Guardando…" : "Guardar cambios"}</span></button>
          </div>
        </div>
      </form>
    </main>
  )
}