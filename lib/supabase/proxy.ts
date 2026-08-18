import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./database.types"
import { getSupabaseConfig, hasSupabaseConfig } from "./config"
import { getAuthCookieOptions } from "./cookie-options"

const panelRoute = (pathname: string) => pathname === "/panel" || pathname.startsWith("/panel/") || pathname === "/admin"

function unavailableResponse(request: NextRequest) {
  if (panelRoute(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("error", "configuration")
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next({ request })
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

  const { data } = await supabase.auth.getClaims()
  const pathname = request.nextUrl.pathname

  if (panelRoute(pathname) && !data?.claims) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("next", pathname.startsWith("/panel") ? pathname : "/panel")
    return NextResponse.redirect(loginUrl)
  }

  response.headers.set("Cache-Control", panelRoute(pathname) ? "private, no-store" : response.headers.get("Cache-Control") ?? "")
  return response
}
