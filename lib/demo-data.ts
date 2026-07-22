// Datos simulados locales para la demo.
// Estructura pensada para migrarse fácilmente a Supabase (ids, campos planos).

export type CabinStatus =
  | "por-confirmar"
  | "alta-demanda"
  | "propietario-contactado"
  | "confirmada"
  | "no-disponible"

export type PreferredContactMethod = "WhatsApp" | "Llamada" | "Mensaje"

export type CabinOwnerFields = {
  ownerId: string
  ownerName: string
  ownerPhone: string
  ownerWhatsApp: string
  ownerNotes: string
  agreedCommission: number
  lastAvailabilityCheck: string
  preferredContactMethod: PreferredContactMethod
}

export type Owner = {
  id: string
  name: string
  phone: string
  whatsapp: string
  notes: string
  agreedCommission: number
  lastContact: string
  preferredContactMethod: PreferredContactMethod
}

export type CabinCategory = "parejas" | "familiar" | "grupos" | "chimenea" | "pet-friendly" | "bosque"

export type Cabin = CabinOwnerFields & {
  id: string
  name: string
  slug: string
  location: string
  image: string
  status: CabinStatus
  price: number
  oldPrice?: number
  discountPct?: number
  minGuests: number
  maxGuests: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  categories: CabinCategory[]
  rating: number
  reviews: number
  badge?: "popular" | "oferta"
  description: string
  type: "romantica" | "familiar" | "grupal" | "premium"
}

const robertoOwner: CabinOwnerFields = {
  ownerId: "owner-01",
  ownerName: "Roberto Martínez",
  ownerPhone: "844 123 4567",
  ownerWhatsApp: "528441234567",
  ownerNotes: "Prefiere recibir mensajes por WhatsApp y confirmar antes de las 18:00.",
  agreedCommission: 10,
  lastAvailabilityCheck: "Hoy, 12:30",
  preferredContactMethod: "WhatsApp",
}

const lauraOwner: CabinOwnerFields = {
  ownerId: "owner-02",
  ownerName: "Laura Hernández",
  ownerPhone: "844 234 5678",
  ownerWhatsApp: "528442345678",
  ownerNotes: "Atiende llamadas por la mañana. Solicita mínimo dos noches en fin de semana.",
  agreedCommission: 12,
  lastAvailabilityCheck: "Ayer, 17:45",
  preferredContactMethod: "Llamada",
}

const miguelOwner: CabinOwnerFields = {
  ownerId: "owner-03",
  ownerName: "Miguel Salazar",
  ownerPhone: "844 345 6789",
  ownerWhatsApp: "528443456789",
  ownerNotes: "Responde rápido por WhatsApp. Requiere anticipo después de confirmar fechas.",
  agreedCommission: 10,
  lastAvailabilityCheck: "Hoy, 09:10",
  preferredContactMethod: "WhatsApp",
}

const patriciaOwner: CabinOwnerFields = {
  ownerId: "owner-04",
  ownerName: "Patricia Gómez",
  ownerPhone: "844 456 7890",
  ownerWhatsApp: "528444567890",
  ownerNotes: "Prefiere un resumen por mensaje con fechas, huéspedes y necesidades especiales.",
  agreedCommission: 15,
  lastAvailabilityCheck: "Hace 3 días",
  preferredContactMethod: "Mensaje",
}

const ownerFields = [robertoOwner, lauraOwner, miguelOwner, patriciaOwner]

export const owners: Owner[] = ownerFields.map((owner) => ({
  id: owner.ownerId,
  name: owner.ownerName,
  phone: owner.ownerPhone,
  whatsapp: owner.ownerWhatsApp,
  notes: owner.ownerNotes,
  agreedCommission: owner.agreedCommission,
  lastContact: owner.lastAvailabilityCheck,
  preferredContactMethod: owner.preferredContactMethod,
}))

