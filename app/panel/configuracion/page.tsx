import { redirect } from "next/navigation"
import { SettingsWorkspace } from "@/components/panel/settings-workspace"
import { getAdminSiteSettings } from "@/lib/admin-settings/repository.server"
import { requirePanelSession } from "@/lib/auth/session"

export default async function SiteSettingsPage() {
  const session = await requirePanelSession()
  if (session.role !== "admin") redirect("/panel/cabanas")
  const settings = await getAdminSiteSettings()
  return <SettingsWorkspace settings={settings} />
}