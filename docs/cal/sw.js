// 每次修改程式碼後，請更改此版本號來觸發更新
const VERSION = 'v1.0.0';
const CACHE_NAME = `spreadsheet-cache-${VERSION}`;

// 需要快取的檔案列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝階段：將檔案寫入快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 啟動階段：清除舊版本的快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截網路請求：除非找不到快取，否則永遠使用快取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在快取中找到匹配的結果，直接回傳快取
        if (response) {
          return response;
        }
        // 否則透過網路請求
        return fetch(event.request);
      })
  );
});