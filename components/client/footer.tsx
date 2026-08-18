import { Clock3, Mail, MapPin, MessageCircle, Mountain, Phone } from "lucide-react"
import { siteContact } from "@/lib/site-config"

const navigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cabañas", href: "#cabanas" },
  { label: "Cómo funciona", href: "#como-reservar" },
  { label: "Contacto", href: "#contacto" },
]

const linkClasses =
  "rounded-sm text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#14261b]"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#14261b] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_1fr_1fr]">
          <div>
            <a
              href="#inicio"
              aria-label="DUPEZ, volver al inicio"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#14261b]"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white/10 text-[#f4d58b]">
                <Mountain className="size-6" aria-hidden />
              </span>
              <span>
                <span className="block font-serif text-xl font-semibold text-white">DUPEZ</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4d58b]">
                  Renta de cabañas en toda la Sierra de Arteaga
                </span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              Escapadas entre pinos, montañas y noches de chimenea en la Sierra de Arteaga.
              Encuentra un espacio para desconectar y volver a lo esencial.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Navegación</h2>
            <nav aria-label="Navegación del pie de página" className="mt-4">
              <ul className="space-y-3">
                {navigation.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className={linkClasses}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Contacto</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-[#f4d58b]" aria-hidden />
                <a href={siteContact.whatsappUrl} target="_blank" rel="noreferrer" className={linkClasses}>
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#f4d58b]" aria-hidden />
                <a href={siteContact.phoneHref} className={linkClasses}>
                  {siteContact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#f4d58b]" aria-hidden />
                <a href={`mailto:${siteContact.email}`} className={linkClasses}>
                  {siteContact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#f4d58b]" aria-hidden />
                <span className="text-sm leading-6 text-white/75">Arteaga, Coahuila, México</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Horario de atención</h2>
            <div className="mt-4 flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-[#f4d58b]" aria-hidden />
              <div className="text-sm leading-6 text-white/75">
                <p>Lunes a domingo</p>
                <p className="font-semibold text-white">8:00 a 21:00 h</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/55">
              Consulta la disponibilidad para las fechas seleccionadas y planea tu próxima
              estancia.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/12 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} DUPEZ. Todos los derechos reservados.</p>
          <p>Hecho para disfrutar la sierra con tranquilidad.</p>
        </div>
      </div>
    </footer>
  )
}
