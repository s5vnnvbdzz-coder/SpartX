'use strict';
/* Mobile browser audit: fresh classic six-week build, View/Manage/Back,
   native Continue and restarted existing-cycle programme parity. */
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const BASE='http://127.0.0.1:4173/';
function cycleFixture(){
 const id='2026-11-10T12:00:00.000Z';
 return {id,cycle:JSON.stringify({
  profile:{max:{'Back Squat':185,'Bench Press':160,Deadlift:215,'Overhead Press':105},tmPct:95,rounding:2.5,unit:'kg'},
  cycle:{created:id,exercises:['Back Squat','Bench Press','Deadlift'],weeks:{'Back Squat':3,'Bench Press':3,Deadlift:3},currentWeek:3,
    trainingMaxes:{'Back Squat':175,'Bench Press':150,Deadlift:202.5}},
  logs:[]
 }),history:JSON.stringify({sessions:[{
  id:11,date:'2026-11-12T15:00:00Z',exercises:[{name:'Leg Press',sets:[
  {weight:'140',reps:'10',rpe:'7',done:true,type:'Working Set'},
  {weight:'140',reps:'10',rpe:'7',done:true,type:'Working Set'}]}]}]})};
}
const fail=(condition,msg)=>assert.ok(condition,msg);
async function run(type,device){
 const browser=await type.launch({headless:true});
 try{
  const context=await browser.newContext({...devices[device],serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'AscensionX/index.html?sxIntegrated=1&mode=setup&from=workout',{waitUntil:'load'});
  await page.waitForFunction(()=>document.getElementById('cycleEditorBackdrop')?.classList.contains('open')&&!!window.SXAscensionAdaptive);
  await page.evaluate(()=>{
   const target=new Set(['Back Squat','Bench Press','Deadlift']);
   for(const input of document.querySelectorAll('#cycleExerciseOptions input[type=checkbox]')){
    input.checked=target.has(input.value);
    input.dispatchEvent(new Event('change',{bubbles:true}));
   }
   const control=document.getElementById('sxAscAdaptiveEnabled');
   control.checked=true;control.dispatchEvent(new Event('change',{bubbles:true}));
  });
  for(const [lift,max] of [['Back Squat','185'],['Bench Press','160'],['Deadlift','215'],['Overhead Press','105']]){
   await page.locator('#cycleStrengthLift').selectOption(lift);
   await page.locator('#cycleStrengthOneRm').fill(max);
  }
  await page.locator('#cycleStrengthPercent').selectOption('95');
  const preview=await page.evaluate(()=>({
   active:!!state.cycle.created,
   enabled:document.getElementById('sxAscAdaptiveEnabled').checked,
   days:[...document.querySelectorAll('#sxAscAdaptivePreview .sx-adaptive-preview-day')].length,
   scrollLocked:getComputedStyle(document.documentElement).overflow==='hidden'
  }));
  fail(!preview.active&&preview.enabled&&preview.days===4&&preview.scrollLocked,
   'Fresh cycle builder must present all four adaptive training days in a locked focused editor: '+JSON.stringify(preview));
  await page.locator('#saveCycleSelectionBtn').click();
  await page.waitForFunction(()=>document.getElementById('cycleConfirmBackdrop')?.classList.contains('open'));
  await page.locator('#cycleConfirmAction').click();
  await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('sxReturn')==='ascension',{timeout:16000});
  await page.waitForFunction(()=>!!window.SXAscensionPrescription&&!!window.SXAscensionCompanion&&
    !document.getElementById('sxAscensionQuickCard')?.hidden);
  let fresh=await page.evaluate(()=>{
   const raw=localStorage.getItem('ascensionx_strength_v1'),x=JSON.parse(raw);
   const adaptive=window.SXAscensionAdaptive.read(x.cycle.created);
   const w=window.SXAscensionPrescription.build(x,'Back Squat');
   return {cycleId:x.cycle.created,weeks:x.cycle.weeks,currentWeek:x.cycle.currentWeek,
    trainingMax:x.profile.max['Back Squat']*x.profile.tmPct/100,enabled:adaptive.enabled,days:adaptive.days,
    top:w.sets[0],back:w.sets[1],supports:window.SXAscensionAdaptive.plan('Back Squat',1).map(x=>x.name),
    screen:document.querySelector('.screen.active')?.id,raw,landingUrl:location.href,
    returnHint:sessionStorage.getItem('sx_ascension_post_create_v1'),
    storedScreen:localStorage.getItem('spartx_last_screen'),
    activeScreens:[...document.querySelectorAll('.screen.active')].map(x=>x.id)};
  });
  fail(fresh.cycleId&&fresh.enabled&&fresh.days===4,'Fresh cycle persists adaptive support');
  console.log('FRESH CYCLE RETURN STATE',device,JSON.stringify({url:fresh.landingUrl,screen:fresh.screen,hint:fresh.returnHint,last:fresh.storedScreen,active:fresh.activeScreens}));
  assert.equal(fresh.screen,'workout','Cycle creation lands on SpartanX Workout');
  assert.equal(fresh.currentWeek,1);
  assert.equal(fresh.top.weight,127.5);
  assert.equal(fresh.top.reps,6);
  assert.equal(fresh.back.weight,117.5);
  assert.equal(fresh.supports[0],'Hack Squat');
  console.log('PASS fresh six-week AscensionX cycle, 1RM/TM calculation and support '+device);
  await page.locator('#sxAscensionOptions').click();
  await page.locator('#sxAscensionView').click();
  await page.waitForFunction(()=>document.getElementById('sxCycleViewBackdrop')?.classList.contains('open'));
  const viewed=await page.evaluate(()=>({week:document.querySelector('#sxCycleViewContent')?.innerText,
   visible:document.getElementById('sxCycleViewBackdrop')?.getAttribute('aria-hidden'),
   scroll:document.getElementById('sxCycleViewScroll')?.scrollTop}));
  fail(viewed.week?.includes('Week 1')&&viewed.week?.includes('Hack Squat')&&viewed.visible==='false',
   'View Cycle shows current live prescribed support');
  await page.locator('#sxCycleViewSave').click();
  await page.waitForFunction(()=>location.pathname==='/'&&document.querySelector('.screen.active')?.id==='workout'&&
    !document.getElementById('sxAscensionQuickCard')?.hidden);
  await page.locator('#sxAscensionOptions').click();
  await page.locator('#sxAscensionManage').click();
  await page.waitForFunction(()=>document.getElementById('cycleEditorBackdrop')?.classList.contains('open'));
  fail(await page.locator('#sxAscAdaptiveEnabled').isChecked(),'Manage Cycle retains adaptive toggle');
  await page.locator('#cycleEditorClose').click();
  await page.waitForFunction(()=>location.pathname==='/'&&document.querySelector('.screen.active')?.id==='workout'&&
    !document.getElementById('sxAscensionQuickCard')?.hidden);
  console.log('PASS View/Manage/Back navigation '+device);
  await page.locator('#sxAscensionContinue').click();
  await page.waitForFunction(()=>!document.getElementById('sxAscContinueBackdrop')?.hidden);
  let modal=await page.evaluate(()=>{
   const b=document.getElementById('sxAscContinueLoad').getBoundingClientRect();
   return {viewHeight:innerHeight,top:b.top,bottom:b.bottom,
    modalOpen:window.SXModalViewport?.isOpen(),nav:getComputedStyle(document.querySelector('#trackerNav')).display,
    visible:!document.getElementById('sxAscContinueBackdrop').hidden,
    text:document.getElementById('sxAscContinuePreview').innerText};
  });
  fail(modal.visible&&modal.modalOpen&&modal.nav==='none'&&modal.top>=0&&modal.bottom<=modal.viewHeight+1,
   'Continue popup must stay entirely in viewport with background nav hidden: '+JSON.stringify(modal));
  fail(modal.text.includes('127.5 kg')&&modal.text.includes('Hack Squat'),
   'Continue preview must show actual first-week main weight and accessories');
  await page.locator('#sxAscContinueCancel').click();
  fail(await page.locator('#sxAscContinueBackdrop').isHidden(),'Cancel closes Continue popup');
  assert.equal(await page.locator('#trackerNav').evaluate(el=>getComputedStyle(el).display!=='none'),true);
  await page.locator('#sxAscensionContinue').click();
  await page.locator('#sxAscContinueLift').selectOption('Back Squat');
  await page.locator('#sxAscContinueLoad').click();
  await page.waitForFunction(()=>document.querySelector('.screen.active')?.id==='activeWorkout');
  const imported=await page.evaluate(()=>{
   const main=work.find(e=>e.ascensionLink?.lift==='Back Squat');
   return {rows:work.length,main:main?.sets, names:work.map(e=>e.name),
    comp:work.filter(e=>e.sxStrengthSizeCompanion).map(e=>({name:e.name,sets:e.sets.length})),
    persistedCycle:localStorage.getItem('ascensionx_strength_v1'),
    modalHidden:document.getElementById('sxAscContinueBackdrop')?.hidden};
  });
  fail(imported.main&&imported.main.length>=8&&imported.modalHidden,'Continue loads main lift, warmups and closes popup');
  assert.deepEqual(imported.comp.map(x=>x.name),fresh.supports);
  assert(imported.comp.every(e=>e.sets===3),'Future assistance uses prescribed three working sets');
  assert.equal(imported.persistedCycle,fresh.raw,'No cycle state mutation while simply loading');
  await page.evaluate(()=>window.spartanxOpenAscensionWorkoutPopup('Back Squat'));
  await page.locator('#sxAscContinueLoad').click();
  const repeated=await page.evaluate(()=>({main:work.filter(e=>e.ascensionLink?.lift==='Back Squat').length,
   support:work.filter(e=>e.sxStrengthSizeCompanion?.lift==='Back Squat').length}));
  assert.equal(repeated.main,1,'Repeated Continue never duplicates main lift');
  assert.equal(repeated.support,fresh.supports.length,'Repeated Continue never duplicates assistance');
  console.log('PASS Continue popup, cancellation, main/support import and duplicate prevention '+device);
  await context.close();
  // Existing three-week-progressed cycle, with real historical activity.
  const context2=await browser.newContext({...devices[device],serviceWorkers:'block'});
  const fixture=cycleFixture();
  await context2.addInitScript(values=>{
   const k='ascensionx_strength_v1';
   if(!localStorage.getItem(k)){
    localStorage.setItem(k,values.cycle);
    localStorage.setItem('spartx_db',values.history);
    localStorage.setItem('sx_ascension_adaptive_v1',JSON.stringify({
     [values.id]:{enabled:true,days:4,focus:'strength'}
    }));
   }
  },fixture);
  const page2=await context2.newPage();
  const runtimeErrors=[];
  page2.on('pageerror',e=>runtimeErrors.push(String(e)));
  await page2.goto(BASE,{waitUntil:'load'});
  await page2.waitForFunction(()=>!document.getElementById('sxAscensionQuickCard')?.hidden &&
   !!window.SXAscensionCompanion && !!window.SXAscensionPrescription);
  await page2.evaluate(()=>switchScreen('workout',{instant:true}));
  await page2.locator('#sxAscensionContinue').click();
  await page2.locator('#sxAscContinueLift').selectOption('Deadlift');
  const deadliftPreview=await page2.locator('#sxAscContinuePreview').innerText();
  fail(deadliftPreview.includes('167.5 kg')&&deadliftPreview.includes('Romanian Deadlift')&&
   deadliftPreview.includes('90 kg'),
    'Existing cycle preview must show correct W3 main, fixed RDL and support weights: '+deadliftPreview);
  await page2.locator('#sxAscContinueLoad').click();
  await page2.waitForFunction(()=>document.querySelector('.screen.active')?.id==='activeWorkout');
  const existing=await page2.evaluate(()=>{
   const m=work.find(x=>x.ascensionLink?.lift==='Deadlift');
   const r=work.find(x=>x.name==='Romanian Deadlift');
   return {main:m?.sets, rdl:r?.sets, support:work.filter(x=>x.sxStrengthSizeCompanion).map(x=>x.name),
    cycle:localStorage.getItem('ascensionx_strength_v1'),
    history:localStorage.getItem('spartx_db')};
  });
  assert.equal(existing.main?.find(x=>x.type==='Working Set')?.weight,'167.5');
  assert.equal(existing.rdl?.[0]?.weight,'90');
  assert.equal(existing.rdl?.length,3);
  assert.equal(existing.cycle,fixture.cycle);
  assert.equal(existing.history,fixture.history);
  // Editing an existing cycle cannot accidentally reset previous lift weeks
  // or discard a draft workout. Only the explicitly added fourth lift is new.
  await page2.evaluate(()=>switchScreen('workout',{instant:true}));
  await page2.locator('#sxAscensionOptions').click();
  await page2.locator('#sxAscensionManage').click();
  await page2.waitForFunction(()=>document.getElementById('cycleEditorBackdrop')?.classList.contains('open'));
  await page2.locator('#cycleExerciseOptions input[value="Overhead Press"]').check();
  await page2.locator('#saveCycleSelectionBtn').click();
  await page2.waitForFunction(()=>document.getElementById('cycleConfirmBackdrop')?.classList.contains('open'));
  await page2.locator('#cycleConfirmAction').click();
  await page2.waitForFunction(()=>location.pathname==='/'&&document.querySelector('.screen.active')?.id==='workout');
  const edited=await page2.evaluate(()=>{
   const data=JSON.parse(localStorage.getItem('ascensionx_strength_v1'));
   return {weeks:data.cycle.weeks,currentWeek:data.cycle.currentWeek,
    history:localStorage.getItem('spartx_db'),
    draft:JSON.parse(localStorage.getItem('spartx_draft_v1')||'null')};
  });
  assert.equal(edited.currentWeek,3);
  assert.deepEqual(edited.weeks,{'Back Squat':3,'Bench Press':3,Deadlift:3,'Overhead Press':1});
  assert.equal(edited.history,fixture.history);
  fail(edited.draft?.work?.some(x=>x.ascensionLink?.lift==='Deadlift'),
   'Editing a cycle does not delete an existing active workout draft');
  console.log('PASS existing-cycle editor adds new lift without resetting prior weeks or active workout '+device);
  fail(!errors.length&&!runtimeErrors.length,
   'Unexpected JS exceptions in cycle workflows: '+errors.concat(runtimeErrors).join('; '));
  console.log('PASS resumed Week 3, RDL loading, preserved history and no JS exceptions '+device);
  await context2.close();
 }finally{await browser.close();}
}
(async()=>{await run(chromium,'Pixel 7');await run(webkit,'iPhone 13');console.log('PASS AscensionX end-to-end mobile browser audit');})()
 .catch(e=>{console.error(e);process.exit(1)});
