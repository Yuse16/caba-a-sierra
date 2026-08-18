import type { Metadata } from "next"
import { CabinsProvider } from "@/components/panel/cabins-provider"
import { PromotionsProvider } from "@/components/panel/promotions-provider"
import { PanelSessionProvider } from "@/components/auth/panel-session-provider"
import { requirePanelSession } from "@/lib/auth/session"

export function generateMetadata(): Metadata {
  return {
    title: "Panel DUPEZ — Administración",
    robots: { index: false, follow: false },
    manifest: "/manifest.webmanifest?scope=panel",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Panel DUPEZ",
    },
    icons: {
      icon: "/panel-icon-192.png",
      apple: "/panel-icon-512.png",
    },
    applicationName: "Panel DUPEZ",
  }
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePanelSession()
  return <PanelSessionProvider session={session}><CabinsProvider><PromotionsProvider>{children}</PromotionsProvider></CabinsProvider></PanelSessionProvider>
}
