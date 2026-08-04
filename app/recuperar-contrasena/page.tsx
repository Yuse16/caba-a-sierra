import type { Metadata } from "next"
import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"
import { requestPasswordResetAction } from "@/app/login/actions"

export const metadata: Metadata = { title: "Recuperar acceso — Cabañas Sierra Norte", robots: { index: false, follow: false } }

export default function RecoverPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"><p className="text-sm font-semibold text-primary">Acceso seguro</p><h1 className="mt-1 font-serif text-3xl font-bold">Recupera tu contraseña</h1><p className="mt-2 text-sm text-muted-foreground">Escribe el correo de una cuenta autorizada.</p><AuthForm action={requestPasswordResetAction} mode="recover" /><Link href="/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Volver al acceso</Link></section></main>
}
