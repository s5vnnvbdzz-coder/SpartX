/* SpartanX connected-page carousel · reversible TEST
 * Touch swipes follow the finger; the adjacent page moves as one continuous
 * strip. Normal document scrolling, header spacer, footer and modals stay
 * outside the transition. Only the four main navigation screens participate.
 */
(function(){
 'use strict';
 const PAGES=['tools','home','workout','profile'];
 const STORE='spartx_carousel_trial_v1';
 const main=document.querySelector('body > main');
 const setting=document.getElementById('sxCarouselSetting');
 if(!main)return;
 const mobile=window.matchMedia('(max-width:767px) and (pointer:coarse)');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let enabled=true;
 try{enabled=localStorage.getItem(STORE)!=='off';}catch(_){}
 if(setting){
  setting.checked=enabled;
  setting.addEventListener('change',()=>{
   enabled=setting.checked;
   try{localStorage.setItem(STORE,enabled?'on':'off');}catch(_){}
   if(!enabled)clear();
  });
 }
 let drag=null;
 let busy=false;
 let bypass=false;
 let phaseToken=0;
 let timer=null;
 let suppressClickUntil=0;
 let suppressClickPage=null;
 // A swipe across a button must not also open its click action.
 document.addEventListener('click',event=>{
  if(suppressClickPage&&performance.now()<suppressClickUntil&&
     suppressClickPage.contains(event.target)){
   event.preventDefault();
   event.stopImmediatePropagation();
  }
 },true);
 const get=id=>document.getElementById(id);
 const active=()=>main.querySelector(':scope > .screen.active');
 const highlightNav=id=>{
  document.querySelectorAll('#trackerNav button[data-screen]').forEach(button=>{
   button.classList.toggle('active',button.dataset.screen===id);
  });
 };
 const ready=()=>{
  if(!enabled||!mobile.matches||busy)return false;
  const current=active();
  if(!current||!PAGES.includes(current.id))return false;
  const body=document.body;
  if(['profile-settings-open','profile-editor-open','completed-workout-open',
      'sx-workout-calendar-open','sx-ascensionx-open'].some(c=>body.classList.contains(c)))return false;
  if(document.querySelector('.detail-overlay:not(.hidden),.set-type-sheet.is-open,.rpe-sheet.is-open,.number-pad-sheet.is-open'))return false;
  return true;
 };
 /* Taps still work: only actual horizontal drags take over. A swipe can
    begin on a card's button or link, which was the main source of misses. */
 const editableTarget=t=>!!t?.closest?.(
  'input,textarea,select,iframe,[contenteditable="true"],[role="slider"],'+
  '#trackerNav,header,.feed-menu,.set-type-sheet,.rpe-sheet,.number-pad-sheet,.detail-overlay,'+
  '.sx-ascensionx-overlay,[data-no-carousel],.library-categories,[data-native-horizontal-scroll]'
 );
 const clear=(keepHighlight=false)=>{
  phaseToken++;
  if(timer!==null){window.clearTimeout(timer);timer=null;}
  for(const id of PAGES){
   const page=get(id);
   if(!page)continue;
   page.classList.remove('drag-preview','dragging','drag-settle');
   for(const name of ['transform','transition','top','left','right','width','position','z-index']){
    page.style.removeProperty(name);
   }
  }
  document.body.classList.remove('sx-carousel-in-motion');
  drag=null;
  busy=false;
  // When a gesture is cancelled, keep the highlighted tab in sync with
  // whichever real page is active (rather than the discarded preview).
  const current=active();
  if(!keepHighlight&&current&&PAGES.includes(current.id))highlightNav(current.id);
 };
 window.spartanxClearDrag=clear;
 const place=(page,x)=>{
  page.style.transform='translate3d('+Math.round(x)+'px,0,0)';
 };
 const metrics=page=>{
  const container=getComputedStyle(main);
  const bounds=page.getBoundingClientRect();
  return {width:bounds.width,
          left:parseFloat(container.paddingLeft)||16,
          top:parseFloat(container.paddingTop)||16};
 };
 const makePair=(origin,neighbor,direction)=>{
  const m=metrics(origin);
  if(!neighbor)return {...m,neighbor:null,direction};
  neighbor.classList.add('drag-preview','dragging');
  neighbor.style.position='absolute';
  neighbor.style.width=m.width+'px';
  neighbor.style.left=m.left+'px';
  neighbor.style.right='auto';
  neighbor.style.top=m.top+'px';
  neighbor.style.zIndex='3';
  place(neighbor,direction*m.width);
  origin.classList.add('dragging');
  document.body.classList.add('sx-carousel-in-motion');
  return {...m,neighbor,direction};
 };
 const finish=(origin,neighbor,direction,toNext,initialX)=>{
  if(busy)return;
  busy=true;
  const localToken=++phaseToken;
  const targetId=toNext&&neighbor?neighbor.id:null;
  // Update the bottom tab as soon as the user commits to the page change,
  // not after the 320ms slide animation has finished.
  highlightNav(targetId||origin.id);
  const width=metrics(origin).width;
  const endX=targetId?-direction*width:0;
  const time=reduced.matches?0:(targetId?320:260);
  origin.classList.remove('dragging');
  origin.classList.add('drag-settle');
  if(neighbor){
   neighbor.classList.remove('dragging');
   neighbor.classList.add('drag-settle');
  }
  if(time){
   origin.style.transition='transform '+time+'ms cubic-bezier(.22,.8,.2,1)';
   if(neighbor)neighbor.style.transition=origin.style.transition;
  }
  const complete=()=>{
   if(localToken!==phaseToken)return;
   if(targetId&&window.switchScreen){
    // Keep the destination tab lit throughout the final commit. Clearing
    // the animation must not briefly re-highlight the old page.
    bypass=true;
    try{clear(true);window.switchScreen(targetId);}finally{bypass=false;}
   }else clear();
  };
  if(!time){
   place(origin,endX);
   if(neighbor)place(neighbor,direction*width+endX);
   complete();
   return;
  }
  // Two frames guarantee iOS paints the starting position before snapping.
  window.requestAnimationFrame(()=>{
   if(localToken!==phaseToken)return;
   window.requestAnimationFrame(()=>{
    if(localToken!==phaseToken)return;
    place(origin,endX);
    if(neighbor)place(neighbor,direction*width+endX);
   });
  });
  timer=window.setTimeout(complete,time+70);
 };
 // This hook is invoked by the existing switchScreen function. On desktop,
 // disabled mode or non-main screens, the original switch stays untouched.
 window.spartanxCarouselNavigate=function(targetId){
  if(bypass||!enabled||!mobile.matches||!PAGES.includes(targetId))return false;
  const origin=active();
  if(!origin||!PAGES.includes(origin.id)||origin.id===targetId||!ready())return false;
  clear();
  const dir=PAGES.indexOf(targetId)>PAGES.indexOf(origin.id)?1:-1;
  const target=get(targetId);
  if(!target)return false;
  const pair=makePair(origin,target,dir);
  finish(origin,pair.neighbor,dir,true,0);
  return true;
 };
 document.addEventListener('touchstart',event=>{
  if(!ready()||event.touches.length!==1||editableTarget(event.target)){drag=null;return;}
  suppressClickUntil=0;
  suppressClickPage=null;
  const page=active();
  if(!page||!event.target?.closest?.('main > .screen.active'))return;
  const finger=event.touches[0];
  // Leave Safari's bezel/back gesture free.
  if(finger.clientX<22||finger.clientX>window.innerWidth-22)return;
  drag={origin:page,x:finger.clientX,y:finger.clientY,
   dx:0,axis:null,direction:0,neighbor:null,width:0,
   lastX:finger.clientX,lastTime:performance.now(),velocity:0};
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(!drag||event.touches.length!==1)return;
  if(!ready()||active()!==drag.origin){clear();return;}
  const finger=event.touches[0];
  let dx=finger.clientX-drag.x,dy=finger.clientY-drag.y;
  if(!drag.axis){
   const horizontal=Math.abs(dx),vertical=Math.abs(dy);
   if(Math.max(horizontal,vertical)<10)return;
   // Vertical scrolling wins early. Do not hijack slightly diagonal page
   // scrolls, especially inside long feed cards on iPhone.
   if(vertical>=9&&vertical>horizontal*.77){drag=null;return;}
   if(horizontal<13)return;
   if(horizontal<vertical*1.28){
    if(Math.max(horizontal,vertical)>27)drag=null;
    return;
   }
   drag.axis='x';
  }
  // No preventDefault here: main already declares touch-action:pan-y,
  // so Safari can scroll vertically on its native compositor thread.
  // A passive listener also avoids delaying every vertical scroll frame.
  const dir=dx<0?1:-1;
  if(dir!==drag.direction){
   if(drag.neighbor){
    drag.neighbor.classList.remove('drag-preview','dragging');
    for(const name of ['transform','transition','top','left','right','width','position','z-index'])
     drag.neighbor.style.removeProperty(name);
   }
   drag.direction=dir;
   const index=PAGES.indexOf(drag.origin.id);
   const nextId=PAGES[index+dir];
   drag.neighbor=nextId?get(nextId):null;
   const pair=makePair(drag.origin,drag.neighbor,dir);
   drag.width=pair.width;
  }
  // Gentle resistance at the first and last page; no wrap-around.
  if(!drag.neighbor)dx*=.18;
  else dx=Math.max(-drag.width*.95,Math.min(drag.width*.95,dx));
  place(drag.origin,dx);
  if(drag.neighbor)place(drag.neighbor,drag.direction*drag.width+dx);
  const now=performance.now();
  const elapsed=now-drag.lastTime;
  if(elapsed>8){
   drag.velocity=(finger.clientX-drag.lastX)/elapsed;
   drag.lastX=finger.clientX;drag.lastTime=now;
  }
  drag.dx=dx;
 },{passive:true});
 document.addEventListener('touchend',()=>{
  if(!drag)return;
  const d=drag;
  drag=null;
  if(d.axis!=='x'){return;}
  const distance=Math.abs(d.dx);
  if(distance>12){
   suppressClickPage=d.origin;
   suppressClickUntil=performance.now()+480;
  }
  const wanted=!!d.neighbor&&
   (distance>Math.min(d.width*.18,72)||
     (distance>22&&Math.abs(d.velocity)>.38));
  finish(d.origin,d.neighbor,d.direction,wanted,d.dx);
 },{passive:true});
 document.addEventListener('touchcancel',()=>{if(drag)clear();},{passive:true});
 window.addEventListener('pagehide',clear,{passive:true});
})();
