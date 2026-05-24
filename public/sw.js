/* Kya Banaye - Service Worker */
const CACHE_NAME = 'kya-banaye-v1';
const urlsToCache = ['/', '/index.html', '/static/js/main.chunk.js', '/static/css/main.chunk.css'];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!['http:', 'https:'].includes(url.protocol)) return;
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push Notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🍽️ Kya Banaye?';
  const options = {
    body: data.body || 'Aaj ka meal decide karo!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'meal-reminder',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '🍳 Dekho Options' },
      { action: 'dismiss', title: 'Baad mein' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
        return clientList[0].navigate('/');
      }
      return clients.openWindow('/');
    })
  );
});

// Scheduled notification check (every hour via periodic sync or message)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_CHECK') {
    checkAndNotify(event.data.hour);
  }
});

function checkAndNotify(hour) {
  const schedules = [
    { hour: 7, title: '🌅 Breakfast Time!', body: 'Subah ka naashta decide karo — weather ke hisaab se suggestions ready hain!', tag: 'breakfast' },
    { hour: 11, title: '☀️ Lunch Prep Time!', body: 'Dopahar ka khana banana shuru karo — options dekhne ke liye tap karo!', tag: 'lunch' },
    { hour: 16, title: '🌇 Snack O\'Clock!', body: 'Shaam ki chai ke saath kya khayein? Suggestions dekhlo!', tag: 'snack' },
    { hour: 19, title: '🌙 Dinner Time!', body: 'Raat ka khana decide karo — aaj mood kaisa hai?', tag: 'dinner' },
  ];
  const match = schedules.find((s) => s.hour === hour);
  if (match) {
    self.registration.showNotification(match.title, {
      body: match.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: match.tag,
      renotify: true,
      actions: [
        { action: 'open', title: '🍳 Dekho Options' },
        { action: 'dismiss', title: 'Baad mein' }
      ]
    });
  }
}
