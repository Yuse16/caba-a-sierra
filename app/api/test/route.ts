import { NextResponse } from "next/server"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    if (!hasSupabaseConfig()) return NextResponse.json({ ok: false, error: "no supabase config" })
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getClaims()
    return NextResponse.json({ ok: !error, data, error: error?.message })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) })
  }
}
