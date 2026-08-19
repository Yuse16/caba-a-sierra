"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

export function PanelLogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    if (busy) return
    setBusy(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut({ scope: "global" })
    } catch {
      // continue even if signOut API fails
    }
    window.location.href = "/login"
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleLogout}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
        className,
      )}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <LogOut className="size-4" aria-hidden />
    </button>
  )
}
