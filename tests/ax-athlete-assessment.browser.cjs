/* Real-browser AX athlete assessment: profile reuse, six-step flow, programme creation, isolation. */
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const BASE='http://127.0.0.1:4173/AscensionX2/';
async function run(browserType,device){
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext({...devices[device],serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(BASE+'index.html',{waitUntil:'load'});
  await page.evaluate(()=>{
   localStorage.setItem('spartx_db',JSON.stringify({profile:{bodyweight:90,age:36},measurements:[{id:'weight',date:'2026-11-23',values:{bodyweight:92,height:175}}],sessions:[{id:42,exercises:[{name:'Bench Press'}]}]}));
   localStorage.setItem('ascensionx_strength_v1',JSON.stringify({profile:{max:{'Back Squat':185,'Bench Press':160,Deadlift:215}},cycle:{created:'2026-11-01',currentWeek:5}}));
  });
  await page.goto(BASE+'assessment.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.AXAssessment&&!!window.SX2Engine);
  assert.match(await page.title(),/AX · Athlete Assessment/);
  assert.equal(await page.locator('input[name="age"]').inputValue(),'36');
  assert.equal(await page.locator('input[name="weight"]').inputValue(),'92');
  assert.equal(await page.locator('input[name="height"]').inputValue(),'175');
  assert.equal(await page.locator('input[name="squatMax"]').inputValue(),'185');
  assert.equal(await page.locator('input[name="benchMax"]').inputValue(),'160');
  assert.equal(await page.locator('input[name="deadliftMax"]').inputValue(),'215');
  await page.locator('#axNext').click();
  assert.match(await page.locator('#stepHeading').innerText(),/Understand your starting point/);
  await page.locator('#axNext').click();
  assert.match(await page.locator('#stepHeading').innerText(),/Establish your strength baseline/);
  await page.locator('input[name="squatGoal"]').fill('195');
  await page.locator('input[name="benchGoal"]').fill('167.5');
  await page.locator('input[name="deadliftGoal"]').fill('225');
  await page.locator('.ax-expand > summary').click();
  await page.locator('input[name="weakSquat"][value="hips-first"]').check();
  await page.locator('#axNext').click();
  assert.match(await page.locator('#stepHeading').innerText(),/Build around recovery/);
  await page.locator('select[name="job"]').selectOption('moderate');
  await page.locator('select[name="nutrition"]').selectOption('maintenance');
  await page.locator('#axNext').click();
  assert.match(await page.locator('#stepHeading').innerText(),/Design the training week/);
  assert.match(await page.locator('#schedulePreview').innerText(),/MON · TUE · THU · SAT/);
  await page.locator('#axNext').click();
  assert.match(await page.locator('#assessmentSummary').innerText(),/185 kg → 195 kg/);
  await page.locator('#axGenerate').click();
  await page.waitForURL(/index\.html\?ax2_created=1/);
  await page.waitForFunction(()=>!document.getElementById('programme').hidden);
  const state=await page.evaluate(()=>({
   ax2:JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')),
   db:JSON.parse(localStorage.getItem('spartx_db')),
   classic:JSON.parse(localStorage.getItem('ascensionx_strength_v1'))
  }));
  assert.equal(state.ax2.active.plan.profile.weeks,8);
  assert.equal(state.ax2.active.plan.profile.days,4);
  assert.equal(state.ax2.active.plan.profile.age,36);
  assert.equal(state.ax2.active.plan.profile.bodyweight,92);
  assert.equal(state.ax2.active.plan.profile.height,175);
  assert.deepEqual(state.ax2.active.plan.profile.trainingDays,['Mon','Tue','Thu','Sat']);
  assert.equal(state.ax2.active.plan.profile.weakPoints['Back Squat'][0],'hips-first');
  assert.equal(state.ax2.active.plan.weeks[0].sessions[3].day,'Sat');
  assert.equal(state.ax2.active.plan.weeks[7].attempts['Back Squat'].goal,195);
  assert.equal(state.db.sessions[0].id,42,'Workout history unchanged');
  assert.equal(state.classic.cycle.currentWeek,5,'Six-week classic progression unchanged');
  assert.equal(state.classic.profile.max['Back Squat'],185,'Classic 1RM unchanged');
  assert.equal(state.ax2.archives.length,0);
  await page.locator('[data-edit-cycle]').click();
  assert.equal(await page.locator('#manageDialog').evaluate(x=>x.open),true);
  await page.locator('#manageForm [name="benchGoal"]').fill('172.5');
  await page.locator('#manageForm button[type=submit]').click();
  const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('ascensionx2_standalone_workspace_v1')));
  assert.equal(updated.active.plan.profile.age,36,'Manage cycle preserves captured athlete profile');
  assert.deepEqual(updated.active.plan.profile.trainingDays,['Mon','Tue','Thu','Sat']);
  assert.equal(updated.active.plan.profile.goals['Bench Press'],172.5);
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+3,'No horizontal phone overflow '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'No uncaught errors: '+errors.join('; '));
  console.log('PASS AX six-step assessment '+device+' (Measures, PR targets, schedule, archive-safe generation, edit, classic isolation)');
  await context.close();
 }finally{await browser.close();}
}
(async()=>{await run(chromium,'Pixel 7');await run(webkit,'iPhone 13');})().catch(e=>{console.error(e);process.exit(1)});
