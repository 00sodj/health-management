/* health-managem Service Worker —— 应用外壳缓存，支持离线访问 */
const CACHE = 'health-managem-v1'
const CORE = ['/', '/index.html', '/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // 仅缓存同源资源；API / 外部请求直接放行
  if (url.origin !== self.location.origin) return

  // 导航请求：网络优先，失败回退到缓存的 index.html（SPA 离线可用）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // 静态资源：缓存优先 + 后台更新（stale-while-revalidate）
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return resp
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
