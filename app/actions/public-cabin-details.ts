"use server"

import type { PublicCabin } from "@/lib/public-cabins"
import { getPublicCabins } from "@/lib/public-content.server"

export type PublicCabinDetailResult =
  | { ok: true; data: PublicCabin }
  | { ok: false; message: string }

export async function getPublicCabinDetailAction(id: string): Promise<PublicCabinDetailResult> {
  if (!id) return { ok: false, message: "No pudimos identificar la cabaña." }

  const cabin = (await getPublicCabins()).find((entry) => entry.id === id)
  if (!cabin) return { ok: false, message: "La cabaña ya no está disponible." }

  return { ok: true, data: cabin }
}
