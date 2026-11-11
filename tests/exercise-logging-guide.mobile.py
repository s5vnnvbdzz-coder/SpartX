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
    # Timer and workout data remain unchanged when viewing help.
    run("preferences.theme='dark';applyTheme();window.startRest(0,0)")
    before=run("return {deadline:exerciseTimers[activeRestExercise].deadline,work:JSON.stringify(work)}")
    click("#exerciseList [data-live-exercise-link]")
    assert run("return !!document.querySelector('#sxExerciseLogGuide:not([hidden])')")
    assert run("return document.querySelector('#sxLogGuideExercise').textContent")=='Incline Dumbbell Press'
    assert '20 kg in each hand = 40 kg logged.' in run("return document.querySelector('#sxLogGuideExample').textContent")
    assert run("return document.querySelector('#sxExerciseLogGuide').getAttribute('role')") is None
    assert run("return document.querySelector('#sxExerciseLogGuide [role=dialog]').getAttribute('aria-modal')")=='true'
    assert run("return JSON.stringify(work)") == before['work']
    click("#sxLogGuideClose")
    assert run("return document.querySelector('#sxExerciseLogGuide').hidden")
    assert run("return document.querySelector('#activeWorkout.screen.active')!==null")
    assert run("return exerciseTimers[activeRestExercise].deadline") == before['deadline']
    print('PASS How to Log opens/closes without mutating sets or rest deadline',flush=True)

    # Specific two-sided row prescription, plus existing stats page access.
    run("document.querySelectorAll('#exerciseList [data-live-exercise-link]')[1].click()")
    assert run("return document.querySelector('#sxLogGuideExercise').textContent")=='Iso-Lateral Row'
    assert '60 kg on the left + 60 kg on the right = 120 kg logged.' in run("return document.querySelector('#sxLogGuideExample').textContent")
    click('#sxLogGuideStats')
    assert run("return document.querySelector('#sxExerciseLogGuide').hidden")
    assert run("return document.querySelector('#exerciseHistoryScreen.screen.active')!==null")
    assert run("return document.querySelector('#exerciseHistoryTitle').textContent")=='Iso-Lateral Row'
    click('#sxExerciseTopTabs [data-sx-exercise-tab=howto]')
    assert '120 kg logged' in run("return document.querySelector('#sxExerciseHowTo').textContent")
    click('#closeExerciseHistory')
    assert run("return document.querySelector('#activeWorkout.screen.active')!==null")
    print('PASS Iso-Lateral Row 60+60 example and View Statistics preserved',flush=True)

    run("document.querySelectorAll('#exerciseList [data-live-exercise-link]')[2].click()")
    assert run("return document.querySelector('#sxLogGuideRule').textContent")=='Log the actual dumbbell in use'
    assert 'One 20 kg dumbbell = 20 kg logged.' in run("return document.querySelector('#sxLogGuideExample').textContent")
    click('#sxLogGuideClose')
    # Cardio title, rendered as a span, also opens the same sheet.
    run("""work.push({name:'Rowing Machine',rest:120,notes:'',sets:[
      window.SpartanXCardio.blank()]});renderWork();""")
    el=run("""const span=document.querySelector('#exerciseList .sx-cardio-card [data-live-exercise-link]');
       const s=getComputedStyle(span);return {exists:!!span,border:s.borderTopWidth,background:s.backgroundColor};""")
    assert el['exists'] and el['border']=='0px' and el['background'] in ('rgba(0, 0, 0, 0)','transparent'),el
    click('#exerciseList .sx-cardio-card [data-live-exercise-link]')
    assert 'machine totals' in run("return document.querySelector('#sxLogGuideRule').textContent").lower()
    click('#sxLogGuideClose')
    print('PASS single-arm nuance and cardio title consistency',flush=True)
finally:
    browser.quit()
