/* Memory Space service worker */
const CACHE = 'ms-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '新消息', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || '空间消息提醒';
  const options = {
    body: data.body || '',
    icon: data.icon || '/heart.svg',
    badge: data.icon || '/heart.svg',
    tag: data.tag || 'memory-space',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/chat' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const client of wins) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            client.focus();
            client.postMessage({ type: 'navigate', url: target });
            return;
          }
        } catch (e) {}
      }
      return self.clients.openWindow(target);
    }),
  );
});
