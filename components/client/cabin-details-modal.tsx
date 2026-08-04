"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import { X, MapPin, Users, Bed, Bath, Star, Check, CalendarDays, Send } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  currency,
  publicCabinStatusLabel,
  publicCabinStatusTone,
  type PublicCabin,
} from "@/lib/public-cabins"
import { siteContact } from "@/lib/site-config"

const formControlClass =
  "mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:h-10"

const dateControlClass =
  "h-11 w-full appearance-auto rounded-lg border border-border bg-background pl-9 pr-2 text-sm text-foreground outline-none [color-scheme:light] focus:border-ring focus:ring-2 focus:ring-ring/20 sm:h-10"

export function CabinDetailsModal({
  cabin,
  onClose,
  onAction,
}: {
  cabin: PublicCabin | null
  onClose: () => void
  onAction: (cabin: PublicCabin) => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [checkIn, setCheckIn] = useState("2026-08-14")
  const [checkOut, setCheckOut] = useState("2026-08-16")
  const [whatsappUrl, setWhatsappUrl] = useState<string>(siteContact.whatsappUrl)

  useEffect(() => {
    if (!cabin) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [cabin, onClose])

  if (!cabin) return null
  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = [
      "Hola, quiero consultar disponibilidad.",
      `Cabaña: ${cabin.name}`,
      `Nombre: ${String(formData.get("name") ?? "")}`,
      `Teléfono: ${String(formData.get("phone") ?? "")}`,
      `Entrada: ${checkIn}`,
      `Salida: ${checkOut}`,
      `Huéspedes: ${String(formData.get("guests") ?? "")}`,
      String(formData.get("comments") ?? "").trim() ? `Comentarios: ${String(formData.get("comments"))}` : "",
    ].filter(Boolean).join("\n")
    const nextWhatsappUrl = `https://wa.me/${siteContact.whatsappNumber}?text=${encodeURIComponent(message)}`
    setWhatsappUrl(nextWhatsappUrl)
    setSubmitted(true)
    onAction(cabin)
    window.open(nextWhatsappUrl, "_blank", "noopener,noreferrer")
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
        className="max-h-[100dvh] w-full max-w-3xl scroll-pb-24 overscroll-contain overflow-y-auto rounded-t-2xl bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-[94vh] sm:rounded-2xl sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[16/8] w-full">
          <Image src={cabin.image || "/placeholder.svg"} alt={`Foto de ${cabin.name}`} fill sizes="(max-width: 768px) 100vw, 720px" className="rounded-t-2xl object-cover" />
          <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background sm:size-9">
            <X className="size-4" aria-hidden />
          </button>
          <div className="absolute left-3 top-3">
            <StatusBadge tone={publicCabinStatusTone[cabin.status]} className="border border-border bg-white text-foreground shadow-sm">
              {publicCabinStatusLabel[cabin.status]}
            </StatusBadge>
          </div>
        </div>

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
                <p className="font-semibold text-foreground">Tu consulta está lista</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Envíala por WhatsApp para continuar con la consulta de disponibilidad.</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Abrir WhatsApp</a>
                <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">Cerrar</button>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Cabaña seleccionada<input value={cabin.name} readOnly className={`${formControlClass} bg-muted`} /></label>
                <label className="text-xs font-medium text-muted-foreground">Nombre<input name="name" autoComplete="name" required placeholder="Tu nombre" className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground">Teléfono<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="Tu número con lada" className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground">Entrada<span className="relative mt-1 flex"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 size-4 text-primary sm:top-3" aria-hidden /><input name="checkIn" type="date" required value={checkIn} max={checkOut} onChange={(event) => setCheckIn(event.target.value)} className={dateControlClass} /></span></label>
                <label className="text-xs font-medium text-muted-foreground">Salida<span className="relative mt-1 flex"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 size-4 text-primary sm:top-3" aria-hidden /><input name="checkOut" type="date" required value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} className={dateControlClass} /></span></label>
                <label className="text-xs font-medium text-muted-foreground">Huéspedes<input name="guests" type="number" inputMode="numeric" min={1} max={cabin.maxGuests} defaultValue={2} required className={formControlClass} /></label>
                <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Comentarios<textarea name="comments" rows={3} placeholder="Necesidades especiales o preguntas" className="mt-1 min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none [color-scheme:light] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:col-span-2"><Send className="size-4" aria-hidden />Consultar disponibilidad</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
