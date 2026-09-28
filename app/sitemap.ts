import type { MetadataRoute } from "next"

function productionOriginUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  try {
    return new URL(configured || (vercelProduction ? `https://${vercelProduction}` : ""))
  } catch {
    return null
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = productionOriginUrl()
  if (!origin) return []
  return [
    {
      url: origin.origin,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}