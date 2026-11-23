/* First-party SpartanX Intelligence navigation.
 * One shared athlete record, same origin, no iframe or duplicate tracker.
 * Preserves the originating SpartanX tab and enables fast browser-history Back
 * (including the back/forward cache on supported browsers).
 */
(()=>{
 'use strict';
 const KEY='sx_intelligence_launch_source_v1';
 const SNAPSHOT='sx_intelligence_return_scroll_v1';
 const allowed=new Set(['workout','home','tools','profile','activeWorkout']);
 const params=new URLSearchParams(location.search);
 const explicit=params.get('from');
 let source=allowed.has(explicit)?explicit:null;
 try{
  if(!source){const saved=sessionStorage.getItem(KEY);if(allowed.has(saved))source=saved}
  if(source)sessionStorage.setItem(KEY,source);
 }catch(_){}
 source=source||'workout';
 const integrated=params.get('sxIntegrated')==='1';
 document.body.classList.toggle('sx-intelligence-integrated',integrated);
 const setReturns=()=>{
  for(const link of document.querySelectorAll('a[href*="sxReturn=intelligence"]')){
   const url=new URL(link.getAttribute('href'),location.href);
   url.searchParams.set('sxFrom',source);
   link.href=url.toString();
  }
  // Preserve the integrated launch context when returning to the Intelligence
  // dashboard from the Bodybuilding / Weight Loss layout.
  if(integrated){
   for(const link of document.querySelectorAll('a.brand[href="./"]')){
    const url=new URL(link.getAttribute('href'),location.href);
    url.searchParams.set('from',source);
    url.searchParams.set('sxIntegrated','1');
    link.href=url.toString();
    // Moving between Intelligence dashboards should not add another
    // browser-history entry between this module and its SpartanX origin.
    if(!link.dataset.sxIntegratedBrandRoute){
     link.dataset.sxIntegratedBrandRoute='true';
     link.addEventListener('click',event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
         event.shiftKey||event.altKey)return;
      event.preventDefault();
      location.replace(link.href);
     });
    }
   }
  }
 };
 setReturns();
 window.addEventListener('pageshow',setReturns);
 function hasRecentSpartanXLaunch(){
  if(!integrated||history.length<2)return false;
  try{
   const snapshot=JSON.parse(sessionStorage.getItem(SNAPSHOT)||'null');
   return snapshot?.source===source&&Number.isFinite(snapshot.at)&&
    Date.now()-snapshot.at>=0&&Date.now()-snapshot.at<3600000;
  }catch(_){return false}
 }
 // A browser-history return normally reuses SpartanX without reloading all
 // its scripts. If no previous page exists, the ordinary Back link remains
 // an accessible, reliable first-party URL with normal scroll restoration.
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
     event.shiftKey||event.altKey||!hasRecentSpartanXLaunch())return;
  const anchor=event.target.closest?.('a[href*="sxReturn=intelligence"]');
  if(!anchor)return;
  event.preventDefault();
  const fallback=anchor.href;
  let departed=false;
  window.addEventListener('pagehide',()=>{departed=true},{once:true});
  history.back();
  // Direct links and unusual WebView history stacks may refuse Back.
  // In that case, use the normal return route rather than trapping the user.
  setTimeout(()=>{if(!departed)location.assign(fallback)},900);
 },true);
})();