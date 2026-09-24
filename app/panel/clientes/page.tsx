import { redirect } from "next/navigation"
import { CustomersWorkspace } from "@/components/panel/customers-workspace"
import { requirePanelSession } from "@/lib/auth/session"
import { listCrmCustomers } from "@/lib/admin-crm/repository.server"
export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) { const session=await requirePanelSession(); if(session.role!=="admin") redirect("/panel/cabanas"); const params=await searchParams; const data=await listCrmCustomers(params); return <CustomersWorkspace key={data.selected?.id ?? "empty"} {...data} params={params}/> }
