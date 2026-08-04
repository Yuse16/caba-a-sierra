import {
  LayoutDashboard,
  Home,
  FileText,
  Users,
  MessageSquare,
  Settings,
  User,
  CircleHelp,
  CalendarDays,
  BookMarked,
  CreditCard,
  Sparkles,
  Wrench,
  Package,
  UserCog,
  Tag,
  BadgePercent,
  FileStack,
  BarChart3,
  ContactRound,
  BadgeCheck,
  HandCoins,
  type LucideIcon,
} from "lucide-react"

export type SectionKey =
  | "dashboard"
  | "cabanas"
  | "solicitudes"
  | "clientes"
  | "mensajes"
  | "configuracion"
  | "perfil"
  | "ayuda"
  | "calendario"
  | "reservaciones"
  | "pagos"
  | "limpieza"
  | "mantenimiento"
  | "inventario"
  | "personal"
  | "precios"
  | "promociones"
  | "servicios"
  | "paginas"
  | "reportes"
  | "propietarios"
  | "confirmaciones"
  | "comisiones"

export type NavItem = {
  key: SectionKey
  label: string
  icon: LucideIcon
  badge?: number
}

export type NavGroup = {
  title?: string
  items: NavItem[]
}

export const startNav: NavGroup[] = [
  {
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "cabanas", label: "Cabañas", icon: Home },
      { key: "promociones", label: "Promociones", icon: BadgePercent },
      { key: "propietarios", label: "Propietarios", icon: ContactRound },
      { key: "solicitudes", label: "Solicitudes", icon: FileText, badge: 8 },
      { key: "confirmaciones", label: "Confirmaciones", icon: BadgeCheck, badge: 3 },
      { key: "clientes", label: "Clientes", icon: Users },
      { key: "mensajes", label: "Mensajes", icon: MessageSquare },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "perfil", label: "Perfil", icon: User },
      { key: "ayuda", label: "Ayuda", icon: CircleHelp },
    ],
  },
]

export const proNav: NavGroup[] = [
  {
    items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Gestión",
    items: [
      { key: "cabanas", label: "Cabañas", icon: Home },
      { key: "propietarios", label: "Propietarios", icon: ContactRound },
      { key: "calendario", label: "Calendario", icon: CalendarDays },
      { key: "solicitudes", label: "Solicitudes", icon: FileText, badge: 5 },
      { key: "confirmaciones", label: "Confirmaciones", icon: BadgeCheck, badge: 3 },
      { key: "reservaciones", label: "Reservaciones", icon: BookMarked, badge: 24 },
      { key: "clientes", label: "Clientes", icon: Users },
      { key: "pagos", label: "Pagos", icon: CreditCard, badge: 12 },
      { key: "comisiones", label: "Comisiones", icon: HandCoins },
      { key: "reportes", label: "Reportes", icon: BarChart3 },
      { key: "mensajes", label: "Mensajes", icon: MessageSquare },
    ],
  },
  {
    title: "Operación",
    items: [
      { key: "limpieza", label: "Limpieza", icon: Sparkles, badge: 6 },
      { key: "mantenimiento", label: "Mantenimiento", icon: Wrench, badge: 4 },
      { key: "inventario", label: "Inventario", icon: Package },
      { key: "personal", label: "Personal", icon: UserCog },
    ],
  },
  {
    title: "Configuración",
    items: [
      { key: "precios", label: "Precios y temporadas", icon: Tag },
      { key: "promociones", label: "Promociones", icon: BadgePercent },
      { key: "servicios", label: "Servicios y amenidades", icon: Sparkles },
      { key: "paginas", label: "Páginas y contenido", icon: FileStack },
      { key: "configuracion", label: "Configuración general", icon: Settings },
    ],
  },
]
