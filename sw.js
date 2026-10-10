/* Timmar – endast appens skal cachas. Användardata lagras INTE i Service Worker. */
const CACHE_NAME = 'timmar-shell-v1-1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('timmar-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.mode === 'navigate'){
    event.respondWith(fetch(req).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(req).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}
      return response;
    }).catch(()=>caches.match(req)));
  }else if(/\/(?:manifest\.webmanifest|icon-192\.png|icon-512\.png|apple-touch-icon\.png)$/.test(url.pathname)){
    event.respondWith(caches.match(req).then(found => found || fetch(req)));
  }
});
