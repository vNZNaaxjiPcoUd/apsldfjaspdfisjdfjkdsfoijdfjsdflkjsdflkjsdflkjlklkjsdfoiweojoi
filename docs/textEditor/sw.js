const APP_PREFIX = 'textEditor';
const CACHE_NAME = `${APP_PREFIX}-v1.0.17`;
const urlsToCache = [
  './index.html',
  './editor.js',
  './manifest.json',
  './icon-192.webp',
  './icon-512.webp',
  './marked.min.js',
  './favicon.ico',
  '/favicon.ico',
  './',
  '/'
];


/*
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
});*/




self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('開始快取檔案...');
      for (const url of urlsToCache) {
        try { 
          await cache.add(url);
          console.log(`成功快取: ${url}`);
        } catch (err) {
          console.error(`快取失敗的檔案: ${url}`, err);
        }
      }
    })
  );
  self.skipWaiting();
});


self.addEventListener('fetch', event => {
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    (async () => {

      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
      if (cachedResponse) {
        return cachedResponse;
      }


      const url = new URL(event.request.url);
      if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
        const indexResponse = await caches.match('./index.html', { ignoreSearch: true }) || 
                              await caches.match('./', { ignoreSearch: true });
        if (indexResponse) return indexResponse;
      }


      try {
        return await fetch(event.request);
      } catch (error) {
        console.error('離線且無快取：', event.request.url);
        return new Response('<h1>離線中且尚無快取資料</h1>', {
          status: 533,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })()
  );
});



self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      
      const deletePromises = cacheNames
        .filter(cacheName => {
          // 條件：名稱開頭為 textEditor，且不等於當前的 CACHE_NAME
          return cacheName.startsWith(APP_PREFIX) && cacheName !== CACHE_NAME;
        })
        .map(async cacheName => {
          console.log('刪除舊快取:', cacheName);
          return await caches.delete(cacheName);
        });

      await Promise.all(deletePromises);
      await self.clients.claim();
    })()
  );
});