export const cabins: Cabin[] = [
  {
    id: "cab-01",
    name: "Cabaña Bosque Real",
    slug: "bosque-real",
    location: "Arteaga, Coahuila",
    image: "/cabins/bosque-real.png",
    status: "por-confirmar",
    price: 2800,
    minGuests: 2,
    maxGuests: 6,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["Chimenea", "WiFi", "Asador"],
    categories: ["familiar", "chimenea", "bosque"],
    rating: 4.8,
    reviews: 128,
    description:
      "Una cabaña acogedora entre pinos con chimenea de leña, terraza de madera y vistas al bosque. Ideal para escapadas familiares tranquilas.",
    type: "familiar",
    ...robertoOwner,
  },
  {
    id: "cab-02",
    name: "Refugio del Pino",
    slug: "refugio-pino",
    location: "Arteaga, Coahuila",
    image: "/cabins/refugio-pino.png",
    status: "confirmada",
    price: 2200,
    minGuests: 2,
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Chimenea", "Cocina", "Vista"],
    categories: ["parejas", "chimenea", "bosque"],
    rating: 4.7,
    reviews: 96,
    description:
      "Refugio íntimo tipo A-frame perfecto para parejas. Noches cálidas junto a la chimenea y amaneceres entre la niebla del bosque.",
    type: "romantica",
    ...lauraOwner,
  },
  {
    id: "cab-03",
    name: "Cabaña Mirador",
    slug: "mirador",
    location: "Arteaga, Coahuila",
    image: "/cabins/mirador.png",
    status: "alta-demanda",
    price: 3900,
    minGuests: 2,
    maxGuests: 8,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Vista", "Terraza", "WiFi", "Asador"],
    categories: ["familiar", "grupos", "bosque"],
    rating: 4.9,
    reviews: 210,
    badge: "popular",
    description:
      "Amplia cabaña con grandes ventanales y una terraza panorámica sobre la sierra. La favorita para grupos que buscan las mejores vistas.",
    type: "grupal",
    ...miguelOwner,
  },
  {
    id: "cab-04",
    name: "Valle Escondido",
    slug: "valle-escondido",
    location: "Arteaga, Coahuila",
    image: "/cabins/valle-escondido.png",
    status: "por-confirmar",
    price: 4900,
    minGuests: 2,
    maxGuests: 10,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["Chimenea", "Asador", "Jacuzzi"],
    categories: ["grupos", "familiar", "chimenea"],
    rating: 4.6,
    reviews: 74,
    description:
      "Lodge de madera en un valle privado rodeado de pinos. Espacio para reuniones grandes con asador, jacuzzi y sala de estar amplia.",
    type: "grupal",
    ...patriciaOwner,
  },
  {
    id: "cab-05",
    name: "Cabaña Los Encinos",
    slug: "los-encinos",
    location: "Arteaga, Coahuila",
    image: "/cabins/los-encinos.png",
    status: "no-disponible",
    price: 3200,
    oldPrice: 3800,
    discountPct: 16,
    minGuests: 2,
    maxGuests: 6,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["WiFi", "Pet friendly"],
    categories: ["pet-friendly", "familiar", "bosque"],
    rating: 4.5,
    reviews: 65,
    badge: "oferta",
    description:
      "Cabaña rústica entre encinos y pinos donde tu mascota también es bienvenida. Perfecta para familias que viajan con su perro.",
    type: "familiar",
    ...lauraOwner,
  },
  {
    id: "cab-06",
    name: "Refugio Sierra Alta",
    slug: "sierra-alta",
    location: "Arteaga, Coahuila",
    image: "/cabins/sierra-alta.png",
    status: "propietario-contactado",
    price: 6500,
    minGuests: 2,
    maxGuests: 12,
    bedrooms: 5,
    bathrooms: 3,
    amenities: ["Chimenea", "Jacuzzi", "Vista"],
    categories: ["grupos", "chimenea", "bosque"],
    rating: 4.9,
    reviews: 152,
    description:
      "La cabaña más exclusiva: dos pisos en lo alto de la sierra, jacuzzi con vista y capacidad para grandes grupos. Lujo entre las montañas.",
    type: "premium",
    ...patriciaOwner,
  },
  {
    id: "cab-07",
    name: "Cabaña Niebla",
    slug: "niebla",
    location: "Sierra de Arteaga, Coahuila",
    image: "/cabins/niebla.png",
    status: "confirmada",
    price: 2600,
    minGuests: 2,
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Chimenea", "WiFi", "Cocina"],
    categories: ["parejas", "chimenea", "bosque"],
    rating: 4.7,
    reviews: 88,
    description:
      "Envuelta en la niebla matinal del bosque, esta cabaña ofrece la escapada romántica más tranquila de la sierra.",
    type: "romantica",
    ...robertoOwner,
  },
  {
    id: "cab-08",
    name: "Mirador de la Montaña",
    slug: "mirador-montana",
    location: "Sierra de Arteaga, Coahuila",
    image: "/cabins/mirador-montana.png",
    status: "alta-demanda",
    price: 4200,
    oldPrice: 4700,
    discountPct: 11,
    minGuests: 2,
    maxGuests: 8,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Vista", "Terraza", "Asador", "WiFi"],
    categories: ["grupos", "familiar", "bosque"],
    rating: 4.8,
    reviews: 119,
    badge: "oferta",
    description:
      "Arquitectura moderna de madera y cristal con una terraza espectacular sobre la cordillera. Atardeceres inolvidables garantizados.",
    type: "grupal",
    ...miguelOwner,
  },
]

