const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}
