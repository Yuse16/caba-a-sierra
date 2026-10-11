export const SUPABASE_IN_QUERY_BATCH_SIZE = 100

export function chunkForSupabaseIn<T>(values: readonly T[], batchSize = SUPABASE_IN_QUERY_BATCH_SIZE): T[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("El tamaño de lote debe ser un entero positivo.")
  }

  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += batchSize) {
    chunks.push(values.slice(index, index + batchSize))
  }
  return chunks
}
