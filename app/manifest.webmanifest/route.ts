import { NextRequest, NextResponse } from "next/server"

const publicManifest = {
  id: "dupez-public",
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
  id: "dupez-panel",
  name: "Panel DUPEZ — Administración",
  short_name: "Panel DUPEZ",
  description: "Panel de administración para gestionar cabañas, reservaciones y clientes.",
  start_url: "/",
  scope: "/",
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
  const host = request.headers.get("host") ?? ""
  const isPanelHost = host.startsWith("panel.")

  return NextResponse.json(isPanelHost ? panelManifest : publicManifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
