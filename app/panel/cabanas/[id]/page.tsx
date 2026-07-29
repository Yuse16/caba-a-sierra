import { EditCabinForm } from "@/components/panel/cabin-form"

export default async function EditCabinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditCabinForm id={id} />
}
