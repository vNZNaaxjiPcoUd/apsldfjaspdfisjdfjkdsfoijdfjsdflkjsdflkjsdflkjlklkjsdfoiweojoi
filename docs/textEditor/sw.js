const CACHE_NAME = 'markdown-pwa-v2.111';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './marked.min.js',
  './'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 若快取中有對應檔案則直接回傳，否則透過網路請求
      return response || fetch(event.request);
    })
  );
});