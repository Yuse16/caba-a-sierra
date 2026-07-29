"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminPanel } from "@/components/admin/admin-panel"
import type { Cabin } from "@/lib/demo-data"
import type { PlatformVersion } from "@/lib/platform-types"

export function PanelRouteShell() {
  const router = useRouter()
  const [version, setVersion] = useState<PlatformVersion>("start")

  return (
    <AdminPanel
      version={version}
      onVersionChange={setVersion}
      onManageCabins={() => router.push("/panel/cabanas")}
      onCreateCabin={() => router.push("/panel/cabanas/nueva")}
      onEditCabin={(cabin: Cabin) => router.push(`/panel/cabanas/${cabin.id}`)}
    />
  )
}
