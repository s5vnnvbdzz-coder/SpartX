/* Independently scoped service worker: NEVER unregister or delete SpartanX caches. */
const CACHE='ascensionx2-dev-v1';
const SHELL=['./','./index.html','./engine.js?v=1','./app.js?v=1','./style.css?v=1','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ascensionx2-dev-')&&k!==CACHE).map(k=>caches.delete(k))))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.includes('/AscensionX2/'))return;
 // Prefer network to avoid hiding a just-deployed development build on iPhone.
 event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));}
  return response;
 }).catch(async()=>{
  const cache=await caches.open(CACHE);
  return await cache.match(req)||await cache.match('./index.html')||Response.error();
 }));
});