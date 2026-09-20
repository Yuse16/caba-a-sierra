"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

export function PwaInstallButton({
  className,
  label = "Instalar app",
}: {
  className?: string
  label?: string
}) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)")

    const refreshInstalledState = () => {
      setInstalled(
        displayMode.matches ||
          Boolean((window.navigator as NavigatorWithStandalone).standalone),
      )
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstallPrompt(null)
      setInstalled(true)
    }

    refreshInstalledState()
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)
    displayMode.addEventListener?.("change", refreshInstalledState)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      displayMode.removeEventListener?.("change", refreshInstalledState)
    }
  }, [])

  if (installed || !installPrompt) return null

  const install = async () => {
    const prompt = installPrompt
    setInstallPrompt(null)
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === "dismissed") setInstallPrompt(prompt)
  }

  return (
    <button
      type="button"
      onClick={install}
      className={cn(
        "items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Download className="size-4" aria-hidden />
      {label}
    </button>
  )
}
