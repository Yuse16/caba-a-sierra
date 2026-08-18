import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
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
      {
        src: "/panel-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/panel-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/panel-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  })
}
