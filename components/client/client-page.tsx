"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Heart,
  Headset,
  MapPin,
  MessageCircle,
  Mountain,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  TreePine,
  Users,
  UsersRound,
} from "lucide-react"
import type { PublicCabin } from "@/lib/public-cabins"
import type { PublicSiteSettings } from "@/lib/public-site-settings"
import {
  buildSearchOptions,
  initialClientSearch,
  searchStateToQuery,
  dateGapIsValid,
  type ClientSearchState,
} from "@/lib/public-search"
import { PublicHeader } from "./public-header"
import { SearchBar } from "./search-bar"
import { FilterChips, type ChipKey } from "./filter-chips"
import { CabinCard } from "./cabin-card"
import { CabinDetailsModal } from "./cabin-details-modal"
import { Footer } from "./footer"
import { PublicPromotionsSection } from "@/components/promotions/public-promotions-section"
import type { PublicPromotion } from "@/lib/public-promotions"

const tripTypes = [
  {
    icon: <Heart className="size-5" aria-hidden />,
    title: "Para parejas",
    description: "Refugios íntimos para bajar el ritmo y reconectar.",
  },
  {
    icon: <Users className="size-5" aria-hidden />,
    title: "En familia",
    description: "Espacios cómodos para compartir sin prisas.",
  },
  {
    icon: <UsersRound className="size-5" aria-hidden />,
    title: "Con amigos",
    description: "Cabañas amplias para reuniones memorables.",
  },
  {
    icon: <Flame className="size-5" aria-hidden />,
    title: "Noches de chimenea",
    description: "Calidez, bosque y sobremesas junto al fuego.",
  },
  {
    icon: <PawPrint className="size-5" aria-hidden />,
    title: "Con tu mascota",
    description: "Opciones pet friendly para viajar juntos.",
  },
  {
    icon: <TreePine className="size-5" aria-hidden />,
    title: "Cerca del bosque",
    description: "Naturaleza y senderos a unos cuantos pasos.",
  },
]

const trustPoints = [
  {
    icon: <ShieldCheck className="size-5" aria-hidden />,
    title: "Cabañas verificadas",
    description: "Opciones seleccionadas con atención",
  },
  {
    icon: <BadgeDollarSign className="size-5" aria-hidden />,
    title: "Precios claros",
    description: "Conoce el costo antes de confirmar",
  },
  {
    icon: <Headset className="size-5" aria-hidden />,
    title: "Atención cercana",
    description: "Resuelve tus dudas antes de reservar",
  },
  {
    icon: <CalendarCheck className="size-5" aria-hidden />,
    title: "Fechas para tu viaje",
    description: "Consulta la disponibilidad para las fechas seleccionadas",
  },
]

const steps = [
  {
    number: "01",
    icon: <Search className="size-5" aria-hidden />,
    title: "Encuentra tu cabaña",
    description: "Explora opciones, precios, capacidad y servicios.",
  },
  {
    number: "02",
    icon: <CalendarCheck className="size-5" aria-hidden />,
    title: "Elige tus fechas",
    description: "Consulta la disponibilidad y selecciona entrada y salida.",
  },
  {
    number: "03",
    icon: <CheckCircle2 className="size-5" aria-hidden />,
    title: "Confirma tu reservación",
    description: "Completa tus datos y confirma de forma sencilla.",
  },
]

const focusClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"

