import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Playfair_Display } from 'next/font/google'
import { headers } from 'next/headers'
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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${protocol}://${host}` : null

  return {
    title: 'Cabañas Sierra Norte — Cabañas en Arteaga',
    description:
      'Explora cabañas en la Sierra de Arteaga, Coahuila, consulta disponibilidad y encuentra opciones para tu próxima estancia.',
    openGraph: {
      title: 'Cabañas Sierra Norte',
      description: 'Respira el bosque. Vive la sierra.',
      locale: 'es_MX',
      type: 'website',
      images: origin
        ? [
            {
              url: `${origin}/og.png`,
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
      images: origin ? [`${origin}/og.png`] : undefined,
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
    <html lang="es" className={`${geistSans.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
