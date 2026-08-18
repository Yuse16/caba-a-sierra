"use client"

import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/admin/admin-panel"
import type { Cabin } from "@/lib/demo-data"
import type { AdminPanelInitialData } from "@/lib/admin-panel-data"

export function PanelRouteShell({ initialData }: { initialData: AdminPanelInitialData }) {
  const router = useRouter()
  return (
    <AdminPanel
      version="start"
      initialData={initialData}
      onManageCabins={() => router.push("/panel/cabanas")}
      onManagePromotions={() => router.push("/panel/promociones")}
      onCreateCabin={() => router.push("/panel/cabanas/nueva")}
      onEditCabin={(cabin: Cabin) => router.push(`/panel/cabanas/${cabin.id}`)}
    />
  )
}
