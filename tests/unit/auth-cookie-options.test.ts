import { describe, expect, it } from "vitest"
import { getAuthCookieOptions } from "@/lib/supabase/cookie-options"

describe("cookies de autenticación", () => {
  it("son HttpOnly, SameSite=Lax y Secure en producción", () => {
    expect(getAuthCookieOptions("production")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    })
  })

  it("permiten HTTP únicamente en desarrollo y pruebas locales", () => {
    expect(getAuthCookieOptions("development").secure).toBe(false)
    expect(getAuthCookieOptions("test").secure).toBe(false)
  })
})
