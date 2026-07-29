"use client"

import { useState } from "react"
import { AdminPanel } from "./admin-panel"
import type { PlatformVersion } from "@/lib/platform-types"

export function AdminRouteShell() {
  const [version, setVersion] = useState<PlatformVersion>("start")

  return <AdminPanel version={version} onVersionChange={setVersion} />
}
