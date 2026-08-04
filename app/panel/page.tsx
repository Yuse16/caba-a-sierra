import { PanelRouteShell } from "@/components/panel/panel-route-shell"
import { getAdminPanelData } from "@/lib/admin-panel-data.server"
import { requirePanelSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function PanelPage() {
  const session = await requirePanelSession()
  if (session.role === "editor") redirect("/panel/cabanas")
  return <PanelRouteShell initialData={await getAdminPanelData(session)} />
}
