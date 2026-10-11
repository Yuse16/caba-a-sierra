import { describe, expect, it } from "vitest"
import { chunkForSupabaseIn, SUPABASE_IN_QUERY_BATCH_SIZE } from "@/lib/admin-cabins/query-batching"

describe("chunkForSupabaseIn", () => {
  it("divide consultas largas sin perder ni duplicar valores", () => {
    const values = Array.from({ length: SUPABASE_IN_QUERY_BATCH_SIZE * 2 + 17 }, (_, index) => `id-${index}`)

    const chunks = chunkForSupabaseIn(values)

    expect(chunks.map((chunk) => chunk.length)).toEqual([
      SUPABASE_IN_QUERY_BATCH_SIZE,
      SUPABASE_IN_QUERY_BATCH_SIZE,
      17,
    ])
    expect(chunks.flat()).toEqual(values)
  })

  it("mantiene una consulta pequeña en un solo lote", () => {
    expect(chunkForSupabaseIn(["a", "b", "c"])).toEqual([["a", "b", "c"]])
  })

  it("rechaza tamaños de lote inválidos", () => {
    expect(() => chunkForSupabaseIn(["a"], 0)).toThrow("entero positivo")
  })
})
