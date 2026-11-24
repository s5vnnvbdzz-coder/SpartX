'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
(async()=>{
 for(const [type,device] of [[chromium,'Pixel 7'],[webkit,'iPhone 13']]){
  const browser=await type.launch({headless:true});
  try{
   const page=await browser.newPage({...devices[device],serviceWorkers:'block'});
   await page.addInitScript(()=>{
    const key='ascensionx_strength_v1';
    if(localStorage.getItem(key))return;
    const lifts=['Back Squat','Bench Press','Deadlift'],id='2026-01-01T12:00:00.000Z';
    localStorage.setItem(key,JSON.stringify({profile:{max:{'Back Squat':185,'Bench Press':160,Deadlift:215},tmPct:95,rounding:2.5,unit:'kg'},cycle:{created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(l=>[l,5])),currentWeek:5},logs:[]}));
   });
   await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'load'});
   await page.waitForFunction(()=>typeof window.SXModalViewport?.isOpen==='function'&&typeof window.spartanxOpenAscensionWorkoutPopup==='function');
   await page.evaluate(()=>{switchScreen('workout',{instant:true});window.spartanxOpenAscensionWorkoutPopup('Back Squat');});
   await page.waitForFunction(()=>document.documentElement.classList.contains('sx-modal-open'));
   const bounds=await page.evaluate(()=>{
    const b=document.querySelector('#sxAscContinueLoad').getBoundingClientRect();
    return {bottom:b.bottom,top:b.top,height:innerHeight,nav:getComputedStyle(document.querySelector('#trackerNav')).display,overflow:getComputedStyle(document.documentElement).overflowY};
   });
   assert.equal(bounds.nav,'none');assert.equal(bounds.overflow,'hidden');assert(bounds.bottom<=bounds.height+1&&bounds.top>=0,'Load button inside viewport');
   const scroll=page.locator('#sxAscContinueDialog .sx-asc-scroll');
   await scroll.evaluate(el=>{const filler=document.createElement('div');filler.style.height='1600px';el.append(filler);el.scrollTop=0;});
   const outcome=await scroll.evaluate(el=>{const before=scrollY;el.scrollTop=200;const evt=new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true,composed:true});el.dispatchEvent(evt);const internal=el.scrollTop;el.scrollTop=el.scrollHeight;const edge=new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true,composed:true});el.dispatchEvent(edge);const outside=new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true,composed:true});document.querySelector('main').dispatchEvent(outside);return {before,after:scrollY,internal,allowed:!evt.defaultPrevented,edge:edge.defaultPrevented,outside:outside.defaultPrevented};});
   assert(outcome.internal>0&&outcome.allowed&&outcome.edge&&outcome.outside);assert.equal(outcome.before,outcome.after);
   await page.evaluate(()=>{const e=document.createElement('div');e.id='qaNested';e.setAttribute('aria-modal','true');e.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(e);window.SXModalViewport.refresh();document.querySelector('#sxAscContinueCancel').click();});
   const nested=await page.evaluate(()=>{
    const el=document.getElementById('qaNested');
    return {exists:!!el,rects:el?.getClientRects().length,
     fixed:el?getComputedStyle(el).position:null,
     aria:el?.getAttribute('aria-modal'),
     closed:document.getElementById('sxAscContinueBackdrop')?.hidden,
     open:window.SXModalViewport.isOpen(),
     documentLocked:document.documentElement.classList.contains('sx-modal-open')};
   });
   console.log('NESTED MODAL STATE',device,nested);
   assert(nested.open,'Nested modal must retain viewport ownership: '+JSON.stringify(nested));
   await page.evaluate(()=>{document.querySelector('#qaNested').remove();window.SXModalViewport.refresh();});
   assert(!(await page.evaluate(()=>window.SXModalViewport.isOpen())));
   assert(await page.locator('#trackerNav').isVisible());
   await page.evaluate(()=>{const e=document.querySelector('#setTypeSheet');e.classList.add('is-open');e.setAttribute('aria-hidden','false');window.SXModalViewport.refresh();});
   assert(await page.evaluate(()=>window.SXModalViewport.isOpen()));
   assert(!(await page.locator('#trackerNav').isVisible()));
   await page.evaluate(()=>{const e=document.querySelector('#setTypeSheet');e.classList.remove('is-open');e.setAttribute('aria-hidden','true');window.SXModalViewport.refresh();});
   assert(!(await page.evaluate(()=>window.SXModalViewport.isOpen())));
   console.log('PASS modal viewport '+device);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
