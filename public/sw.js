self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // 仅用于满足可安装 PWA 的 Service Worker 要求，不改变现有业务请求逻辑
});
