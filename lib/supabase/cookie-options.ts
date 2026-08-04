import type { CookieOptionsWithName } from "@supabase/ssr"

export function getAuthCookieOptions(nodeEnv = process.env.NODE_ENV): CookieOptionsWithName {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: nodeEnv === "production",
  }
}
