const CACHE_NAME = 'zhitrend-store-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.svg',
  '/images/logo-white.svg',
  '/images/favicon.svg',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// 处理请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(error => {
      console.log('Fetch error:', error);
      return new Response('Network error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
}); 