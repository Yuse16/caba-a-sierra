"use client"

import { LogOut } from "lucide-react"
import { logoutAction } from "@/app/login/actions"
import { cn } from "@/lib/utils"

export function PanelLogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction} className={className}>
      <button type="submit" className={cn("inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")} aria-label="Cerrar sesión" title="Cerrar sesión">
        <LogOut className="size-4" aria-hidden />
      </button>
    </form>
  )
}
