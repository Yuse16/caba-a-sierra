import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./database.types"
import { getSupabaseConfig, hasSupabaseConfig } from "./config"
import { getAuthCookieOptions } from "./cookie-options"
import { configurationLoginUrl, isPanelRoute } from "@/lib/auth/redirects"

function unavailableResponse(request: NextRequest) {
  const target = configurationLoginUrl(request.nextUrl.pathname)
  if (!target) return NextResponse.next({ request })
  const loginUrl = request.nextUrl.clone()
  const [path, rawQuery] = target.split("?")
  loginUrl.pathname = path
  loginUrl.search = `?${rawQuery ?? ""}`
  return NextResponse.redirect(loginUrl)
}

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasSupabaseConfig()) return unavailableResponse(request)

  const { url, anonKey } = getSupabaseConfig()
  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(url, anonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  let claimsData
  try {
    const result = await supabase.auth.getClaims()
    claimsData = result.data
  } catch (err) {
    console.error("proxy: getClaims failed", err)
    return NextResponse.next({ request })
  }

  const pathname = request.nextUrl.pathname

  if (isPanelRoute(pathname) && !claimsData?.claims) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("next", pathname.startsWith("/panel") ? pathname : "/panel")
    return NextResponse.redirect(loginUrl)
  }

  response.headers.set("Cache-Control", isPanelRoute(pathname) ? "private, no-store" : response.headers.get("Cache-Control") ?? "")
  return response
}
