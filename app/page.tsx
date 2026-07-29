import { redirect } from "next/navigation"
import { ClientPage } from "@/components/client/client-page"

type PublicPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: PublicPageProps) {
  const params = await searchParams

  if (params.vista !== undefined || params.version !== undefined) {
    redirect("/")
  }

  return <ClientPage />
}
