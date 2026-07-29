import { redirect } from "next/navigation"

export const metadata = {
  title: "Panel administrativo — Cabañas Sierra Norte",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  redirect("/panel")
}
