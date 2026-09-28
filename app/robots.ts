import type { MetadataRoute } from "next"

function productionOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  try {
    return new URL(configured || (vercelProduction ? `https://${vercelProduction}` : ""))
  } catch {
    return null
  }
}

export default function robots(): MetadataRoute.Robots {
  const origin = productionOrigin()

  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/admin", "/login", "/recuperar-contrasena", "/actualizar-contrasena", "/api", "/auth"],
    },
  ]

  if (!origin) return { rules }
  return {
    rules,
    sitemap: `${origin.origin}/sitemap.xml`,
    host: origin.origin,
  }
}