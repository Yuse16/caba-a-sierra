"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Archive, Bed, Edit3, Eye, MapPin, Plus, RefreshCw, Users, X } from "lucide-react"
import { formatCurrency as currency } from "@/lib/admin-presentational"
import type { AdminCabin } from "@/lib/admin-cabins/types"
import { useAdminCabins } from "./cabins-provider"
import { usePanelSession } from "@/components/auth/panel-session-provider"
import { ConfirmDialog } from "./confirm-dialog"

function coverFor(cabin: AdminCabin) {
  return cabin.images.find((image) => image.isCover) ?? cabin.images[0]
}

function CabinPreview({ cabin, onClose }: { cabin: AdminCabin; onClose: () => void }) {
  const cover = coverFor(cabin)
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Vista previa de ${cabin.name}`}>
      <article className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] text-card-foreground shadow-xl sm:max-h-[92vh] sm:rounded-2xl sm:pb-0">
        <div className="relative aspect-[16/9] bg-muted">
          {cover ? <Image src={cover.url} alt={`Portada de ${cabin.name}`} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover sm:rounded-t-2xl" /> : null}
          <button type="button" onClick={onClose} aria-label="Cerrar vista previa" className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm hover:bg-background">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vista previa</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">{cabin.name || "Cabaña sin nombre"}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden />{cabin.location || "Ubicación pendiente"}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{cabin.status === "published" ? "Publicada" : "Oculta"}</span>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{cabin.shortDescription || "Agrega una descripción corta para presentar esta cabaña."}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-secondary/60 p-3 text-center">
            <div><Users className="mx-auto size-5 text-primary" aria-hidden /><p className="mt-1 font-semibold">{cabin.maxGuests}</p><p className="text-xs text-muted-foreground">Huéspedes</p></div>
            <div><Bed className="mx-auto size-5 text-primary" aria-hidden /><p className="mt-1 font-semibold">{cabin.beds}</p><p className="text-xs text-muted-foreground">Camas</p></div>
            <div><p className="text-xl font-semibold text-primary">${currency(cabin.nightlyPrice)}</p><p className="text-xs text-muted-foreground">Por noche</p></div>
          </div>
          <button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Cerrar vista previa</button>
        </div>
      </article>
    </div>
  )
}

export function CabinsList() {
  const session = usePanelSession()
  const { cabins, ready, error, reload, setCabinStatus, archiveCabin } = useAdminCabins()
  const [preview, setPreview] = useState<AdminCabin | null>(null)
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [pendingArchive, setPendingArchive] = useState<AdminCabin | null>(null)

  const changeStatus = async (cabin: AdminCabin) => {
    setChangingId(cabin.id)
    const result = await setCabinStatus(cabin.id, cabin.status === "published" ? "draft" : "published")
    setChangingId(null)
    setNotice({ tone: result.ok ? "success" : "error", message: result.message })
    window.setTimeout(() => setNotice(null), 3500)
  }

  const archive = async () => {
    if (!pendingArchive) return
    setChangingId(pendingArchive.id)
    const result = await archiveCabin(pendingArchive.id)
    setChangingId(null)
    setPendingArchive(null)
    setNotice({ tone: result.ok ? "success" : "error", message: result.message })
    window.setTimeout(() => setNotice(null), 3500)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-20 sm:px-6 sm:py-8">
      {notice && (
        <div className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm font-medium shadow-xl ${notice.tone === "success" ? "bg-forest-dark text-primary-foreground" : "bg-destructive text-white"}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.message}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Administración de cabañas</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">Tus cabañas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Edita la información, revisa cómo se verá y decide cuáles cabañas estarán publicadas.</p>
        </div>
        <Link href="/panel/cabanas/nueva" className="hidden min-h-12 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:inline-flex">
          <Plus className="size-4" aria-hidden />Nueva cabaña
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-secondary px-3 py-1.5 text-secondary-foreground">{cabins.length} cabañas</span>
        <span className="rounded-full bg-success/12 px-3 py-1.5 text-success">{cabins.filter((cabin) => cabin.status === "published").length} publicadas</span>
        <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">{cabins.filter((cabin) => cabin.status === "draft").length} ocultas</span>
      </div>

      <div className="mt-5 space-y-4">
        {!ready && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground" role="status">Cargando cabañas…</div>}
        {ready && error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5" role="alert"><p className="text-sm text-destructive">{error}</p><button type="button" onClick={() => void reload()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"><RefreshCw className="size-4" aria-hidden />Reintentar</button></div>}
        {ready && !error && cabins.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><p className="font-semibold text-foreground">Todavía no hay cabañas</p><p className="mt-1 text-sm text-muted-foreground">Crea la primera cabaña para comenzar.</p></div>}
        {ready && !error && cabins.map((cabin, index) => {
          const cover = coverFor(cabin)
          const published = cabin.status === "published"
          return (
            <article key={cabin.id} className="grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted md:aspect-square">
                {cover ? <Image src={cover.url} alt={`Portada de ${cabin.name}`} fill sizes="112px" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className="object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-foreground">{cabin.name || "Cabaña sin nombre"}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>{published ? "Publicada" : "Oculta"}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{cabin.location || "Ubicación pendiente"}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground">
                  <span className="font-semibold">${currency(cabin.nightlyPrice)} MXN <span className="font-normal text-muted-foreground">por noche</span></span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="size-4" aria-hidden />Hasta {cabin.maxGuests} personas</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:min-w-56">
                <Link href={`/panel/cabanas/${cabin.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted">
                  <Edit3 className="size-4" aria-hidden />Editar
                </Link>
                <button type="button" onClick={() => setPreview(cabin)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted">
                  <Eye className="size-4" aria-hidden />Vista previa
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  aria-label={`${published ? "Ocultar" : "Publicar"} ${cabin.name}`}
                  disabled={changingId === cabin.id}
                  onClick={() => void changeStatus(cabin)}
                  className="col-span-2 flex min-h-12 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  <span>{changingId === cabin.id ? "Guardando…" : published ? "Visible para clientes" : "Oculta para clientes"}</span>
                  <span className={`relative h-7 w-12 rounded-full transition-colors ${published ? "bg-primary" : "bg-muted"}`} aria-hidden>
                    <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${published ? "translate-x-6" : "translate-x-1"}`} />
                  </span>
                </button>
                {session.role === "admin" && (
                  <button type="button" disabled={changingId === cabin.id} onClick={() => setPendingArchive(cabin)} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60">
                    <Archive className="size-4" aria-hidden />Archivar
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {preview && <CabinPreview cabin={preview} onClose={() => setPreview(null)} />}
      <ConfirmDialog open={pendingArchive !== null} title="¿Archivar esta cabaña?" description="La cabaña dejará de aparecer en el panel y en la página pública. Sus datos se conservarán para auditoría." confirmLabel="Archivar cabaña" onCancel={() => setPendingArchive(null)} onConfirm={() => void archive()} />
    </main>
  )
}
