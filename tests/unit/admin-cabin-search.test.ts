import { describe, expect, it } from "vitest"
import { filterAdminCabins } from "@/lib/admin-cabins/search"
import { emptyAdminCabin, type AdminCabin } from "@/lib/admin-cabins/types"

const cabins: AdminCabin[] = [
  {
    ...emptyAdminCabin,
    id: "a",
    createdAt: "",
    updatedAt: "",
    name: "Cabaña Árbol",
    location: "Arteaga",
    zone: "Los Lirios",
    owner: {
      id: "o1", name: "José Pérez", phone: "844 111 2222",
      whatsapp: "528441112222", email: "owner@example.test",
      preferredContact: "whatsapp", notes: "", contactHours: "",
    },
  },
  {
    ...emptyAdminCabin,
    id: "b",
    createdAt: "",
    updatedAt: "",
    name: "Refugio Norte",
    location: "San Antonio de las Alazanas",
    address: "Camino del Bosque 20",
    whatsapp: "528443334444",
    owner: null,
  },
]

describe("buscador del panel de cabañas", () => {
  it("encuentra por nombre sin depender de mayúsculas ni acentos", () => {
    expect(filterAdminCabins(cabins, "  arbol " ).map(c => c.id)).toEqual(["a"])
  })

  it("encuentra por propietario y ubicación, incluyendo varias palabras", () => {
    expect(filterAdminCabins(cabins, "jose arteaga").map(c => c.id)).toEqual(["a"])
    expect(filterAdminCabins(cabins, "alazanas").map(c => c.id)).toEqual(["b"])
  })

  it("encuentra por teléfono o WhatsApp ignorando espacios y prefijo", () => {
    expect(filterAdminCabins(cabins, "8441112222").map(c => c.id)).toEqual(["a"])
    expect(filterAdminCabins(cabins, "3334444").map(c => c.id)).toEqual(["b"])
  })

  it("conserva el orden y muestra todos si la búsqueda está vacía", () => {
    expect(filterAdminCabins(cabins, "  ")).toEqual(cabins)
    expect(filterAdminCabins(cabins, "inexistente")).toEqual([])
  })
})
