"use client"

import { useDemo } from "./demo-context"
import { DemoTopBar } from "./demo-top-bar"
import { ClientPage } from "@/components/client/client-page"
import { AdminPanel } from "@/components/admin/admin-panel"

export function DemoShell() {
  const { vista, version } = useDemo()

  return (
    <div className="min-h-screen bg-background">
      <DemoTopBar />
      {vista === "clientes" ? (
        <ClientPage key={`client-${version}`} version={version} />
      ) : (
        <AdminPanel key={`admin-${version}`} version={version} />
      )}
    </div>
  )
}
