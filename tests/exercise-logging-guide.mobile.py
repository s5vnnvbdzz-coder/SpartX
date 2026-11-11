#!/usr/bin/env python3
"""Mobile-sized Chrome check for active exercise title styling and logging help."""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts=Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_experimental_option("mobileEmulation",{
    "deviceMetrics":{"width":390,"height":844,"pixelRatio":3}
})
browser=webdriver.Chrome(options=opts)
run=lambda js,*args:browser.execute_script(js,*args)
click=lambda selector:run("document.querySelector(arguments[0]).click()",selector)
wait=WebDriverWait(browser,40)
try:
    browser.get("http://127.0.0.1:8765/index.html?how-to-log=303")
    wait.until(lambda b:run("return !!window.SpartanXExerciseLoggingGuide && typeof startSession==='function'"))
    run("""
      startSession();
      work=[
       {name:'Incline Dumbbell Press',rest:90,notes:'',sets:[
         {weight:'40',reps:'10',rpe:'8',type:'Working Set',done:false}]},
       {name:'Iso-Lateral Row',rest:120,notes:'',sets:[
         {weight:'120',reps:'10',rpe:'',type:'Working Set',done:false}]},
       {name:'Single-Arm Dumbbell Row',rest:120,notes:'',sets:[
         {weight:'30',reps:'10',rpe:'',type:'Working Set',done:false}]}
      ];
      renderWork();saveDraft();
    """)
    for theme in ['dark','spartan-red','spartan-gold','cosmic-nebula']:
        info=run("""
          preferences.theme=arguments[0];applyTheme();
          const title=document.querySelector('#exerciseList [data-live-exercise-link]');
          const style=getComputedStyle(title),parent=title.closest('.exercise-title-row');
          const r=title.getBoundingClientRect();
          return {title:title.textContent,border:style.borderTopWidth,shadow:style.boxShadow,
            outline:style.outlineStyle,background:style.backgroundColor,
            width:r.width,parentWidth:parent.getBoundingClientRect().width,
            positionedMenu:getComputedStyle(parent.querySelector('.sx-exercise-menu-trigger')).marginLeft};
        """,theme)
        assert info['title']=='Incline Dumbbell Press',info
        assert info['border']=='0px',info
        assert info['shadow']=='none',info
        assert info['outline']=='none',info
        assert info['background'] in ('rgba(0, 0, 0, 0)','transparent'),info
        assert 80<info['width']<info['parentWidth']*.75,info
        print('PASS borderless text-sized title in',theme,info['border'],info['background'],flush=True)
    # The exercise title must open Statistics directly, without a separate modal.
    run("preferences.theme='dark';applyTheme();window.startRest(0,0)")
    before=run("return {deadline:exerciseTimers[activeRestExercise].deadline,work:JSON.stringify(work)}")
    click("#exerciseList [data-live-exercise-link]")
    assert run("return document.querySelector('#exerciseHistoryScreen.screen.active')!==null")
    assert run("return document.querySelector('#exerciseHistoryTitle').textContent")=='Incline Dumbbell Press'
    hint=run("""return {
      visible:!document.getElementById('sxExerciseLoggingSummaryNote').hidden,
      text:document.getElementById('sxExerciseLoggingSummaryNote').textContent,
      subtitle:document.getElementById('exerciseHistorySubtitle').textContent,
      after:document.getElementById('exerciseHistorySubtitle').nextElementSibling.id
    };""")
    assert hint['visible'] and '10 kg per dumbbell = 20 kg total' in hint['text'],hint
    assert hint['after']=='sxExerciseLoggingSummaryNote',hint
    assert run("return JSON.stringify(work)")==before['work']
    assert run("return exerciseTimers[activeRestExercise].deadline")==before['deadline']
    click('#closeExerciseHistory')
    assert run("return document.querySelector('#activeWorkout.screen.active')!==null")
    print('PASS direct Statistics navigation and inline dumbbell hint; timer preserved',flush=True)

    # Iso-Lateral Row shows 40 kg per side = 80 kg total.
    run("document.querySelectorAll('#exerciseList [data-live-exercise-link]')[1].click()")
    assert run("return document.querySelector('#exerciseHistoryTitle').textContent")=='Iso-Lateral Row'
    iso=run("return document.getElementById('sxExerciseLoggingSummaryNote').textContent")
    assert '40 kg per side = 80 kg total' in iso,iso
    click('#sxExerciseTopTabs [data-sx-exercise-tab=howto]')
    assert '120 kg logged' in run("return document.querySelector('#sxExerciseHowTo').textContent")
    click('#closeExerciseHistory')
    print('PASS inline Iso-Lateral Row note and existing How to tab',flush=True)

    # Single-arm exercises should not incorrectly advise doubling the weight.
    run("document.querySelectorAll('#exerciseList [data-live-exercise-link]')[2].click()")
    single=run("return document.getElementById('sxExerciseLoggingSummaryNote').textContent")
    assert '10 kg logged' in single and 'Do not double' in single,single
    click('#closeExerciseHistory')
    # Cardio title remains borderless and opens Statistics directly with no strength hint.
    run("""work.push({name:'Rowing Machine',rest:120,notes:'',sets:[
      window.SpartanXCardio.blank()]});renderWork();""")
    el=run("""const span=document.querySelector('#exerciseList .sx-cardio-card [data-live-exercise-link]');
       const style=getComputedStyle(span);return {exists:!!span,border:style.borderTopWidth,background:style.backgroundColor};""")
    assert el['exists'] and el['border']=='0px' and el['background'] in ('rgba(0, 0, 0, 0)','transparent'),el
    click('#exerciseList .sx-cardio-card [data-live-exercise-link]')
    assert run("return document.querySelector('#exerciseHistoryTitle').textContent")=='Rowing Machine'
    assert run("return document.querySelector('#sxExerciseLoggingSummaryNote').hidden")
    click('#closeExerciseHistory')
    print('PASS unilateral logging exception and cardio without strength note',flush=True)
finally:
    browser.quit()
