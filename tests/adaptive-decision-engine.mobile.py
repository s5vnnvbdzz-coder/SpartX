#!/usr/bin/env python3
"""Mobile browser regression: ongoing six-week AscensionX baseline is read-only."""
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options=Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_experimental_option('mobileEmulation',{
 'deviceMetrics':{'width':390,'height':844,'pixelRatio':3}})
driver=webdriver.Chrome(options=options)
run=lambda code,*args:driver.execute_script(code,*args)
wait=WebDriverWait(driver,35)
try:
 driver.get('http://127.0.0.1:8765/index.html?ci-decision=305')
 wait.until(lambda d:run("""return !!window.SXDecisionEngine &&
  !!window.SXDecisionPanels && !!window.SXBodybuildingProgrammes &&
  !!document.getElementById('sxPowerbuildingScreen');"""))
 run("""
  const cycleId='2026-11-01T09:00:00.000Z';
  const lifts=['Back Squat','Bench Press','Deadlift'];
  const cycle={created:cycleId,exercises:lifts,currentWeek:3,
   weeks:{'Back Squat':3,'Bench Press':3,'Deadlift':3}};
  const logs=lifts.flatMap((lift,i)=>[1,2].map(week=>({
    id:200+i*2+week,cycleId,lift,week,date:new Date().toISOString(),
    setsComplete:true,sets:[{label:'Top set',weight:100+i*20+week*2.5,
      reps:week===1?5:3,rpe:8,done:true}]})));
  localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle,logs}));
  // The unlinked heavy workout must appear in regular history only.
  localStorage.setItem('spartx_db',JSON.stringify({sessions:[{
    id:'free-training',date:new Date().toISOString(),name:'Unlinked workout',
    exercises:[{name:'Bench Press',sets:[{
      type:'Working Set',done:true,weight:200,reps:2,rpe:9}]}]
  }]}));
  window.__beforeData=['ascensionx_strength_v1','spartx_db'].map(
    key=>localStorage.getItem(key));
  window.SXBodybuildingProgrammes.openPowerbuilding();
 """)
 wait.until(lambda d:run("return document.querySelector('#sxPowerbuildingScreen.screen.active')!==null"))
 count=run("return document.querySelectorAll('#sxPBDecisionPanel .sx-decision-lift').length")
 assert count==3,f'Expected three selected lifts, received {count}'
 summary=run("return document.getElementById('sxPBDecisionPanel').textContent")
 assert summary.count('2 / 6 WEEKS LOGGED')==3,summary
 assert 'Overhead Press' not in summary,summary
 assert 'estimated 1RM' in summary,summary
 assert 'READ-ONLY' in summary,summary
 assert run("""return ['ascensionx_strength_v1','spartx_db'].every(
  (key,i)=>localStorage.getItem(key)===window.__beforeData[i])""")
 print('PASS Powerbuilding shows 2 logged weeks for 3 lifts, no changes to AscensionX',flush=True)

 run("""
  const p=window.SXBodybuildingModel.fresh({days:4,weeks:8});
  const saved=window.SXBodybuildingModel.save(window.SXBodybuildingModel.read(),p);
  window.SXBodybuildingProgrammes.open();
 """)
 wait.until(lambda d:run("return document.querySelector('#sxBodybuildingBuilder.screen.active')!==null"))
 note=run("return document.getElementById('sxBBDecisionPanel')?.textContent||''")
 assert 'Programme decision review' in note,note
 assert 'GATHERING EVIDENCE' in note,note
 print('PASS bodybuilding displays linked-only decision review baseline',flush=True)

 driver.get('http://127.0.0.1:8765/intelligence/index.html?ci-decision=305')
 wait.until(lambda d:run("""return !!window.SXDecisionEngine &&
   !!window.SXDecisionPanels && !!document.getElementById('sxDecisionIntelligence') &&
   !!document.querySelector('[data-tab="intelligence"]');"""))
 run("document.querySelector('button[data-tab=intelligence]').click()")
 wait.until(lambda d:run("""return !!document.querySelector('#intelligencePage:not([hidden])')"""))
 insight=run("return document.getElementById('sxDecisionIntelligence').textContent")
 assert 'Back Squat' in insight and 'Bench Press' in insight and 'Deadlift' in insight,insight
 assert 'READ-ONLY' in insight.upper(),insight
 print('PASS Spartan Intelligence Insights shares the cycle analysis',flush=True)

 # A user logging only through AscensionX must still see those real cycle
 # recommendations when the general Strength dashboard uses demo mode.
 run("localStorage.removeItem('spartx_db')")
 driver.refresh()
 wait.until(lambda d:run("""return !!window.SXDecisionPanels &&
  !!document.querySelector('[data-tab="intelligence"]');"""))
 run("document.querySelector('button[data-tab=intelligence]').click()")
 wait.until(lambda d:run("""return !!document.querySelector('#intelligencePage:not([hidden])')"""))
 fallback=run("return document.getElementById('sxDecisionIntelligence').textContent")
 assert 'REAL ASCENSIONX CYCLE DATA' in fallback,fallback
 assert 'Back Squat' in fallback and 'Bench Press' in fallback and 'Deadlift' in fallback,fallback
 print('PASS AscensionX-only data remains visible and separate from demo charts',flush=True)
finally:
 driver.quit()
