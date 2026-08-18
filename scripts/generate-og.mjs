import sharp from "sharp"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const brand = "DUPEZ"
const tagline = "Renta de cabañas en toda la Sierra de Arteaga"

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#356045"/>
      <stop offset="55%" stop-color="#24472f"/>
      <stop offset="100%" stop-color="#14271a"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <circle cx="940" cy="150" r="64" fill="#f4d58b" opacity="0.16"/>
  <circle cx="940" cy="150" r="88" fill="#f4d58b" opacity="0.07"/>

  <path d="M0 470 L190 330 L340 460 L520 300 L700 460 L880 340 L1060 470 L1200 420 L1200 630 L0 630 Z" fill="#2d5439" opacity="0.7"/>
  <path d="M0 560 L210 430 L380 560 L590 410 L800 560 L1000 450 L1200 550 L1200 630 L0 630 Z" fill="#0f2114"/>

  <rect x="552" y="196" width="96" height="5" rx="2.5" fill="#f0c66a"/>

  <text x="600" y="344" font-family="Georgia, 'Times New Roman', serif" font-size="128" font-weight="700" letter-spacing="10" fill="#ffffff" text-anchor="middle">${brand}</text>

  <text x="600" y="410" font-family="'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="400" letter-spacing="1" fill="#efe6cf" text-anchor="middle">${tagline}</text>
</svg>`

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "og.png")
await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`Generado: ${out}`)
