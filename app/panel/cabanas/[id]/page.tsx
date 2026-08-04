import { EditCabinForm } from "@/components/panel/cabin-form"

export default async function EditCabinPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return <EditCabinForm id={id} created={query.created === "1"} />
}
