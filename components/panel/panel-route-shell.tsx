"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/admin/admin-panel"
import type { Cabin } from "@/lib/demo-data"
import type { AdminPanelInitialData } from "@/lib/admin-panel-data"
import type { PlatformVersion } from "@/lib/platform-types"

export function PanelRouteShell({ initialData }: { initialData: AdminPanelInitialData }) {
  const router = useRouter()
  const [version, setVersion] = useState<PlatformVersion>("start")

  return (
    <AdminPanel
      version={version}
      initialData={initialData}
      onVersionChange={setVersion}
      onManageCabins={() => router.push("/panel/cabanas")}
      onManagePromotions={() => router.push("/panel/promociones")}
      onCreateCabin={() => router.push("/panel/cabanas/nueva")}
      onEditCabin={(cabin: Cabin) => router.push(`/panel/cabanas/${cabin.id}`)}
    />
  )
}
