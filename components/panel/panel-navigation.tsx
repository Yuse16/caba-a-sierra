"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Menu, Mountain } from "lucide-react"
import { cn } from "@/lib/utils"
import { getPanelBackHref, panelNavigationLinks } from "@/lib/panel-navigation"

type NavigationState = { collapsed: boolean; toggleSidebar: () => void }
const NavigationContext = createContext<NavigationState | null>(null)
export function PanelNavigationProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // El estado se conserva al navegar por el panel, sin depender del almacenamiento del navegador.
  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const value = useMemo(() => ({ collapsed, toggleSidebar }), [collapsed, toggleSidebar])
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function usePanelNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("El panel requiere PanelNavigationProvider")
  return context
}

export function PanelMobileBackLink() {
  const pathname = usePathname()
  return (
    <Link
      href={getPanelBackHref(pathname)}
      aria-label="Volver atrás"
      title="Volver atrás"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted lg:hidden"
    >
      <ArrowLeft className="size-5" aria-hidden />
    </Link>
  )
}

export function PanelDesktopMenuButton() {
  const { collapsed, toggleSidebar } = usePanelNavigation()
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-controls="panel-desktop-sidebar"
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
      title={collapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
      className="hidden size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted lg:inline-flex"
    >
      <Menu className="size-5" aria-hidden />
    </button>
  )
}

export function PanelSubpageFrame({ children }: { children: React.ReactNode }) {
  const { collapsed } = usePanelNavigation()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        id="panel-desktop-sidebar"
        aria-label="Menú lateral del panel"
        className={cn("sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar lg:block", collapsed && "lg:hidden")}
      >
        <div className="flex items-center gap-3 px-5 py-6 text-sidebar-foreground">
          <Mountain className="size-6 text-primary" aria-hidden />
          <span className="text-lg font-semibold">DUPEZ</span>
        </div>
        <nav aria-label="Secciones del panel" className="space-y-1 px-3">
          {panelNavigationLinks.map(({ href, label }) => {
            const active = pathname === href || (href !== "/panel" && pathname.startsWith(href + "/"))
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
