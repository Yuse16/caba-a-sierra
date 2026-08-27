"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, LockKeyhole } from "lucide-react"
import type { AuthActionState } from "@/app/login/actions"

type AuthAction = (state: AuthActionState, data: FormData) => Promise<AuthActionState>

export function AuthForm({ action, mode, next = "/panel" }: { action: AuthAction; mode: "login" | "recover" | "update"; next?: string }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, { error: null, success: false })
  const login = mode === "login"
  const update = mode === "update"

  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginPending, setLoginPending] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginPending(true)
    setLoginError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password"), next: fd.get("next") }),
      })
      const result = await resp.json()
      if (!result.ok) {
        setLoginError(result.error)
        setLoginPending(false)
        return
      }
      router.push(result.redirect || "/panel")
    } catch {
      setLoginError("Ocurrió un error inesperado.")
      setLoginPending(false)
    }
  }

  if (login) {
    return (
      <form onSubmit={handleLoginSubmit} className="mt-7 space-y-5">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm font-medium text-foreground">Correo<input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
        <label className="block text-sm font-medium text-foreground">Contraseña<input name="password" type="password" autoComplete="current-password" minLength={8} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
        {loginError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{loginError}</p>}
        <button type="submit" disabled={loginPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60">
          {loginPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LockKeyhole className="size-4" aria-hidden />}
          {loginPending ? "Procesando…" : "Iniciar sesión"}
        </button>
      </form>
    )
  }

  return (
    <form action={formAction} className="mt-7 space-y-5">
      {update && <label className="block text-sm font-medium text-foreground">Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {update && <label className="block text-sm font-medium text-foreground">Confirmar contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {!update && !login && <label className="block text-sm font-medium text-foreground">Correo<input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {state.error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      {state.success && mode === "recover" && <p role="status" className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-foreground">Si existe una cuenta autorizada, recibirá instrucciones por correo.</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LockKeyhole className="size-4" aria-hidden />}
        {pending ? "Procesando…" : update ? "Guardar contraseña" : "Enviar instrucciones"}
      </button>
    </form>
  )
}
