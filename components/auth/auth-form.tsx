"use client"

import { useActionState } from "react"
import { LoaderCircle, LockKeyhole } from "lucide-react"
import type { AuthActionState } from "@/app/login/actions"

type AuthAction = (state: AuthActionState, data: FormData) => Promise<AuthActionState>

export function AuthForm({ action, mode, next = "/panel" }: { action: AuthAction; mode: "login" | "recover" | "update"; next?: string }) {
  const [state, formAction, pending] = useActionState(action, { error: null, success: false })
  const login = mode === "login"
  const update = mode === "update"

  return (
    <form action={formAction} className="mt-7 space-y-5">
      {login && <input type="hidden" name="next" value={next} />}
      {!update && <label className="block text-sm font-medium text-foreground">Correo<input name="email" type="email" autoComplete="email" required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {(login || update) && <label className="block text-sm font-medium text-foreground">{update ? "Nueva contraseña" : "Contraseña"}<input name="password" type="password" autoComplete={update ? "new-password" : "current-password"} minLength={login ? 8 : 12} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {update && <label className="block text-sm font-medium text-foreground">Confirmar contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required className="mt-1.5 min-h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>}
      {state.error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      {state.success && mode === "recover" && <p role="status" className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-foreground">Si existe una cuenta autorizada, recibirá instrucciones por correo.</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LockKeyhole className="size-4" aria-hidden />}
        {pending ? "Procesando…" : login ? "Iniciar sesión" : update ? "Guardar contraseña" : "Enviar instrucciones"}
      </button>
    </form>
  )
}
