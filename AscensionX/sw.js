// Keep the standalone AscensionX app fresh on iOS. Navigation and HTML are
// network-first; all other shell assets remain available offline.
const CACHE = 'ascensionx-shell-v79';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', '../assets/energy-can.svg', '../assets/themes/spartanx-ascension-embed.css?v=288', '../assets/ascension/adaptive-programming.js?v=310', '../assets/ascension/cycle-builder-ui.css?v=309'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(key => key.startsWith('ascensionx-shell-') && key !== CACHE).map(key => caches.delete(key)))
 ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 if(event.request.method !== 'GET')return;
 const url=new URL(event.request.url);
 if(url.origin !== self.location.origin)return;
 // The previous cache-first strategy could keep showing an old programme UI.
 const isDocument=event.request.mode === 'navigate'||url.pathname.endsWith('/AscensionX/index.html')||url.pathname.endsWith('/AscensionX/');
 if(isDocument){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
   if(response && response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
   return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
  if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
  return response;
 }).catch(()=>caches.match(event.request))));
});
