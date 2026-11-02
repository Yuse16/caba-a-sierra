import { describe, expect, it } from "vitest"
import { assertSameOrigin } from "@/lib/http/same-origin"

describe("assertSameOrigin", () => {
  it("accepts the public origin behind a reverse proxy", () => {
    const request = new Request("http://127.0.0.1:3000/api/media/upload", {
      headers: {
        origin: "https://dupez.uk",
        host: "dupez.uk",
        "x-forwarded-proto": "https",
      },
    })
    expect(() => assertSameOrigin(request)).not.toThrow()
  })

  it("accepts x-forwarded-host when the proxy rewrites Host", () => {
    const request = new Request("http://127.0.0.1:3000/api/media/upload", {
      headers: {
        origin: "https://dupez.uk",
        host: "127.0.0.1:3000",
        "x-forwarded-host": "dupez.uk",
        "x-forwarded-proto": "https",
      },
    })
    expect(() => assertSameOrigin(request)).not.toThrow()
  })

  it("rejects a foreign origin", () => {
    const request = new Request("http://127.0.0.1:3000/api/media/upload", {
      headers: {
        origin: "https://evil.example",
        host: "dupez.uk",
        "x-forwarded-proto": "https",
      },
    })
    expect(() => assertSameOrigin(request)).toThrow(/origen válido/)
  })
})
