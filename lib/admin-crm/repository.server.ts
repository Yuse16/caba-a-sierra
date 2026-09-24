import "server-only"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { inquiryStatusLabels, customerStatusLabels, type CrmCustomer, type CrmEvent, type CrmInquiry, type CrmNote, type PagedResult, type PublishedCabinOption } from "./types"
import type { Database } from "@/lib/supabase/database.types"

const PAGE_SIZE = 20
type Params = Record<string, string | undefined>
type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>
type InquiryRow = Database["public"]["Views"]["admin_inquiry_search"]["Row"]
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"]
const safePage = (value?: string) => Math.max(1, Math.min(100_000_000, Number.parseInt(value ?? "1", 10) || 1))
const pageInfo = (page: number, total: number) => ({ page, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) })
// PostgREST OR values are quoted, including escaped backslashes/quotes.
const pattern = (value: string) => JSON.stringify(`%${value.replace(/[%_*]/g, "")}%`)
const validId = (value?: string) => !!value && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const noteRows = (rows: Array<{ id: string; body: string; created_at: string }> | null): CrmNote[] => (rows ?? []).map(row => ({ id: row.id, body: row.body, createdAt: row.created_at }))

function mapInquiry(row: InquiryRow): CrmInquiry {
  return { id: row.id, cabinId: row.cabin_id, cabinName: row.cabin_name, customerId: row.customer_id,
    customerName: row.customer_name, phoneDisplay: row.phone_display, phoneE164: row.phone_e164,
    checkIn: row.check_in, checkOut: row.check_out, guests: row.guests, message: row.message, status: row.status, version: row.version,
    createdAt: row.created_at, updatedAt: row.updated_at, lastContactAt: row.last_contact_at, events: [], notes: [] }
}

