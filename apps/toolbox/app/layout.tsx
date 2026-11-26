// app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { BRAND } from '@/lib/brand'

import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: `${BRAND.name} - Herramientas gratuitas para tu negocio`,
  applicationName: BRAND.name,
  description: 'Notas de venta listas desde tu celular, y más herramientas en camino. Herramientas gratuitas para pequeños negocios, tiendas y emprendedores.',
  manifest: "/manifest.json",
  icons: {
    icon: '/icon_192x192.png',
    apple: '/icon_192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es-MX"
      // Color de acento de las micro apps: 'brick' o 'violet' (ver theme.css)
      data-accent="brick"
      suppressHydrationWarning
      className={`bg-background ${geist.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased text-foreground">
        <Providers>
          {/* Arriba: abajo viven los botones principales (descargar, compartir, guardar) */}
          <Toaster
            richColors
            closeButton
            position="top-center"
            mobileOffset={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}