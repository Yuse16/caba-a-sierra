"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, CalendarDays, Edit3, Eye, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { getEffectivePromotionStatus } from "@/lib/admin-promotions/service"
import { promotionStatusLabel, type AdminPromotion, type AdminPromotionStatus } from "@/lib/admin-promotions/types"
import { usePanelSession } from "@/components/auth/panel-session-provider"
import { useAdminPromotions } from "./promotions-provider"
import { ConfirmDialog } from "./confirm-dialog"
import { PromotionPreviewDialog } from "./promotion-preview-dialog"

const statusTone: Record<AdminPromotionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-warning/20 text-[oklch(0.45_0.09_75)]",
  active: "bg-success/12 text-success",
  expired: "bg-destructive/10 text-destructive",
  hidden: "bg-secondary text-secondary-foreground",
}

function dateLabel(value: string) {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
}

export function PromotionsList() {
  const session = usePanelSession()
  const { promotions, ready, error, reload, setPromotionStatus, deletePromotion, movePromotion } = useAdminPromotions()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | AdminPromotionStatus>("all")
  const [preview, setPreview] = useState<AdminPromotion | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminPromotion | null>(null)
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => promotions.filter((promotion) => {
    const effective = getEffectivePromotionStatus(promotion)
    return (filter === "all" || effective === filter) && promotion.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))
  }), [filter, promotions, query])

  const showResult = (ok: boolean, message: string) => {
    setNotice({ tone: ok ? "success" : "error", message })
    window.setTimeout(() => setNotice(null), 3500)
  }

  const toggle = async (promotion: AdminPromotion) => {
    const effective = getEffectivePromotionStatus(promotion)
    setBusyId(promotion.id)
    const result = await setPromotionStatus(promotion.id, effective === "active" ? "hidden" : "active")
    setBusyId(null)
    showResult(result.ok, result.message)
  }

  const move = async (promotion: AdminPromotion, direction: -1 | 1) => {
    setBusyId(promotion.id)
    const result = await movePromotion(promotion.id, direction)
    setBusyId(null)
    showResult(result.ok, result.message)
  }

  const remove = async () => {
    if (!pendingDelete) return
    const result = await deletePromotion(pendingDelete.id)
    setPendingDelete(null)
    showResult(result.ok, result.message)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
      {notice && <div className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm font-medium shadow-xl ${notice.tone === "success" ? "bg-forest-dark text-white" : "bg-destructive text-white"}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.message}</div>}

      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Contenido de la página</p><h1 className="mt-1 font-serif text-3xl font-bold text-foreground">Promociones</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Sube una imagen, agrega la información básica y decide cuándo mostrarla.</p></div><Link href="/panel/promociones/nueva" className="hidden min-h-12 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:inline-flex"><Plus className="size-4" aria-hidden />Nueva promoción</Link></div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-4">
        <label className="relative"><span className="sr-only">Buscar por nombre</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre" className="min-h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
        <label><span className="sr-only">Filtrar por estado</span><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none [color-scheme:light] focus:border-ring focus:ring-2 focus:ring-ring/20"><option value="all">Todos los estados</option>{Object.entries(promotionStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>

      <div className="mt-5 space-y-4">
        {!ready && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground" role="status">Cargando promociones…</div>}
        {ready && error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5" role="alert"><p className="text-sm text-destructive">{error}</p><button type="button" onClick={() => void reload()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"><RefreshCw className="size-4" aria-hidden />Reintentar</button></div>}
        {ready && !error && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><p className="font-semibold text-foreground">No encontramos promociones</p><p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre o estado.</p></div>}
        {ready && !error && filtered.map((promotion) => {
          const status = getEffectivePromotionStatus(promotion)
          const index = promotions.findIndex((item) => item.id === promotion.id)
          return <article key={promotion.id} className="grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:grid-cols-[180px_minmax(0,1fr)_280px] lg:items-center">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-secondary">{promotion.image && <Image src={promotion.image.url} alt={promotion.imageAlt || `Imagen de ${promotion.name}`} fill loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} unoptimized={promotion.image.url.startsWith("data:")} sizes="180px" className="object-cover" />}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold text-foreground">{promotion.name || "Promoción sin nombre"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>{promotionStatusLabel[status]}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{promotion.shortDescription || "Sin descripción breve"}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{dateLabel(promotion.startDate)} – {promotion.endDate ? dateLabel(promotion.endDate) : "Sin finalización"}</span><span>Orden {promotion.order}</span></div></div>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/panel/promociones/${promotion.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"><Edit3 className="size-4" aria-hidden />Editar</Link>
              <button type="button" onClick={() => setPreview(promotion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"><Eye className="size-4" aria-hidden />Vista previa</button>
              <button type="button" disabled={index === 0 || busyId === promotion.id} onClick={() => void move(promotion, -1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-35"><ArrowUp className="size-4" aria-hidden />Subir</button>
              <button type="button" disabled={index === promotions.length - 1 || busyId === promotion.id} onClick={() => void move(promotion, 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-35"><ArrowDown className="size-4" aria-hidden />Bajar</button>
              <button type="button" disabled={busyId === promotion.id || status === "expired"} onClick={() => void toggle(promotion)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-45">{status === "active" ? "Ocultar" : status === "expired" ? "Edita las fechas" : "Activar"}</button>
              {session.role === "admin" && <button type="button" onClick={() => setPendingDelete(promotion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden />Eliminar</button>}
            </div>
          </article>
        })}
      </div>

      <Link href="/panel/promociones/nueva" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xl hover:bg-primary/90 sm:hidden"><Plus className="size-4" aria-hidden />Nueva promoción</Link>
      <PromotionPreviewDialog promotion={preview} onClose={() => setPreview(null)} />
      <ConfirmDialog open={pendingDelete !== null} title="¿Eliminar esta promoción?" description="La promoción y su imagen se eliminarán. Esta acción no se puede deshacer." confirmLabel="Eliminar promoción" onCancel={() => setPendingDelete(null)} onConfirm={() => void remove()} />
    </main>
  )
}
