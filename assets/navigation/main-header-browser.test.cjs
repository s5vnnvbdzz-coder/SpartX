'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:320,height:844},{width:390,height:844},{width:430,height:844},{width:1280,height:800}]){
   const page=await browser.newPage({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500});
   await page.addInitScript(()=>{localStorage.setItem('spartx_preferences_v1',JSON.stringify({theme:'sx-obsidian-white'}));});
   await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'load'});
   await page.waitForFunction(()=>!!document.querySelector('#sxProfileHandle')&&!!document.querySelector('#toolsReplica')?.shadowRoot);
   let baseHeight=null,baselineSize=null;
   for(const id of ['home','tools','workout','profile']){
    await page.evaluate(target=>window.spartanxNavigateScreen(target,{instant:true}),id);
    await page.waitForFunction(target=>document.querySelector('main>.screen.active')?.id===target,id);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const m=await page.evaluate(id=>{
     const rect=el=>el.getBoundingClientRect(),header=rect(document.querySelector('body>header'));
     const first=id==='tools'?document.querySelector('#toolsReplica').shadowRoot.querySelector('main>.eyebrow'):document.querySelector('#'+id).firstElementChild;
     const groups={tools:'#sxHeaderToolActions',workout:'#sxHeaderWorkoutActions',profile:'#sxHeaderProfileActions .profile-action-buttons'};
     return {height:header.height,gap:rect(first).top-header.bottom,buttons:groups[id]?[...document.querySelectorAll(groups[id]+' button,'+groups[id]+' a')].map(el=>{
      const r=rect(el),svg=el.querySelector('svg'),i=svg?rect(svg):null;
      return {id:el.id||el.getAttribute('aria-label'),w:r.width,h:r.height,radius:getComputedStyle(el).borderRadius,background:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopColor,dx:i?(i.left+i.right-r.left-r.right)/2:0,dy:i?(i.top+i.bottom-r.top-r.bottom)/2:0};
     }):[]};
    },id);
    if(baseHeight===null)baseHeight=m.height;
    assert.ok(Math.abs(m.height-baseHeight)<1,id+' common header height '+JSON.stringify(m));
    assert.ok(Math.abs(m.gap-16)<2,id+' top gap '+JSON.stringify(m));
    console.log(viewport.width,id,JSON.stringify(m));
    for(const button of m.buttons){
     const msg=id+' '+JSON.stringify(button);assert.ok(Math.abs(button.w-button.h)<.5,msg);assert.equal(button.radius,'50%',msg);
     assert.ok(Math.abs(button.dx)<1&&Math.abs(button.dy)<1,msg);
     if(!baselineSize)baselineSize=button;else{assert.ok(Math.abs(button.w-baselineSize.w)<.5,msg);assert.equal(button.background,baselineSize.background,msg);assert.equal(button.border,baselineSize.border,msg);}
    }
   }
   assert.equal(await page.locator('#sxHeaderProfileActions .profile-action-buttons button').count(),3);
   await page.locator('#editProfile').click();
   await page.waitForSelector('#editProfileOverlay.screen.active');
   await page.close();
  }
  console.log('PASS: shared header and first-content spacing, centred circular actions, profile edit link.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
