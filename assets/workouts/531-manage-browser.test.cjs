/* Browser-level regression for 5/3/1 Manage Cycle.
 * Run with a localhost static server and playwright installed:
 *   node assets/workouts/531-manage-browser.test.cjs
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function run(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const sample={
    id:'sx531_browser_test',name:'5/3/1 · 12 weeks · Squat / Bench Press',
    lift:'Bench Press',exercises:['Back Squat','Bench Press'],
    created:'2026-11-10T12:00:00.000Z',weeks:12,bbb:false,bbbPct:60,
    startTM:145,increase:2.5,completedWeeks:[1],
    completedSessions:{'Back Squat':[1],'Bench Press':[1]},
    liftSettings:{
      'Back Squat':{oneRm:180,tm:165,increase:5},
      'Bench Press':{oneRm:160,tm:145,increase:2.5}
    }
  };
  await page.addInitScript(sample=>{
    localStorage.setItem('spartanx_531_saved_cycles_v1',JSON.stringify([sample]));
  },sample);
  try{
    await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.spartanx531ManageDesign?.open &&
      document.getElementById('native531Host')?.shadowRoot?.querySelector('[data-edit="sx531_browser_test"]'),
      {timeout:20000});
    await page.evaluate(()=>{
      document.querySelectorAll('main > .screen').forEach(x=>x.classList.toggle('active',x.id==='workout'));
      window.dispatchEvent(new CustomEvent('spartx:open531CycleEditor',{
        detail:{id:'sx531_browser_test',skipPreview:true}
      }));
    });
    await page.waitForFunction(()=>document.getElementById('native531Host')?.shadowRoot
      ?.querySelectorAll('.sx531-unified-section').length===4,{timeout:10000});
    const state=await page.evaluate(()=>{
      const host=document.getElementById('native531Host'),r=host.shadowRoot;
      const overlay=document.getElementById('sxQuick531CycleOverlay');
      const sections=[...r.querySelectorAll('.sx531-unified-section')];
      const deleteBtn=document.getElementById('sx531ManageDelete');
      const deleteArea=document.getElementById('sx531ManageDeleteArea');
      return {
        title:document.getElementById('sxQuick531CycleTitle').textContent,
        subtitle:document.getElementById('sxQuick531CycleSubtitle').textContent,
        eyebrow:document.getElementById('sxQuick531CycleEyebrow').textContent,
        isPage:overlay.classList.contains('sx-531-manage-page')&&overlay.getAttribute('role')==='main',
        headings:sections.map(x=>x.querySelector('.sx531-unified-eyebrow')?.textContent),
        cardBorders:sections.map(x=>getComputedStyle(x).borderTopWidth),
        deleteOutsideFooter:!!deleteArea?.contains(deleteBtn)&&
          !document.getElementById('sx531ManageFooter').contains(deleteBtn),
        footerButtons:[...document.querySelectorAll('#sx531ManageFooter .sx531-manage-footer-row button')]
          .map(x=>x.textContent.trim()),
        primaryFields:!!sections[0].querySelector('#lift')&&!!sections[0].querySelector('#oneRm'),
        programmeLifts:!!sections[1].querySelector('#sx531LiftChoices'),
        cycleLength:!!sections[2].querySelector('#lengthChoices'),
        bbb:!!sections[3].querySelector('#bbb')
      };
    });
    assert.equal(state.title,'Manage your cycle');
    assert.equal(state.eyebrow,'5/3/1 · PROGRAMME');
    assert.ok(state.subtitle.includes('completed training weeks'));
    assert.equal(state.isPage,true);
    assert.deepEqual(state.headings,[
      '01 · STARTING STRENGTH','02 · PRIMARY LIFTS',
      '03 · CYCLE PROGRESSION','04 · OPTIONAL ASSISTANCE'
    ]);
    assert.ok(state.cardBorders.every(v=>v!=='0px'),'Each card must be visibly bordered');
    assert.equal(state.deleteOutsideFooter,true,'Delete Programme must appear in scrollable content');
    assert.deepEqual(state.footerButtons,['CANCEL','SAVE CHANGES']);
    for(const key of ['primaryFields','programmeLifts','cycleLength','bbb'])
      assert.equal(state[key],true,key+' inputs must remain present');
    await page.screenshot({path:'531-manage-desktop.png'});
    await page.setViewportSize({width:390,height:844});
    const narrow=await page.evaluate(()=>{
      const r=document.getElementById('native531Host').shadowRoot;
      return {
        cardCount:r.querySelectorAll('.sx531-unified-section').length,
        horizontalOverflow:document.querySelector('#sxQuick531CycleScroll').scrollWidth-
          document.querySelector('#sxQuick531CycleScroll').clientWidth
      };
    });
    assert.equal(narrow.cardCount,4);
    assert.ok(narrow.horizontalOverflow<=2,'No horizontal scrolling on iPhone width');
    await page.screenshot({path:'531-manage-mobile.png'});
    await page.click('#sx531ManageCancel');
    const restored=await page.evaluate(()=>{
      const r=document.getElementById('native531Host').shadowRoot;
      return {
        closed:document.getElementById('sxQuick531CycleOverlay').hidden,
        cards:r.querySelectorAll('.sx531-unified-section').length
      };
    });
    assert.equal(restored.closed,true,'Cancel should return to Workout');
    assert.equal(restored.cards,0,'The temporary manage cards should be removed after exit');
    console.log('5/3/1 browser test: dedicated page rendered with matching cards on desktop and mobile.');
    if(errors.length)console.warn('Additional page errors:',errors.slice(0,5));
  }catch(err){
    try{await page.screenshot({path:'531-manage-failure.png'});}catch(_){}
    const details=await page.evaluate(()=>{
      const host=document.getElementById('native531Host');
      const shadow=host?.shadowRoot;
      return {
        heading:document.getElementById('sxQuick531CycleTitle')?.textContent,
        loaded:!!window.spartanx531ManageDesign,
        root:!!shadow,
        editorVisible:shadow?.getElementById('editModal')?.hidden===false,
        sectionCount:shadow?.querySelectorAll('.sx531-unified-section').length,
        inline:host?.classList.contains('sx-531-manage-inline'),
        resources:performance.getEntriesByType('resource').filter(x=>x.name.includes('531-manage')).map(x=>x.name)
      };
    }).catch(()=>({}));
    console.error('Browser state:',JSON.stringify(details));
    console.error('Page errors:',errors.slice(0,10));
    throw err;
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exit(1)});
