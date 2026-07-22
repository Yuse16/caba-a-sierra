"use client"

import { Monitor, Crown, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDemo, type Vista, type Version } from "./demo-context"

function SegButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-primary-foreground/70 hover:text-primary-foreground",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function DemoTopBar() {
  const { vista, version, setVista, setVersion, toggleVersion } = useDemo()
  const isPro = version === "pro"

  const vistas: { key: Vista; label: string }[] = [
    { key: "clientes", label: "Página de clientes" },
    { key: "panel", label: "Panel administrativo" },
  ]

  const versions: { key: Version; label: string }[] = [
    { key: "start", label: "Start" },
    { key: "pro", label: "Pro" },
  ]

  return (
    <div className="sticky top-0 z-50 bg-forest-dark text-primary-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
        {/* Left: brand + version badge */}
        <div className="flex items-center gap-2.5">
          <Monitor className="size-4 shrink-0 text-primary-foreground/70" aria-hidden />
          <span className="hidden text-sm font-medium sm:inline">
            Demo de plataforma para cabañas
          </span>
          <span className="text-sm font-medium sm:hidden">Demo cabañas</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
              isPro
                ? "bg-gold text-gold-foreground"
                : "bg-primary-foreground/15 text-primary-foreground",
            )}
          >
            {isPro ? (
              <>
                Versión PRO <Crown className="size-3" aria-hidden />
              </>
            ) : (
              "Versión Start"
            )}
          </span>
        </div>

        {/* Center: vista switch */}
        <div className="order-last flex w-full justify-center sm:order-none sm:mx-auto sm:w-auto">
          <div className="inline-flex items-center gap-1 rounded-lg bg-black/20 p-1">
            {vistas.map((v) => (
              <SegButton key={v.key} active={vista === v.key} onClick={() => setVista(v.key)}>
                {v.label}
              </SegButton>
            ))}
          </div>
        </div>

        {/* Right: version switch + contextual CTA */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-primary-foreground/70 md:inline">
            Cambiar versión:
          </span>
          <div className="inline-flex items-center gap-1 rounded-lg bg-black/20 p-1">
            {versions.map((v) => (
              <SegButton
                key={v.key}
                active={version === v.key}
                onClick={() => setVersion(v.key)}
                className={cn(v.key === "pro" && version === "pro" && "bg-gold text-gold-foreground")}
              >
                {v.label}
              </SegButton>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleVersion}
            className={cn(
              "hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors lg:inline-flex",
              isPro
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-gold bg-gold text-gold-foreground hover:bg-gold/90",
            )}
          >
            {isPro ? (
              <>
                <Sparkles className="size-3.5" aria-hidden />
                Estás viendo la plataforma profesional
              </>
            ) : (
              <>
                Ver plataforma profesional
                <ChevronRight className="size-3.5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
