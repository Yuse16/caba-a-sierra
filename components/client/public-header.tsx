"use client"

import { useState } from "react"
import { Mountain, Heart, CalendarCheck, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDemo } from "@/components/demo/demo-context"

export function PublicHeader({ favoritesCount }: { favoritesCount: number }) {
  const { version, toggleVersion } = useDemo()
  const isPro = version === "pro"
  const [open, setOpen] = useState(false)

  const links = isPro
    ? ["Inicio", "Cabañas", "Experiencias", "Promociones", "Cómo funciona", "Contacto"]
    : ["Inicio", "Cabañas", "Cómo funciona", "Contacto"]

  return (
    <header className="sticky top-[41px] z-40 border-b border-border bg-background/95 backdrop-blur sm:top-[41px]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mountain className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold leading-tight text-foreground">
            Cabañas
            <br />
            Sierra Norte
          </span>
        </a>

        <nav className="mx-auto hidden items-center gap-6 lg:flex">
          {links.map((l, i) => (
            <a
              key={l}
              href="#cabanas"
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                i === 0 && "text-foreground underline decoration-primary decoration-2 underline-offset-8",
              )}
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {isPro && (
            <button className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex">
              <Heart className="size-4" aria-hidden />
              Favoritos
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {favoritesCount}
              </span>
            </button>
          )}

          <div className="group relative hidden sm:block">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Ver cabañas
              <CalendarCheck className="size-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l}>
                <a
                  href="#cabanas"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {l}
                </a>
              </li>
            ))}
            {isPro && (
              <li>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  <Heart className="size-4" aria-hidden /> Favoritos ({favoritesCount})
                </button>
              </li>
            )}
            <li className="pt-2">
              <button
                onClick={() => {
                  toggleVersion()
                  setOpen(false)
                }}
                className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-gold-foreground"
              >
                {isPro ? "Ver versión Start" : "Ver plataforma profesional"}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
