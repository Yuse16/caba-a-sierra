"use client"

import { useEffect, useState } from "react"

export function CountdownTimer() {
  // Cuenta regresiva de demostración: siempre parte de un objetivo cercano.
  const [remaining, setRemaining] = useState(2 * 86400 + 14 * 3600 + 36 * 60 + 48)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  const parts = [
    { value: days, label: "días" },
    { value: hours, label: "horas" },
    { value: minutes, label: "min" },
    { value: seconds, label: "seg" },
  ]

  return (
    <div className="flex gap-3">
      {parts.map((p) => (
        <div key={p.label} className="flex flex-col items-center">
          <span className="min-w-11 rounded-lg bg-primary-foreground/10 px-2 py-1.5 text-center text-lg font-semibold tabular-nums text-primary-foreground">
            {String(p.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[11px] text-primary-foreground/60">{p.label}</span>
        </div>
      ))}
    </div>
  )
}
