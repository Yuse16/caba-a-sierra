"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { calendarCabins, calendarDays, calendarBookings } from "@/lib/demo-data"

const statusStyle: Record<string, string> = {
  reserved: "bg-primary/85 text-primary-foreground",
  available: "bg-success/15",
  unavailable: "bg-destructive/15",
  maintenance:
    "bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.08)_5px,rgba(0,0,0,0.08)_10px)] bg-muted",
}

export function OccupancyCalendar() {
  const cols = calendarDays.length
  const [period, setPeriod] = useState(0)
  const periodLabels = ["Mayo - Junio 2026", "Junio - Julio 2026", "Julio - Agosto 2026", "Agosto - Septiembre 2026", "Septiembre - Octubre 2026"]
  const periodLabel = periodLabels[period + 2]

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Calendario de ocupación</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{periodLabel}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPeriod(0)} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent">
              Hoy
            </button>
            <button type="button" aria-label="Periodo anterior" onClick={() => setPeriod((value) => Math.max(-2, value - 1))} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40" disabled={period === -2}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Periodo siguiente" onClick={() => setPeriod((value) => Math.min(2, value + 1))} className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40" disabled={period === 2}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div
            className="grid border-b border-border pb-2"
            style={{ gridTemplateColumns: `180px repeat(${cols}, minmax(0,1fr))` }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cabaña
            </div>
            {calendarDays.map((d) => (
              <div key={d.date} className="text-center">
                <div className="text-sm font-semibold text-foreground">{d.date}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{d.dow}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {calendarCabins.map((cabin) => {
            const bookings = calendarBookings[cabin.id] ?? []
            return (
              <div
                key={cabin.id}
                className="grid items-center border-b border-border/60"
                style={{ gridTemplateColumns: `180px repeat(${cols}, minmax(0,1fr))` }}
              >
                <div className="flex items-center gap-2 py-2 pr-2">
                  <Image
                    src={cabin.image || "/placeholder.svg"}
                    alt={cabin.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{cabin.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{cabin.capacity}</p>
                  </div>
                </div>
                <div className="relative col-span-full col-start-2 grid h-11" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                  {/* base cells */}
                  {calendarDays.map((d, i) => (
                    <div key={i} className="border-l border-border/40 first:border-l-0" />
                  ))}
                  {/* booking bars */}
                  {bookings.map((b, i) => (
                    <div
                      key={i}
                      className={`absolute top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 overflow-hidden rounded-md px-2 text-[11px] font-medium ${statusStyle[b.status]}`}
                      style={{
                        left: `calc(${(b.start / cols) * 100}% + 2px)`,
                        width: `calc(${((b.end - b.start) / cols) * 100}% - 4px)`,
                      }}
                    >
                      <span className="truncate">{b.label}</span>
                      {b.guests ? (
                        <span className="ml-auto flex shrink-0 items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {b.guests}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary/85" /> Reservada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-success/25" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-destructive/25" /> No disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted" /> Mantenimiento
        </span>
      </div>
    </section>
  )
}
