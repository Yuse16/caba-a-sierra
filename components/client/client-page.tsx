"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Search,
  MessageCircle,
  ShieldCheck,
  BadgeDollarSign,
  Headset,
  CalendarClock,
  Star,
  Gift,
  Lock,
  Heart,
  Users,
  UsersRound,
  Flame,
  PawPrint,
  TreePine,
  ChevronRight,
} from "lucide-react"
import type { Version } from "@/components/demo/demo-context"
import { cabins, promotions, type Cabin } from "@/lib/demo-data"
import { PublicHeader } from "./public-header"
import { SearchBar, initialClientSearch, type ClientSearchState } from "./search-bar"
import { FilterChips, type ChipKey } from "./filter-chips"
import { CabinCard } from "./cabin-card"
import { CabinDetailsModal } from "./cabin-details-modal"
import { CountdownTimer } from "./countdown-timer"
import { Footer } from "./footer"

const categories = [
  { icon: <Heart className="size-5" aria-hidden />, title: "Para parejas", desc: "Escapadas románticas en entornos únicos." },
  { icon: <Users className="size-5" aria-hidden />, title: "Familiar", desc: "Espacios cómodos y seguros para todos." },
  { icon: <UsersRound className="size-5" aria-hidden />, title: "Grupos", desc: "Cabañas amplias para reuniones inolvidables." },
  { icon: <Flame className="size-5" aria-hidden />, title: "Con chimenea", desc: "Noches cálidas junto al fuego." },
  { icon: <PawPrint className="size-5" aria-hidden />, title: "Pet friendly", desc: "Tu mascota también es bienvenida." },
  { icon: <TreePine className="size-5" aria-hidden />, title: "Cerca del bosque", desc: "Conecta con la naturaleza a pocos pasos." },
]

const proIndicators = [
  { icon: <CalendarClock className="size-5" aria-hidden />, title: "Disponibilidad gestionada", desc: "Confirmamos con el propietario" },
  { icon: <Star className="size-5" aria-hidden />, title: "Mejores recomendaciones", desc: "Según tu búsqueda" },
  { icon: <Gift className="size-5" aria-hidden />, title: "Promociones exclusivas", desc: "Solo en plataforma" },
  { icon: <Lock className="size-5" aria-hidden />, title: "Seguimiento personalizado", desc: "Acompañamos tu solicitud" },
]

const proBenefits = [
  { icon: <CalendarClock className="size-5" aria-hidden />, title: "Cancelación flexible", desc: "Sin penalizaciones*" },
  { icon: <Headset className="size-5" aria-hidden />, title: "Atención personalizada", desc: "Te ayudamos a elegir" },
  { icon: <ShieldCheck className="size-5" aria-hidden />, title: "Cabañas verificadas", desc: "Calidad garantizada" },
  { icon: <Lock className="size-5" aria-hidden />, title: "Proceso acompañado", desc: "Sin reservación automática" },
  { icon: <BadgeDollarSign className="size-5" aria-hidden />, title: "Precios transparentes", desc: "Consulta antes de confirmar" },
]

