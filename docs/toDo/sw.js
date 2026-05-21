const CACHE_NAME = 'todo-pwa-v1.6'; // 升級版本號以強制更新
const urlsToCache = [
  './',
  './index.html',
  // 注意：已移除 './manifest.json'，因為它是動態生成的
  './keepMe.js',
  './favicon192.png',
  './favicon512.png',
  'https://h.jwint.net/static/crypto-js.min.js'
];

// 安裝時快取核心檔案 (採用高容錯寫法)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        console.log('Service Worker: 開始快取檔案...');
        // 逐一快取檔案，就算某個檔案失敗，也不會讓整個安裝崩潰
        for (let url of urlsToCache) {
          try {
            await cache.add(url);
            console.log(`✅ 成功快取: ${url}`);
          } catch (error) {
            console.warn(`❌ 無法快取檔案 (但不影響主程式): ${url}`, error);
          }
        }
      })
      .then(() => self.skipWaiting()) // 強制立即啟用新的 Service Worker
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
            console.log('Service Worker: 刪除舊快取', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即接管所有頁面
  );
});