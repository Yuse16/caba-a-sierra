export type DashboardSearchOwner = {
  id: string
  name: string
  phone: string
  whatsapp: string
  email?: string
  notes: string
}

export type DashboardSearchCabin = {
  id: string
  name: string
  location: string
  ownerId: string
}

export type DashboardOwnerResult<
  TOwner extends DashboardSearchOwner,
  TCabin extends DashboardSearchCabin,
> = { owner: TOwner; cabins: TCabin[] }

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX").trim()
}

export function filterDashboardOwners<
  TOwner extends DashboardSearchOwner,
  TCabin extends DashboardSearchCabin,
>(
  owners: TOwner[],
  cabins: TCabin[],
  query: string,
): DashboardOwnerResult<TOwner, TCabin>[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  return owners.flatMap((owner) => {
    const ownedCabins = cabins.filter((cabin) => cabin.ownerId === owner.id && Boolean(owner.id))
    const searchable = [
      owner.name, owner.phone, owner.whatsapp, owner.email ?? "", owner.notes,
      ...ownedCabins.flatMap((cabin) => [cabin.name, cabin.location]),
    ]
    const haystack = normalize(searchable.join(" "))
    const phones = [owner.phone, owner.whatsapp].map((value) => value.replace(/\D/g, "")).join(" ")
    const matches = terms.every((term) =>
      haystack.includes(term) || (/^\d+$/.test(term) && phones.includes(term)),
    )

    return matches ? [{ owner, cabins: ownedCabins }] : []
  })
}
