import { EditPromotionForm } from "@/components/panel/promotion-form"

export default async function EditPromotionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return <EditPromotionForm id={id} created={query.created === "1"} />
}
