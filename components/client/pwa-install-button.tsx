"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

declare global {
  interface Window {
    __dupezInstallPrompt?: BeforeInstallPromptEvent
  }
}

export function PwaInstallButton({
  className,
  label = "Instalar app",
}: {
  className?: string
  label?: string
}) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

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
      const prompt = event as BeforeInstallPromptEvent
      window.__dupezInstallPrompt = prompt
      setInstallPrompt(prompt)
    }

    const handlePromptConsumed = () => {
      setInstallPrompt(null)
    }

    const handleInstalled = () => {
      delete window.__dupezInstallPrompt
      setInstallPrompt(null)
      setInstalled(true)
    }

    refreshInstalledState()
    setIsAndroid(/Android/i.test(window.navigator.userAgent))
    if (window.__dupezInstallPrompt) setInstallPrompt(window.__dupezInstallPrompt)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)
    window.addEventListener("dupez-pwa-prompt-consumed", handlePromptConsumed)
    displayMode.addEventListener?.("change", refreshInstalledState)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      window.removeEventListener("dupez-pwa-prompt-consumed", handlePromptConsumed)
      displayMode.removeEventListener?.("change", refreshInstalledState)
    }
  }, [])

  if (installed || (!installPrompt && !isAndroid)) return null

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true)
      return
    }

    const prompt = installPrompt
    delete window.__dupezInstallPrompt
    window.dispatchEvent(new Event("dupez-pwa-prompt-consumed"))
    await prompt.prompt()
    await prompt.userChoice
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className={cn(
          "items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        <Download className="size-4" aria-hidden />
        {installPrompt ? label : "Cómo instalar DUPEZ"}
      </button>

      {showInstructions && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 text-left shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setShowInstructions(false)}
            aria-label="Cerrar instrucciones de instalación"
            className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" aria-hidden />
          </button>
          <p className="pr-8 text-sm font-semibold text-foreground">Instalar DUPEZ en Android</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            En Chrome toca el menú de tres puntos y elige “Instalar aplicación” o
            “Agregar a pantalla principal”. Si todavía no aparece, permanece unos segundos
            en la página, tócala una vez y vuelve a abrir el menú.
          </p>
        </div>
      )}
    </>
  )
}
