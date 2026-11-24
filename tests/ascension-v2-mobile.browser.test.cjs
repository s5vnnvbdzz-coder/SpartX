// Isolated local static server; no live accounts or production storage.
const { chromium, webkit, devices }=require('playwright');
const assert=require('node:assert/strict');
const url='http://127.0.0.1:8765';
(async()=>{
 for(const [kind,driver,device] of [['chromium',chromium,'Pixel 7'],['webkit',webkit,'iPhone 13']]){
  const browser=await driver.launch({headless:true});
  try{
   const context=await browser.newContext({...devices[device],serviceWorkers:'block'});
   const page=await context.newPage();
   page.on('dialog',d=>d.accept().catch(()=>{}));
   await page.goto(url+'/AscensionX/programme-preview.html');
   await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
   for(const [name,value] of Object.entries({age:36,bodyweight:92,height:175,squat:185,bench:160,deadlift:215,sleep:6}))await page.locator('[name='+name+']').fill(String(value));
   await page.locator('[name=experience]').selectOption('advanced');
   await page.locator('[name=minutes]').selectOption('120');
   await page.locator('button[type=submit]').click();
   await page.getByRole('button',{name:'SAVE EXPERIMENTAL PROGRAMME'}).click();
   await page.getByText('0 / 30 sessions completed').waitFor({timeout:10000});
   await page.reload();
   await page.getByRole('button',{name:'LOAD NEXT SESSION INTO SPARTANX'}).waitFor();
   const before=await page.evaluate(()=>localStorage.getItem('sx_ascension_v2_programme_v1'));
   // An actual legacy cycle must prevent import.
   const legacy=JSON.stringify({cycle:{created:'2026-01-01T00:00:00.000Z',exercises:['Back Squat'],weeks:{'Back Squat':2}},logs:[]});
   await page.evaluate(x=>localStorage.setItem('ascensionx_strength_v1',x),legacy);
   await page.getByRole('button',{name:'LOAD NEXT SESSION INTO SPARTANX'}).click();
   await page.waitForURL('**/index.html');
   await page.waitForFunction(()=>!!window.SpartanXStartAscensionV2Session&&document.readyState==='complete');
   assert.equal(await page.evaluate(()=>localStorage.getItem('ascensionx_strength_v1')),legacy);
   assert.equal(await page.evaluate(()=>localStorage.getItem('sx_ascension_v2_programme_v1')),before);
   assert.equal(await page.locator('#activeWorkout.active').count(),0);
   await page.evaluate(()=>localStorage.removeItem('ascensionx_strength_v1'));
   await page.goto(url+'/AscensionX/programme-preview.html');
   await page.getByRole('button',{name:'LOAD NEXT SESSION INTO SPARTANX'}).click();
   await page.waitForURL('**/index.html');
   await page.locator('#activeWorkout.active').waitFor({timeout:20000});
   const first=await page.evaluate(()=>({title:document.querySelector('#activeWorkoutName').textContent,sets:work.flatMap(e=>e.sets).map(s=>s.done)}));
   assert.match(first.title,/Week 1/);assert(first.sets.length>0&&first.sets.every(x=>!x));
   await page.evaluate(()=>{const top=work[0].sets.find(s=>s.sxV2Target?.role==='top');top.done=true;top.rpe='9.5';renderWork();saveDraft();});
   const beforeBack=await page.evaluate(()=>work[0].sets.filter(z=>z.sxV2Target?.role==='backdown').map(z=>+z.weight));
   await page.getByRole('button',{name:'REVIEW REMAINING LOADS'}).click();
   const afterBack=await page.evaluate(()=>work[0].sets.filter(z=>z.sxV2Target?.role==='backdown').map(z=>+z.weight));
   assert(afterBack.every((x,i)=>x<beforeBack[i]));
   await page.reload();
   await page.locator('#activeWorkout.active').waitFor({timeout:20000});
   assert.deepEqual(await page.evaluate(()=>work[0].sets.filter(z=>z.sxV2Target?.role==='backdown').map(z=>+z.weight)),afterBack);
   await page.evaluate(()=>{for(const e of work)for(const s of e.sets){if(s.type==='Warm-up')continue;s.done=true;s.weight=s.weight||'40';s.rpe=s.rpe||'8';}commitFinishSession();});
   await page.goto(url+'/AscensionX/programme-preview.html');
   await page.getByText('1 / 30 sessions completed').waitFor({timeout:10000});
   console.log(kind+': mobile preview, legacy protection, import, adjustment, draft reload and workout progression passed');
   await context.close();
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
