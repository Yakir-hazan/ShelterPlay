const CACHE_NAME = 'mamad-v1';
const ASSETS = [
  '/',
  '/index.html'
];

// התקנה — שמור את האתר במטמון
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// הפעלה — מחק מטמון ישן
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// בקשות — תחזיר מהמטמון אם אין אינטרנט
self.addEventListener('fetch', e => {
  // התראות אמת — תמיד מהרשת, לא ממטמון
  if (e.request.url.includes('oref') || e.request.url.includes('nominatim')) {
    e.respondWith(fetch(e.request).catch(() => new Response('')));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // שמור במטמון רק תגובות תקינות
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
