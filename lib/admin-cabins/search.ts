import type { AdminCabin } from "./types"

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("es-MX")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function filterAdminCabins(cabins: AdminCabin[], query: string): AdminCabin[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return cabins

  return cabins.filter((cabin) => {
    const owner = cabin.owner
    const fields = [
      cabin.name, cabin.location, cabin.zone, cabin.address, cabin.whatsapp,
      owner?.name, owner?.phone, owner?.whatsapp, owner?.email,
    ].filter((item): item is string => Boolean(item))
    const haystack = normalize(fields.join(" "))
    const numbers = fields.map((field) => field.replace(/\D/g, "")).join(" ")

    return terms.every((term) =>
      haystack.includes(term) ||
      (/^\d+$/.test(term) && numbers.includes(term)),
    )
  })
}
