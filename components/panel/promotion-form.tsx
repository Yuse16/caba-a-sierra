"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Save, Send } from "lucide-react"
import { emptyAdminPromotion, promotionStatusLabel, type AdminPromotion, type AdminPromotionInput, type AdminPromotionStatus } from "@/lib/admin-promotions/types"
import { getEffectivePromotionStatus } from "@/lib/admin-promotions/service"
import { validatePromotion, type PromotionField, type PromotionValidationErrors } from "@/lib/admin-promotions/validation"
import { PublicPromotionCard } from "@/components/promotions/public-promotion-card"
import { useAdminPromotions } from "./promotions-provider"
import { PromotionImageField } from "./promotion-image-field"
import { ConfirmDialog } from "./confirm-dialog"
import { discardAdminMediaAction } from "@/app/panel/media/actions"

const controlClass = "mt-1.5 min-h-12 w-full appearance-auto rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:min-h-11 sm:text-sm"
const textareaClass = `${controlClass} min-h-28 resize-y py-3`

function toInput(promotion: AdminPromotion): AdminPromotionInput {
  return {
    name: promotion.name,
    image: promotion.image ? { ...promotion.image } : null,
    shortDescription: promotion.shortDescription,
    imageAlt: promotion.imageAlt,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    status: promotion.status,
    order: promotion.order,
    ctaLabel: promotion.ctaLabel,
    href: promotion.href,
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1 block text-xs font-medium text-destructive">{message}</span> : null
}

function firstErrorField(errors: PromotionValidationErrors) {
  return Object.keys(errors)[0] as PromotionField | undefined
}

function PromotionForm({ promotion, created = false }: { promotion?: AdminPromotion; created?: boolean }) {
  const router = useRouter()
  const { promotions, savePromotion } = useAdminPromotions()
  const [form, setForm] = useState<AdminPromotionInput>(() => promotion ? toInput(promotion) : { ...emptyAdminPromotion, order: promotions.length + 1 })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<PromotionValidationErrors>({})
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(created ? { tone: "success", message: "La promoción se creó correctamente." } : null)
  const [confirmExit, setConfirmExit] = useState(false)

  useEffect(() => {
    if (!created) return
    window.history.replaceState(window.history.state, "", window.location.pathname)
  }, [created])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [dirty])

  const update = <Key extends keyof AdminPromotionInput>(key: Key, value: AdminPromotionInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setErrors((current) => ({ ...current, [key]: undefined }))
    setNotice(null)
  }

  const persist = async (mode: "draft" | "selected") => {
    const today = new Date().toISOString().slice(0, 10)
    if (mode === "selected" && form.status === "scheduled" && (!form.startDate || form.startDate <= today)) {
      const message = "Selecciona una fecha de inicio futura para programarla."
      setErrors((current) => ({ ...current, startDate: message }))
      setNotice({ tone: "error", message })
      document.getElementById("promotion-field-startDate")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    let status: AdminPromotionStatus = "draft"
    if (mode === "selected") {
      status = form.status === "hidden" ? "hidden" : form.startDate && form.startDate > today ? "scheduled" : "active"
    }
    const input = { ...form, status }
    const validationErrors = validatePromotion(input, mode === "selected" && status !== "hidden")
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const field = firstErrorField(validationErrors)
      setNotice({ tone: "error", message: validationErrors[field ?? "name"] ?? "Revisa los datos marcados." })
      if (field) document.getElementById(`promotion-field-${field}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSaving(true)
    const result = await savePromotion(input, promotion?.id)
    setSaving(false)
    if (!result.ok || !result.promotion) { setNotice({ tone: "error", message: result.message }); return }
    setForm(toInput(result.promotion))
    setDirty(false)
    setErrors({})
    const nextNotice = { tone: "success" as const, message: result.message }
    setNotice(nextNotice)
    if (!promotion) router.replace(`/panel/promociones/${result.promotion.id}?created=1`)
  }

  const discardPendingUpload = async () => {
    if (form.image?.pendingUpload && form.image.assetId) await discardAdminMediaAction([form.image.assetId], "promotions")
  }
  const requestExit = () => dirty ? setConfirmExit(true) : void discardPendingUpload().finally(() => router.push("/panel/promociones"))
  const effectiveStatus = promotion ? getEffectivePromotionStatus({ ...promotion, ...form }) : form.status
  const preview = form.image ? { id: promotion?.id ?? "preview", name: form.name || "Promoción sin nombre", imageUrl: form.image.url, imageAlt: form.imageAlt || "Vista previa de la promoción", shortDescription: form.shortDescription, ctaLabel: form.ctaLabel, href: form.href } : null
  const primaryLabel = form.status === "hidden" ? "Guardar oculta" : form.status === "scheduled" || form.startDate && form.startDate > new Date().toISOString().slice(0, 10) ? "Programar" : "Publicar"

  return (
    <main className="mx-auto min-w-0 w-full max-w-5xl px-4 py-5 pb-44 min-[360px]:pb-32 sm:px-6 sm:py-8">
      <button type="button" onClick={requestExit} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-muted"><ArrowLeft className="size-4" aria-hidden />Volver a promociones</button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">{promotion ? "Editar promoción" : "Nueva promoción"}</p><h1 className="mt-1 font-serif text-3xl font-bold text-foreground">{promotion?.name || "Sube una imagen y publícala"}</h1><p className="mt-2 text-sm text-muted-foreground">Puedes guardar un borrador aunque todavía falten datos.</p></div><span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">{promotionStatusLabel[effectiveStatus]}</span></div>

      {notice && <div className={`mt-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${notice.tone === "success" ? "border-success/30 bg-success/10 text-foreground" : notice.tone === "warning" ? "border-warning/40 bg-warning/10 text-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}<p>{notice.message}</p></div>}

      <form className="mt-6 space-y-5 scroll-pb-44" onSubmit={(event) => event.preventDefault()} noValidate>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Información básica</h2><p className="mt-1 text-sm text-muted-foreground">Sólo se mostrará esta información autorizada en la página pública.</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label id="promotion-field-name" className="text-sm font-medium text-foreground sm:col-span-2">Nombre de la promoción<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Escapada de otoño" maxLength={100} autoComplete="off" className={controlClass} aria-invalid={Boolean(errors.name)} /><FieldError message={errors.name} /></label>
          <label className="text-sm font-medium text-foreground sm:col-span-2">Descripción corta opcional<textarea value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} placeholder="Una frase breve para presentar la promoción" maxLength={180} rows={3} className={textareaClass} /><span className="mt-1 block text-right text-xs text-muted-foreground">{form.shortDescription.length}/180</span></label>
          <label id="promotion-field-imageAlt" className="text-sm font-medium text-foreground sm:col-span-2">Texto alternativo de la imagen<input value={form.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} placeholder="Describe lo que aparece en la imagen" maxLength={160} className={controlClass} aria-invalid={Boolean(errors.imageAlt)} /><FieldError message={errors.imageAlt} /></label>
        </div></section>

        <div id="promotion-field-image"><PromotionImageField image={form.image} onChange={(image) => update("image", image)} error={errors.image} /></div>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Fechas y publicación</h2><p className="mt-1 text-sm text-muted-foreground">Una fecha futura la programa automáticamente. Al terminar, aparecerá como vencida.</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label id="promotion-field-startDate" className="text-sm font-medium text-foreground">Fecha de inicio opcional<input type="date" value={form.startDate} max={form.endDate || undefined} onChange={(event) => update("startDate", event.target.value)} className={controlClass} aria-invalid={Boolean(errors.startDate)} /><FieldError message={errors.startDate} /></label>
          <label id="promotion-field-endDate" className="text-sm font-medium text-foreground">Fecha de finalización opcional<input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(event) => update("endDate", event.target.value)} className={controlClass} aria-invalid={Boolean(errors.endDate)} /><FieldError message={errors.endDate} /></label>
          <label className="text-sm font-medium text-foreground">Estado<select value={form.status === "expired" ? "active" : form.status} onChange={(event) => update("status", event.target.value as AdminPromotionStatus)} className={controlClass}><option value="draft">Borrador</option><option value="active">Activa</option><option value="scheduled">Programada</option><option value="hidden">Oculta</option></select></label>
          <label id="promotion-field-order" className="text-sm font-medium text-foreground">Orden de aparición<input type="number" inputMode="numeric" min={1} value={form.order} onChange={(event) => update("order", Number(event.target.value))} className={controlClass} aria-invalid={Boolean(errors.order)} /><FieldError message={errors.order} /></label>
        </div></section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Botón opcional</h2><p className="mt-1 text-sm text-muted-foreground">El botón sólo puede llevar a una sección pública disponible.</p><div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label id="promotion-field-ctaLabel" className="text-sm font-medium text-foreground">Texto del botón<input value={form.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} placeholder="Ej. Ver cabañas" maxLength={40} className={controlClass} aria-invalid={Boolean(errors.ctaLabel)} /><FieldError message={errors.ctaLabel} /></label>
          <label id="promotion-field-href" className="text-sm font-medium text-foreground">Destino<select value={form.href} onChange={(event) => update("href", event.target.value)} className={controlClass} aria-invalid={Boolean(errors.href)}><option value="">Sin enlace</option><option value="#cabanas">Cabañas</option><option value="#como-reservar">Cómo reservar</option><option value="#contacto">Contacto</option><option value="#inicio">Inicio</option></select><FieldError message={errors.href} /></label>
        </div></section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6"><div className="flex items-center gap-2"><Eye className="size-5 text-primary" aria-hidden /><h2 className="text-lg font-semibold text-foreground">Vista previa</h2></div><p className="mt-1 text-sm text-muted-foreground">Es el mismo diseño que verá el cliente.</p><div className="mt-5">{preview ? <PublicPromotionCard promotion={preview} preview /> : <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">Agrega una imagen para ver la promoción.</div>}</div></section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6"><div className="mx-auto grid max-w-5xl grid-cols-1 gap-2 min-[360px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[360px]:gap-3"><button type="button" disabled={saving} onClick={() => void persist("draft")} className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"><Save className="size-4 shrink-0" aria-hidden /><span className="truncate">{saving ? "Guardando…" : "Guardar borrador"}</span></button><button type="button" disabled={saving} onClick={() => void persist("selected")} className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{form.status === "hidden" ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Send className="size-4 shrink-0" aria-hidden />}<span className="truncate">{primaryLabel}</span></button></div></div>
      </form>

      <ConfirmDialog open={confirmExit} title="¿Salir sin guardar?" description="Hay cambios que todavía no se han guardado. Si sales ahora, se perderán." confirmLabel="Salir sin guardar" onCancel={() => setConfirmExit(false)} onConfirm={() => void discardPendingUpload().finally(() => router.push("/panel/promociones"))} />
    </main>
  )
}

export function NewPromotionForm() { return <PromotionForm /> }

export function EditPromotionForm({ id, created = false }: { id: string; created?: boolean }) {
  const { ready, error, reload, findPromotion } = useAdminPromotions()
  const promotion = findPromotion(id)
  if (!ready) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground" role="status">Preparando la promoción…</p></main>
  if (error) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center" role="alert"><p className="text-sm text-destructive">{error}</p><button type="button" onClick={() => void reload()} className="mt-5 min-h-12 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Reintentar</button></section></main>
  if (!promotion) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-border bg-card p-6 text-center"><h1 className="text-xl font-semibold text-foreground">No encontramos esta promoción</h1><p className="mt-2 text-sm text-muted-foreground">Puede que el enlace sea antiguo o que la promoción ya no exista.</p><button type="button" onClick={() => window.location.assign("/panel/promociones")} className="mt-5 min-h-12 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Volver a promociones</button></section></main>
  return <PromotionForm key={promotion.id} promotion={promotion} created={created} />
}
