const CACHE_NAME = 'todo-pwa-v1.1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './keepMe.js',
  './favicon192.png',
  './favicon512.png',
  'https://h.jwint.net/static/crypto-js.min.js'
];

// 安裝時快取核心檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截請求
self.addEventListener('fetch', event => {
  // 如果是 API 請求 (script.google.com 或 API)，一律走網路不走快取
  if (event.request.url.includes('script.google.com')) {
      event.respondWith(fetch(event.request));
      return;
  }

  // 其他靜態資源採用 Network First 策略，若離線才讀取快取
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 更新快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
