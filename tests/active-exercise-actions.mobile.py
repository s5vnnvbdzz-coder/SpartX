#!/usr/bin/env python3
"""Mobile Chrome smoke test against locally served SpartanX build.
Does not access production or the user's saved workouts.
"""
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_experimental_option("mobileEmulation", {
    "deviceMetrics": {"width": 390, "height": 844, "pixelRatio": 3}
})
browser = webdriver.Chrome(options=opts)
run = lambda js, *args: browser.execute_script(js, *args)
click = lambda selector: run("document.querySelector(arguments[0]).click()", selector)
wait = WebDriverWait(browser, 40)

try:
    browser.get("http://127.0.0.1:8765/index.html?exercise-actions-ci=302")
    wait.until(lambda _: run("""
      return !!window.SXActiveExerciseActions &&
        !!window.SpartanXExerciseReplacement &&
        !!document.getElementById('sxActiveExerciseReorder') &&
        !!document.getElementById('sxActiveExerciseSuperset') &&
        typeof window.openExerciseActions==='function';
    """))
    run("""
      startSession();
      work=[
        {name:'Cable Curl',rest:90,notes:'',sets:[
          {weight:'20',reps:'10',rpe:'',type:'Working Set',done:false},
          {weight:'20',reps:'10',rpe:'',type:'Working Set',done:false}]},
        {name:'Triceps Pushdown',rest:75,notes:'',sets:[
          {weight:'30',reps:'10',rpe:'',type:'Working Set',done:false},
          {weight:'30',reps:'10',rpe:'',type:'Working Set',done:false}]},
        {name:'Lat Pulldown',rest:120,notes:'',sets:[
          {weight:'50',reps:'10',rpe:'',type:'Working Set',done:false}]}
      ];
      renderWork();saveDraft();
    """)
    assert run("return document.querySelectorAll('#exerciseList .sx-exercise-menu-trigger').length")==3
    assert run("return document.querySelectorAll('#exerciseList .sx-replace-exercise').length")==0

    # Menu shows four real actions.
    click("#exerciseList .sx-exercise-menu-trigger")
    assert run("return !document.getElementById('sxExerciseActionsOverlay').hidden")
    assert run("return [...document.querySelectorAll('[data-sx-action]')].map(b=>b.textContent.trim())")==[
        "↕Reorder Exercises", "⇄Replace Exercise", "＋Add to Superset", "×Remove Exercise"
    ], "Incorrect menu actions"

    # Cancel doesn't alter the active workout.
    click("[data-sx-action=reorder]")
    assert run("return document.querySelector('#sxActiveExerciseReorder.screen.active')!==null")
    assert run("return document.querySelectorAll('#sxActiveExerciseReorder [data-sx-key]').length")==3
    click("#sxActiveExerciseReorder [data-sx-cancel]")
    assert run("return document.querySelector('#activeWorkout.screen.active')!==null")
    assert run("return work.map(e=>e.name).join(',')")=="Cable Curl,Triceps Pushdown,Lat Pulldown"

    # Hold-and-drag is supported (not just arrow buttons).
    click("#exerciseList .sx-exercise-menu-trigger")
    click("[data-sx-action=reorder]")
    drag = browser.execute_async_script("""
      const done=arguments[arguments.length-1];
      const a=document.querySelector('#sxActiveExerciseReorder [data-sx-key="2"] [data-sx-drag]');
      const b=document.querySelector('#sxActiveExerciseReorder [data-sx-key="0"]');
      const src=a.getBoundingClientRect(),t=b.getBoundingClientRect();
      const p=(type,x,y)=>new PointerEvent(type,{bubbles:true,cancelable:true,
        pointerId:41,pointerType:'touch',button:0,clientX:x,clientY:y});
      a.dispatchEvent(p('pointerdown',src.x+src.width/2,src.y+src.height/2));
      setTimeout(()=>{
        document.dispatchEvent(p('pointermove',t.x+t.width/2,t.y+t.height/2));
        document.dispatchEvent(p('pointerup',t.x+t.width/2,t.y+t.height/2));
        done([...document.querySelectorAll('#sxActiveExerciseReorder [data-sx-key]')].map(e=>Number(e.dataset.sxKey)));
      },380);
    """)
    assert drag==[2,0,1], f"Hold-and-drag order was {drag}"
    assert run("return work.map(e=>e.name).join(',')")=="Cable Curl,Triceps Pushdown,Lat Pulldown"
    click("#sxActiveExerciseReorder [data-sx-save]")
    assert run("return work.map(e=>e.name).join(',')")=="Lat Pulldown,Cable Curl,Triceps Pushdown"
    print("PASS menu + cancel + hold-drag reorder/save", flush=True)

    # A superset can include exactly two selections and persists in draft.
    run("openExerciseActions(1)")
    click("[data-sx-action=superset]")
    assert run("return document.querySelector('#sxActiveExerciseSuperset.screen.active')!==null")
    assert run("return document.querySelector('#sxActiveExerciseSuperset [data-sx-save]').disabled")
    click("#sxActiveExerciseSuperset [data-sx-choose='2']")
    assert not run("return document.querySelector('#sxActiveExerciseSuperset [data-sx-save]').disabled")
    click("#sxActiveExerciseSuperset [data-sx-save]")
    pair = run("""return {
      first:work[1].sxSupersetId,second:work[2].sxSupersetId,
      firstLabel:document.querySelector('#exerciseList').children[1].querySelector('.sx-superset-banner')?.textContent,
      secondLabel:document.querySelector('#exerciseList').children[2].querySelector('.sx-superset-banner')?.textContent
    };""")
    assert pair["first"] and pair["first"]==pair["second"],pair
    assert "SS1" in pair["firstLabel"] and "SS1" in pair["secondLabel"],pair
    assert run("return JSON.parse(localStorage.getItem('spartx_draft_v1')).work[1].sxSupersetId") ==pair["first"]

    # Finishing one partner's set starts rest for the next partner's set.
    run("completeSet(1,0,true)")
    timer=run("""return {
       source:activeRestExercise,target:exerciseTimers[activeRestExercise]?.nextSupersetIndex,
       deadline:exerciseTimers[activeRestExercise]?.deadline,
       text:document.getElementById('floatingRestExercise')?.textContent,
       saved:JSON.parse(localStorage.getItem('spartx_draft_v1')).rest?.nextSupersetIndex
    };""")
    assert timer["source"]==1 and timer["target"]==2,timer
    assert timer["saved"]==2 and "Triceps Pushdown" in timer["text"],timer
    print("PASS pairing + visible labels + next-exercise timer", flush=True)

    # Reorder while timer is counting. Deadline and pair both survive.
    run("openExerciseActions(1)")
    click("[data-sx-action=reorder]")
    run("""
      const handle=document.querySelector('#sxActiveExerciseReorder [data-sx-key="1"] [data-sx-drag]');
      handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));
    """)
    click("#sxActiveExerciseReorder [data-sx-save]")
    after=run("""return {
       names:work.map(x=>x.name),source:activeRestExercise,
       target:exerciseTimers[activeRestExercise]?.nextSupersetIndex,
       deadline:exerciseTimers[activeRestExercise]?.deadline,
       labels:[...document.querySelectorAll('#exerciseList .sx-superset-banner')].map(x=>x.textContent)
    };""")
    assert after["names"]==["Cable Curl","Lat Pulldown","Triceps Pushdown"],after
    assert after["source"]==0 and after["target"]==2,after
    assert after["deadline"]==timer["deadline"],(timer,after)
    assert len(after["labels"])==2,after
    print("PASS rest deadline + superset labels preserved through reorder", flush=True)

    # Remove existing superset but retain both exercise records and countdown.
    run("openExerciseActions(0)")
    click("[data-sx-action=superset]")
    click("#sxActiveExerciseSuperset [data-sx-unpair]")
    assert run("return work[0].sxSupersetId===undefined&&work[2].sxSupersetId===undefined")
    assert run("return activeRestExercise===0&&exerciseTimers[0]?.deadline> Date.now()")
    assert not run("return document.querySelector('#exerciseList .sx-superset-banner')")
    print("PASS remove pair without deleting workout", flush=True)

    # Replace action uses the existing exercise library.
    run("openExerciseActions(0)")
    click("[data-sx-action=replace]")
    assert run("return document.querySelector('#exerciseLibraryScreen.screen.active')!==null")
    run("window.pickExercise('Dumbbell Curl')")
    # Previously logged source set requires confirmation.
    if browser.switch_to.alert:
        browser.switch_to.alert.accept()
    assert run("return document.querySelector('#activeWorkout.screen.active')!==null")
    assert run("return work[0].name")=="Dumbbell Curl"
    assert run("return work.length")==3
    print("PASS replace preserves workout order and clears old exercise data", flush=True)
finally:
    browser.quit()
