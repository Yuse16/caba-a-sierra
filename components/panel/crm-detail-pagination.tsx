import Link from "next/link"
import type { PageInfo } from "@/lib/admin-crm/types"

export function CrmDetailPagination({ info, label, field, params, selected }: {
  info?: PageInfo; label: string; field: string; params: Record<string, string | undefined>; selected: string
}) {
  if (!info || info.totalPages <= 1) return null
  const href = (page: number) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value)
    query.set("selected", selected)
    query.set(field, String(page))
    return `?${query}`
  }
  const style = "inline-flex min-h-11 items-center rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  return <nav aria-label={label} className="mt-3 flex flex-wrap items-center justify-between gap-1">
    {info.page > 1 ? <Link className={style} href={href(info.page - 1)}>Anterior</Link> : <span />}
    <span className="text-xs">{info.page} / {info.totalPages} · {info.total}</span>
    {info.page < info.totalPages ? <Link className={style} href={href(info.page + 1)}>Siguiente</Link> : <span />}
  </nav>
}
