import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseConfig } from "@/lib/supabase/config"
import { getAuthCookieOptions } from "@/lib/supabase/cookie-options"

export async function POST(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig()
  const cookieOptions = getAuthCookieOptions()
  const res = NextResponse.redirect(new URL("/login", request.url), 303)

  const supabase = createServerClient(url, anonKey, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  await supabase.auth.signOut({ scope: "global" })

  const projectRef = url.includes("supabase.co") ? url.split("//")[1]?.split(".")[0] ?? "" : ""
  if (projectRef) {
    res.cookies.delete(`sb-${projectRef}-auth-token`)
    res.cookies.delete(`sb-${projectRef}-auth-token-key`)
  }

  return res
}