export function ClientPage({
  cabins,
  promotions,
  settings,
  initialSearch,
}: {
  cabins: PublicCabin[]
  promotions: PublicPromotion[]
  settings: PublicSiteSettings
  initialSearch: ClientSearchState
}) {
  const isHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false)
  const router = useRouter()
  const [search, setSearch] = useState<ClientSearchState>(initialSearch)
  const [category, setCategory] = useState<ChipKey>("todos")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<PublicCabin | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const cabinOptions = useMemo(() => buildSearchOptions(cabins), [cabins])

  const availableCategories = useMemo(() => {
    const seen = new Set<PublicCabin["categories"][number]>()
    for (const cabin of cabins) for (const c of cabin.categories) seen.add(c)
    return [...seen]
  }, [cabins])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 3000)
  }

  const updateSearch = (next: Partial<ClientSearchState>) => {
    setSearch((current) => ({
      ...current,
      ...next,
    }))
  }

  const skipUrlSync = useRef(true)
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false
      return
    }
    if (!dateGapIsValid(search.checkIn, search.checkOut)) return
    const query = searchStateToQuery(search)
    router.replace(query ? `/?${query}` : "/", { scroll: false })
  }, [search, router])

  const toggleFavorite = (id: string) =>
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filtered = useMemo(() => {
    let list = cabins

    if (category !== "todos") {
      list = list.filter((cabin) =>
        cabin.categories.includes(category as PublicCabin["categories"][number]),
      )
    }

    const query = search.query.trim().toLocaleLowerCase("es")
    if (query) {
      list = list.filter((cabin) =>
        [cabin.name, cabin.location, cabin.zone, cabin.description, ...cabin.amenities].some((text) =>
          text.toLocaleLowerCase("es").includes(query),
        ),
      )
    }

    list = list.filter(
      (cabin) =>
        cabin.maxGuests >= search.guests &&
        (search.maxPrice === 0 || cabin.price <= search.maxPrice) &&
        (search.bedrooms === 0 || cabin.bedrooms === search.bedrooms) &&
        (search.minBeds === 0 || cabin.beds >= search.minBeds) &&
        (search.bedType === "todas" || (cabin.bedDistribution[search.bedType] ?? 0) > 0) &&
        (search.zone === "todas" || cabin.zone === search.zone) &&
        (search.pool === "todas" || cabin.poolType === search.pool) &&
        (search.pets === "todas" ||
          (search.pets === "admitidas" && cabin.acceptsPets) ||
          (search.pets === "no-admitidas" && !cabin.acceptsPets)),
    )

    if (search.cabinType !== "todas") {
      list = list.filter((cabin) => cabin.type === search.cabinType)
    }

    if (search.amenity !== "todas") {
      list = list.filter((cabin) => cabin.amenities.includes(search.amenity))
    }

    if (favoritesOnly) {
      list = list.filter((cabin) => favorites.has(cabin.id))
    }

    return list
  }, [cabins, category, favorites, favoritesOnly, search])

  const visibleCabins = showAll ? filtered : filtered.slice(0, 6)

  const resetAll = () => {
    setSearch(initialClientSearch)
    router.replace("/", { scroll: false })
    setCategory("todos")
    setFavoritesOnly(false)
    setShowAll(false)
  }

  const officeHasContent = Boolean(settings.officeAddress || settings.officeMapsUrl)

  return (
    <div id="inicio" className="min-h-screen bg-background text-foreground">
      <PublicHeader businessName={settings.businessName} subtitle={settings.subtitle} />

      {notice && (
        <div
          className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-forest-dark px-4 py-3 text-center text-sm font-semibold text-white shadow-xl"
          role="status"
        >
          {notice}
        </div>
      )}

      <main data-hydrated={isHydrated ? "true" : "false"}>
        <section className="relative isolate overflow-hidden bg-forest-dark" aria-labelledby="hero-title">
          <Image
            src={settings.heroImageUrl}
            alt={`${settings.businessName} — ${settings.subtitle}`}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="-z-20 scale-[1.16] object-cover object-[center_70%] sm:scale-100 sm:object-[center_58%]"
          />
          <div
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(17,39,27,0.92)_0%,rgba(17,39,27,0.76)_42%,rgba(17,39,27,0.28)_75%,rgba(17,39,27,0.12)_100%)]"
            aria-hidden
          />

          <div className="mx-auto flex min-h-[540px] max-w-7xl items-center px-4 pb-24 pt-20 sm:min-h-[590px] sm:px-6 sm:pb-28 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm sm:text-xs">
                <Mountain className="size-4 text-[#f4d58b]" aria-hidden />
                {settings.businessName}
              </p>
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f4d58b] sm:text-sm">
                <span className="h-px w-8 bg-[#f4d58b]" aria-hidden />
                {settings.subtitle}
              </p>
              <h1
                id="hero-title"
                className="max-w-xl font-serif text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-white text-balance sm:text-5xl lg:text-6xl"
              >
                {settings.tagline}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/90 text-pretty sm:text-lg">
                Encuentra cabañas únicas para descansar, reconectar y crear recuerdos entre
                montañas, pinos y noches de chimenea.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#cabanas"
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f0c66a] px-5 py-3 text-sm font-bold text-[#203628] shadow-lg transition-colors hover:bg-[#f7d98e] ${focusClasses}`}
                >
                  Explorar cabañas
                  <Search className="size-4" aria-hidden />
                </a>
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-forest-dark ${focusClasses}`}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Contactar por WhatsApp
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/85 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#f4d58b]" aria-hidden /> Sin cargos ocultos
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#f4d58b]" aria-hidden /> Atención personalizada
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Buscador de cabañas" className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-12 sm:px-6 lg:px-8">
          <SearchBar
            value={search}
            options={cabinOptions}
            dateError={search.checkIn && search.checkOut && !dateGapIsValid(search.checkIn, search.checkOut) ? "La fecha de salida debe ser posterior a la de entrada." : null}
            onChange={updateSearch}
            onReset={resetAll}
            onSearch={() => {
              setFavoritesOnly(false)
              if (search.checkIn && search.checkOut && !dateGapIsValid(search.checkIn, search.checkOut)) {
                showNotice("Ajusta las fechas: la salida debe ser posterior a la entrada.")
                return
              }
              if (!dateGapIsValid(search.checkIn, search.checkOut)) {
                showNotice("Selecciona la fecha de entrada y de salida para continuar.")
                return
              }
              showNotice(
                `Encontramos ${filtered.length} ${filtered.length === 1 ? "opción" : "opciones"} para tu búsqueda.`,
              )
              document.querySelector("#cabanas")?.scrollIntoView({ behavior: "smooth" })
            }}
            resultCount={filtered.length}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-label="Ventajas del servicio">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {point.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{point.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PublicPromotionsSection promotions={promotions} />

        <section className="border-y border-border bg-[#f5f1e7] py-6" aria-labelledby="categories-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Elige tu experiencia</p>
              <h2 id="categories-title" className="mt-1 font-serif text-2xl font-semibold text-forest-dark">
                ¿Qué tipo de escapada buscas?
              </h2>
            </div>
            <FilterChips
              active={category}
              availableCategories={availableCategories}
              onChange={(nextCategory) => {
                setCategory(nextCategory)
                setFavoritesOnly(false)
                setShowAll(false)
              }}
            />
          </div>
        </section>

        <section id="cabanas" className="scroll-mt-24 py-14 sm:py-18" aria-labelledby="cabins-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="size-4" aria-hidden /> Selección {settings.businessName}
                </p>
                <h2 id="cabins-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.02em] text-forest-dark sm:text-4xl">
                  Cabañas para tu próxima pausa
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Espacios elegidos por su entorno, comodidad y carácter. Elige tu favorita y
                  consulta la disponibilidad para las fechas seleccionadas.
                </p>
              </div>

              {favorites.size > 0 && (
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((current) => !current)}
                  aria-pressed={favoritesOnly}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-bold transition-colors sm:self-auto ${
                    favoritesOnly
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                  } ${focusClasses}`}
                >
                  <Heart className={`size-4 ${favoritesOnly ? "fill-white" : ""}`} aria-hidden />
                  Mis favoritos ({favorites.size})
                </button>
              )}
            </div>

            {visibleCabins.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-12 text-center">
                <TreePine className="mx-auto size-8 text-primary" aria-hidden />
                <p className="mt-3 font-bold text-foreground">No encontramos una coincidencia exacta</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prueba con menos filtros o cambia el número de huéspedes.
                </p>
                <button
                  type="button"
                  onClick={resetAll}
                  className={`mt-5 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-forest-dark ${focusClasses}`}
                >
                  Restablecer búsqueda
                </button>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCabins.map((cabin) => (
                  <CabinCard
                    key={cabin.id}
                    cabin={cabin}
                    isFavorite={favorites.has(cabin.id)}
                    onToggleFavorite={toggleFavorite}
                    onViewDetails={setSelected}
                  />
                ))}
              </div>
            )}

            {filtered.length > 6 && (
              <div className="mt-9 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary bg-card px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white ${focusClasses}`}
                >
                  {showAll ? "Ver selección destacada" : "Ver todas las cabañas"}
                  <ChevronRight className={`size-4 transition-transform ${showAll ? "rotate-90" : ""}`} aria-hidden />
                </button>
              </div>
            )}
          </div>
        </section>

        {officeHasContent && (
          <section id="oficina" className="scroll-mt-24 border-y border-border bg-[#f5f1e7] py-14 sm:py-16" aria-labelledby="office-title">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <MapPin className="size-4" aria-hidden /> Nuestra oficina
                </p>
                <h2 id="office-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.02em] text-forest-dark sm:text-4xl">
                  Visítanos en {settings.generalLocation}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Te atendemos personalmente para ayudarte a elegir y planear tu estancia.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <div className="flex items-center gap-3 rounded-2xl border border-forest-dark/8 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(31,60,43,0.05)]">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <div>
                    {settings.officeAddress && (
                      <p className="max-w-xs text-sm font-semibold text-foreground">{settings.officeAddress}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{settings.generalLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-forest-dark/8 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(31,60,43,0.05)]">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock3 className="size-5" aria-hidden />
                  </span>
                  <p className="max-w-xs text-sm font-semibold text-foreground">{settings.businessHours}</p>
                </div>
                {settings.officeMapsUrl && (
                  <a
                    href={settings.officeMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-dark ${focusClasses}`}
                  >
                    <MapPin className="size-4" aria-hidden />
                    Cómo llegar
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="bg-[#f5f1e7] py-16 sm:py-20" aria-labelledby="trip-types-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Una estancia a tu manera</p>
              <h2 id="trip-types-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.02em] text-forest-dark sm:text-4xl">
                Encuentra la cabaña perfecta para ti
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Ya sea una escapada romántica, un viaje en familia o un fin de semana con amigos,
                hay un espacio hecho para tu plan.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tripTypes.map((trip) => (
                <article
                  key={trip.title}
                  className="group flex items-start gap-4 rounded-2xl border border-forest-dark/8 bg-white p-5 shadow-[0_8px_30px_rgba(31,60,43,0.05)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {trip.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-forest-dark">{trip.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{trip.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-reservar" className="scroll-mt-24 bg-[#f5f1e7] py-16 sm:py-20" aria-labelledby="como-reservar-title">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Reserva en tres pasos</p>
              <h2 id="como-reservar-title" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.02em] text-forest-dark sm:text-4xl">
                Cómo reservar
              </h2>
            </div>

            <ol className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="group rounded-2xl border border-forest-dark/10 bg-white p-6 shadow-[0_8px_30px_rgba(31,60,43,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_38px_rgba(31,60,43,0.12)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {step.icon}
                    </span>
                    <span className="font-serif text-3xl font-semibold text-gold-foreground/45">{step.number}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-forest-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex justify-center">
              <a
                href="#cabanas"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-forest-dark ${focusClasses}`}
              >
                Ver cabañas
                <ChevronRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-24 px-4 pb-0 sm:px-6 lg:px-8" aria-labelledby="contact-title">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-t-[2rem] bg-primary px-6 py-10 sm:rounded-[2rem] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f4d58b]">Estamos para ayudarte</p>
              <h2 id="contact-title" className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">
                ¿No sabes cuál elegir?
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                Cuéntanos las fechas, cuántas personas viajan y qué experiencia buscas. Te ayudamos
                a encontrar la mejor opción para tu estancia.
              </p>
            </div>
            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={`mt-7 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f0c66a] px-5 py-3 text-sm font-bold text-[#203628] transition-colors hover:bg-[#f7d98e] sm:w-auto lg:mt-0 ${focusClasses}`}
            >
              <MessageCircle className="size-5" aria-hidden />
              Hablar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer settings={settings} />

      <CabinDetailsModal
        key={selected?.id ?? "sin-cabana"}
        cabin={selected}
        bookingDefaults={{
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          guests: search.guests,
        }}
        settings={settings}
        onClose={() => setSelected(null)}
        onAction={(cabin) => showNotice(`Tu consulta para ${cabin.name} está lista para enviarse por WhatsApp.`)}
      />
    </div>
  )
}