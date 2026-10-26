const CACHE_NAME_HEAD = '聊天🌿';


// 此部份聊天🌿不用修改，為swJsVersionUpdate.js自動更新，於 updateCode.sh 呼叫發動。
const CACHE_NAME = '聊天🌿-v.261026152540'; 

// 更新相應暫存檔案
const urlsToCache = [
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
  './manifest.json',
  './'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      console.log("快取版本：", CACHE_NAME);
      const cache = await caches.open(CACHE_NAME);

      // 1. 使用 Promise.allSettled 進行並行下載與容錯處理
      await Promise.allSettled(
        urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.error(`快取失敗的檔案: ${url}`, err);
          }
        })
      );

      // 2. 確保快取流程處理完畢後，再跳過等待期接管頁面
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 逐一抓取並快取，避免單一 404 造成全盤失敗
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[SW] 快取檔案失敗（可能檔案不存在）: ${url}`, err);
        }
      }
    })
  );
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
        console.error('離線且無快取：', error, event.request.url);
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
        .filter(cacheName => cacheName.startsWith(CACHE_NAME_HEAD) && cacheName !== CACHE_NAME)
        .map(async cacheName => {
          console.log('刪除舊快取:', cacheName);
          return await caches.delete(cacheName);
        });

      await Promise.all(deletePromises);

      // 讓所有已開的即有的TAB，都立即更新，讓新的 Service Worker 立即開始控制現有的全部分頁
      await self.clients.claim();
    })()
  );
});
