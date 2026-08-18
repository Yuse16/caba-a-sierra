import { Analytics } from '@vercel/analytics/next'
import { SerwistProvider } from '@serwist/turbopack/react'
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
    applicationName: 'DUPEZ',
    title: 'DUPEZ | Renta de cabañas en toda la Sierra de Arteaga',
    description:
      'Encuentra y reserva cabañas en la Sierra de Arteaga. Conoce opciones, disponibilidad y promociones de DUPEZ.',
    alternates: origin ? { canonical: '/' } : undefined,
    openGraph: {
      title: 'DUPEZ | Renta de cabañas en toda la Sierra de Arteaga',
      description: 'Encuentra y reserva cabañas en la Sierra de Arteaga. Conoce opciones, disponibilidad y promociones de DUPEZ.',
      locale: 'es_MX',
      type: 'website',
      url: origin ? '/' : undefined,
      images: origin
        ? [
            {
              url: '/og.png',
              width: 1200,
              height: 630,
              alt: 'DUPEZ — Renta de cabañas en toda la Sierra de Arteaga',
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'DUPEZ | Renta de cabañas en toda la Sierra de Arteaga',
      description: 'Encuentra y reserva cabañas en la Sierra de Arteaga. Conoce opciones, disponibilidad y promociones de DUPEZ.',
      images: origin ? ['/og.png'] : undefined,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'DUPEZ',
    },
    icons: {
      icon: ['/favicon.png', '/icon.svg'],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.webmanifest',
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2f5741',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${geistSans.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
        </SerwistProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
