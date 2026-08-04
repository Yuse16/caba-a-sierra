import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { updatePasswordAction } from "@/app/login/actions"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Nueva contraseña — Cabañas Sierra Norte", robots: { index: false, follow: false } }

export default async function UpdatePasswordPage() {
  if (!hasSupabaseConfig()) redirect("/login?error=recovery")
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || typeof data?.claims?.sub !== "string") redirect("/login?error=recovery")

  return <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"><p className="text-sm font-semibold text-primary">Acceso seguro</p><h1 className="mt-1 font-serif text-3xl font-bold">Crea una nueva contraseña</h1><p className="mt-2 text-sm text-muted-foreground">El enlace de recuperación debe seguir activo.</p><AuthForm action={updatePasswordAction} mode="update" /></section></main>
}
