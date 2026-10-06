"use client"

import { useEffect, useRef } from "react"

const cabinDialogSelector =
  '[role="dialog"][aria-modal="true"][aria-label^="Detalles y reserva para "]'

function currentHistoryState() {
  return window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {}
}

export function CabinModalHistoryGuard() {
  const modalOpenRef = useRef(false)
  const historyEntryRef = useRef(false)
  const closingFromPopStateRef = useRef(false)

  useEffect(() => {
    const cabinDialogIsOpen = () => Boolean(document.querySelector(cabinDialogSelector))

    const pushCabinHistoryEntry = () => {
      window.history.pushState(
        { ...currentHistoryState(), dupezCabinModal: true },
        "",
        window.location.href,
      )
      historyEntryRef.current = true
    }

    const syncModalState = () => {
      const isOpen = cabinDialogIsOpen()

      if (isOpen && !modalOpenRef.current) {
        modalOpenRef.current = true
        if (!historyEntryRef.current) pushCabinHistoryEntry()
        return
      }

      if (!isOpen && modalOpenRef.current) {
        modalOpenRef.current = false

        if (closingFromPopStateRef.current) {
          closingFromPopStateRef.current = false
          historyEntryRef.current = false
          return
        }

        if (historyEntryRef.current) {
          historyEntryRef.current = false
          window.history.back()
        }
      }
    }

    const onPopState = () => {
      if (!modalOpenRef.current) return

      closingFromPopStateRef.current = true
      historyEntryRef.current = false
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))

      window.setTimeout(() => {
        if (!cabinDialogIsOpen()) return

        // Si primero se cerró la foto ampliada, conserva una entrada adicional para que
        // el siguiente gesto/botón Atrás cierre la ficha de la cabaña y no la PWA.
        closingFromPopStateRef.current = false
        pushCabinHistoryEntry()
      }, 0)
    }

    const observer = new MutationObserver(syncModalState)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("popstate", onPopState)
    syncModalState()

    return () => {
      observer.disconnect()
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  return null
}
