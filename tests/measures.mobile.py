#!/usr/bin/env python3
"""SpartanX iPhone Measures and muscle-role smoke tests (localhost)."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options=Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_experimental_option('mobileEmulation', {
 'deviceMetrics':{'width':390,'height':844,'pixelRatio':3}
})
browser=webdriver.Chrome(options=options)
wait=WebDriverWait(browser,45)
run=lambda code,*args:browser.execute_script(code,*args)
try:
 browser.get('http://127.0.0.1:8765/?measures-smoke=326')
 wait.until(lambda _:run("return !!window.SpartanXMeasures && !!document.querySelector('#sxMeasureLogPage')"))
 run("""
  db.profile={...(db.profile||{}),name:'QA Athlete',bodyweight:91,standard:'male'};
  db.sessions=[{id:'keep-me',date:new Date().toISOString(),name:'Historic workout',
    duration:1800,volume:600,exercises:[{name:'Back Squat',sets:[
       {done:true,type:'Working Set',weight:100,reps:6,rpe:7}
    ]}]}];
  persist();renderProfile();switchScreen('profile',{instant:true});
 """)
 run("document.getElementById('openMeasures').click()")
 wait.until(lambda _:run("return document.getElementById('measuresOverlay').classList.contains('active')"))
 layout=run("""
  const app=document.getElementById('measuresOverlay');
  const heading=app.querySelector('.sx-measure-page-head').getBoundingClientRect();
  return {
   isScreen:app.classList.contains('screen'),
   notDialog:!app.hasAttribute('role'),
   navHidden:getComputedStyle(document.getElementById('trackerNav')).display==='none',
   headingClear:heading.top>=60,
   withinViewport:heading.left>=0&&heading.right<=document.documentElement.clientWidth+1,
   displaysOldWeight:document.getElementById('sxMeasuresCurrent').textContent.includes('91')
  };
 """)
 assert all(layout.values()),layout
 print('PASS Measures is a status-safe secondary screen retaining existing bodyweight',flush=True)
 run("document.getElementById('sxMeasuresPlus').click()")
 wait.until(lambda _:run("return document.getElementById('sxMeasureLogPage').classList.contains('active')"))
 assert run("return document.getElementById('sxMeasureField_bodyweight').value")=='91'
 run("""
  document.getElementById('sxMeasureField_bodyweight').value='91.5';
  document.getElementById('sxMeasureField_waist').value='84';
  document.getElementById('sxMeasureEntryForm').requestSubmit();
 """)
 wait.until(lambda _:run("return document.getElementById('measuresOverlay').classList.contains('active')"))
 saved=run("""
  const a=JSON.parse(localStorage.getItem('spartx_db'));
  return {count:a.measurements?.length,weight:a.measurements?.[0]?.values?.bodyweight,
    waist:a.measurements?.[0]?.values?.waist,profile:a.profile.bodyweight,
    sessions:a.sessions.map(s=>s.id),
    chart:!!document.querySelector('#sxMeasuresChart svg')};
 """)
 assert saved['count']==1 and saved['weight']==91.5 and saved['waist']==84,saved
 assert saved['profile']==91.5 and saved['sessions']==['keep-me'] and saved['chart'],saved
 print('PASS adding bodyweight and waist saves dated history and updates rankings without altering workouts',flush=True)
 run("""
  document.getElementById('sxMeasuresPlus').click();
  document.getElementById('sxMeasureDate').value='2026-10-29';
  document.getElementById('sxMeasureField_bodyweight').value='90.5';
  document.getElementById('sxMeasureField_waist').value='85';
  document.getElementById('sxMeasureEntryForm').requestSubmit();
 """)
 wait.until(lambda _:run("return document.getElementById('sxMeasureEntryCount').textContent==='2'"))
 assert run("return db.profile.bodyweight")==91.5,'Backdated entry should not replace current weight'
 run("""
  document.getElementById('sxMeasureMetric').value='waist';
  document.getElementById('sxMeasureMetric').dispatchEvent(new Event('change',{bubbles:true}));
 """)
 assert run("return document.getElementById('sxMeasuresChart').querySelectorAll('.chart-point').length")==2
 print('PASS metric charts include multiple dated values; backdated measurements do not overwrite current bodyweight',flush=True)
 # Progress photo is optional, but must persist separately from workout JSON.
 run("document.querySelector('#sxMeasuresHistory button[data-measure-edit]').click()")
 wait.until(lambda _:run("return document.getElementById('sxMeasureLogPage').classList.contains('active')"))
 inserted=browser.execute_async_script("""
  const done=arguments[arguments.length-1],canvas=document.createElement('canvas');
  canvas.width=50;canvas.height=50;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#17bba6';ctx.fillRect(0,0,50,50);
  canvas.toBlob(blob=>{
    const input=document.getElementById('sxMeasurePhotoInput');
    const data=new DataTransfer();
    data.items.add(new File([blob],'progress.png',{type:'image/png'}));
    input.files=data.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    done(!!document.querySelector('#sxMeasurePhotoPreview img'));
  },'image/png');
 """)
 assert inserted,'Image preview should appear after selection'
 run("document.getElementById('sxMeasureEntryForm').requestSubmit()")
 wait.until(lambda _:run("return document.getElementById('measuresOverlay').classList.contains('active')"))
 assert run("return db.measurements.some(x=>x.hasPhoto)") is True
 stored=browser.execute_async_script("""
  const done=arguments[arguments.length-1];
  const entry=db.measurements.find(x=>x.hasPhoto);
  const req=indexedDB.open('spartx_measurement_photos_v1',1);
  req.onerror=()=>done(false);
  req.onsuccess=()=>{
   const tx=req.result.transaction('photos','readonly');
   const r=tx.objectStore('photos').get(entry.id);
   r.onsuccess=()=>done(r.result instanceof Blob && r.result.size>0);
   r.onerror=()=>done(false);
  };
 """)
 assert stored,'Progress photo should survive in separate IndexedDB storage'
 print('PASS optional progress pictures persist without increasing the workout JSON size',flush=True)
 run("document.querySelector('#sxMeasuresHistory button[data-measure-edit]').click()")
 wait.until(lambda _:run("return document.getElementById('sxMeasureLogPage').classList.contains('active')"))
 assert run("return document.getElementById('sxMeasureEntryTitle').textContent")=='Edit Measurements'
 run("document.getElementById('sxMeasureEntryBack').click()")
 wait.until(lambda _:run("return document.getElementById('measuresOverlay').classList.contains('active')"))
 run("document.getElementById('closeMeasures').click()")
 wait.until(lambda _:run("return document.getElementById('profile').classList.contains('active')"))
 browser.refresh()
 wait.until(lambda _:run("return !!window.SpartanXMeasures && !!document.querySelector('#sxMeasureLogPage')"))
 assert run("return JSON.parse(localStorage.getItem('spartx_db')).measurements.length")==2
 print('PASS two-page navigation and measurement persistence after reload',flush=True)
 roles=run("""
  const tmp=document.createElement('div');
  tmp.innerHTML=SpartanXAnatomy.render(new Set(['quads']),new Set(['calves']));
  document.body.appendChild(tmp);
  const colors=['neutral','secondary','primary'].map(type=>{
   const part=tmp.querySelector('.sx-muscle-'+type);
   return part?getComputedStyle(part).fill:null;
  });
  tmp.remove();
  return colors;
 """)
 assert all(roles) and len(set(roles))==3,roles
 print('PASS shared anatomy distinguishes inactive, secondary and primary muscles',roles,flush=True)
finally:
 browser.quit()
