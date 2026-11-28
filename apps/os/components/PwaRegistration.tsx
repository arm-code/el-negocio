'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
  useEffect(() => {
    // Sin esperar a "load": si la página ya cargó, ese evento no vuelve a ocurrir
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin service worker la app funciona igual, pero sin avisos
      });
    }
  }, []);

  return null;
}