export const statusLabel: Record<CabinStatus, string> = {
  "por-confirmar": "Disponibilidad por confirmar",
  "alta-demanda": "Alta demanda",
  "propietario-contactado": "Propietario consultado",
  confirmada: "Disponible confirmado",
  "no-disponible": "No disponible temporalmente",
}

export const categoryLabel: Record<CabinCategory, string> = {
  parejas: "Para parejas",
  familiar: "Familiar",
  grupos: "Grupos",
  chimenea: "Con chimenea",
  "pet-friendly": "Pet friendly",
  bosque: "Cerca del bosque",
}

// --- Panel administrativo ---

export type RequestStatus =
  | "nueva"
  | "pendiente-propietario"
  | "propietario-contactado"
  | "disponible-confirmada"
  | "no-disponible"
  | "alternativa-ofrecida"
  | "cliente-no-respondio"
  | "esperando-anticipo"
  | "reservacion-confirmada"
  | "en-estancia"
  | "finalizada"
  | "cancelada"

export type ClientRequest = {
  id: string
  client: string
  cabinId: string
  cabin: string
  date: string
  checkIn: string
  checkOut: string
  status: RequestStatus
  guests: number
  message: string
  email: string
  phone: string
  ownerId: string
  ownerName: string
  ownerPhone: string
}

export const requests: ClientRequest[] = [
  {
    id: "req-01",
    client: "María González",
    cabinId: "cab-03",
    cabin: "Cabaña Mirador",
    date: "22 jul. 2026",
    checkIn: "14 ago 2026",
    checkOut: "16 ago 2026",
    status: "nueva",
    guests: 4,
    email: "maria.gonzalez@email.com",
    phone: "(844) 111 2233",
    ownerId: "owner-03",
    ownerName: "Miguel Salazar",
    ownerPhone: "844 345 6789",
    message: "Hola, me interesa reservar del 14 al 16 de agosto para 4 personas. ¿Tienen disponibilidad?",
  },
  {
    id: "req-02",
    client: "Carlos Ramírez",
    cabinId: "cab-02",
    cabin: "Refugio del Pino",
    date: "22 jul. 2026",
    checkIn: "28 ago 2026",
    checkOut: "30 ago 2026",
    status: "pendiente-propietario",
    guests: 2,
    email: "carlos.ramirez@email.com",
    phone: "(844) 222 3344",
    ownerId: "owner-02",
    ownerName: "Laura Hernández",
    ownerPhone: "844 234 5678",
    message: "Buscamos una escapada romántica de fin de semana. ¿El precio incluye desayuno?",
  },
  {
    id: "req-03",
    client: "Ana López",
    cabinId: "cab-01",
    cabin: "Cabaña Bosque Real",
    date: "21 jul. 2026",
    checkIn: "26 jul 2026",
    checkOut: "28 jul 2026",
    status: "propietario-contactado",
    guests: 6,
    email: "ana.lopez@email.com",
    phone: "(844) 333 4455",
    ownerId: "owner-01",
    ownerName: "Roberto Martínez",
    ownerPhone: "844 123 4567",
    message: "Somos una familia de 6. ¿Se permite llevar mascota pequeña?",
  },
  {
    id: "req-04",
    client: "Luis Hernández",
    cabinId: "cab-04",
    cabin: "Valle Escondido",
    date: "21 jul. 2026",
    checkIn: "5 sep 2026",
    checkOut: "7 sep 2026",
    status: "alternativa-ofrecida",
    guests: 10,
    email: "luis.hernandez@email.com",
    phone: "(844) 444 5566",
    ownerId: "owner-04",
    ownerName: "Patricia Gómez",
    ownerPhone: "844 456 7890",
    message: "Queremos organizar una reunión familiar de 10 personas. ¿Cuentan con asador?",
  },
  {
    id: "req-05",
    client: "Sofía Martínez",
    cabinId: "cab-06",
    cabin: "Refugio Sierra Alta",
    date: "20 jul. 2026",
    checkIn: "10 sep 2026",
    checkOut: "14 sep 2026",
    status: "disponible-confirmada",
    guests: 8,
    email: "sofia.martinez@email.com",
    phone: "(844) 555 6677",
    ownerId: "owner-04",
    ownerName: "Patricia Gómez",
    ownerPhone: "844 456 7890",
    message: "Gracias por la info, quedamos atentos a la confirmación del pago.",
  },
]

