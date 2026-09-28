import { createSupabasePublicClient } from "@/lib/supabase/public.server"

export const dynamic = "force-dynamic"

const CRON_SCHEDULE = "17 15 * * *"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get("authorization")

  if (secret) {
    return authorization === `Bearer ${secret}`
  }

  return request.headers.get("x-vercel-cron-schedule") === CRON_SCHEDULE
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const supabase = createSupabasePublicClient()

  const results = await Promise.all([
    supabase.from("public_site_config").select("business_name", { count: "exact", head: true }),
    supabase.from("public_cabins").select("id", { count: "exact", head: true }),
    supabase.from("public_promotions").select("id", { count: "exact", head: true }),
  ])

  const errors = results.flatMap((result) => result.error ? [result.error.message] : [])

  if (errors.length > 0) {
    console.error("DUPEZ Supabase keepalive failed", errors)
    return Response.json({ ok: false }, { status: 503 })
  }

  console.info("DUPEZ Supabase keepalive OK")
  return Response.json({ ok: true })
}
