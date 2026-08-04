import { NextResponse, type NextRequest } from "next/server"
import { safeAuthCallbackRedirect } from "@/lib/auth/redirects"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const next = safeAuthCallbackRedirect(request.nextUrl.searchParams.get("next") ?? "/panel")
  if (!code || !hasSupabaseConfig()) return NextResponse.redirect(new URL("/login?error=callback", request.url))

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL(error ? "/login?error=callback" : next, request.url))
}
