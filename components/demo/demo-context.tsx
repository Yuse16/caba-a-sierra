"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type Vista = "clientes" | "panel"
export type Version = "start" | "pro"

type DemoState = {
  vista: Vista
  version: Version
  setVista: (v: Vista) => void
  setVersion: (v: Version) => void
  toggleVersion: () => void
}

const DemoContext = createContext<DemoState | null>(null)

function normalizeVista(value: string | null): Vista {
  return value === "panel" ? "panel" : "clientes"
}

function normalizeVersion(value: string | null): Version {
  return value === "pro" ? "pro" : "start"
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const vista = normalizeVista(searchParams.get("vista"))
  const version = normalizeVersion(searchParams.get("version"))

  const navigate = useCallback(
    (nextVista: Vista, nextVersion: Version) => {
      const params = new URLSearchParams()
      params.set("vista", nextVista)
      params.set("version", nextVersion)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router],
  )

  const value = useMemo<DemoState>(
    () => ({
      vista,
      version,
      setVista: (v) => navigate(v, version),
      setVersion: (v) => navigate(vista, v),
      toggleVersion: () => navigate(vista, version === "pro" ? "start" : "pro"),
    }),
    [vista, version, navigate],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error("useDemo debe usarse dentro de DemoProvider")
  return ctx
}
