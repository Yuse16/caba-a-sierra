import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { updateSupabaseSession } from "@/lib/supabase/proxy"

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  if (host.startsWith("panel.") && request.nextUrl.pathname === "/") {
    const panelUrl = new URL("/panel", `https://${host}`)
    return NextResponse.redirect(panelUrl)
  }
  return updateSupabaseSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
