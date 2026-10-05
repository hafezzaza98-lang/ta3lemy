// ============================================
// Service Worker - منصة حافظ التعليمية
// ============================================

const CACHE_NAME = 'ta3lemy-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  // تجاوز طلبات Supabase (لازم نت دايمًا)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // لو موجود في الكاش → رجعه
        if (response) {
          return response;
        }

        // لو مش موجود → جيبه من النت
        return fetch(event.request).then((response) => {
          // تحقق من الرد
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // خزنه في الكاش
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // لو النت مقطوع — رجع الصفحة الرئيسية
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// رسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
