import { describe, expect, it } from "vitest"

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es-MX")
}

type OwnerContact = {
  ownerName: string
  ownerPhone: string
  ownerWhatsApp: string
  cabinNames: string[]
}

function matchesOwnerContact(owner: OwnerContact, query: string) {
  const normalizedQuery = normalize(query)
  return [owner.ownerName, owner.ownerPhone, owner.ownerWhatsApp, ...owner.cabinNames]
    .some((value) => normalize(value).includes(normalizedQuery))
}

const owner = {
  ownerName: "María González",
  ownerPhone: "844 111 2233",
  ownerWhatsApp: "528441112233",
  cabinNames: ["El Pinar", "Cabaña Encino"],
}

describe("owner contact search", () => {
  it("matches by cabin name", () => {
    expect(matchesOwnerContact(owner, "pinar")).toBe(true)
  })

  it("matches by owner name", () => {
    expect(matchesOwnerContact(owner, "maría")).toBe(true)
  })

  it("does not match unrelated text", () => {
    expect(matchesOwnerContact(owner, "mirador azul")).toBe(false)
  })
})
