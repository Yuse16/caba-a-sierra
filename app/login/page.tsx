import type { Metadata } from "next"
import Link from "next/link"
import { BadgePercent } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { getPanelSession } from "@/lib/auth/session"
import { safePanelRedirect } from "@/lib/auth/redirects"
import { loginAction } from "./actions"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const host = h.get("host") ?? ""
  const isPanel = host.startsWith("panel.")

  return {
    title: isPanel ? "Panel DUPEZ — Acceso" : "Acceso al panel — Cabañas Sierra Norte",
    robots: { index: false, follow: false },
    ...(isPanel
      ? {
          manifest: "/manifest.webmanifest",
          appleWebApp: { capable: true, statusBarStyle: "default", title: "Panel DUPEZ" },
          icons: { icon: "/panel-icon-192.png", apple: "/panel-icon-512.png" },
          applicationName: "Panel DUPEZ",
        }
      : {}),
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  if (await getPanelSession()) redirect(safePanelRedirect(next))
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BadgePercent className="size-6" aria-hidden /></span>
        <p className="mt-6 text-sm font-semibold text-primary">Panel privado</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">Inicia sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acceso exclusivo para usuarios administrativos autorizados.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error === "access" ? "Tu sesión venció o la cuenta no tiene acceso activo." : error === "configuration" ? "El acceso seguro no está configurado en este entorno." : "El enlace no es válido o ya venció. Solicita uno nuevo."}</p>}
        <AuthForm action={loginAction} mode="login" next={next} />
        <Link href="/recuperar-contrasena" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">¿Olvidaste tu contraseña?</Link>
      </section>
    </main>
  )
}
