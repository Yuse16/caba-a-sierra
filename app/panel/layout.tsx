import type { Metadata } from "next"
import { CabinsProvider } from "@/components/panel/cabins-provider"
import { PromotionsProvider } from "@/components/panel/promotions-provider"
import { PanelSessionProvider } from "@/components/auth/panel-session-provider"
import { requirePanelSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Panel privado — Cabañas Sierra Norte",
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePanelSession()
  return <PanelSessionProvider session={session}><CabinsProvider><PromotionsProvider>{children}</PromotionsProvider></CabinsProvider></PanelSessionProvider>
}
