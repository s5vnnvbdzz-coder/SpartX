/* Preserve the SpartanX screen that launched Intelligence, including when
   switching Powerlifting / Bodybuilding / Weight Loss documents. */
(()=>{
 'use strict';
 const KEY='sx_intelligence_launch_source_v1';
 const allowed=new Set(['workout','home','tools','profile','activeWorkout']);
 const params=new URLSearchParams(location.search);
 const explicit=params.get('from');
 let source=allowed.has(explicit)?explicit:null;
 try{
  if(!source){const saved=sessionStorage.getItem(KEY);if(allowed.has(saved))source=saved}
  if(source)sessionStorage.setItem(KEY,source);
 }catch(_){}
 // Direct Intelligence links have historically come from both Home and
 // Workout; Workout is a useful fallback when there is no source marker.
 source=source||'workout';
 const setReturns=()=>{
  for(const link of document.querySelectorAll('a[href*="sxReturn=intelligence"]')){
   const url=new URL(link.getAttribute('href'),location.href);
   url.searchParams.set('sxFrom',source);
   link.href=url.toString();
  }
 };
 setReturns();
 window.addEventListener('pageshow',setReturns);
})();
