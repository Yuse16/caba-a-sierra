"use client"

import { AdminPanel } from "./admin-panel"
import type { PlatformVersion } from "@/lib/platform-types"
import type { AdminPanelInitialData } from "@/lib/admin-panel-data"

export function AdminRouteShell({ initialData }: { initialData: AdminPanelInitialData }) {
  return <AdminPanel version={"start" satisfies PlatformVersion} initialData={initialData} />
}
