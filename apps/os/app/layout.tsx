import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import type { Metadata } from 'next';
import PwaRegistration from '@/components/PwaRegistration';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import QueryProvider from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/lib/auth';
import { BusinessProvider } from '@/lib/business';
import { DataProvider } from '@/lib/data-store';
import { getInstanceBrand, PLATFORM_NAME } from '@/lib/instance-brand';

// Dominio público de esta instancia (vista previa al compartir por WhatsApp, canonical)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getInstanceBrand();
  const name = brand.name ?? PLATFORM_NAME;
  const description = brand.name
    ? `Sitio y panel de administración de ${brand.name}.`
    : 'Sistema de gestión para negocios: inventario, cotizaciones y finanzas.';

  return {
    metadataBase: new URL(SITE_URL || 'http://localhost:3000'),
    title: { default: name, template: `%s | ${name}` },
    applicationName: name,
    description,
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      url: SITE_URL,
      siteName: name,
      title: name,
      description,
    },
    twitter: { card: 'summary_large_image', title: name, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: SITE_URL ? { canonical: SITE_URL } : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es' className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className='min-h-screen bg-gray-50'>
        <QueryProvider>
          <AuthProvider>
            <BusinessProvider>
              <DataProvider>
                <PwaRegistration />
                {children}
                <Toaster position="top-right" richColors />
              </DataProvider>
            </BusinessProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
