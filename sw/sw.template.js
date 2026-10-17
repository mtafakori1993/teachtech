/* TeachTech service worker. __BUILD_ID__ is stamped at build time (scripts/stamp-sw.mjs) so every release changes this file
 * byte-for-byte and the browser's update check detects it.
 *
 * Scope of caching (deliberately small and non-sensitive):
 *  - app shell assets: /_next/static/* (content-hashed), icons, fonts
 *  - public pages for repeat visits (network-first)
 *  - an offline fallback page
 * Never cached: /api/*, private areas (dashboards, learning, quizzes, orders, certificates, checkout, cart, login), media (video), Range requests.
 */
const BUILD = "__BUILD_ID__";
const SHELL_CACHE = `tt-shell-${BUILD}`;
const PAGES_CACHE = `tt-pages-${BUILD}`;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/brand-mark.svg"];

const PUBLIC_PAGE = /^\/(?:$|courses(?:\/|$)|instructors\/|about$|contact$|faq$|resources(?:\/|$)|install$|privacy$|terms$|offline$|search$|verify(?:\/|$))/;
const PRIVATE = /^\/(?:api|dashboard|instructor|admin|learn|quiz|certificate|order|checkout|cart|login)(?:\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, PAGES_CACHE]);
    for (const k of await caches.keys()) if (k.startsWith("tt-") && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

async function networkFirstPage(request, url) {
  const cacheable = PUBLIC_PAGE.test(url.pathname) && !PRIVATE.test(url.pathname);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok && cacheable && !res.redirected) {
      const copy = res.clone();
      caches.open(PAGES_CACHE).then((c) => c.put(request, copy)).then(() => trim(PAGES_CACHE, 40));
    }
    return res;
  } catch {
    if (cacheable) {
      const hit = await caches.match(request, { cacheName: PAGES_CACHE });
      if (hit) return hit;
    }
    return (await caches.match("/offline", { cacheName: SHELL_CACHE })) || new Response("آفلاین", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);
  const net = fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (p.startsWith("/api/") || p === "/sw.js" || p.startsWith("/media/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url));
    return;
  }
  if (p.startsWith("/_next/static/")) { event.respondWith(cacheFirst(request)); return; }
  if (p.startsWith("/icons/") || p === "/brand-mark.svg" || /\.(?:woff2?|png|svg|ico)$/.test(p)) { event.respondWith(staleWhileRevalidate(request)); return; }
});
