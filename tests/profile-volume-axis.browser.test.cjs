'use strict';
/* Browser regression: lifetime total volume and Profile volume Y axis only. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.formatLifetimeVolumeK==='function' &&
   !!document.querySelector('#sxProfileChart')&&typeof window.stats==='function',
   null,{timeout:20000});
  const fm=await page.evaluate(()=>({
   empty:formatLifetimeVolumeK(0),
   example:formatLifetimeVolumeK(134358),
   small:formatLifetimeVolumeK(950),
   other:formatLifetimeVolumeK(999999),
   thousand:formatLifetimeVolumeK(1000)
  }));
  assert.equal(fm.empty,'0k');
  assert.equal(fm.example,'134.4k');
  assert.equal(fm.small,'1.0k');
  assert.equal(fm.thousand,'1.0k');
  assert.equal(fm.other,'1,000.0k');
  await page.evaluate(()=>{
   db.sessions=[
    {id:'volume-chart-current',date:new Date().toISOString(),name:'Current training',
     duration:3600,volume:57864,exercises:[{
      name:'Back Squat',sets:[{weight:120,reps:2,done:true},
                            {weight:120,reps:2,done:true}]}]},
    {id:'volume-history-long-ago',date:new Date(Date.now()-365*86400000).toISOString(),
     name:'Older training',duration:3600,volume:0,exercises:[{
      name:'Deadlift',sets:[{weight:133878,reps:1,done:true}]}]}
   ];
   stats();
  });
  assert.equal(await page.locator('#volume').innerText(),'134.4k');
  assert.equal(await page.locator('#volume').getAttribute('title'),'134,358 kg');
  const label=await page.locator('#volume').evaluate(el=>el.previousElementSibling.textContent.trim());
  assert.equal(label,'TOTAL VOLUME KG');
  await page.locator('#trackerNav [data-screen="profile"]').click();
  const grid=page.locator('#sxProfileChart');
  await grid.waitFor({state:'visible'});
  // Duration axis is unchanged.
  const durationTop=await page.locator('#sxProfileChartMax').innerText();
  assert.match(durationTop,/hrs$/);
  await page.locator('#performanceTabs button[data-performance-metric="volume"]').click();
  for(const width of [320,375,390,430,768]){
   await page.setViewportSize({width,height:844});
   const values=await page.evaluate(()=>({
    max:document.querySelector('#sxProfileChartMax')?.textContent.trim(),
    mid:document.querySelector('#sxProfileChartMid')?.textContent.trim(),
    zero:document.querySelector('#sxProfileChart .sx-profile-chart-gridline:last-child span')?.textContent.trim(),
    readout:document.querySelector('#sxProfileChartReadout')?.textContent.trim(),
    barTitle:document.querySelector('#sxProfileChartBars [data-bar="11"]')?.title,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
   }));
   assert.equal(values.max,'64.8k','Only the volume Y axis uses compact k values');
   assert.equal(values.mid,'32.4k','Midpoint tick is one-decimal k');
   assert.equal(values.zero,'0','Zero remains 0');
   assert.match(values.readout,/57,864 kg/,'Selected bar readout retains full kg');
   assert.match(values.barTitle,/57,864 kg/,'Bar title retains full kg');
   assert(values.overflow<=2,'Mobile volume chart must not create sideways scroll');
   if(width===390)await page.locator('#sxProfileChart').screenshot({path:'profile-volume-axis-390.png'});
  }
  await page.locator('#performanceTabs button[data-performance-metric="reps"]').click();
  assert.equal(await page.locator('#sxProfileChartMax').innerText().then(x=>x.includes('k')),false,
   'Reps axis formatting is unchanged');
  console.log('PASS: lifetime volume 134.4k and Profile volume axis 64.8k/32.4k only, five viewport widths');
  if(errors.length)console.log('Browser warnings:',errors.slice(0,5));
 }catch(error){
  try{await page.screenshot({path:'profile-volume-axis-failure.png'})}catch(_){}
  console.error('Page errors:',errors.slice(-10));throw error;
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