export const requestStatusLabel: Record<RequestStatus, string> = {
  nueva: "Nueva solicitud",
  "pendiente-propietario": "Pendiente de consultar propietario",
  "propietario-contactado": "Propietario contactado",
  "disponible-confirmada": "Disponible confirmada",
  "no-disponible": "No disponible",
  "alternativa-ofrecida": "Alternativa ofrecida",
  "cliente-no-respondio": "Cliente no respondió",
  "esperando-anticipo": "Esperando anticipo",
  "reservacion-confirmada": "Reservación confirmada",
  "en-estancia": "En estancia",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

// --- Reservaciones (Pro) ---

export type ReservationStatus =
  | "pendiente"
  | "confirmada"
  | "en-uso"
  | "finalizada"
  | "cancelada"

export type Reservation = {
  id: string
  client: string
  cabin: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  total: number
  status: ReservationStatus
  paid: boolean
}

export const reservations: Reservation[] = [
  {
    id: "RS-2026-0821",
    client: "María González",
    cabin: "Cabaña Bosque Real",
    checkIn: "23 jul 2026",
    checkOut: "25 jul 2026",
    guests: 4,
    nights: 2,
    total: 5600,
    status: "confirmada",
    paid: true,
  },
  {
    id: "RS-2026-0822",
    client: "Carlos Ramírez",
    cabin: "Refugio del Pino",
    checkIn: "24 jul 2026",
    checkOut: "27 jul 2026",
    guests: 2,
    nights: 3,
    total: 6600,
    status: "confirmada",
    paid: true,
  },
  {
    id: "RS-2026-0823",
    client: "Ana López",
    cabin: "Valle Escondido",
    checkIn: "25 jul 2026",
    checkOut: "27 jul 2026",
    guests: 6,
    nights: 2,
    total: 9800,
    status: "pendiente",
    paid: false,
  },
  {
    id: "RS-2026-0824",
    client: "Javier Moreno",
    cabin: "Mirador de la Montaña",
    checkIn: "26 jul 2026",
    checkOut: "29 jul 2026",
    guests: 8,
    nights: 3,
    total: 12600,
    status: "en-uso",
    paid: true,
  },
  {
    id: "RS-2026-0825",
    client: "Familia Hernández",
    cabin: "Cabaña Mirador",
    checkIn: "22 jul 2026",
    checkOut: "24 jul 2026",
    guests: 8,
    nights: 2,
    total: 7800,
    status: "finalizada",
    paid: true,
  },
  {
    id: "RS-2026-0826",
    client: "Grupo García",
    cabin: "Refugio Sierra Alta",
    checkIn: "30 jul 2026",
    checkOut: "3 ago 2026",
    guests: 10,
    nights: 4,
    total: 26000,
    status: "pendiente",
    paid: false,
  },
  {
    id: "RS-2026-0818",
    client: "Diego Torres",
    cabin: "Cabaña Los Encinos",
    checkIn: "12 jul 2026",
    checkOut: "14 jul 2026",
    guests: 5,
    nights: 2,
    total: 6400,
    status: "cancelada",
    paid: false,
  },
]

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  "en-uso": "En uso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

// --- Pagos (Pro) ---

export type Payment = {
  id: string
  reservation: string
  client: string
  amount: number
  method: "Tarjeta" | "Transferencia" | "Efectivo"
  date: string
  status: "pagado" | "pendiente" | "reembolsado"
}

export const payments: Payment[] = [
  { id: "PAY-1201", reservation: "RS-2026-0821", client: "María González", amount: 5600, method: "Tarjeta", date: "22 jul 2026", status: "pagado" },
  { id: "PAY-1202", reservation: "RS-2026-0822", client: "Carlos Ramírez", amount: 6600, method: "Transferencia", date: "22 jul 2026", status: "pagado" },
  { id: "PAY-1203", reservation: "RS-2026-0824", client: "Javier Moreno", amount: 12600, method: "Tarjeta", date: "21 jul 2026", status: "pagado" },
  { id: "PAY-1204", reservation: "RS-2026-0823", client: "Ana López", amount: 4900, method: "Transferencia", date: "20 jul 2026", status: "pendiente" },
  { id: "PAY-1205", reservation: "RS-2026-0826", client: "Grupo García", amount: 13000, method: "Transferencia", date: "20 jul 2026", status: "pendiente" },
  { id: "PAY-1198", reservation: "RS-2026-0818", client: "Diego Torres", amount: 6400, method: "Tarjeta", date: "10 jul 2026", status: "reembolsado" },
]

// --- Actividad, tareas, llegadas (Pro dashboard) ---

export const recentActivity = [
  { id: "act-1", title: "Nueva reservación confirmada", detail: "Cabaña Bosque Real", time: "Hace 15 min", type: "reservation" },
  { id: "act-2", title: "Pago recibido", detail: "Reserva #RS-2026-0821", time: "Hace 1 hora", type: "payment" },
  { id: "act-3", title: "Solicitud nueva de información", detail: "Refugio del Pino", time: "Hace 2 horas", type: "request" },
  { id: "act-4", title: "Tarea de limpieza completada", detail: "Cabaña Mirador", time: "Hace 3 horas", type: "cleaning" },
  { id: "act-5", title: "Mantenimiento programado", detail: "Valle Escondido", time: "Hace 5 horas", type: "maintenance" },
] as const

export const pendingTasks = [
  { id: "task-1", title: "Limpieza", cabin: "Cabaña Mirador", when: "Hoy, 11:00 AM", status: "Pendiente" },
  { id: "task-2", title: "Mantenimiento", cabin: "Valle Escondido", when: "Hoy, 02:00 PM", status: "Pendiente" },
  { id: "task-3", title: "Revisión", cabin: "Refugio Sierra Alta", when: "Mañana, 09:00 AM", status: "Programada" },
] as const

export const upcomingArrivals = [
  { id: "arr-1", client: "María González", cabin: "Cabaña Bosque Real", dates: "23 jul – 25 jul", guests: 4, status: "Confirmada" },
  { id: "arr-2", client: "Carlos Ramírez", cabin: "Refugio del Pino", dates: "24 jul – 27 jul", guests: 2, status: "Confirmada" },
  { id: "arr-3", client: "Ana López", cabin: "Valle Escondido", dates: "25 jul – 27 jul", guests: 6, status: "Confirmada" },
] as const

// --- Tareas de operación (Pro) ---

export const cleaningTasks = [
  { id: "cl-1", cabin: "Cabaña Mirador", assignee: "Rosa M.", when: "Hoy, 11:00 AM", status: "Pendiente" },
  { id: "cl-2", cabin: "Cabaña Bosque Real", assignee: "Rosa M.", when: "Hoy, 01:00 PM", status: "En proceso" },
  { id: "cl-3", cabin: "Refugio del Pino", assignee: "Pedro L.", when: "Hoy, 03:30 PM", status: "Pendiente" },
  { id: "cl-4", cabin: "Cabaña Niebla", assignee: "Rosa M.", when: "Ayer, 10:00 AM", status: "Completada" },
] as const

export const maintenanceTasks = [
  { id: "mt-1", cabin: "Valle Escondido", issue: "Revisión de calentador", when: "Hoy, 02:00 PM", priority: "Alta", status: "Pendiente" },
  { id: "mt-2", cabin: "Refugio Sierra Alta", issue: "Cambio de focos terraza", when: "Mañana, 09:00 AM", priority: "Media", status: "Programada" },
  { id: "mt-3", cabin: "Cabaña Los Encinos", issue: "Fuga menor en cocina", when: "Hoy, 04:00 PM", priority: "Alta", status: "En proceso" },
  { id: "mt-4", cabin: "Cabaña Mirador", issue: "Ajuste de chimenea", when: "Completada ayer", priority: "Baja", status: "Completada" },
] as const

export const inventoryItems = [
  { id: "inv-1", item: "Juegos de sábanas", stock: 42, min: 30, status: "ok" },
  { id: "inv-2", item: "Toallas de baño", stock: 28, min: 40, status: "bajo" },
  { id: "inv-3", item: "Leña (bultos)", stock: 15, min: 20, status: "bajo" },
  { id: "inv-4", item: "Kits de amenidades", stock: 60, min: 25, status: "ok" },
  { id: "inv-5", item: "Café y té", stock: 34, min: 20, status: "ok" },
] as const

export const staff = [
  { id: "st-1", name: "Rosa Martínez", role: "Limpieza", phone: "(844) 700 1122", shift: "Matutino" },
  { id: "st-2", name: "Pedro López", role: "Limpieza", phone: "(844) 700 2233", shift: "Vespertino" },
  { id: "st-3", name: "Miguel Ángel Ruiz", role: "Mantenimiento", phone: "(844) 700 3344", shift: "Matutino" },
  { id: "st-4", name: "Laura Sánchez", role: "Recepción", phone: "(844) 700 4455", shift: "Mixto" },
] as const

// --- Promociones (Pro) ---

export type Promotion = {
  id: string
  title: string
  discount: string
  detail: string
  active: boolean
}

export const promotions: Promotion[] = [
  { id: "promo-1", title: "Escapada entre semana", discount: "15%", detail: "En estancias de 2 noches", active: true },
  { id: "promo-2", title: "Familias felices", discount: "20%", detail: "En estancias de 3 noches o más", active: true },
  { id: "promo-3", title: "Reserva anticipada", discount: "10%", detail: "Reservando 30 días antes", active: true },
]

// --- Temporadas / precios (Pro) ---

export const seasons = [
  { id: "se-1", name: "Temporada baja", months: "Feb – May", modifier: "-10%", color: "success" },
  { id: "se-2", name: "Temporada media", months: "Jun – Sep", modifier: "Base", color: "muted" },
  { id: "se-3", name: "Temporada alta", months: "Dic – Ene", modifier: "+25%", color: "warning" },
  { id: "se-4", name: "Puentes y festivos", months: "Variable", modifier: "+35%", color: "gold" },
]

export const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n)

