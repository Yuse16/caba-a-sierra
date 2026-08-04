import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import { getSupabaseConfig } from "./config"
import { getAuthCookieOptions } from "./cookie-options"

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot persist refreshed cookies. proxy.ts does it.
        }
      },
    },
  })
}
