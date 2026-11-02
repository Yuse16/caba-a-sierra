import { redirect } from "next/navigation"
import { ClientPage } from "@/components/client/client-page"
import { getPublicCabins, getPublicPromotions } from "@/lib/public-content.server"
import { getPublicSiteSettings } from "@/lib/public-site-settings.server"
import { searchQueryToState } from "@/lib/public-search"
import { toPublicCabinSummary } from "@/lib/public-cabin-summary"

type PublicPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: PublicPageProps) {
  const params = await searchParams

  if (params.vista !== undefined || params.version !== undefined) {
    redirect("/")
  }

  const initialSearch = searchQueryToState(params)
  const [cabins, promotions, settings] = await Promise.all([
    getPublicCabins(),
    getPublicPromotions(),
    getPublicSiteSettings(),
  ])
  const cabinSummaries = cabins.map(toPublicCabinSummary)
  return (
    <ClientPage
      cabins={cabinSummaries}
      promotions={promotions}
      settings={settings}
      initialSearch={initialSearch}
    />
  )
}