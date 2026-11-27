'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.addInitScript(()=>{if(!localStorage.getItem('spartxToolsSettings'))localStorage.setItem('spartxToolsSettings',JSON.stringify({warmup:false,diagram:true,trainingMaxFinder:true,plates:{25:true,20:true,15:true,10:true,5:true,2.5:true,1.25:true}}));});
 const base='http://127.0.0.1:4173/';
 await page.goto(base+'index.html',{waitUntil:'load'});
 await page.evaluate(()=>window.spartanxNavigateScreen('tools',{instant:true}));
 const card=page.locator('#toolsReplica section[aria-labelledby="plateTitle"]');
 if(await card.evaluate(el=>el.classList.contains('is-collapsed')))await card.locator('.card-collapse').click();
 assert.equal(await card.locator('#plateSettings input').count(),7);
 await card.locator('#bar').fill('20');await card.locator('#target').fill('70');
 assert.match(await card.locator('#plates').innerText(),/1 × 25 kg/);
 await card.locator('[data-plate-size="25"]').uncheck();
 assert.doesNotMatch(await card.locator('#plates').innerText(),/25 kg/);
 assert.match(await card.locator('#plates').innerText(),/20 kg/);
 await card.locator('#diagramToggle').evaluate(el=>el.click());
 assert.equal(await card.locator('#plateDiagramWrap').isVisible(),false);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('spartxToolsSettings')));
 assert.equal(saved.plates[25],false);assert.equal(saved.diagram,false);assert.equal(saved.warmup,false);
 await page.goto(base+'tools/settings.html?return=tracker',{waitUntil:'load'});
 assert.equal(await page.locator('#plateSettings,#diagramToggle').count(),0);
 await page.goto(base+'index.html',{waitUntil:'load'});
 await page.evaluate(()=>window.spartanxNavigateScreen('tools',{instant:true}));
 assert.equal(await card.locator('[data-plate-size="25"]').isChecked(),false);
 assert.equal(await card.locator('#diagramToggle').isChecked(),false);
 for(const route of ['tools/index.html','tools/embedded.html']){
  await page.goto(base+route,{waitUntil:'load'});
  assert.equal(await page.locator('#plateSettings input').count(),7);
  assert.equal(await page.locator('[data-plate-size="25"]').isChecked(),false);
 }
 console.log('PASS: inline plate choices, immediate recalculation, diagram toggle, shared saved settings, no duplicate settings card');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
