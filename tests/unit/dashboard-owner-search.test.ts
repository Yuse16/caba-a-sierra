import { describe, expect, it } from "vitest"
import {
  filterDashboardOwners,
  type DashboardSearchOwner,
  type DashboardSearchCabin,
} from "@/lib/dashboard-owner-search"

const owners: DashboardSearchOwner[] = [
  { id: "owner-1", name: "José Álvarez", phone: "844 123 4567", whatsapp: "52 844 123 4567", email: "jose@example.mx", notes: "Llamar por la mañana" },
  { id: "owner-2", name: "María García", phone: "844 999 0000", whatsapp: "", email: "", notes: "Solo grupos grandes" },
  { id: "owner-3", name: "Sin cabaña", phone: "", whatsapp: "", notes: "" },
]
const cabins: DashboardSearchCabin[] = [
  { id: "cab-1", name: "Refugio del Pino", location: "Arteaga", ownerId: "owner-1" },
  { id: "cab-2", name: "Cabaña Mirador", location: "San Antonio", ownerId: "owner-1" },
  { id: "cab-3", name: "Bosque Azul", location: "Arteaga", ownerId: "owner-2" },
  { id: "cab-4", name: "Sin dueño", location: "Arteaga", ownerId: "" },
]

describe("búsqueda de propietarios desde Dashboard", () => {
  it("no despliega información personal sin que se busque", () => {
    expect(filterDashboardOwners(owners, cabins, "   ")).toEqual([])
  })
  it("encuentra nombres sin distinguir acentos ni mayúsculas", () => {
    const results = filterDashboardOwners(owners, cabins, "JOSE")
    expect(results.map(({ owner }) => owner.id)).toEqual(["owner-1"])
    expect(results[0]?.cabins.map(({ id }) => id)).toEqual(["cab-1", "cab-2"])
  })
  it("encuentra por parte del teléfono o WhatsApp con formato", () => {
    expect(filterDashboardOwners(owners, cabins, "8441234567")[0]?.owner.id).toBe("owner-1")
    expect(filterDashboardOwners(owners, cabins, "999 0000")[0]?.owner.id).toBe("owner-2")
  })
  it("encuentra por correo o por nombre de su cabaña", () => {
    expect(filterDashboardOwners(owners, cabins, "jose@example.mx")[0]?.owner.id).toBe("owner-1")
    expect(filterDashboardOwners(owners, cabins, "refugio pino")[0]?.owner.id).toBe("owner-1")
    expect(filterDashboardOwners(owners, cabins, "bosque")[0]?.owner.id).toBe("owner-2")
  })
  it("permite combinar propietario y ubicación y busca en observaciones", () => {
    expect(filterDashboardOwners(owners, cabins, "jose arteaga")[0]?.owner.id).toBe("owner-1")
    expect(filterDashboardOwners(owners, cabins, "mañana")[0]?.owner.id).toBe("owner-1")
  })
  it("maneja propietarios sin cabañas y resultados vacíos", () => {
    expect(filterDashboardOwners(owners, cabins, "sin cabaña")[0]?.cabins).toEqual([])
    expect(filterDashboardOwners(owners, cabins, "inexistente")).toEqual([])
  })
})
