import { redirect } from "next/navigation"
import { RequestsWorkspace } from "@/components/panel/requests-workspace"
import { requirePanelSession } from "@/lib/auth/session"
import { listCrmInquiries } from "@/lib/admin-crm/repository.server"
export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) { const session=await requirePanelSession(); if(session.role!=="admin") redirect("/panel/cabanas"); const params=await searchParams; const data=await listCrmInquiries(params); return <RequestsWorkspace key={data.selected?.id ?? "empty"} {...data} params={params}/> }
