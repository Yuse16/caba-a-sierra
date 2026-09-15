import "server-only"

import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createSupabasePublicClient } from "@/lib/supabase/public.server"
import { defaultPublicSiteSettings, officeMapsValid, type PublicSiteSettings } from "@/lib/public-site-settings"

export async function getPublicSiteSettings() {
  if (!hasSupabaseConfig()) return defaultPublicSiteSettings

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from("public_site_config")
    .select("business_name,subtitle,tagline,logo_url,hero_image_url,public_whatsapp,public_phone,public_email,general_location,business_hours,office_address,office_maps_url,timezone,currency")

  if (error || !Array.isArray(data) || data.length === 0) {
    console.error("No pudimos consultar la configuración pública.", error)
    return defaultPublicSiteSettings
  }

  const row = data[0]
  const whatsappNumber = (typeof row.public_whatsapp === "string" && row.public_whatsapp.trim()
    ? row.public_whatsapp.trim().replace(/\D/g, "")
    : defaultPublicSiteSettings.whatsappNumber) || defaultPublicSiteSettings.whatsappNumber
  const whatsappUrl = `https://wa.me/${whatsappNumber}`
  const phoneDisplay = typeof row.public_phone === "string" && row.public_phone.trim()
    ? row.public_phone.trim()
    : defaultPublicSiteSettings.phoneDisplay
  const officeMaps = typeof row.office_maps_url === "string" && officeMapsValid(row.office_maps_url)
    ? row.office_maps_url
    : ""

  return {
    businessName: typeof row.business_name === "string" && row.business_name.trim() ? row.business_name : defaultPublicSiteSettings.businessName,
    subtitle: typeof row.subtitle === "string" && row.subtitle.trim() ? row.subtitle : defaultPublicSiteSettings.subtitle,
    tagline: typeof row.tagline === "string" && row.tagline.trim() ? row.tagline : defaultPublicSiteSettings.tagline,
    logoUrl: typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url : defaultPublicSiteSettings.logoUrl,
    heroImageUrl: typeof row.hero_image_url === "string" && row.hero_image_url.trim() ? row.hero_image_url : defaultPublicSiteSettings.heroImageUrl,
    whatsappNumber,
    whatsappUrl,
    phoneDisplay,
    phoneHref: `tel:+${whatsappNumber}`,
    email: typeof row.public_email === "string" && row.public_email.trim() ? row.public_email.trim() : defaultPublicSiteSettings.email,
    generalLocation: typeof row.general_location === "string" && row.general_location.trim() ? row.general_location : defaultPublicSiteSettings.generalLocation,
    businessHours: typeof row.business_hours === "string" && row.business_hours.trim() ? row.business_hours : defaultPublicSiteSettings.businessHours,
    officeAddress: typeof row.office_address === "string" && row.office_address.trim() ? row.office_address : "",
    officeMapsUrl: officeMaps,
    currency: typeof row.currency === "string" && row.currency.trim() ? row.currency : defaultPublicSiteSettings.currency,
    timezone: typeof row.timezone === "string" && row.timezone.trim() ? row.timezone : defaultPublicSiteSettings.timezone,
  } satisfies PublicSiteSettings
}