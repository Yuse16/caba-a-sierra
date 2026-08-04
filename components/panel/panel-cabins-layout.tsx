"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Mountain, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PanelLogoutButton } from "@/components/auth/panel-logout-button"

export function PanelCabinsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const editing = pathname === "/panel/cabanas/nueva" || /^\/panel\/cabanas\/[^/]+$/.test(pathname)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mountain className="size-5" aria-hidden />
            </span>
            <div className={cn("min-w-0 leading-tight", !editing && "hidden min-[360px]:block")}>
              <p className="truncate text-sm font-semibold text-foreground">Sierra Norte</p>
              <p className="text-xs text-muted-foreground">Panel privado</p>
            </div>
          </div>

          {!editing && (
            <nav className="ml-auto flex items-center gap-2" aria-label="Navegación del panel">
              <Link
                href="/panel"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted sm:w-auto sm:gap-2 sm:px-3"
                aria-label="Inicio del panel"
              >
                <Home className="size-4" aria-hidden />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              <Link
                href="/panel/cabanas/nueva"
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                  pathname === "/panel/cabanas/nueva" && "pointer-events-none opacity-70",
                )}
              >
                <Plus className="size-4" aria-hidden />
                Nueva cabaña
              </Link>
            </nav>
          )}
          <PanelLogoutButton className={editing ? "ml-auto" : undefined} />
        </div>
      </header>
      {children}
    </div>
  )
}
