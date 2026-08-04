import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasPermission, type AdminPermission, type AdminRole } from "./permissions"

export type PanelSession = {
  userId: string
  email: string | null
  displayName: string
  role: AdminRole
  isLocal: boolean
}

function developmentSession(): PanelSession {
  return { userId: "local-development", email: null, displayName: "Administrador Sierra Norte", role: "admin", isLocal: true }
}

export const getPanelSession = cache(async (): Promise<PanelSession | null> => {
  if (!hasSupabaseConfig()) return process.env.NODE_ENV === "production" ? null : developmentSession()

  const supabase = await createSupabaseServerClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const subject = claims?.sub
  if (claimsError || typeof subject !== "string") return null

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id, display_name, role, is_active")
    .eq("user_id", subject)
    .maybeSingle()

  if (profileError || !profile?.is_active || (profile.role !== "admin" && profile.role !== "editor")) return null

  return {
    userId: subject,
    email: typeof claims?.email === "string" ? claims.email : null,
    displayName: profile.display_name,
    role: profile.role,
    isLocal: false,
  }
})

export async function requirePanelSession() {
  const session = await getPanelSession()
  if (!session) {
    if (!hasSupabaseConfig() && process.env.NODE_ENV === "production") notFound()
    redirect("/login?error=access")
  }
  return session
}

export async function requirePermission(permission: AdminPermission) {
  const session = await requirePanelSession()
  if (!hasPermission(session.role, permission)) throw new Error("FORBIDDEN")
  return session
}
