"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Menu, Mountain, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getPanelBackHref, panelNavigationLinks } from "@/lib/panel-navigation"

type NavigationState = { collapsed: boolean; toggleSidebar: () => void; mobileOpen: boolean; openMobileMenu: () => void; closeMobileMenu: () => void }
const NavigationContext = createContext<NavigationState | null>(null)
export function PanelNavigationProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // El estado se conserva al navegar por el panel, sin depender del almacenamiento del navegador.
  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const openMobileMenu = useCallback(() => setMobileOpen(true), [])
  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])
  const value = useMemo(
    () => ({ collapsed, toggleSidebar, mobileOpen, openMobileMenu, closeMobileMenu }),
    [collapsed, toggleSidebar, mobileOpen, openMobileMenu, closeMobileMenu],
  )
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

export function PanelMobileMenuButton({ onClick, expanded }: { onClick?: () => void; expanded?: boolean }) {
  const { mobileOpen, openMobileMenu } = usePanelNavigation()
  return (
    <button
      type="button"
      onClick={onClick ?? openMobileMenu}
      aria-controls="panel-mobile-drawer"
      aria-expanded={onClick ? expanded : mobileOpen}
      aria-label="Abrir menú del panel"
      title="Abrir menú del panel"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted lg:hidden"
    >
      <Menu className="size-5" aria-hidden />
    </button>
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
  const { collapsed, mobileOpen, closeMobileMenu } = usePanelNavigation()
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
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Cerrar menú del panel"
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
          />
          <div
            id="panel-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel"
            className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col bg-sidebar text-sidebar-foreground shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-3">
              <span className="flex items-center gap-2 font-semibold"><Mountain className="size-5 text-primary" aria-hidden />DUPEZ</span>
              <button type="button" onClick={closeMobileMenu} aria-label="Cerrar navegación" className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-sidebar-accent">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Secciones móviles del panel" className="flex-1 space-y-1 overflow-y-auto p-3">
              {panelNavigationLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  aria-current={pathname === href || (href !== "/panel" && pathname.startsWith(href + "/")) ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === href || (href !== "/panel" && pathname.startsWith(href + "/"))
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
