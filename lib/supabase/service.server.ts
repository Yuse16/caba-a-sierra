import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { getSupabaseConfig } from "./config"

export function createSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.")
  const { url } = getSupabaseConfig()
  return createClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } })
}
