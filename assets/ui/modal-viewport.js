/* Shared modal viewport controller for SpartanX and native AscensionX. */
(function controller(win,doc){
 'use strict';
 const selector='[aria-modal="true"],dialog[open],.detail-overlay,.set-type-sheet.is-open,.cycle-confirm-backdrop.open,.settings-backdrop.open,.set-popup-backdrop.open,#workoutSavedOverlay,#rankUnlockedOverlay,#sessionOptionsMenu,#sxAscContinueBackdrop,#sxCycleViewBackdrop.open';
 const hostSelector='#toolsReplica,#native531Host,#sxAscensionPortalHost';
 let active=[],scheduled=false,touch=null;
 const observed=new WeakSet();
 const parent=el=>el.parentElement||el.getRootNode?.()?.host||null;
 function visible(el){
  if(!el?.isConnected||!el.getClientRects().length)return false;
  for(let node=el;node&&node!==doc.documentElement;node=parent(node)){
   if(node.hidden||node.getAttribute('aria-hidden')==='true')return false;
   const style=win.getComputedStyle(node);
   if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;
  }
  return true;
 }
 function surface(el){
  // Set-type, RPE and numeric sheets transition visibility for 250 ms.
  // Once marked open, claim modal ownership immediately rather than leaving
  // a brief frame where the background can scroll or receive taps.
  if(el.matches('.set-type-sheet.is-open')&&el.isConnected&&!el.hidden&&
    el.getAttribute('aria-hidden')!=='true')return el;
  if(!visible(el))return null;
  if(el.matches('dialog[open]'))return el;
  for(let node=el;node&&node!==doc.body;node=parent(node))if(win.getComputedStyle(node).position==='fixed')return node;
  return null;
 }
 function watch(root){if(observed.has(root))return;observed.add(root);observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','aria-modal','style','open']});}
 function sync(){
  scheduled=false;
  const roots=[doc];for(const host of doc.querySelectorAll(hostSelector))if(host.shadowRoot){roots.push(host.shadowRoot);watch(host.shadowRoot);}
  const next=[...new Set(roots.flatMap(root=>Array.from(root.querySelectorAll(selector)).map(surface).filter(Boolean)))];
  for(const el of active)if(!next.includes(el))el.removeAttribute('data-sx-modal-surface');
  for(const el of next)if(!active.includes(el))el.setAttribute('data-sx-modal-surface','');
  active=next;
  doc.documentElement.classList.toggle('sx-modal-open',active.length>0);
 }
 function schedule(){if(scheduled)return;scheduled=true;win.requestAnimationFrame(sync);}
 const observer=new win.MutationObserver(records=>{
  if(records.some(r=>r.type==='attributes'?r.target!==doc.documentElement:
    Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(n=>n.nodeType===1)))schedule();
 });
 watch(doc.body);
 function canScroll(path,limit,dx,dy){
  for(const el of path){
   if(el?.nodeType!==1)continue;
   if(el.matches('input[type="range"],canvas,[role="slider"]'))return true;
   const style=win.getComputedStyle(el),vertical=Math.abs(dy)>=Math.abs(dx);
   if(/^(auto|scroll|overlay)$/.test(vertical?style.overflowY:style.overflowX)){
    const pos=vertical?el.scrollTop:el.scrollLeft;
    const max=vertical?el.scrollHeight-el.clientHeight:el.scrollWidth-el.clientWidth;
    const delta=vertical?dy:dx;
    if(max>1&&((delta>0&&pos<max-1)||(delta<0&&pos>1)))return true;
   }
   if(el===limit)break;
  }
  return false;
 }
 function guard(event,dx,dy){
  if(scheduled)sync();
  if(!active.length||!event.cancelable)return;
  const path=event.composedPath(),limit=path.find(el=>active.includes(el));
  if(!limit||!canScroll(path,limit,dx,dy))event.preventDefault();
 }
 doc.addEventListener('wheel',e=>{if(!e.ctrlKey)guard(e,e.deltaX,e.deltaY);},{capture:true,passive:false});
 doc.addEventListener('touchstart',e=>{if(scheduled)sync();touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{capture:true,passive:true});
 doc.addEventListener('touchmove',e=>{
  if(e.touches.length!==1||!touch)return;
  const p=e.touches[0],dx=touch.x-p.clientX,dy=touch.y-p.clientY;
  touch={x:p.clientX,y:p.clientY};if(dx||dy)guard(e,dx,dy);
 },{capture:true,passive:false});
 for(const type of ['touchend','touchcancel'])doc.addEventListener(type,()=>{touch=null;},{capture:true,passive:true});
 win.addEventListener('pageshow',sync);win.addEventListener('load',sync,{once:true});
 win.SXModalViewport=Object.freeze({refresh:sync,isOpen:()=>active.length>0});
 sync();
})(window,document);
