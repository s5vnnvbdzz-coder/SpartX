'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.spartanxCarouselNavigate==='function');
  await page.evaluate(()=>window.spartanxNavigateScreen('home',{instant:true}));
  for(const id of ['tools','home','workout','profile','home']){
   await page.evaluate(target=>window.spartanxNavigateScreen(target),id);
   await page.waitForFunction(target=>document.querySelector('main>.screen.active')?.id===target&&!document.body.classList.contains('sx-carousel-in-motion'),id);
   assert.equal(await page.locator('main>.screen.active').count(),1);
   assert.equal(await page.locator('main>.screen.drag-preview').count(),0);
   assert.equal(await page.locator('#trackerNav button.active').getAttribute('data-screen'),id);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.evaluate(()=>{window.spartanxNavigateScreen('tools');window.spartanxNavigateScreen('profile');});
  await page.waitForFunction(()=>document.querySelector('main>.screen.active')?.id==='profile'&&!document.body.classList.contains('sx-carousel-in-motion'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>window.spartanxNavigateScreen('home'));
  assert.equal(await page.locator('#home.screen.active').count(),1);
  assert.equal(await page.locator('main>.screen.drag-preview').count(),0);
  console.log('PASS: four touch tabs, rapid navigation, reduced motion and no orphan preview');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
