"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Image from "next/image"
import { X, MapPin, Users, Bed, Bath, Star, Check, CalendarDays, Send, ChevronLeft, ChevronRight, DoorOpen, Info } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { createBookingInquiryAction } from "@/app/actions/booking-inquiries"
import {
  currency,
  publicCabinStatusLabel,
  publicCabinStatusTone,
  type PublicCabin,
} from "@/lib/public-cabins"
import type { PublicSiteSettings } from "@/lib/public-site-settings"

const formControlClass =
  "mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:h-10"

const dateControlClass =
  "h-11 w-full appearance-auto rounded-lg border border-border bg-background pl-9 pr-2 text-sm text-foreground outline-none [color-scheme:light] focus:border-ring focus:ring-2 focus:ring-ring/20 sm:h-10"

export function CabinDetailsModal({
  cabin,
  bookingDefaults,
  settings,
  onClose,
  onAction,
}: {
  cabin: PublicCabin | null
  bookingDefaults: {
    checkIn: string
    checkOut: string
    guests: number
  }
  settings: PublicSiteSettings
  onClose: () => void
  onAction: (cabin: PublicCabin) => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState(bookingDefaults.checkIn)
  const [checkOut, setCheckOut] = useState(bookingDefaults.checkOut)
  const [whatsappUrl, setWhatsappUrl] = useState<string>(settings.whatsappUrl)
  const [dateError, setDateError] = useState<string | null>(null)
  const [galleryState, setGalleryState] = useState({ cabinId: "", index: 0 })
  const touchStartX = useRef<number | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const idempotencyKeyRef = useRef<string | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!cabin) return
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowLeft" && cabin.images.length > 1) {
        setGalleryState((current) => ({
          cabinId: cabin.id,
          index: ((current.cabinId === cabin.id ? current.index : 0) - 1 + cabin.images.length) % cabin.images.length,
        }))
      }
      if (event.key === "ArrowRight" && cabin.images.length > 1) {
        setGalleryState((current) => ({
          cabinId: cabin.id,
          index: ((current.cabinId === cabin.id ? current.index : 0) + 1) % cabin.images.length,
        }))
      }
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      previouslyFocusedRef.current?.focus()
    }
  }, [cabin, onClose])

  if (!cabin) return null
  const gallery = cabin.images.length > 0 ? cabin.images : [{ id: `${cabin.id}-cover`, url: cabin.image, altText: `Fotografía de ${cabin.name}`, position: 1, isCover: true }]
  const activeIndex = galleryState.cabinId === cabin.id ? Math.min(galleryState.index, gallery.length - 1) : 0
  const activeImage = gallery[activeIndex]
  const moveGallery = (direction: -1 | 1) => {
    setGalleryState({ cabinId: cabin.id, index: (activeIndex + direction + gallery.length) % gallery.length })
  }
  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!checkIn || !checkOut) {
      setDateError("Selecciona la fecha de entrada y de salida.")
      return
    }
    if (checkOut <= checkIn) {
      setDateError("La fecha de salida debe ser posterior a la de entrada.")
      return
    }
    const formData = new FormData(event.currentTarget)
    const customerName = String(formData.get("name") ?? "")
    const phone = String(formData.get("phone") ?? "")
    const guests = Number(formData.get("guests"))
    const comments = String(formData.get("comments") ?? "").trim()
    const message = [
      "Hola, quiero consultar disponibilidad.",
      `Cabaña: ${cabin.name}`,
      `Nombre: ${customerName}`,
      `Teléfono: ${phone}`,
      `Entrada: ${checkIn}`,
      `Salida: ${checkOut}`,
      `Huéspedes: ${guests}`,
      comments ? `Comentarios: ${comments}` : "",
    ].filter(Boolean).join("\n")
    const nextWhatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`
    const whatsappWindow = window.open("about:blank", "_blank")
    if (whatsappWindow) whatsappWindow.opener = null
    idempotencyKeyRef.current ??= crypto.randomUUID()
    setIsSubmitting(true)
    setSubmitError(null)
    setDateError(null)

    try {
      const result = await createBookingInquiryAction({
        cabinId: cabin.id,
        customerName,
        phone,
        checkIn,
        checkOut,
        guests,
        message: comments,
        idempotencyKey: idempotencyKeyRef.current,
      })

      if (!result.ok) {
        whatsappWindow?.close()
        setSubmitError(result.message)
        return
      }

      setWhatsappUrl(nextWhatsappUrl)
      setSubmitted(true)
      onAction(cabin)
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.location.replace(nextWhatsappUrl)
      else window.open(nextWhatsappUrl, "_blank", "noopener,noreferrer")
    } catch {
      whatsappWindow?.close()
      setSubmitError("No fue posible registrar la solicitud. Inténtalo nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles y reserva para ${cabin.name}`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-h-[100dvh] w-full max-w-3xl scroll-pb-24 overscroll-contain overflow-y-auto rounded-t-2xl bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[94vh] sm:rounded-2xl sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          data-testid="cabin-gallery"
          className="relative aspect-[4/3] w-full overflow-hidden bg-forest-dark/10 sm:aspect-[16/8]"
          aria-label={`Galería de ${cabin.name}`}
          onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null || gallery.length < 2) return
            const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
            touchStartX.current = null
            if (Math.abs(distance) >= 40) moveGallery(distance > 0 ? -1 : 1)
          }}
        >
          <Image key={activeImage.id} src={activeImage.url || "/placeholder.svg"} alt={activeImage.altText} fill sizes="(max-width: 768px) 100vw, 720px" className="rounded-t-2xl object-cover" priority />
          <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 sm:size-9">
            <X className="size-4" aria-hidden />
          </button>
          <div className="absolute left-3 top-3">
            <StatusBadge tone={publicCabinStatusTone[cabin.status]} className="border border-border bg-white text-foreground shadow-sm">
              {publicCabinStatusLabel[cabin.status]}
            </StatusBadge>
          </div>
          {gallery.length > 1 && <>
            <button type="button" onClick={() => moveGallery(-1)} aria-label="Fotografía anterior" className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"><ChevronLeft className="size-5" aria-hidden /></button>
            <button type="button" onClick={() => moveGallery(1)} aria-label="Fotografía siguiente" className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"><ChevronRight className="size-5" aria-hidden /></button>
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">{activeIndex + 1} / {gallery.length}</p>
          </>}
        </div>

        {gallery.length > 1 && (
          <div className="hidden gap-2 overflow-x-auto border-b border-border bg-background p-3 sm:flex" aria-label="Miniaturas de la galería">
            {gallery.map((image, index) => <button key={image.id} type="button" onClick={() => setGalleryState({ cabinId: cabin.id, index })} aria-label={`Ver fotografía ${index + 1} de ${gallery.length}`} aria-current={index === activeIndex ? "true" : undefined} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${index === activeIndex ? "border-primary" : "border-transparent opacity-75 hover:opacity-100"}`}><Image src={image.url} alt="" fill sizes="96px" className="object-cover" /></button>)}
          </div>
        )}

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{cabin.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden />{cabin.location}</p>
              </div>
              {typeof cabin.rating === "number" && typeof cabin.reviews === "number" && <span className="flex items-center gap-1 text-sm font-medium"><Star className="size-4 fill-gold text-gold" aria-hidden />{cabin.rating} <span className="text-muted-foreground">({cabin.reviews})</span></span>}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{cabin.description}</p>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-secondary/60 p-3 text-center text-sm">
              <div className="flex flex-col items-center gap-1"><Users className="size-4 text-primary" aria-hidden /><b>{cabin.minGuests}-{cabin.maxGuests}</b><span className="text-xs text-muted-foreground">Huéspedes</span></div>
              <div className="flex flex-col items-center gap-1"><Bed className="size-4 text-primary" aria-hidden /><b>{cabin.bedrooms}</b><span className="text-xs text-muted-foreground">Habitaciones</span></div>
              <div className="flex flex-col items-center gap-1"><Bath className="size-4 text-primary" aria-hidden /><b>{cabin.bathrooms}</b><span className="text-xs text-muted-foreground">Baños</span></div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-foreground"><MapPin className="size-4 text-primary" aria-hidden />Zona: <b>{cabin.zone || cabin.location}</b></p>
              {cabin.mapsUrl && (
                <a href={cabin.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-forest-dark">
                  <MapPin className="size-3.5" aria-hidden />Cómo llegar
                </a>
              )}
            </div>
            {cabin.bedDistribution && Object.keys(cabin.bedDistribution).length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><DoorOpen className="size-4 text-primary" aria-hidden />Distribución de camas</h3>
                <ul className="flex flex-wrap gap-2">{Object.entries(cabin.bedDistribution).map(([bed, count]) => <li key={bed} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium">{count} × {bed}</li>)}</ul>
              </div>
            )}
            {cabin.rules.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Info className="size-4 text-primary" aria-hidden />Reglas de la cabaña</h3>
                <ul className="flex flex-wrap gap-2">{cabin.rules.map((rule) => <li key={rule} className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium"><Check className="size-3.5 text-success" aria-hidden />{rule}</li>)}</ul>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold">Amenidades</h3>
              <div className="flex flex-wrap gap-2">{cabin.amenities.map((amenity) => <span key={amenity} className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium"><Check className="size-3.5 text-success" aria-hidden />{amenity}</span>)}</div>
            </div>
            <p className="flex items-baseline gap-1.5 border-t border-border pt-4"><span className="text-2xl font-semibold">${currency(cabin.price)}</span><span className="text-sm text-muted-foreground">MXN / noche</span></p>
          </div>

          <form onSubmit={submitRequest} className="rounded-2xl border border-border bg-secondary/30 p-4">
            <h3 className="font-semibold text-foreground">Reserva tu cabaña</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Consulta la disponibilidad, elige tus fechas y confirma tu reservación de forma sencilla.</p>
            {submitted ? (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4" role="status">
                <p className="font-semibold text-foreground">Tu solicitud quedó registrada</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">También puedes continuar la conversación por WhatsApp.</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Abrir WhatsApp</a>
                <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">Cerrar</button>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Cabaña seleccionada<input value={cabin.name} readOnly className={`${formControlClass} bg-muted`} /></label>
                <label className="text-xs font-medium text-muted-foreground">Nombre<input name="name" autoComplete="name" required placeholder="Tu nombre" className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground">Teléfono<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="Tu número con lada" className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground">Entrada<span className="relative mt-1 flex"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 size-4 text-primary sm:top-3" aria-hidden /><input name="checkIn" type="date" required value={checkIn} max={checkOut || undefined} onChange={(event) => { setCheckIn(event.target.value); setDateError(null) }} className={dateControlClass} /></span></label>
                <label className="text-xs font-medium text-muted-foreground">Salida<span className="relative mt-1 flex"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 size-4 text-primary sm:top-3" aria-hidden /><input name="checkOut" type="date" required value={checkOut} min={checkIn || undefined} onChange={(event) => { setCheckOut(event.target.value); setDateError(null) }} className={dateControlClass} /></span></label>
                <label className="text-xs font-medium text-muted-foreground">Huéspedes<input name="guests" type="number" inputMode="numeric" min={1} max={cabin.maxGuests} defaultValue={bookingDefaults.guests} required className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Comentarios<textarea name="comments" rows={3} placeholder="Necesidades especiales o preguntas" className="mt-1 min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                {submitError && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">{submitError}</p>}
                {dateError && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">{dateError}</p>}
                <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"><Send className="size-4" aria-hidden />{isSubmitting ? "Registrando solicitud…" : "Consultar disponibilidad"}</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
