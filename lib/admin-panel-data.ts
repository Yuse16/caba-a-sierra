import type { Cabin, ClientRequest, Owner, Payment, Promotion, Reservation, CalendarBar } from "@/lib/demo-data"

export type AdminPanelInitialData = {
  cabins: Cabin[]
  owners: Owner[]
  requests: ClientRequest[]
  reservations: Reservation[]
  payments: Payment[]
  cleaningTasks: { id: string; cabin: string; assignee: string; when: string; status: string }[]
  maintenanceTasks: { id: string; cabin: string; issue: string; when: string; status: string; priority: string }[]
  promotions: Promotion[]
  seasons: { id: string; name: string; months: string; modifier: string; color: string }[]
  recentActivity: { id: string; type: string; title: string; detail: string; time: string }[]
  pendingTasks: { id: string; title: string; cabin: string; when: string; status: string }[]
  upcomingArrivals: { id: string; client: string; cabin: string; dates: string; guests: number; status: string }[]
  calendarDays: { date: string; dow: string }[]
  calendarCabins: { id: string; name: string; image: string; capacity: string }[]
  calendarBookings: Record<string, CalendarBar[]>
}
