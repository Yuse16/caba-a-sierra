import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Playfair_Display } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

function configuredProductionOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const value = configured || (vercelProduction ? `https://${vercelProduction}` : '')

  try {
    return value ? new URL(value) : null
  } catch {
    return null
  }
}

export function generateMetadata(): Metadata {
  const origin = configuredProductionOrigin()

  return {
    metadataBase: origin ?? undefined,
    title: 'Cabañas Sierra Norte — Cabañas en Arteaga',
    description:
      'Explora cabañas en la Sierra de Arteaga, Coahuila, consulta disponibilidad y encuentra opciones para tu próxima estancia.',
    alternates: origin ? { canonical: '/' } : undefined,
    openGraph: {
      title: 'Cabañas Sierra Norte',
      description: 'Respira el bosque. Vive la sierra.',
      locale: 'es_MX',
      type: 'website',
      url: origin ? '/' : undefined,
      images: origin
        ? [
            {
              url: '/og.png',
              width: 1200,
              height: 630,
              alt: 'Cabañas Sierra Norte — Respira el bosque. Vive la sierra.',
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cabañas Sierra Norte',
      description: 'Respira el bosque. Vive la sierra.',
      images: origin ? ['/og.png'] : undefined,
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2f5741',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${geistSans.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
