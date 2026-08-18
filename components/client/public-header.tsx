"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Menu, Mountain, X } from "lucide-react"

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cabañas", href: "#cabanas" },
  { label: "Cómo funciona", href: "#como-reservar" },
  { label: "Contacto", href: "#contacto" },
]

const focusClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-forest-dark/10 bg-background/95 shadow-[0_1px_0_rgba(24,55,39,0.04)] backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        <a
          href="#inicio"
          aria-label="DUPEZ, ir al inicio"
          className={`flex min-w-0 items-center gap-3 rounded-lg ${focusClasses}`}
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Mountain className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-lg font-semibold leading-tight tracking-[-0.02em] text-forest-dark">
              DUPEZ
            </span>
            <span className="mt-0.5 block max-w-[172px] text-[8px] font-bold uppercase leading-[1.35] tracking-[0.14em] text-primary sm:max-w-[240px] sm:text-[9px] sm:tracking-[0.18em] lg:max-w-none lg:text-[10px] lg:tracking-[0.22em] lg:whitespace-nowrap">
              Renta de cabañas en toda la Sierra de Arteaga
            </span>
          </span>
        </a>

        <nav aria-label="Navegación principal" className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:bg-primary/8 hover:text-primary ${focusClasses}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#cabanas"
          className={`ml-auto hidden min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-dark lg:ml-3 lg:inline-flex ${focusClasses}`}
        >
          Ver cabañas
          <CalendarCheck className="size-4" aria-hidden />
        </a>

        <button
          type="button"
          className={`ml-auto inline-flex size-11 items-center justify-center rounded-xl border border-border bg-card text-forest-dark transition-colors hover:bg-secondary lg:hidden ${focusClasses}`}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav
          id="menu-movil"
          aria-label="Navegación móvil"
          className="border-t border-border bg-background px-4 pb-5 pt-3 shadow-lg lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary hover:text-primary ${focusClasses}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#cabanas"
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-dark ${focusClasses}`}
              >
                Ver cabañas
                <CalendarCheck className="size-4" aria-hidden />
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
