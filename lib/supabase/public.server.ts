import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { getSupabaseConfig } from "./config"

export function createSupabasePublicClient() {
  const { url, anonKey } = getSupabaseConfig()

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { "X-Client-Info": "cabanas-sierra-norte-public" },
    },
  })
}
