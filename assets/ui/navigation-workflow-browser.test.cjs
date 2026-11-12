/* SpartanX Build 317 secondary-page workflow acceptance — real Chromium. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function main(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.spartanxNavigateScreen &&
    document.querySelector('#profile .profile-edit-button')?.onclick &&
    document.querySelector('#homeCreateRoutine')?.onclick,null,{timeout:25000});
  // The four root tabs never acquire the secondary-page Back control.
  for(const id of ['home','workout','tools','profile']){
   assert.equal(await page.locator('#'+id+' > .sx-page-back').count(),0,id+' has no secondary Back');
  }
  await page.evaluate(()=>window.spartanxNavigateScreen('home',{instant:true}));
  const collapse=page.locator('#rankCollapseToggle');
  assert.equal((await collapse.innerText()).trim(),'+','Collapsed Rank Progression must use +');
  await collapse.click();
  assert.equal((await collapse.innerText()).trim(),'−','Expanded Rank Progression must use −');
  await collapse.click();

  // Find Athletes has its own screen without global bottom navigation.
  await page.locator('#sxSocialToggle').click();
  await page.waitForSelector('#athleteSearch.screen.active');
  assert.equal(await page.locator('#trackerNav').evaluate(el=>getComputedStyle(el).display),'none');
  let nav=page.locator('#sxSocialBack');
  assert.equal((await nav.innerText()).trim(),'← Back');
  await assertStandardBack(nav,'athlete search');
  await nav.click();
  await page.waitForSelector('#home.screen.active');

  // Profile settings and editing are distinct SPA screens (not dialogs).
  await page.evaluate(()=>window.spartanxNavigateScreen('profile',{instant:true}));
  await page.locator('#openProfileSettings').click();
  await page.waitForSelector('#profileSettingsOverlay.screen.active');
  assert.equal(await page.locator('#profileSettingsOverlay[aria-modal]').count(),0,'Settings no longer modal');
  assert.equal(await page.locator('#trackerNav').evaluate(el=>getComputedStyle(el).display),'none');
  await assertStandardBack(page.locator('#closeProfileSettings'),'profile settings');
  await page.locator('#closeProfileSettings').click();
  await page.waitForSelector('#profile.screen.active');
  await page.locator('#editProfile').click();
  await page.waitForSelector('#editProfileOverlay.screen.active');
  assert.equal(await page.locator('#editProfileOverlay[aria-modal]').count(),0,'Edit Profile no longer modal');
  await assertStandardBack(page.locator('#closeEditProfile'),'edit profile');
  await page.locator('#profileNameInput').fill('Test Athlete');
  await page.locator('#saveProfile').click();
  await page.waitForSelector('#profile.screen.active');

  // In Workout, Add New Routine must open the actual builder.
  await page.evaluate(()=>window.spartanxNavigateScreen('workout',{instant:true}));
  await page.locator('#homeCreateRoutine').click();
  await page.waitForSelector('#routineBuilderScreen.screen.active',{timeout:10000});
  await page.locator('#routineName').fill('Power Day');
  await page.locator('#addRoutineExercise').click();
  await page.waitForSelector('#exerciseLibraryScreen.screen.active');
  const search=page.locator('#librarySearch');
  await search.fill('Bench Press');
  await page.locator('#libraryList [data-add-exercise]').first().click();
  await page.waitForSelector('#routineBuilderScreen.screen.active');
  assert.ok((await page.locator('#routineDraftList .exercise-card').count())>=1,
   'Selected exercises appear in routine builder');
  await page.locator('#saveRoutine').click();
  await page.waitForSelector('#workout.screen.active');
  const routine=page.locator('#homeRoutineList [data-view-routine]').first();
  assert.equal(await routine.count(),1,'Saved routine offers View without Start');
  await page.locator('#homeRoutineDetails').evaluate(el=>el.open=true);
  await routine.click();
  await page.waitForSelector('#routineDetailScreen.screen.active');
  assert.match(await page.locator('#sxRoutineDetailTitle').innerText(),/Power Day/);
  assert.ok(await page.locator('#sxRoutineDetailExercises .sx-routine-preview-card').count()>=1);
  await assertStandardBack(page.locator('#sxRoutineDetailBack'),'routine detail');
  await page.locator('#sxRoutineDetailBack').click();
  await page.waitForSelector('#workout.screen.active');

  // Square vertical 3-dot buttons, not horizontal character glyphs.
  for(const path of ['./assets/ascension/quick-access.js','./assets/workouts/531-cycle-flow.js']){
   const text=await page.evaluate(async url=>(await(await fetch(url)).text()),path);
   assert.match(text,/<circle cx="12" cy="5"/,'Vertical dots: '+path);
   assert.ok(!text.includes('aria-controls="sxAscensionOptionsMenu">•••') &&
       !text.includes('aria-controls="sx531QuickOptions">•••'),'Old horizontal buttons retired');
  }
  const orderScript=await page.evaluate(async()=>await(await fetch('./assets/workouts/workout-card-order.js')).text());
  assert.equal(orderScript.includes('data-workout-move="up"'),false,'No up/down reordering');
  assert.ok(orderScript.includes('pointerdown'),'Hold and drag remains');

  // Workout drag mode has one grip per card and no arrow controls.
  await page.locator('#sxWorkoutReorder').click();
  assert.ok(await page.locator('#workout.sx-workout-ordering .sx-workout-drag').count()>=4);
  assert.equal(await page.locator('#workout .sx-workout-move').count(),0);
  await page.locator('#sxWorkoutOrderCancel').click();
  await page.screenshot({path:'uniform-navigation-workout-mobile.png'});
  await page.evaluate(()=>window.spartanxNavigateScreen('profile',{instant:true}));
  await page.locator('#editProfile').click();
  await page.screenshot({path:'uniform-navigation-edit-profile-mobile.png'});
  console.log('Build 317 UI acceptance passed — navigable Profile pages, Rank +/−, routines, Athlete Search, draggable Workout.');
  if(errors.length)console.warn('Nonfatal browser errors',errors.slice(0,8));
 }catch(e){
  try{await page.screenshot({path:'uniform-navigation-failure.png'})}catch(_){}
  const state=await page.evaluate(()=>({
   screen:document.querySelector('.screen.active')?.id,
   header:document.querySelector('body>header')?.textContent.slice(0,180),
   routines:document.querySelector('#homeRoutineList')?.textContent.slice(0,300)
  })).catch(()=>({}));
  console.error('State',JSON.stringify(state),'Runtime errors',errors.slice(-12));throw e;
 }finally{await browser.close()}
 async function assertStandardBack(locator,where){
  const rect=await locator.evaluate(el=>{
   const r=el.getBoundingClientRect(),parent=el.parentElement?.getBoundingClientRect();
   const css=getComputedStyle(el);
   return {height:r.height,width:r.width,right:r.right,parentRight:parent?.right,
     border:css.borderTopWidth,radius:css.borderRadius,alignment:css.alignItems};
  });
  assert.ok(rect.height>=47&&rect.height<=49,where+' fixed-height Back');
  assert.equal(rect.border,'1px',where+' border');
  assert.ok(rect.width>=94,where+' Back min-width');
  assert.ok(rect.parentRight-rect.right<25,where+' Back at right of header');
 }
}
main().catch(e=>{console.error(e);process.exit(1)});
