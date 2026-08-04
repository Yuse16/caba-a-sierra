import { redirect } from "next/navigation"
import { ClientPage } from "@/components/client/client-page"
import { getPublicCabins, getPublicPromotions } from "@/lib/public-content.server"

type PublicPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: PublicPageProps) {
  const params = await searchParams

  if (params.vista !== undefined || params.version !== undefined) {
    redirect("/")
  }

  const [cabins, promotions] = await Promise.all([getPublicCabins(), getPublicPromotions()])
  return <ClientPage cabins={cabins} promotions={promotions} />
}