export function ClientPage({ version }: { version: Version }) {
  const isPro = version === "pro"
  const [search, setSearch] = useState<ClientSearchState>(initialClientSearch)
  const [category, setCategory] = useState<ChipKey>("todos")
  const [favorites, setFavorites] = useState<Set<string>>(new Set(isPro ? ["cab-03", "cab-06", "cab-01"] : []))
  const [selected, setSelected] = useState<Cabin | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3000)
  }

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filtered = useMemo(() => {
    let list = cabins
    if (!isPro && category !== "todos") {
      list = list.filter((c) => c.categories.includes(category as Cabin["categories"][number]))
    }
    const query = search.query.trim().toLocaleLowerCase("es")
    if (query) {
      list = list.filter((c) =>
        [c.name, c.location, ...c.amenities].some((text) =>
          text.toLocaleLowerCase("es").includes(query),
        ),
      )
    }
    list = list.filter((c) => c.maxGuests >= search.guests)
    if (search.cabinType !== "todas") list = list.filter((c) => c.type === search.cabinType)
    if (isPro) {
      list = list.filter((c) => c.price <= search.maxPrice && c.bedrooms >= search.bedrooms)
      if (search.amenity !== "todas") list = list.filter((c) => c.amenities.includes(search.amenity))
      if (favoritesOnly) list = list.filter((c) => favorites.has(c.id))
    }
    return showAll ? list : list.slice(0, 6)
  }, [category, favorites, favoritesOnly, isPro, search, showAll])

  return (
    <div id="inicio" className="min-h-screen bg-background">
      <PublicHeader
        favoritesCount={favorites.size}
        onShowFavorites={() => {
          setFavoritesOnly((current) => !current)
          document.querySelector("#cabanas")?.scrollIntoView({ behavior: "smooth" })
        }}
      />

      {notice && (
        <div className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-forest-dark px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow-xl" role="status">
          {notice}
        </div>
      )}

      {/* Hero */}
      <section className="relative">
        <div className="relative min-h-[440px] w-full overflow-hidden sm:min-h-[520px]">
          <Image
            src="/cabins/hero.png"
            alt="Cabaña de madera iluminada en el bosque al atardecer"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/85 via-forest-dark/55 to-forest-dark/20" />
          <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl text-primary-foreground">
              {isPro ? (
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                  Tu próxima escapada
                  <br />
                  <span className="italic text-gold">empieza aquí</span>
                </h1>
              ) : (
                <h1 className="text-4xl font-bold leading-tight text-balance sm:text-5xl">
                  Encuentra la cabaña ideal para tu próxima escapada
                </h1>
              )}
              <p className="mt-4 max-w-lg text-base text-primary-foreground/85 text-pretty">
                {isPro
                  ? "Cabañas únicas en Arteaga y sus alrededores. Naturaleza, comodidad y momentos inolvidables."
                  : "Explora opciones para parejas, familias y grupos en entornos naturales de Arteaga y sus alrededores."}
              </p>

              {isPro ? (
                <div className="mt-6 flex flex-wrap gap-5 text-sm">
                  {[
                    { icon: <ShieldCheck className="size-4" aria-hidden />, label: "Confirmación con propietario" },
                    { icon: <BadgeDollarSign className="size-4" aria-hidden />, label: "Precios transparentes" },
                    { icon: <Headset className="size-4" aria-hidden />, label: "Atención personalizada" },
                  ].map((b) => (
                    <span key={b.label} className="flex items-center gap-2 text-primary-foreground/90">
                      {b.icon}
                      {b.label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#cabanas"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Explorar cabañas
                    <Search className="size-4" aria-hidden />
                  </a>
                  <a
                    href="https://wa.me/528441234567"
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/40 bg-background/10 px-5 py-3 text-sm font-medium text-primary-foreground backdrop-blur hover:bg-background/20"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search bar overlapping */}
        <div className="mx-auto -mt-10 max-w-6xl px-4 sm:-mt-12 sm:px-6">
          <SearchBar
            version={version}
            value={search}
            onChange={setSearch}
            onSearch={() => {
              setFavoritesOnly(false)
              showNotice(`Se encontraron opciones para ${search.guests} huésped${search.guests === 1 ? "" : "es"}.`)
              document.querySelector("#cabanas")?.scrollIntoView({ behavior: "smooth" })
            }}
          />
        </div>
      </section>

      {/* Pro indicators */}
      {isPro && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {proIndicators.map((i) => (
              <div key={i.title} className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {i.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chips / heading */}
      <section id="cabanas" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {isPro ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-primary">
                Recomendadas para ti <Star className="size-4 fill-gold text-gold" aria-hidden />
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">Cabañas ideales para solicitar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultaremos tus fechas con el propietario: {search.query || "Todas las ubicaciones"} · {search.checkIn} – {search.checkOut} · {search.guests} huéspedes
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFavoritesOnly(false)
                setShowAll((current) => !current)
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {showAll ? "Ver recomendadas" : "Ver todas las cabañas"} <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <FilterChips active={category} onChange={setCategory} />
            <div className="mt-10 text-center">
              <h2 className="text-2xl font-semibold text-foreground">Cabañas destacadas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Opciones seleccionadas para diferentes tipos de estancia.
              </p>
            </div>
          </>
        )}
      </section>

      {/* Cabins grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay cabañas que coincidan con tu búsqueda. Ajusta los filtros o el número de huéspedes.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cabin) => (
              <CabinCard
                key={cabin.id}
                cabin={cabin}
                version={version}
                isFavorite={favorites.has(cabin.id)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={setSelected}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pro promotions */}
      {isPro && (
        <section id="promociones" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-2xl bg-forest-dark p-5 text-primary-foreground">
              <div>
                <h3 className="text-lg font-semibold">Promociones exclusivas</h3>
                <p className="font-serif text-sm italic text-gold">por tiempo limitado</p>
              </div>
              <div className="mt-4">
                <CountdownTimer />
              </div>
              <p className="mt-4 text-xs text-primary-foreground/70">
                Aprovecha antes de que terminen.
              </p>
              <button
                type="button"
                onClick={() => showNotice("Mostrando las promociones activas de la demo.")}
                className="mt-3 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-gold-foreground hover:bg-gold/90"
              >
                Ver promociones
              </button>
            </div>
            {promotions.map((p, idx) => (
              <div
                key={p.id}
                className="relative flex flex-col justify-end overflow-hidden rounded-2xl p-5 text-primary-foreground"
              >
                <Image
                  src={cabins[idx + 1].image || "/placeholder.svg"}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 to-forest-dark/30" />
                <div className="relative">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gold">{p.discount} de descuento</p>
                  <p className="mt-1 text-xs text-primary-foreground/80">{p.detail}</p>
                  <button
                    type="button"
                    onClick={() => showNotice(`${p.title}: ${p.discount} de descuento. ${p.detail}.`)}
                    className="mt-3 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories (start) / benefits (pro) */}
      <section id="como-funciona" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {isPro ? (
            <>
              <h2 className="text-center text-2xl font-semibold text-foreground">
                ¿Por qué reservar con nosotros?
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {proBenefits.map((b) => (
                  <div key={b.title} className="flex flex-col items-center gap-2 text-center">
                    <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {b.icon}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center text-2xl font-semibold text-foreground">
                Encuentra la cabaña perfecta para ti
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c) => (
                  <div key={c.title} className="flex items-start gap-3">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      {c.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <div id="contacto">
        <Footer version={version} />
      </div>

      <CabinDetailsModal
        key={selected?.id ?? "sin-cabana"}
        cabin={selected}
        version={version}
        onClose={() => setSelected(null)}
        onAction={(cabin) => {
          showNotice(`Solicitud de disponibilidad creada para ${cabin.name}.`)
        }}
      />
    </div>
  )
}
