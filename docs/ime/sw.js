const CACHE_NAME = 'cjime.v.1.1'; // 每次更新檔案請更改此版本號

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './crypto-js.min.js',
  './cangjie_dict.js',
  './sw.js',
  './cj.obf.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已快取新版本:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('快取檔案失敗:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得控制權
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有資料，直接回傳；否則透過網路請求
        return response || fetch(event.request).catch(() => {
          // 若網路斷線且是請求 HTML 頁面，回傳首頁快取
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});