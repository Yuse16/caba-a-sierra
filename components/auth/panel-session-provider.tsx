"use client"

import { createContext, useContext } from "react"
import type { PanelSession } from "@/lib/auth/session"

const PanelSessionContext = createContext<PanelSession | null>(null)

export function PanelSessionProvider({ session, children }: { session: PanelSession; children: React.ReactNode }) {
  return <PanelSessionContext.Provider value={session}>{children}</PanelSessionContext.Provider>
}

export function usePanelSession() {
  const session = useContext(PanelSessionContext)
  if (!session) throw new Error("PanelSessionProvider no está disponible.")
  return session
}
