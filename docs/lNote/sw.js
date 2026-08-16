// 每次修改 index.html 或靜態檔案時，請記得更改這個版本號，這樣才會觸發更新
const CACHE_PREFIX = 'lnote-cache';
const CACHE_NAME = `${CACHE_PREFIX}-v3.3333333333`;

const urlsToCache = [
  '/lNote/',
  '/lNote/index.html',
  '/lNote/manifest.js',
  '/lNote/crypto-js.min.js',
  '/lNote/marked.min.js',
  '/lNote/mermaid.min.js',
  '/lNote/favicon192.png',
  '/lNote/favicon512.png',
  '/lNote/style_black.css',
  '/lNote/note.obf.js',
  '/lNote/keep.v1.js'
];

// 1. 安裝階段：快取核心檔案
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      //console.log('[Service Worker] 開始快取資源...');
      
      // 使用 Promise.allSettled 代替 cache.addAll
      const results = await Promise.allSettled(
        urlsToCache.map(async url => {
          try {
            await cache.add(url);
            //console.log(`[SW] 快取成功: ${url}`);
          } catch (err) {
            // 捕捉單一檔案失敗，列出具體網址，不讓整個流程崩潰
            console.error(`[SW] 快取失敗 (請檢查路徑或404): ${url}`, err);
          }
        })
      );
    })
  );
});

// 2. 啟動階段：清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 只刪除前綴為 lnote-cache 且非當前版本的舊快取
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
            //console.log('[lNote SW] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求：Cache First + 動態快取 (Dynamic Caching)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 如果請求非同源，或是非 /lNote/ 路徑，直接放行不做快取管理
  if (!url.pathname.startsWith('/lNote/')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // 動態寫入快取
        if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(error => {
        console.log('[lNote SW] 網路請求失敗，且無快取可用:', error);
      });
    })
  );
});
