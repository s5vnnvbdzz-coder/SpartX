// Keep the standalone AscensionX app fresh on iOS. Navigation and HTML are
// network-first; all other shell assets remain available offline.
const CACHE = 'ascensionx-shell-v144';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', '../assets/energy-can.svg', '../assets/themes/spartanx-ascension-embed.css?v=288', '../assets/ascension/load-guard.js?v=338', '../assets/ascension/workout-prescription.js?v=425', '../assets/ascension/cycle-progression.js?v=346', '../assets/ascension/cycle-intelligence.js?v=1', '../assets/themes/uniform-surfaces.css?v=340', '../assets/themes/shared-theme.js?v=340', '../assets/charts/touch-scrub.js?v=340', '../assets/science/evidence-engine.js?v=2', '../assets/science/volume-intelligence.js?v=432', '../assets/ascension/selection-quality.js?v=428', '../assets/ascension/adaptive-programming.js?v=454', '../assets/bodybuilding/ascension-companion.js?v=423', '../assets/ascension/cycle-builder-ui.css?v=406', './obsidian-clean.css?v=355', '../assets/ui/modal-viewport.css?v=413', '../assets/ui/modal-viewport.js?v=419', '../assets/ui/compact-layout.css?v=441'];
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
 if(isDocument&&url.searchParams.get('sxIntegrated')==='1'){
  // The integrated first-party programme shares its cache with SpartanX.
  // Immediately use any prefetched page (even if the root service worker
  // stored it) while quietly validating the latest deployed document.
  const fresh=fetch(event.request,{cache:'no-store'}).then(response=>{
   if(response?.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
   }
   return response;
  });
  event.waitUntil(fresh.catch(()=>{}));
  event.respondWith(caches.match(event.request).then(cached=>cached||fresh)
   .catch(()=>fresh).catch(()=>Response.error()));
  return;
 }
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
