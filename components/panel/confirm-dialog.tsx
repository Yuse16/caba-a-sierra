"use client"

import { AlertTriangle, X } from "lucide-react"

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <section className="w-full max-w-md rounded-t-2xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-card-foreground shadow-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted" aria-label="Cerrar">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="min-h-12 rounded-lg bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
