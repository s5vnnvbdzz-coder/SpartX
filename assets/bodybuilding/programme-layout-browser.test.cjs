/* Playwright visual layout smoke: Strength & Bodybuilding must use an
   AscensionX-style full-width header, centred editor and fixed action footer. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function openBuilder(browser,viewport){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.SXBodybuildingProgrammes?.open&&
  document.getElementById('sxBodybuildingBuilder'),null,{timeout:20000});
 await page.evaluate(()=>window.SXBodybuildingProgrammes.open());
 await page.waitForSelector('#sxBodybuildingBuilder.screen.active');
 await page.waitForSelector('#sxBBEdit:not([hidden])');
 return page;
}
function getGeometry(page){
 return page.evaluate(()=>{
  const rect=selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect();
   return {width:b?.width??0,left:b?.left??0,right:b?.right??0,top:b?.top??0,height:b?.height??0,
    display:el?getComputedStyle(el).display:'missing',position:el?getComputedStyle(el).position:'missing'};};
  return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   rootHeader:rect('body > header'),main:rect('body > main'),
   header:rect('#sxBodybuildingBuilder > .sx-bb-header'),
   library:rect('#sxBBLibrary'),setup:rect('#sxBBEdit > .sx-bb-setup'),
   footer:rect('#sxBBEdit > .sx-bb-actions'),
   back:rect('#sxBodybuildingBuilder > .sx-bb-header .sx-bb-back'),
   editor:rect('#sxBBEditorDays'),nav:rect('#trackerNav'),
   pageTitle:document.querySelector('#sxBBPageTitle')?.textContent,
   labelFont:parseFloat(getComputedStyle(document.querySelector('#sxBBKind').closest('label')).fontSize)};
 });
}
async function main(){
 const browser=await chromium.launch({headless:true});
 let desktop,mobile;
 try{
  desktop=await openBuilder(browser,{width:1440,height:900});
  const big=await getGeometry(desktop);
  console.log('Desktop layout:',JSON.stringify(big));
  assert(big.main.width>=1400,'Builder must break out of the 760px workout container');
  assert(big.header.width>=1400,'Header must span viewport like AscensionX');
  assert(big.rootHeader.display==='none','Small SpartanX header must not duplicate the builder header');
  assert(big.setup.width>=800&&big.setup.width<=910,'Editor must use a centred readable panel');
  assert(Math.abs((big.viewport-big.setup.width)/2-big.setup.left)<12,'Editor must be centred');
  assert(big.footer.position==='fixed'&&big.footer.width>=1400,'Full-width Save/Discard footer is fixed');
  assert(big.nav.display==='none','Workout bottom nav must not overlay builder');
  assert(big.labelFont>=11,'Builder controls must be legible');
  assert(big.pageTitle==='Build your programme','New programme header must match builder context');
  assert(big.scrollWidth<=big.viewport+2,'No desktop horizontal overflow');
  assert(await desktop.locator('#sxBBEdit > .sx-bb-actions button').count()===2,'Save/Discard controls retained');
  await desktop.locator('#sxBBName').fill('Strength & Bodybuilding Layout Test');
  await desktop.locator('#sxBBDays').selectOption('5');
  assert.equal(await desktop.locator('#sxBBEditorDays > .sx-bb-edit-day').count(),5,
   'Changing days must still rebuild the training split');
  await desktop.screenshot({path:'bodybuilding-builder-desktop.png',fullPage:false});
  console.log('PASS desktop layout and controls');

  mobile=await openBuilder(browser,{width:390,height:844});
  const small=await getGeometry(mobile);
  console.log('Mobile layout:',JSON.stringify(small));
  assert(small.main.width>=388,'Mobile builder uses viewport width');
  assert(small.header.width>=388,'Mobile header spans viewport');
  assert(small.setup.width>=355&&small.setup.width<=390,'Mobile fields should fit without overflow');
  assert(small.footer.position==='fixed'&&small.footer.width>=388,'Mobile Save/Discard remains visible');
  assert(small.back.width>=44&&small.back.height>=44,'Back action must remain touch-sized');
  assert(small.scrollWidth<=small.viewport+2,'No mobile horizontal overflow');
  assert(small.rootHeader.display==='none','Mobile must not show duplicated SpartanX header');
  await mobile.screenshot({path:'bodybuilding-builder-mobile.png',fullPage:false});
  console.log('PASS mobile layout');

  desktop.once('dialog',dialog=>dialog.accept());
  await desktop.locator('#sxBBEdit > .sx-bb-actions [data-bb-action="discard"]').click();
  await desktop.waitForSelector('#workout.screen.active');
  console.log('PASS return from builder');
 }finally{
  await desktop?.close();
  await mobile?.close();
  await browser.close();
 }
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
