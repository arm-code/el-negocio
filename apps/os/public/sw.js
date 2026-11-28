self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Service worker básico passthrough.
  // Esto es necesario para que el navegador reconozca la aplicación como instalable (PWA).
  // No realiza caché activo de red para evitar conflictos.
});

// Avisos que manda el API: { title, body, url, tag }
self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch (error) {
    message = {};
  }
  // El navegador exige mostrar algo por cada aviso recibido
  event.waitUntil(
    self.registration.showNotification(message.title || 'Tienes un aviso', {
      body: message.body || '',
      icon: '/images/icon-192x192.png',
      tag: message.tag,
      renotify: Boolean(message.tag),
      data: { url: message.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data && event.notification.data.url;
  // Solo rutas de esta misma app
  const isOwnPath = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
  const target = new URL(isOwnPath ? path : '/dashboard', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (!open) return self.clients.openWindow(target);
      await open.focus();
      if (open.url !== target) await open.navigate(target).catch(() => self.clients.openWindow(target));
    })()
  );
});
