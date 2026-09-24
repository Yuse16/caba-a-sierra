"use client"

import Link from "next/link"
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react"
import { usePanelSession } from "@/components/auth/panel-session-provider"

export function ProfileSection() {
  const session = usePanelSession()
  const roleLabel = session.role === "admin" ? "Administrador" : "Editor"

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Mi perfil</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{session.displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta los datos de acceso de tu cuenta y administra tu contraseña de forma segura.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Mail className="size-4" aria-hidden />
              Correo
            </dt>
            <dd className="mt-2 break-all text-sm font-medium text-foreground">
              {session.email ?? "Correo no disponible"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden />
              Rol
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground">{roleLabel}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h3 className="font-semibold text-foreground">Contraseña</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Por seguridad la contraseña actual nunca se muestra. Puedes cambiarla con tu sesión
              activa o solicitar un enlace de recuperación por correo.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/actualizar-contrasena"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Cambiar contraseña
          </Link>
          <Link
            href="/recuperar-contrasena"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Recuperar por correo
          </Link>
        </div>
      </div>
    </section>
  )
}
