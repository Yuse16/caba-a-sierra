import { describe, expect, it, vi } from "vitest"
import { collectInBatches } from "@/lib/supabase/query-batching"

describe("PostgREST query batching", () => {
  it("divide listas grandes y agrega todos los resultados en orden", async () => {
    const values = Array.from({ length: 101 }, (_, index) => `id-${index + 1}`)
    const fetchBatch = vi.fn(async (batch: readonly string[]) => batch.map((id) => ({ id })))

    const rows = await collectInBatches(values, fetchBatch, 40)

    expect(fetchBatch).toHaveBeenCalledTimes(3)
    expect(fetchBatch.mock.calls.map(([batch]) => batch.length)).toEqual([40, 40, 21])
    expect(rows.map((row) => row.id)).toEqual(values)
  })

  it("no ejecuta consultas cuando no hay valores", async () => {
    const fetchBatch = vi.fn(async (batch: readonly string[]) => batch)

    await expect(collectInBatches([], fetchBatch, 40)).resolves.toEqual([])
    expect(fetchBatch).not.toHaveBeenCalled()
  })

  it("rechaza un tamaño de lote inválido", async () => {
    await expect(collectInBatches(["a"], async (batch) => batch, 0)).rejects.toThrow(/lote/i)
  })
})
