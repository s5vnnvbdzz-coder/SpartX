/* SpartanX PWA — lightweight install so iOS is not blocked by any optional
   image/theme/tool asset. All successfully fetched files are cached on use. */
const CACHE='spartanx-v329';
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
