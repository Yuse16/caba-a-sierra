import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { readFile, rename, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

function storePath(key: string) {
  const workspace = createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12)
  return path.join(tmpdir(), `cabanas-sierra-norte-${workspace}-${key}.json`)
}

export function createDevelopmentJsonStore<Value>(key: string, seed: () => Value, clone: (value: Value) => Value) {
  const filePath = storePath(key)

  return {
    async read() {
      try {
        return clone(JSON.parse(await readFile(filePath, "utf8")) as Value)
      } catch (error) {
        const code = error instanceof Error && "code" in error ? (error as NodeJS.ErrnoException).code : undefined
        if (code !== "ENOENT" && !(error instanceof SyntaxError)) throw error
        return clone(seed())
      }
    },
    async write(value: Value) {
      const temporaryPath = `${filePath}.${randomUUID()}.tmp`
      await writeFile(temporaryPath, JSON.stringify(value), { encoding: "utf8", mode: 0o600 })
      await rename(temporaryPath, filePath)
      return clone(value)
    },
  }
}
