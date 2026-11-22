'use strict';
/* Real mobile-browser test: Milestone Progression must be a no-nav popup. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.SpartanXMilestoneProgression?.open==='function'
   &&typeof renderWorkoutFeed==='function',{timeout:18000});
  await page.evaluate(()=>{
   db.sessions=Array.from({length:15},(_,i)=>({
    id:'milestone-qa-'+i,name:'Training '+i,date:new Date(Date.now()-i*86400000).toISOString(),
    exercises:[{name:'Back Squat',sets:[{weight:150,reps:10,done:true,type:'Working Set'}]}]
   }));
   stats();
  });
  await page.locator('#trackerNav [data-screen="profile"]').click();
  const details=page.locator('#profile .sx-profile-details');
  await details.locator('summary').click();
  const opener=page.locator('#sxOpenMilestoneProgression');
  await opener.waitFor({state:'visible'});
  for(const width of [320,375,390,430,768]){
   await page.setViewportSize({width,height:844});
   await opener.click();
   const overlay=page.locator('#sxMilestoneOverlay');
   assert(await overlay.isVisible(),'Milestone window must be visible');
   const result=await page.evaluate(()=>{
    const e=document.getElementById('sxMilestoneOverlay');
    const d=e.querySelector('.sx-milestone-dialog');
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    return {
     dialogRole:d.getAttribute('role'),modal:d.getAttribute('aria-modal'),
     overlay:rect(e),dialog:rect(d),navDisplay:getComputedStyle(document.querySelector('#trackerNav')).display,
     bodyLocked:document.body.classList.contains('sx-milestones-open'),
     title:document.querySelector('#sxMilestoneTitle')?.textContent.trim(),
     entryCount:document.querySelectorAll('#sxMilestoneCollection .sx-milestone-card').length,
     awardCount:document.querySelector('#sxMilestoneOverview')?.textContent.trim(),
     workouts:document.querySelector('[data-milestone-id="workouts"] .sx-milestone-count')?.textContent.trim(),
     volume:document.querySelector('[data-milestone-id="volume"] .sx-milestone-count')?.textContent.trim(),
     contentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     firstCardWidth:rect(document.querySelector('[data-milestone-id="workouts"]')).w
    };
   });
   assert.equal(result.dialogRole,'dialog');
   assert.equal(result.modal,'true');
   assert.equal(result.navDisplay,'none','Main navigation must be hidden inside Milestone Progression');
   assert(result.bodyLocked,'Background must not scroll behind the popup');
   assert.equal(result.title,'Milestone Progression');
   assert.equal(result.entryCount,4,'The four achievement paths are visible');
   assert.match(result.workouts,/15 \/ 100 workouts/);
   assert.match(result.volume,/22\.5k \/ 1M kg lifted/);
   assert(result.overlay.w>=width-1,'Overlay covers available width '+width+': '+JSON.stringify(result));
   assert(result.overlay.h>=840,'Overlay covers full screen '+width+': '+JSON.stringify(result));
   assert(result.dialog.right<=width+1,'Dialog fits screen '+width+': '+JSON.stringify(result));
   assert(result.contentOverflow<=2,'No sideways scroll '+width+': '+JSON.stringify(result));
   if(width===390)await overlay.screenshot({path:'milestone-modal-mobile-390.png'});
   await page.locator('[data-close-milestones]').first().click();
   assert(!(await overlay.isVisible()),'Close button dismisses the popup');
   assert(await page.locator('#trackerNav').isVisible(),'App navigation returns on close');
  }
  await opener.click();
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#sxMilestoneOverlay').isVisible()),'Escape closes dialog');
  assert(await opener.evaluate(el=>el===document.activeElement),'Keyboard focus returns to the trigger');
  console.log('PASS: no-nav full-screen milestone popup, four paths, live stats, focus return and mobile geometry');
  if(errors.length)console.log('Browser warnings:',errors.slice(0,5));
 }catch(e){try{await page.screenshot({path:'milestone-modal-failure.png'})}catch(_){}
  console.error('Browser errors:',errors.slice(-8));throw e;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
