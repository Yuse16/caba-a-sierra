import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getPanelSession } from "@/lib/auth/session"

export async function POST() {
  const out: Record<string, unknown> = {}
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getClaims()
    out.getClaims = { hasData: !!data, error: error?.message ?? null }
  } catch (e) {
    out.getClaimsError = String(e)
  }
  try {
    const session = await getPanelSession()
    out.session = session ? { userId: session.userId, role: session.role } : null
  } catch (e) {
    out.sessionError = String(e)
  }
  return NextResponse.json({ ok: true, out })
}
