import { describe, expect, it } from "vitest"
import { emptyAdminCabin, getMissingPublicationFields } from "@/lib/admin-cabins/types"

describe("admin cabin publication requirements", () => {
  it("does not require a per-cabin WhatsApp number", () => {
    const missing = getMissingPublicationFields({ ...emptyAdminCabin, whatsapp: "" })
    expect(missing).not.toContain("whatsapp")
  })
})
