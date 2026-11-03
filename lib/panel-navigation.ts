export const panelNavigationLinks = [
  { href: "/panel", label: "Inicio" },
  { href: "/panel/cabanas", label: "Cabañas" },
  { href: "/panel/promociones", label: "Promociones" },
  { href: "/panel/solicitudes", label: "Solicitudes" },
  { href: "/panel/clientes", label: "Clientes" },
  { href: "/panel/configuracion", label: "Configuración" },
] as const

export function getPanelBackHref(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/"
  if (path === "/panel") return "/"
  if (/^\/panel\/(cabanas|promociones)\/[^/]+$/.test(path)) {
    return path.substring(0, path.lastIndexOf("/"))
  }
  return "/panel"
}
