import { MetadataRoute } from 'next';
import { getInstanceBrand, PLATFORM_NAME } from '@/lib/instance-brand';

const SIZES = [192, 512];
const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/** El logo del negocio (idealmente cuadrado, de 512 px o más) o el icono genérico. */
function icons(logoUrl: string | null): MetadataRoute.Manifest['icons'] {
  const type = IMAGE_TYPES[logoUrl?.split('?')[0].split('.').pop()?.toLowerCase() ?? ''];
  return SIZES.map((size) => ({
    src: logoUrl && type ? logoUrl : `/images/icon-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: logoUrl && type ? type : 'image/png',
  }));
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { name, logoUrl } = await getInstanceBrand();
  const appName = name ?? PLATFORM_NAME;

  return {
    name: appName,
    short_name: appName,
    description: name ? `Sitio y panel de ${name}` : 'Sistema de gestión para negocios',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#f9fafb',
    icons: icons(logoUrl),
  };
}
