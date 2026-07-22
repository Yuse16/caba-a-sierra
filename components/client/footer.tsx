import { MessageCircle, Phone, ShieldCheck, MapPin } from "lucide-react"
import type { Version } from "@/components/demo/demo-context"

export function Footer({ version }: { version: Version }) {
  return (
    <footer className="bg-forest-dark text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-3">
            <MessageCircle className="size-6 shrink-0 text-primary-foreground/80" aria-hidden />
            <div>
              <h3 className="text-base font-semibold">¿Tienes dudas?</h3>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Escríbenos por WhatsApp y te ayudamos{version === "pro" ? " al instante." : "."}
              </p>
              <a
                href="https://wa.me/528441234567?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20las%20caba%C3%B1as"
                className="mt-3 inline-flex rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground hover:bg-gold/90"
              >
                {version === "pro" ? "Enviar mensaje" : "Abrir WhatsApp"}
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <Phone className="size-6 shrink-0 text-primary-foreground/80" aria-hidden />
            <div>
              <h3 className="text-base font-semibold">Llámanos</h3>
              <p className="mt-1 text-sm font-medium">(844) 123 4567</p>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Atención diaria
                <br />
                8:00 AM - 9:00 PM
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <ShieldCheck className="size-6 shrink-0 text-primary-foreground/80" aria-hidden />
            <div>
              <h3 className="text-base font-semibold">Confirmación acompañada</h3>
              <p className="mt-1 text-sm text-primary-foreground/70">
                {version === "pro"
                  ? "Verificamos la disponibilidad con cada propietario antes de confirmar."
                  : "Tu solicitud se consulta con el propietario. Sin pagos en línea en esta demo."}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin className="size-6 shrink-0 text-primary-foreground/80" aria-hidden />
            <div>
              <h3 className="text-base font-semibold">Ubicación</h3>
              <p className="mt-1 text-sm font-medium">Arteaga, Coahuila, México</p>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Rodeado de montañas, bosques y naturaleza.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-6 text-center text-xs text-primary-foreground/60">
          © 2026 Cabañas Sierra Norte. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
