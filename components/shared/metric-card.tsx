import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function MetricCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  suffix,
  sub,
  trend,
  action,
  onAction,
}: {
  icon: LucideIcon
  iconClassName?: string
  label: string
  value: string
  suffix?: string
  sub?: string
  trend?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-lg",
            iconClassName ?? "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {value}
        </span>
        {suffix && <span className="pb-1 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </div>
      {trend && (
        <p className="flex items-center gap-1 text-xs font-medium text-success">
          <ArrowUpRight className="size-3.5" aria-hidden />
          {trend}
        </p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-auto inline-flex min-h-11 items-center gap-1 rounded-md text-left text-sm font-medium text-primary hover:underline"
        >
          {action} <span aria-hidden>→</span>
        </button>
      )}
    </div>
  )
}
