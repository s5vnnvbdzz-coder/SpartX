'use strict';
/* Real browser regression test for smaller, centred 2×2 Profile Dashboard.
 * Run from a local server at http://127.0.0.1:4173.
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!document.querySelector('#profile .sx-profile-dashboard-grid')
   &&!!document.querySelector('#trackerNav [data-screen="profile"]'),null,{timeout:20000});
  await page.locator('#trackerNav [data-screen="profile"]').click();
  await page.waitForFunction(()=>document.querySelector('#profile').classList.contains('active'));
  const originalIds=['openTrainingStats','openExerciseStats','openMeasures','openWorkoutCalendar'];
  for(const width of [320,375,390,430,768]){
   await page.setViewportSize({width,height:844});
   const m=await page.evaluate(()=>{
    const grid=document.querySelector('#profile .sx-profile-dashboard-grid');
    const buttons=[...grid.querySelectorAll('button')];
    const bounds=el=>{
     const r=el.getBoundingClientRect();
     return {x:r.left,y:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom,
      centerX:(r.left+r.right)/2,centerY:(r.top+r.bottom)/2};
    };
    return {
     grid:bounds(grid),
     buttons:buttons.map(button=>{
      const a=bounds(button),icon=bounds(button.querySelector('.sx-profile-dashboard-icon'));
      const label=bounds(button.querySelector('.sx-profile-dashboard-label'));
      return {id:button.id,button:a,icon,label,display:getComputedStyle(button).display,
       direction:getComputedStyle(button).flexDirection,
       textAlign:getComputedStyle(button).textAlign,
       centerGroup:(icon.y+label.bottom)/2,
       title:button.querySelector('.sx-profile-dashboard-label').textContent.trim()};
     }),
     gridColumns:getComputedStyle(grid).gridTemplateColumns,
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
   });
   assert.deepEqual(m.buttons.map(x=>x.id),originalIds,'All four original Dashboard actions remain');
   assert.equal(m.buttons.length,4,'Exactly four Profile Dashboard tiles remain');
   assert(Math.abs(m.buttons[0].button.y-m.buttons[1].button.y)<2,
    'Statistics and Exercises remain the top grid row: '+JSON.stringify(m));
   assert(Math.abs(m.buttons[2].button.y-m.buttons[3].button.y)<2,
    'Measures and Calendar remain the second grid row: '+JSON.stringify(m));
   assert(m.buttons[2].button.y>m.buttons[0].button.bottom,
    'Rows must be distinct: '+JSON.stringify(m));
   assert(m.buttons[0].button.right<m.buttons[1].button.x,
    'Two columns should not overlap: '+JSON.stringify(m));
   assert(m.buttons[2].button.right<m.buttons[3].button.x,
    'Second row remains two-column: '+JSON.stringify(m));
   assert(m.grid.h<196,'Grid must shrink compared with the original >216px: '+JSON.stringify(m));
   for(const item of m.buttons){
    assert(item.button.h>=65&&item.button.h<=93,
     'Compact but easy-to-tap buttons: '+JSON.stringify(item));
    assert.equal(item.direction,'column','Icon and title must stack vertically');
    assert.equal(item.textAlign,'center','Tile contents must be centred');
    assert(Math.abs(item.icon.centerX-item.button.centerX)<3,
     'Icon is horizontally centred: '+JSON.stringify(item));
    assert(Math.abs(item.label.centerX-item.button.centerX)<3,
     'Title is horizontally centred: '+JSON.stringify(item));
    assert(item.icon.bottom<=item.label.y,
     'Icon is above title and does not overlap: '+JSON.stringify(item));
    assert(Math.abs(item.centerGroup-item.button.centerY)<11,
     'Combined icon and title are vertically centred: '+JSON.stringify(item));
   }
   assert(m.overflow<=2,'No horizontal overflow at '+width+'px: '+JSON.stringify(m));
   if(width===390){
    await page.locator('#profile .sx-profile-dashboard-grid').screenshot({
     path:'profile-dashboard-compact-390.png'
    });
   }
  }
  // Navigation into the existing Statistics action must still work.
  await page.locator('#openTrainingStats').click();
  assert(await page.locator('#trainingStatsOverlay').isVisible(),
   'Statistics tile remains a functional navigation button');
  console.log('PASS: compact 2×2 dashboard and centred icons/titles across 5 widths; Statistics navigation remains functional');
  if(pageErrors.length)console.log('Browser warnings:',pageErrors.slice(0,6));
 }catch(error){
  try{await page.screenshot({path:'profile-dashboard-compact-failure.png'})}catch(_){}
  console.error('Browser errors:',pageErrors.slice(-10));
  throw error;
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
