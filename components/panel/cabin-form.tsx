"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, EyeOff, Save, Send } from "lucide-react"
import {
  emptyAdminCabin,
  getMissingPublicationFields,
  publicationFieldLabels,
  type AdminCabin,
  type AdminCabinInput,
  type PublicationField,
} from "@/lib/admin-cabins/types"
import { useAdminCabins } from "./cabins-provider"
import { ConfirmDialog } from "./confirm-dialog"
import { ImageManager } from "./image-manager"
import { discardAdminMediaAction } from "@/app/panel/media/actions"

const controlClass =
  "mt-1.5 min-h-12 w-full appearance-auto rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:min-h-11 sm:text-sm"
const textareaClass = `${controlClass} min-h-28 resize-y py-3`

function toInput(cabin: AdminCabin): AdminCabinInput {
  return {
    name: cabin.name,
    shortDescription: cabin.shortDescription,
    description: cabin.description,
    nightlyPrice: cabin.nightlyPrice,
    maxGuests: cabin.maxGuests,
    bedrooms: cabin.bedrooms,
    beds: cabin.beds,
    bathrooms: cabin.bathrooms,
    services: [...cabin.services],
    rules: [...cabin.rules],
    checkInTime: cabin.checkInTime,
    checkOutTime: cabin.checkOutTime,
    acceptsPets: cabin.acceptsPets,
    location: cabin.location,
    whatsapp: cabin.whatsapp,
    status: cabin.status,
    images: cabin.images.map((image) => ({ ...image })),
  }
}

function parseLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1 block text-xs font-medium text-destructive">{message}</span> : null
}

