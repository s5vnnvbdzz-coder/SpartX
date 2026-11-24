/* SpartanX PWA — lightweight install so iOS is not blocked by any optional
   image/theme/tool asset. All successfully fetched files are cached on use. */
const CACHE='spartanx-v417';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE)
  .then(cache=>cache.addAll(CORE))
  .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key.startsWith('spartanx-v')&&key!==CACHE).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const navigate=request.mode==='navigate';
 // Integrated Intelligence/AscensionX views are prefetched while Tools is
 // visible. Render a cached module document immediately while updating its
 // cache in the background; the regular SpartanX home page stays network-first.
 const integratedModule=navigate&&url.searchParams.get('sxIntegrated')==='1'&&
  /\/(?:intelligence|AscensionX)\/(?:index\.html)?$/i.test(url.pathname);
 if(integratedModule){
  const fresh=fetch(new Request(request,{cache:'no-store'})).then(response=>{
   if(response?.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));
   }
   return response;
  });
  // Even when the cache is warm, verify the new document without making the
  // user wait; failed fetches do not invalidate the offline copy.
  event.waitUntil(fresh.catch(()=>{}));
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(request)).then(
   cached=>cached||fresh
  ).catch(()=>fresh).catch(()=>Response.error()));
  return;
 }
 // Don't let Safari's HTTP cache mask a newly deployed HTML document.
 const live=navigate?fetch(new Request(request,{cache:'no-store'})):fetch(request);
 event.respondWith(live.then(response=>{
  if(response&&response.ok){
   const copy=response.clone();
   // Best-effort runtime cache: a failed cache write never blocks the page.
   event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));
  }
  return response;
 }).catch(async()=>{
  const cache=await caches.open(CACHE);
  return (await cache.match(request))||(navigate?await cache.match('./index.html'):undefined)||Response.error();
 }));
});
