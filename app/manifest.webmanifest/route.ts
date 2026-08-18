import { NextRequest, NextResponse } from "next/server"

const publicManifest = {
  name: "DUPEZ — Renta de cabañas en toda la Sierra de Arteaga",
  short_name: "DUPEZ",
  description:
    "Encuentra y reserva cabañas en la Sierra de Arteaga. Conoce opciones, disponibilidad y promociones de DUPEZ.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#f5f1e7",
  theme_color: "#2f5741",
  orientation: "portrait",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}

const panelManifest = {
  name: "Panel DUPEZ — Administración",
  short_name: "Panel DUPEZ",
  description: "Panel de administración para gestionar cabañas, reservaciones y clientes.",
  start_url: "/panel",
  scope: "/panel",
  display: "standalone",
  background_color: "#f5f1e7",
  theme_color: "#2f5741",
  orientation: "portrait",
  icons: [
    { src: "/panel-icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/panel-icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/panel-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}

export const dynamic = "force-dynamic"

export function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope")
  const referer = request.headers.get("referer") ?? ""
  const isPanel = scope === "panel" || referer.includes("/panel")

  return NextResponse.json(isPanel ? panelManifest : publicManifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