function CabinForm({ cabin, created = false }: { cabin?: AdminCabin; created?: boolean }) {
  const router = useRouter()
  const { saveCabin } = useAdminCabins()
  const [form, setForm] = useState<AdminCabinInput>(() => cabin ? toInput(cabin) : { ...emptyAdminCabin, images: [] })
  const [servicesText, setServicesText] = useState(() => cabin?.services.join("\n") ?? "")
  const [rulesText, setRulesText] = useState(() => cabin?.rules.join("\n") ?? "")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<PublicationField, string>>>({})
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(created ? { tone: "success", message: "La cabaña se creó correctamente." } : null)
  const [confirmExit, setConfirmExit] = useState(false)

  useEffect(() => {
    if (!created) return
    window.history.replaceState(window.history.state, "", window.location.pathname)
  }, [created])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [dirty])

  const completeInput = useMemo<AdminCabinInput>(() => ({
    ...form,
    services: parseLines(servicesText),
    rules: parseLines(rulesText),
  }), [form, rulesText, servicesText])

  const update = <Key extends keyof AdminCabinInput>(key: Key, value: AdminCabinInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setErrors((current) => ({ ...current, [key]: undefined }))
    setNotice(null)
  }

  const validationErrors = (missing: PublicationField[]) =>
    Object.fromEntries(missing.map((field) => [field, `Falta completar: ${publicationFieldLabels[field]}.`])) as Partial<Record<PublicationField, string>>

  const persist = async (status: "draft" | "published") => {
    const input = { ...completeInput, status }
    const missing = getMissingPublicationFields(input)

    if (status === "published" && missing.length > 0) {
      setErrors(validationErrors(missing))
      setNotice({ tone: "error", message: `Faltan ${missing.length} ${missing.length === 1 ? "dato" : "datos"} antes de publicar.` })
      document.getElementById(`field-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSaving(true)
    const result = await saveCabin(input, cabin?.id)
    setSaving(false)

    if (!result.ok || !result.cabin) {
      setNotice({ tone: "error", message: result.message })
      return
    }

    setForm(toInput(result.cabin))
    setDirty(false)
    setErrors({})
    let nextNotice: { tone: "success" | "warning" | "error"; message: string }
    if (status === "draft" && missing.length > 0) {
      const labels = missing.slice(0, 4).map((field) => publicationFieldLabels[field]).join(", ")
      nextNotice = { tone: "warning", message: `Borrador guardado. Para publicar falta: ${labels}${missing.length > 4 ? " y otros datos" : ""}.` }
    } else {
      nextNotice = { tone: "success", message: result.message }
    }

    setNotice(nextNotice)
    if (!cabin) router.replace(`/panel/cabanas/${result.cabin.id}?created=1`)
  }

  const discardPendingUploads = async () => {
    const ids = form.images.flatMap((image) => image.pendingUpload && image.assetId ? [image.assetId] : [])
    if (ids.length) await discardAdminMediaAction(ids, "cabins")
  }

  const requestExit = () => {
    if (dirty) setConfirmExit(true)
    else void discardPendingUploads().finally(() => router.push("/panel/cabanas"))
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 sm:px-6 sm:py-8">
      <button type="button" onClick={requestExit} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-muted">
        <ArrowLeft className="size-4" aria-hidden />Volver a cabañas
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{cabin ? "Editar cabaña" : "Nueva cabaña"}</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">{cabin?.name || "Agrega una cabaña"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Puedes guardar un borrador aunque todavía falten datos.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${form.status === "published" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>
          {form.status === "published" ? "Publicada" : "Borrador"}
        </span>
      </div>

      {notice && (
        <div className={`mt-5 flex items-start gap-2 rounded-xl border p-4 text-sm ${notice.tone === "success" ? "border-success/30 bg-success/10 text-foreground" : notice.tone === "warning" ? "border-warning/40 bg-warning/10 text-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
          <p>{notice.message}</p>
        </div>
      )}

      <form className="mt-6 space-y-5 scroll-pb-40" onSubmit={(event) => event.preventDefault()} noValidate>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Información principal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estos datos ayudan a los clientes a entender rápidamente la opción.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label id="field-name" className="text-sm font-medium text-foreground sm:col-span-2">Nombre
              <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Cabaña Bosque Real" autoComplete="off" className={controlClass} aria-invalid={Boolean(errors.name)} />
              <FieldError message={errors.name} />
            </label>
            <label id="field-shortDescription" className="text-sm font-medium text-foreground sm:col-span-2">Descripción corta
              <input value={form.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} placeholder="Una frase breve para presentar la cabaña" maxLength={140} className={controlClass} aria-invalid={Boolean(errors.shortDescription)} />
              <span className="mt-1 block text-right text-xs text-muted-foreground">{form.shortDescription.length}/140</span>
              <FieldError message={errors.shortDescription} />
            </label>
            <label id="field-description" className="text-sm font-medium text-foreground sm:col-span-2">Descripción completa
              <textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe los espacios, el entorno y lo que hace especial a la cabaña" rows={5} className={textareaClass} aria-invalid={Boolean(errors.description)} />
              <FieldError message={errors.description} />
            </label>
            <label id="field-location" className="text-sm font-medium text-foreground sm:col-span-2">Ubicación o zona
              <input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Ej. Sierra de Arteaga, Coahuila" autoComplete="address-level2" className={controlClass} aria-invalid={Boolean(errors.location)} />
              <FieldError message={errors.location} />
            </label>
            <label id="field-nightlyPrice" className="text-sm font-medium text-foreground">Precio por noche
              <input type="number" inputMode="decimal" min={0} value={form.nightlyPrice || ""} onChange={(event) => update("nightlyPrice", Number(event.target.value))} placeholder="2800" className={controlClass} aria-invalid={Boolean(errors.nightlyPrice)} />
              <FieldError message={errors.nightlyPrice} />
            </label>
            <label id="field-whatsapp" className="text-sm font-medium text-foreground">Número de WhatsApp
              <input type="tel" inputMode="tel" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} placeholder="Número con lada internacional" autoComplete="tel" className={controlClass} aria-invalid={Boolean(errors.whatsapp)} />
              <span className="mt-1 block text-xs text-muted-foreground">Incluye clave de país y lada, sólo para contacto público.</span>
              <FieldError message={errors.whatsapp} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Capacidad y horarios</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["maxGuests", "Capacidad máxima"],
              ["bedrooms", "Habitaciones"],
              ["beds", "Camas"],
              ["bathrooms", "Baños"],
            ] as const).map(([field, label]) => (
              <label key={field} id={`field-${field}`} className="text-sm font-medium text-foreground">{label}
                <input type="number" inputMode="numeric" min={1} value={form[field] || ""} onChange={(event) => update(field, event.target.value === "" ? 0 : Number(event.target.value))} className={controlClass} aria-invalid={Boolean(errors[field])} />
                <FieldError message={errors[field]} />
              </label>
            ))}
            <label id="field-checkInTime" className="text-sm font-medium text-foreground">Horario de entrada
              <input type="time" value={form.checkInTime} onChange={(event) => update("checkInTime", event.target.value)} className={controlClass} aria-invalid={Boolean(errors.checkInTime)} />
              <FieldError message={errors.checkInTime} />
            </label>
            <label id="field-checkOutTime" className="text-sm font-medium text-foreground">Horario de salida
              <input type="time" value={form.checkOutTime} onChange={(event) => update("checkOutTime", event.target.value)} className={controlClass} aria-invalid={Boolean(errors.checkOutTime)} />
              <FieldError message={errors.checkOutTime} />
            </label>
          </div>
          <button type="button" role="switch" aria-checked={form.acceptsPets} onClick={() => update("acceptsPets", !form.acceptsPets)} className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted sm:max-w-md">
            <span>Acepta mascotas</span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${form.acceptsPets ? "bg-primary" : "bg-muted"}`} aria-hidden>
              <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-all duration-200 ${form.acceptsPets ? "left-[calc(100%-24px)]" : "left-1"}`} />
            </span>
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Servicios y reglas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Escribe un elemento por línea para que sea fácil de leer.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label id="field-services" className="text-sm font-medium text-foreground">Servicios
              <textarea value={servicesText} onChange={(event) => { setServicesText(event.target.value); setDirty(true); setErrors((current) => ({ ...current, services: undefined })) }} placeholder={"Chimenea\nWiFi\nAsador"} rows={5} className={textareaClass} aria-invalid={Boolean(errors.services)} />
              <FieldError message={errors.services} />
            </label>
            <label id="field-rules" className="text-sm font-medium text-foreground">Reglas
              <textarea value={rulesText} onChange={(event) => { setRulesText(event.target.value); setDirty(true); setErrors((current) => ({ ...current, rules: undefined })) }} placeholder={"No fumar dentro\nRespetar el horario de descanso"} rows={5} className={textareaClass} aria-invalid={Boolean(errors.rules)} />
              <FieldError message={errors.rules} />
            </label>
          </div>
        </section>

        <div id="field-images">
          <ImageManager images={form.images} onChange={(images) => update("images", images)} error={errors.images} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Estado</h2>
          <p className="mt-1 text-sm text-muted-foreground">Un borrador permanece oculto. Al publicar, la información queda lista para mostrarse a clientes cuando exista conexión con la página pública.</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/60 p-4">
            {form.status === "published" ? <Send className="size-5 text-success" aria-hidden /> : <EyeOff className="size-5 text-muted-foreground" aria-hidden />}
            <div><p className="text-sm font-semibold text-foreground">{form.status === "published" ? "Publicada" : "Borrador"}</p><p className="text-xs text-muted-foreground">Los botones inferiores cambian este estado al guardar.</p></div>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3">
            <button type="button" disabled={saving} onClick={() => void persist("draft")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">
              <Save className="size-4" aria-hidden />{saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button type="button" disabled={saving} onClick={() => void persist("published")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Send className="size-4" aria-hidden />Publicar
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmExit}
        title="¿Salir sin guardar?"
        description="Hay cambios que todavía no se han guardado. Si sales ahora, se perderán."
        confirmLabel="Salir sin guardar"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => void discardPendingUploads().finally(() => router.push("/panel/cabanas"))}
      />
    </main>
  )
}

export function NewCabinForm() {
  return <CabinForm />
}

export function EditCabinForm({ id, created = false }: { id: string; created?: boolean }) {
  const { ready, error, reload, findCabin } = useAdminCabins()
  const cabin = findCabin(id)

  if (!ready) {
    return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground" role="status">Preparando la cabaña…</p></main>
  }

  if (error) {
    return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center" role="alert"><p className="text-sm text-destructive">{error}</p><button type="button" onClick={() => void reload()} className="mt-5 min-h-12 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Reintentar</button></section></main>
  }

  if (!cabin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">No encontramos esta cabaña</h1>
          <p className="mt-2 text-sm text-muted-foreground">Puede que el enlace sea antiguo o que la información ya no esté disponible.</p>
          <button type="button" onClick={() => window.location.assign("/panel/cabanas")} className="mt-5 min-h-12 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">Volver a cabañas</button>
        </section>
      </main>
    )
  }

  return <CabinForm key={cabin.id} cabin={cabin} created={created} />
}