// --- Calendario de ocupación (Pro dashboard) ---

export const calendarDays = [
  { date: "22", dow: "Mar" },
  { date: "23", dow: "Mié" },
  { date: "24", dow: "Jue" },
  { date: "25", dow: "Vie" },
  { date: "26", dow: "Sáb" },
  { date: "27", dow: "Dom" },
  { date: "28", dow: "Lun" },
  { date: "29", dow: "Mar" },
  { date: "30", dow: "Mié" },
  { date: "31", dow: "Jue" },
  { date: "1", dow: "Vie" },
  { date: "2", dow: "Sáb" },
  { date: "3", dow: "Dom" },
]

export const calendarCabins = cabins.slice(0, 6).map((c) => ({
  id: c.id,
  name: c.name,
  image: c.image,
  capacity: `${c.minGuests}-${c.maxGuests} personas`,
}))

export type CalendarBar = {
  start: number
  end: number
  label: string
  status: "reserved" | "available" | "unavailable" | "maintenance"
  guests?: number
}

export const calendarBookings: Record<string, CalendarBar[]> = {
  "cab-01": [
    { start: 1, end: 4, label: "María G.", status: "reserved", guests: 4 },
    { start: 7, end: 9, label: "Disponible", status: "available" },
  ],
  "cab-02": [
    { start: 0, end: 2, label: "No disp.", status: "unavailable" },
    { start: 3, end: 6, label: "Carlos R.", status: "reserved", guests: 2 },
    { start: 6, end: 10, label: "Mantenimiento", status: "maintenance" },
  ],
  "cab-03": [
    { start: 2, end: 5, label: "Familia Hernández", status: "reserved", guests: 8 },
    { start: 6, end: 8, label: "Ana L.", status: "reserved", guests: 6 },
    { start: 9, end: 11, label: "Javier M.", status: "reserved", guests: 2 },
  ],
  "cab-04": [
    { start: 0, end: 3, label: "Disponible", status: "available" },
    { start: 4, end: 7, label: "No disp.", status: "unavailable" },
    { start: 8, end: 12, label: "Grupo García", status: "reserved", guests: 10 },
  ],
  "cab-05": [
    { start: 1, end: 4, label: "Disponible", status: "available" },
    { start: 5, end: 8, label: "Ana L.", status: "reserved", guests: 6 },
  ],
  "cab-06": [
    { start: 0, end: 5, label: "Mantenimiento", status: "maintenance" },
    { start: 7, end: 10, label: "Reservada", status: "reserved", guests: 2 },
  ],
}

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
