import { describe, expect, it } from "vitest"
import { matchesOwnerContact, type OwnerContact } from "@/components/panel/owner-contact-search"

const owner: OwnerContact = {
  ownerId: "owner-1",
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

  it("matches by phone", () => {
    expect(matchesOwnerContact(owner, "111 2233")).toBe(true)
  })

  it("does not match unrelated text", () => {
    expect(matchesOwnerContact(owner, "mirador azul")).toBe(false)
  })
})
