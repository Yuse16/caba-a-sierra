import type { Metadata } from "next"
import { CabinsProvider } from "@/components/panel/cabins-provider"

export const metadata: Metadata = {
  title: "Panel privado — Cabañas Sierra Norte",
  robots: { index: false, follow: false },
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <CabinsProvider>{children}</CabinsProvider>
}
