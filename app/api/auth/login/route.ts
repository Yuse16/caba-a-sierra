import { NextResponse } from "next/server"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { safePanelRedirect } from "@/lib/auth/redirects"

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "El acceso seguro todavía no está configurado en este entorno." })
  }

  const body = await request.json()
  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const next = safePanelRedirect(body.next)

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ ok: false, error: "Revisa el correo y la contraseña." })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ ok: false, error: "No pudimos iniciar sesión con esos datos." })

    return NextResponse.json({ ok: true, redirect: next })
  } catch (err) {
    console.error("POST /api/auth/login", err)
    return NextResponse.json({ ok: false, error: "Ocurrió un error inesperado." })
  }
}
