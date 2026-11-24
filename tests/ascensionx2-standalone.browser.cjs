/* Standalone 2.0 real-browser smoke: iPhone and Android layouts, storage isolation and resume. */
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const BASE='http://127.0.0.1:4173/AscensionX2/';
async function run(browserType,device){
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext({...devices[device],serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(BASE,{waitUntil:'load'});
  await page.waitForFunction(()=>window.SX2Engine&&document.getElementById('builderForm'));
  assert.match(await page.title(),/AscensionX 2.0/);
  await page.evaluate(()=>{
   localStorage.setItem('ascensionx_strength_v1','classic-sentinel');
   localStorage.setItem('spartx_db','history-sentinel');
   localStorage.setItem('spartx_draft_v1','draft-sentinel');
  });
  await page.locator('#builderForm button[type=submit]').click();
  await page.waitForFunction(()=>!document.getElementById('programme').hidden);
  assert.match(await page.locator('#programmeView').innerText(),/12-week PR-focused/);
  assert.equal(await page.locator('.session').count(),4,'4 independent training days');
  await page.locator('#weekSelector').selectOption('9');
  let text=await page.locator('#programmeView').innerText();
  assert.match(text,/Week 9 · Intensification/);
  assert.match(text,/Deadlift/);
  await page.locator('.session details').last().locator('summary').click();
  text=await page.locator('#programmeView').innerText();
  assert.match(text,/SECONDARY/,'Opening Day 4 reveals secondary squat and bench prescriptions');
  await page.locator('#weekSelector').selectOption('1');
  await page.locator('.session details').nth(1).locator('summary').click();
  const bench=page.locator('form[data-top-form="Bench Press"]');
  await bench.locator('input[name="kg"]').fill('122.5');
  await bench.locator('input[name="reps"]').fill('5');
  await bench.locator('input[name="rpe"]').fill('6');
  await bench.locator('button[type=submit]').click();
  await page.waitForFunction(()=>{
   const data=JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')||'{}');
   return data?.active?.logs?.some(x=>x.lift==='Bench Press'&&x.week===1);
  });
  const stored=await page.evaluate(()=>({
   classic:localStorage.getItem('ascensionx_strength_v1'),
   history:localStorage.getItem('spartx_db'),
   draft:localStorage.getItem('spartx_draft_v1'),
   active:JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')).active
  }));
  assert.equal(stored.classic,'classic-sentinel');
  assert.equal(stored.history,'history-sentinel');
  assert.equal(stored.draft,'draft-sentinel');
  assert.equal(stored.active.plan.profile.weeks,12);
  assert.equal(stored.active.logs.length,1);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.getElementById('programme').hidden);
  await page.locator('.session details').nth(1).locator('summary').click();
  assert.match(await page.locator('form[data-top-form="Bench Press"]').innerText(),/UPDATE LOG/,'Saved top set survives reload');
  await page.locator('button[data-tab="review"]').click();
  assert.match(await page.locator('#reviewView').innerText(),/122.5 kg × 5/,'Top-set history visible');
  await page.locator('button[data-tab="builder"]').click();
  await page.locator('select[name="weeks"]').selectOption('8');
  await page.locator('#builderForm button[type=submit]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')).active.plan.profile.weeks===8);
  await page.locator('button[data-tab="review"]').click();
  assert.equal(await page.locator('[data-restore]').count(),1,'Previous 12-week cycle archived');
  await page.locator('[data-restore]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')).active.plan.profile.weeks===12);
  assert.equal(await page.locator('form[data-top-form="Bench Press"] input[name="kg"]').inputValue(),'122.5');
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,classic:localStorage.getItem('ascensionx_strength_v1')}));
  assert.ok(metrics.scroll<=metrics.width+3,'No horizontal mobile overflow: '+JSON.stringify(metrics));
  assert.equal(metrics.classic,'classic-sentinel');
  assert.equal(errors.length,0,'No uncaught browser errors: '+errors.join('; '));
  console.log('PASS standalone AscensionX 2.0 '+device+' (build, log, reload, archive, restore, isolation)');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{await run(chromium,'Pixel 7');await run(webkit,'iPhone 13');})()
 .catch(e=>{console.error(e);process.exit(1)});
