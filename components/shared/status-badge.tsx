import { cn } from "@/lib/utils"

export type Tone = "success" | "danger" | "muted" | "warning" | "info" | "gold"

const toneClasses: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  danger: "bg-destructive/12 text-destructive",
  muted: "bg-muted text-muted-foreground",
  warning: "bg-warning/20 text-[oklch(0.45_0.09_75)]",
  info: "bg-[oklch(0.9_0.04_240)] text-[oklch(0.45_0.12_255)]",
  gold: "bg-gold/20 text-gold-foreground",
}

export function StatusBadge({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