export async function listCrmInquiries(input: Params): Promise<{ page: PagedResult<CrmInquiry>; selected: CrmInquiry | null; cabins: PublishedCabinOption[] }> {
  const supabase = await createSupabaseServerClient(), page = safePage(input.page), q = input.q?.trim() ?? ""
  let query = supabase.from("admin_inquiry_search").select("*", { count: "exact" })
  if (q) {
    const digits = q.replace(/\D/g, "")
    query = query.or(`customer_name.ilike.${pattern(q)},phone_display.ilike.${pattern(q)},cabin_name.ilike.${pattern(q)}${digits ? `,phone_e164.ilike.${pattern(digits)}` : ""}`)
  }
  if (input.status && Object.hasOwn(inquiryStatusLabels, input.status)) query = query.eq("status", input.status as CrmInquiry["status"])
  if (validId(input.cabin)) query = query.eq("cabin_id", input.cabin!)
  if (validDate(input.from)) query = query.gte("created_on", input.from!)
  if (validDate(input.to)) query = query.lte("created_on", input.to!)
  const ascending = input.sort === "oldest"
  const { data, error, count } = await query.order("created_at", { ascending }).order("id", { ascending }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw error
  const items = (data ?? []).map(mapInquiry)
  let selected: CrmInquiry | null = input.selected ? null : items[0] ?? null
  if (validId(input.selected)) {
    const detail = await supabase.from("admin_inquiry_search").select("*").eq("id", input.selected!).maybeSingle()
    if (detail.error) throw detail.error
    selected = detail.data ? mapInquiry(detail.data) : null
  }
  if (selected) selected = await inquiryDetail(supabase, selected, input)
  return { page: { items, ...pageInfo(page, count ?? 0) }, selected, cabins: await publishedCabins(supabase) }
}

async function inquiryDetail(supabase: Client, inquiry: CrmInquiry, input: Params) {
  const eventPage = safePage(input.eventsPage), notePage = safePage(input.notesPage)
  const [events, notes] = await Promise.all([
    supabase.from("inquiry_events").select("id,event_type,from_status,to_status,details,created_at", { count: "exact" }).eq("inquiry_id", inquiry.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range((eventPage - 1) * PAGE_SIZE, eventPage * PAGE_SIZE - 1),
    supabase.from("internal_notes").select("id,body,created_at", { count: "exact" }).eq("inquiry_id", inquiry.id).is("deleted_at", null).order("created_at", { ascending: false }).order("id", { ascending: false }).range((notePage - 1) * PAGE_SIZE, notePage * PAGE_SIZE - 1),
  ])
  if (events.error) throw events.error
  if (notes.error) throw notes.error
  return { ...inquiry, events: (events.data ?? []).map((event): CrmEvent => ({ id: event.id, type: event.event_type, fromStatus: event.from_status, toStatus: event.to_status, details: event.details as Record<string, unknown>, createdAt: event.created_at })), notes: noteRows(notes.data), eventPage: pageInfo(eventPage, events.count ?? 0), notePage: pageInfo(notePage, notes.count ?? 0) }
}

async function mapCustomer(supabase: Client, row: CustomerRow): Promise<CrmCustomer> {
  const [latest, first] = await Promise.all([
    supabase.from("booking_inquiries").select("created_at", { count: "exact" }).eq("customer_id", row.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1),
    supabase.from("booking_inquiries").select("created_at").eq("customer_id", row.id).order("created_at").order("id").limit(1),
  ])
  if (latest.error) throw latest.error
  if (first.error) throw first.error
  return { id: row.id, name: row.name, phoneDisplay: row.phone_display, phoneE164: row.phone_e164, email: row.email, status: row.commercial_status, version: row.version,
    firstInquiryAt: first.data?.[0]?.created_at ?? null, lastInquiryAt: latest.data?.[0]?.created_at ?? null, inquiryCount: latest.count ?? 0, lastInteractionAt: row.last_interaction_at, inquiries: [], notes: [] }
}

export async function listCrmCustomers(input: Params): Promise<{ page: PagedResult<CrmCustomer>; selected: CrmCustomer | null }> {
  const supabase = await createSupabaseServerClient(), page = safePage(input.page), q = input.q?.trim() ?? ""
  let query = supabase.from("customers").select("*", { count: "exact" }).is("deleted_at", null)
  if (q) {
    const digits = q.replace(/\D/g, "")
    query = query.or(`name.ilike.${pattern(q)},phone_display.ilike.${pattern(q)}${digits ? `,phone_e164.ilike.${pattern(digits)}` : ""}`)
  }
  if (input.status && Object.hasOwn(customerStatusLabels, input.status)) query = query.eq("commercial_status", input.status as CrmCustomer["status"])
  const { data, error, count } = await query.order("updated_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw error
  const items = await Promise.all((data ?? []).map(row => mapCustomer(supabase, row)))
  let selected: CrmCustomer | null = input.selected ? null : items[0] ?? null
  if (validId(input.selected)) {
    const detail = await supabase.from("customers").select("*").eq("id", input.selected!).is("deleted_at", null).maybeSingle()
    if (detail.error) throw detail.error
    selected = detail.data ? await mapCustomer(supabase, detail.data) : null
  }
  if (selected) selected = await customerDetail(supabase, selected, input)
  return { page: { items, ...pageInfo(page, count ?? 0) }, selected }
}

async function customerDetail(supabase: Client, customer: CrmCustomer, input: Params) {
  const historyPage = safePage(input.historyPage), notePage = safePage(input.notesPage)
  const [inquiries, notes] = await Promise.all([
    supabase.from("admin_inquiry_search").select("id,cabin_name,check_in,check_out,status,created_at", { count: "exact" }).eq("customer_id", customer.id).order("created_at", { ascending: false }).order("id", { ascending: false }).range((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE - 1),
    supabase.from("internal_notes").select("id,body,created_at", { count: "exact" }).eq("customer_id", customer.id).is("deleted_at", null).order("created_at", { ascending: false }).order("id", { ascending: false }).range((notePage - 1) * PAGE_SIZE, notePage * PAGE_SIZE - 1),
  ])
  if (inquiries.error) throw inquiries.error
  if (notes.error) throw notes.error
  return { ...customer, inquiries: (inquiries.data ?? []).map(item => ({ id: item.id, cabinName: item.cabin_name, checkIn: item.check_in, checkOut: item.check_out, status: item.status, createdAt: item.created_at })), notes: noteRows(notes.data),
    historyPage: pageInfo(historyPage, inquiries.count ?? 0), notePage: pageInfo(notePage, notes.count ?? 0) }
}

async function publishedCabins(supabase: Client): Promise<PublishedCabinOption[]> {
  const { data, error } = await supabase.from("cabins").select("id,name,slug").eq("publication_state", "published").is("deleted_at", null).order("name")
  if (error) throw error
  return data ?? []
}
