"use client"

import { useState } from "react"
import { AdminPanel } from "./admin-panel"
import type { PlatformVersion } from "@/lib/platform-types"
import type { AdminPanelInitialData } from "@/lib/admin-panel-data"

export function AdminRouteShell({ initialData }: { initialData: AdminPanelInitialData }) {
  const [version, setVersion] = useState<PlatformVersion>("start")

  return <AdminPanel version={version} initialData={initialData} onVersionChange={setVersion} />
}
