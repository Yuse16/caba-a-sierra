"use client"

import { Mountain, LogOut, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Version } from "@/components/demo/demo-context"
import { startNav, proNav, type SectionKey } from "./nav-config"
import { useDemo } from "@/components/demo/demo-context"

export function AdminSidebar({
  version,
  active,
  onSelect,
}: {
  version: Version
  active: SectionKey
  onSelect: (key: SectionKey) => void
}) {
  const isPro = version === "pro"
  const { setVersion } = useDemo()
  const groups = isPro ? proNav : startNav

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mountain className="size-6" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-base font-semibold text-sidebar-foreground">
            Cabañas
            <br />
            Sierra Norte
          </p>
          {isPro && <p className="text-[11px] font-medium text-primary">Panel PRO</p>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.title ?? `g-${gi}`}>
            {group.title && (
              <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = active === item.key
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.key)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-gold/25 text-gold-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {!isPro && (
          <div className="mx-2 mt-4 rounded-xl border border-border bg-secondary/50 p-3">
            <p className="text-sm font-semibold text-foreground">Versión Start</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Panel básico para administrar tus cabañas y solicitudes.
            </p>
            <button type="button" onClick={() => setVersion("pro")} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
              <Sparkles className="size-3.5 text-gold-foreground" aria-hidden />
              Conocer más funciones
            </button>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <button type="button" onClick={() => onSelect("perfil")} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            JS
          </span>
          <span className="flex-1 text-left leading-tight">
            <span className="block text-sm font-medium text-sidebar-foreground">Jorge Sierra</span>
            <span className="block text-xs text-muted-foreground">Administrador</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </button>
        {isPro && (
          <button type="button" disabled title="La autenticación real no está conectada en esta demo" className="mt-1 flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground opacity-60">
            <LogOut className="size-4" aria-hidden />
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  )
}
