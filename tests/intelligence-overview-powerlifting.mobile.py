#!/usr/bin/env python3
"""Mobile Chrome smoke test: AscensionX strength insights precede accessory analysis."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts=Options()
opts.add_argument('--headless=new')
opts.add_argument('--no-sandbox')
opts.add_argument('--disable-dev-shm-usage')
opts.add_experimental_option('mobileEmulation',{
 'deviceMetrics':{'width':390,'height':844,'pixelRatio':3}
})
driver=webdriver.Chrome(options=opts)
run=lambda code,*args:driver.execute_script(code,*args)
wait=WebDriverWait(driver,45)
try:
 driver.get('http://127.0.0.1:8765/intelligence/index.html?tab=overview')
 wait.until(lambda _:run("""return !!window.SXDecisionPanels?.overview &&
   !!document.getElementById('sxOverviewAscensionInsights') &&
   !!document.getElementById('sxOverviewSupportingTraining');"""))
 run("""
  const cycleId='2026-11-01T09:00:00.000Z';
  const lifts=['Squats','Bench Press','Deadlift'];
  const cycle={created:cycleId,exercises:lifts,currentWeek:3,
   weeks:{Squats:3,'Bench Press':3,Deadlift:3}};
  const logs=lifts.flatMap((lift,i)=>[1,2].map(week=>({
    id:300+i*2+week,cycleId,lift,week,date:new Date().toISOString(),
    setsComplete:true,sets:[
     {label:'Top set',weight:100+i*20+week*2.5,reps:week===1?5:3,rpe:8,done:true}
    ]
  })));
  localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle,logs}));
  localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
    id:'unlinked-999',date:new Date().toISOString(),name:'Independent session',
    exercises:[{name:'Bench Press',sets:[
      {type:'Working Set',weight:999,reps:3,rpe:10,done:true}
    ]}]
  }]}));
 """)
 driver.refresh()
 wait.until(lambda _:run("return document.querySelectorAll('#sxOverviewAscensionInsights .sx-overview-lift-card').length===3"))
 assert run("return document.getElementById('overviewPage').hidden") is False
 text=run("return document.getElementById('sxOverviewAscensionInsights').textContent")
 for lift in ['Back Squat','Bench Press','Deadlift']:
  assert lift in text,text
 assert text.count('WEEK 3 / 6')==3,text
 assert text.count('2 completed linked weeks')==3,text
 assert '999' not in text,'Standalone Bench Press contaminates AscensionX insights'
 assert 'Estimated 1RM' in text or 'ESTIMATED 1RM' in text,text
 assert run("return JSON.parse(localStorage.getItem('ascensionx_strength_v1')).logs.length")==6
 print('PASS top section shows independent squat, bench and deadlift weeks from saved logs',flush=True)
 ordering=run("""const page=document.getElementById('overviewPage');
 const a=page.querySelector('.sx-overview-lift-priority');
 const b=page.querySelector('#sxOverviewAscensionInsights');
 const c=page.querySelector('#kpiGrid');
 const d=page.querySelector('#consistencyChart');
 const e=page.querySelector('#sxOverviewSupportingTraining');
 const accessories=page.querySelector('#sxLatestWorkoutAnalysis');
 return {
   first:page.firstElementChild===a,
   sequence:[a,b,c,d,e,accessories].map(el=>
     [...page.querySelectorAll('*')].indexOf(el)),
   collapsed:!e.open,
   supportContent:e.contains(accessories),
   supportNotShown:!e.querySelector('#sxLatestWorkoutAnalysis').getClientRects().length,
   panelCount:b.querySelectorAll('.sx-overview-lift-card').length
 };""")
 assert ordering['first'],ordering
 assert ordering['sequence']==sorted(ordering['sequence']),ordering
 assert ordering['collapsed'] and ordering['supportContent'] and ordering['supportNotShown'],ordering
 assert ordering['panelCount']==3,ordering
 print('PASS first content is powerlifting and accessories are collapsed below strength charts',flush=True)
 render=run("""const g=document.querySelector('.sx-overview-lift-grid');
  const cards=g.querySelectorAll('.sx-overview-lift-card');
  const a=cards[0].getBoundingClientRect(),b=cards[1].getBoundingClientRect();
  return {stacked:b.top>=a.bottom-2,
    columns:getComputedStyle(g).gridTemplateColumns,
    maxRight:Math.max(...[...cards].map(c=>c.getBoundingClientRect().right)),
    viewport:document.documentElement.clientWidth};""")
 assert render['stacked'],render
 assert render['maxRight']<=render['viewport']+2,render
 print('PASS mobile-width cards are vertically stacked and inside screen',flush=True)
 driver.find_element('css selector','#sxOverviewSupportingTraining > summary').click()
 assert run("return document.getElementById('sxOverviewSupportingTraining').open")
 assert run("return !!document.getElementById('sxSessionTrendChart')")
 assert run("return !!document.getElementById('sxLatestWorkoutAnalysis')")
 print('PASS full saved workout and accessory analysis can be expanded',flush=True)

 # An AscensionX-only user must still see real strength evidence on the
 # Overview while the general charts may remain in demo mode.
 run("localStorage.removeItem('spartx_db')")
 driver.refresh()
 wait.until(lambda _:run("return document.querySelectorAll('#sxOverviewAscensionInsights .sx-overview-lift-card').length===3"))
 raw=run("return document.getElementById('sxOverviewAscensionInsights').textContent")
 assert 'Back Squat' in raw and 'Deadlift' in raw and 'Bench Press' in raw,raw
 assert 'NO ACTIVE CYCLE' not in raw,raw
 print('PASS AscensionX-only saved logs remain visible despite demo-mode general charts',flush=True)
finally:
 driver.quit()
