import fs from "node:fs/promises"
import path from "node:path"

export const fixturePath = path.join(process.cwd(), "test-results", "auth-fixture.json")

export type AuthFixture = {
  admin: { id: string; email: string; password: string }
  editor: { id: string; email: string; password: string }
  inactive: { id: string; email: string; password: string }
  promotionLegacyId: string
  promotionName: string
}

export async function readAuthFixture(): Promise<AuthFixture> {
  return JSON.parse(await fs.readFile(fixturePath, "utf8")) as AuthFixture
}
