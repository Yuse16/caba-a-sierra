import { spawnSync } from "node:child_process"
import { createSerwistRoute } from "@serwist/turbopack"

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ?? crypto.randomUUID()

const largeCabinFallbacks = [
  "public/cabins/valle-escondido.png",
  "public/cabins/sierra-alta.png",
  "public/cabins/niebla.png",
  "public/cabins/mirador.png",
  "public/cabins/mirador-montana.png",
  "public/cabins/los-encinos.png",
  "public/cabins/bosque-real.png",
]

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  globIgnores: largeCabinFallbacks,
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
})
