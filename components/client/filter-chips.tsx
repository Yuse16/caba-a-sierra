"use client"

import { LayoutGrid, Heart, Users, UsersRound, Flame, PawPrint, TreePine } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CabinCategory } from "@/lib/demo-data"

type ChipKey = "todos" | CabinCategory

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
    <div className="flex flex-wrap justify-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          aria-pressed={active === c.key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            active === c.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted",
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
