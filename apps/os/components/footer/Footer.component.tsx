'use client';

import React from 'react';

/**
 * Footer simple — el nombre del negocio lo provee el layout padre (TenantProvider).
 * Se usa a través de TenantFooter dentro de rutas de negocio.
 * Para rutas fuera del negocio (auth, etc.) se muestra el footer genérico.
 */
const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-violet-100 bg-violet-50/80">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-xs text-violet-400">
        <p className="mb-2 md:mb-0 select-none cursor-default">
          &copy; {new Date().getFullYear()} I Am a POS. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
