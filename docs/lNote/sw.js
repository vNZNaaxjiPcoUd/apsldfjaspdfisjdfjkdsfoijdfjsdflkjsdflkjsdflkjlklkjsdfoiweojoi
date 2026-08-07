// 每次修改 index.html 或靜態檔案時，請記得更改這個版本號，這樣才會觸發更新
const CACHE_NAME = 'local-note-v22222'; 

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './crypto-js.min.js',
  './marked.min.js',
  './mermaid.min.js',
  './icon-192x192.png',
  './style_black.css',
  './note.obf.js',
  './keep.v1.js'
];

// 1. 安裝階段：快取核心檔案
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[Service Worker] 開始快取資源...');
      
      // 使用 Promise.allSettled 代替 cache.addAll
      const results = await Promise.allSettled(
        urlsToCache.map(async url => {
          try {
            await cache.add(url);
            console.log(`[SW] 快取成功: ${url}`);
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
          // 如果快取名稱不等於當前版本，就將其刪除
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有打開的客戶端
  );
});

// 3. 攔截請求：Cache First + 動態快取 (Dynamic Caching)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到，直接回傳 (離線時會走這條路)
        if (response) {
          return response;
        }
        
        // 如果快取沒有，則發起網路請求
        return fetch(event.request).then(networkResponse => {
          // 確保請求有效 (過濾掉跨域錯誤或非預期的回應)
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // 將新的網路請求結果複製一份存入快取 (動態快取)
          // 這樣下次斷網時，這個新資源也能被讀取
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        }).catch(error => {
           // 如果網路斷線，且快取裡也找不到資源的處理邏輯
           console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
        });
      })
  );
});