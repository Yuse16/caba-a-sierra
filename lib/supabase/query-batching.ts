export async function collectInBatches<TInput, TOutput>(
  values: readonly TInput[],
  fetchBatch: (batch: readonly TInput[]) => Promise<readonly TOutput[]>,
  batchSize = 40,
): Promise<TOutput[]> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("El tamaño de lote debe ser un entero mayor a cero.")
  }

  const rows: TOutput[] = []
  for (let index = 0; index < values.length; index += batchSize) {
    const batch = values.slice(index, index + batchSize)
    rows.push(...await fetchBatch(batch))
  }
  return rows
}
