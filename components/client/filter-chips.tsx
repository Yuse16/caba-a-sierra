"use client"

import { LayoutGrid, Heart, Users, UsersRound, Flame, PawPrint, TreePine } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublicCabinCategory } from "@/lib/public-cabins"

type ChipKey = "todos" | PublicCabinCategory

const chips: { key: ChipKey; label: string; icon: React.ReactNode }[] = [
  { key: "todos", label: "Todos", icon: <LayoutGrid className="size-4" aria-hidden /> },
  { key: "parejas", label: "Para parejas", icon: <Heart className="size-4" aria-hidden /> },
  { key: "familiar", label: "Familiar", icon: <Users className="size-4" aria-hidden /> },
  { key: "grupos", label: "Grupos", icon: <UsersRound className="size-4" aria-hidden /> },
  { key: "chimenea", label: "Con chimenea", icon: <Flame className="size-4" aria-hidden /> },
  { key: "pet-friendly", label: "Pet friendly", icon: <PawPrint className="size-4" aria-hidden /> },
  { key: "bosque", label: "Cerca del bosque", icon: <TreePine className="size-4" aria-hidden /> },
]

export function FilterChips({
  active,
  onChange,
}: {
  active: ChipKey
  onChange: (k: ChipKey) => void
}) {
  return (
    <div
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      aria-label="Filtrar por tipo de viaje"
    >
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          aria-pressed={active === c.key}
          className={cn(
            "inline-flex min-h-11 shrink-0 snap-start items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
            active === c.key
              ? "border-primary bg-primary text-white shadow-sm"
              : "border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary hover:text-primary",
          )}
        >
          {c.icon}
          {c.label}
        </button>
      ))}
    </div>
  )
}

export type { ChipKey }
