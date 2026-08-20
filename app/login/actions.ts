"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { safePanelRedirect } from "@/lib/auth/redirects"

export type AuthActionState = { error: string | null; success: boolean }

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseConfig()) return { error: "El acceso seguro todavía no está configurado en este entorno.", success: false }

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const next = safePanelRedirect(formData.get("next"))

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return { error: "Revisa el correo y la contraseña.", success: false }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: "No pudimos iniciar sesión con esos datos.", success: false }
  redirect(next)
}

export async function logoutAction() {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient()
    try {
      await supabase.auth.signOut({ scope: "global" })
    } catch {
      // signOut may fail (network, etc.) — continue to clear cookies anyway
    }
    const store = await cookies()
    for (const c of store.getAll()) {
      if (c.name.startsWith("sb-")) store.delete(c.name)
    }
  }
  redirect("/login")
}

export async function requestPasswordResetAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseConfig()) return { error: "La recuperación todavía no está configurada en este entorno.", success: false }
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Escribe un correo válido.", success: false }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (!siteUrl) return { error: "Falta configurar la URL pública para recuperación.", success: false }
  const supabase = await createSupabaseServerClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/callback?next=/actualizar-contrasena` })

  return { error: null, success: true }
}

export async function updatePasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseConfig()) return { error: "La recuperación todavía no está configurada en este entorno.", success: false }
  const password = String(formData.get("password") ?? "")
  const confirmation = String(formData.get("confirmation") ?? "")
  if (password.length < 12) return { error: "Usa una contraseña de al menos 12 caracteres.", success: false }
  if (password !== confirmation) return { error: "Las contraseñas no coinciden.", success: false }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: "No pudimos actualizar la contraseña. Solicita un enlace nuevo.", success: false }

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (userId) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle()
    if (profile) redirect("/panel")
  }
  redirect("/")
}
