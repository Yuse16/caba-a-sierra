"use client"

import { useEffect, useRef } from "react"

const cabinDialogSelector =
  '[role="dialog"][aria-modal="true"][aria-label^="Detalles y reserva para "]'
const expandedPhotoSelector = `${cabinDialogSelector} button[aria-label="Cerrar fotografía ampliada"]`

type DupezHistoryState = Record<string, unknown> & {
  dupezCabinModal?: boolean
  dupezPhotoExpanded?: boolean
}

function currentHistoryState(): DupezHistoryState {
  return window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {}
}

function normalizedHistoryState(state: unknown): DupezHistoryState {
  return state && typeof state === "object" ? (state as DupezHistoryState) : {}
}

export function CabinModalHistoryGuard() {
  const modalOpenRef = useRef(false)
  const photoOpenRef = useRef(false)
  const modalHistoryEntryRef = useRef(false)
  const photoHistoryEntryRef = useRef(false)
  const closingPhotoFromPopStateRef = useRef(false)
  const closingModalFromPopStateRef = useRef(false)
  const suppressedPopStatesRef = useRef(0)

  useEffect(() => {
    const cabinDialogIsOpen = () => Boolean(document.querySelector(cabinDialogSelector))
    const expandedPhotoIsOpen = () => Boolean(document.querySelector(expandedPhotoSelector))

    const pushCabinHistoryEntry = () => {
      window.history.pushState(
        {
          ...currentHistoryState(),
          dupezCabinModal: true,
          dupezPhotoExpanded: false,
        },
        "",
        window.location.href,
      )
      modalHistoryEntryRef.current = true
      photoHistoryEntryRef.current = false
    }

    const pushPhotoHistoryEntry = () => {
      window.history.pushState(
        {
          ...currentHistoryState(),
          dupezCabinModal: true,
          dupezPhotoExpanded: true,
        },
        "",
        window.location.href,
      )
      modalHistoryEntryRef.current = true
      photoHistoryEntryRef.current = true
    }

    const consumeCurrentEntry = () => {
      suppressedPopStatesRef.current += 1
      window.history.back()
    }

    const syncModalState = () => {
      const modalOpen = cabinDialogIsOpen()
      const photoOpen = expandedPhotoIsOpen()

      if (modalOpen && !modalOpenRef.current) {
        modalOpenRef.current = true
        const state = currentHistoryState()
        if (state.dupezCabinModal) modalHistoryEntryRef.current = true
        else pushCabinHistoryEntry()
      }

      if (photoOpen && !photoOpenRef.current) {
        photoOpenRef.current = true
        const state = currentHistoryState()
        if (state.dupezPhotoExpanded) photoHistoryEntryRef.current = true
        else pushPhotoHistoryEntry()
      }

      if (!photoOpen && photoOpenRef.current) {
        photoOpenRef.current = false

        if (closingPhotoFromPopStateRef.current) {
          closingPhotoFromPopStateRef.current = false
          photoHistoryEntryRef.current = false
        } else if (photoHistoryEntryRef.current && currentHistoryState().dupezPhotoExpanded) {
          photoHistoryEntryRef.current = false
          consumeCurrentEntry()
        }
      }

      if (!modalOpen && modalOpenRef.current) {
        modalOpenRef.current = false
        photoOpenRef.current = false
        photoHistoryEntryRef.current = false

        if (closingModalFromPopStateRef.current) {
          closingModalFromPopStateRef.current = false
          modalHistoryEntryRef.current = false
        } else if (modalHistoryEntryRef.current && currentHistoryState().dupezCabinModal) {
          modalHistoryEntryRef.current = false
          consumeCurrentEntry()
        }
      }
    }

    const onPopState = (event: PopStateEvent) => {
      const nextState = normalizedHistoryState(event.state)

      if (suppressedPopStatesRef.current > 0) {
        suppressedPopStatesRef.current -= 1
        modalHistoryEntryRef.current = Boolean(nextState.dupezCabinModal)
        photoHistoryEntryRef.current = Boolean(nextState.dupezPhotoExpanded)
        return
      }

      if (photoOpenRef.current && !nextState.dupezPhotoExpanded) {
        closingPhotoFromPopStateRef.current = true
        photoHistoryEntryRef.current = false
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
        return
      }

      if (modalOpenRef.current && !nextState.dupezCabinModal) {
        closingModalFromPopStateRef.current = true
        modalHistoryEntryRef.current = false
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
      }
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
