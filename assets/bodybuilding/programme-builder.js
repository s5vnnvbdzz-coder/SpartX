/* SpartanX Strength & Bodybuilding programme builder (Stage 1).
   Planning stays in its own localStorage key; no workout/AscensionX mutation. */
(function(){
  'use strict';
  const M=window.SXBodybuildingModel,E=window.SXProgrammeIntelligence,card=document.getElementById('sxBodybuildingProgrammeCard');
  const main=document.querySelector('body > main');
  if(!M||!card||!main)return;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=(n)=>Number(n||0).toLocaleString('en-GB');
  let store=M.read(),selectedId=store.activeId,mode=store.programmes.length?'view':'edit',draft=null,dirty=false,pickerDay=null;
  const screen=document.createElement('section');
  screen.id='sxBodybuildingBuilder';screen.className='screen sx-bb-screen';
  screen.setAttribute('aria-label','Strength and Bodybuilding programme builder');
  screen.innerHTML=[
    '<header class="sx-bb-header"><button type="button" class="sx-bb-back" data-bb-action="back">← WORKOUT</button>',
    '<div><div class="eyebrow">SPARTANX · PROGRESSIVE TRAINING</div><h1>Strength &amp; Bodybuilding</h1></div>',
    '<span class="sx-bb-pill" id="sxBBModePill">BUILDER</span></header>',
    '<p class="sx-bb-subtitle">Build programmes independently of your AscensionX and 5/3/1 cycles.</p>',
    '<div id="sxBBNotice" class="sx-bb-notice" role="status" aria-live="polite" hidden></div>',
    '<section id="sxBBLibrary" class="card sx-bb-library"><div class="sx-bb-library-top">',
    '<label>SAVED PROGRAMMES<select id="sxBBSelect" aria-label="Choose programme"></select></label>',
    '<button type="button" class="sx-bb-secondary" data-bb-action="new">＋ NEW PROGRAMME</button></div>',
    '<p id="sxBBLibraryMeta" class="sx-bb-help"></p></section>',
    '<section id="sxBBView"></section>',
    '<section id="sxBBEdit" hidden>',
    '<div class="sx-bb-setup"><article class="card"><div class="eyebrow">PROGRAMME SETUP</div><h2>Training details</h2>',
    '<label>PROGRAMME NAME<input id="sxBBName" maxlength="80" data-bb-field="name" placeholder="My bodybuilding programme"></label>',
    '<div class="sx-bb-two"><label>TRAINING TYPE<select id="sxBBKind" data-bb-field="kind"><option value="bodybuilding">Bodybuilding</option><option value="hybrid">Strength &amp; Size</option></select></label>',
    '<label>EXPERIENCE<select id="sxBBExperience" data-bb-field="experience"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div>',
    '<div class="sx-bb-two"><label>TRAINING DAYS<select id="sxBBDays" data-bb-field="days"><option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option><option value="6">6 days</option></select></label>',
    '<label>PROGRAMME LENGTH<select id="sxBBWeeks" data-bb-field="weeks"><option value="4">4 weeks</option><option value="6">6 weeks</option><option value="8">8 weeks</option><option value="12">12 weeks</option></select></label></div>',
    '<label>TRAINING PRIORITY<select id="sxBBPriority" data-bb-field="priority"><option value="balanced">Balanced development</option><option value="upper">Upper-body emphasis</option><option value="lower">Lower-body emphasis</option></select></label>',
    '<p class="sx-bb-help">Changing training days rebuilds the exercise split. Changing priority does not overwrite your edited exercises until you choose Rebuild Template.</p>',
    '<button type="button" class="sx-bb-secondary" data-bb-action="rebuild">↻ REBUILD ALL TRAINING DAYS</button>'+
    '<button type="button" id="sxBBBalanceLegs" class="sx-bb-secondary sx-bb-balance-legs" data-bb-action="balance-legs">BALANCE LEG DAYS ONLY</button>'+
    '<p class="sx-bb-help">The balanced lower-volume template uses 11 working sets per lower day (10 on the second leg day of a 5-day plan). Existing saved programmes are never changed automatically.</p></article>',
    '<article class="card"><div class="eyebrow">PROGRESSION METHODOLOGY</div><h2>Double progression</h2>',
    '<p>Increase reps within a planned range. When all working sets reach the upper target with appropriate effort and technique, consider the next available load.</p>',
    '<p class="sx-bb-help">Eight-week plans adapt working sets and RIR by phase. Completed reps, load and RPE inform the next workout; adjustments are recommendations, not silent changes to saved programmes.</p>',
    '<div id="sxBBDraftStats" class="sx-bb-stats"></div><p id="sxBBMuscleCoverage" class="sx-bb-help"></p></article></div>',
    '<div class="sx-bb-sectionhead"><div class="eyebrow">YOUR WEEKLY SPLIT</div><h2>Edit training days</h2><p>All exercises, working sets, rep ranges, RIR, rest and starting loads can be changed.</p></div>',
    '<div id="sxBBEditorDays" class="sx-bb-days"></div>',
    '<div class="sx-bb-actions"><button type="button" class="sx-bb-secondary" data-bb-action="discard">DISCARD</button>',
    '<button type="button" class="sx-bb-primary" data-bb-action="save">SAVE PROGRAMME</button></div></section>',
    '<div id="sxBBPicker" class="sx-bb-picker" role="dialog" aria-modal="true" aria-labelledby="sxBBPickerTitle" hidden>',
    '<section class="sx-bb-picker-panel"><div class="eyebrow">SPARTANX EXERCISE LIBRARY</div><h2 id="sxBBPickerTitle">Add exercise</h2>',
    '<label>SEARCH BY NAME OR MUSCLE GROUP<input id="sxBBSearch" type="search" placeholder="e.g. chest, row, squats" autocomplete="off"></label>',
    '<div id="sxBBPickerList" class="sx-bb-picker-list"></div>',
    '<button type="button" class="sx-bb-secondary" data-bb-action="close-picker">CANCEL</button></section></div>'
  ].join('');
  main.appendChild(screen);
  // Separate six-week AscensionX companion. This does not create or replace
  // an independent bodybuilding programme and is disabled until opted in.
  const companionCard=document.createElement('section');
  companionCard.id='sxBBAscensionCompanion';
  companionCard.className='card sx-bb-companion-card';
  companionCard.hidden=true;
  // The two training systems have independent, fully navigable screens.
  // Bodybuilding manages 8-week standalone plans; Powerbuilding manages the
  // live six-week AscensionX cycle and does not create a second standalone plan.
  const powerScreen=document.createElement('section');
  powerScreen.id='sxPowerbuildingScreen';
  powerScreen.className='screen sx-bb-screen sx-pb-screen';
  powerScreen.setAttribute('aria-label','AscensionX Powerbuilding dashboard');
  powerScreen.innerHTML='<header class="sx-bb-header sx-pb-header">'+
    '<button type="button" class="sx-bb-back" data-pb-back>← WORKOUT</button>'+
    '<div><div class="eyebrow">ASCENSIONX · CONNECTED STRENGTH TRAINING</div>'+
    '<h1>Powerbuilding</h1></div><span class="sx-bb-pill">ASCENSIONX · 6-WEEK WAVE</span></header>'+
    '<p class="sx-bb-subtitle">Build muscle around your existing AscensionX main lifts. This dashboard never changes the weights or progression of your strength cycle.</p>'+
    '<div id="sxPBHero"></div><section id="sxPBDecisionPanel" aria-label="Spartan Intelligence strength cycle decisions"></section>';
  main.appendChild(powerScreen);
  powerScreen.appendChild(companionCard);
  powerScreen.addEventListener('click',event=>{
    if(event.target.closest('[data-pb-back]'))backPowerbuilding();
  });
  const powerCard=document.createElement('section');
  powerCard.id='sxPowerbuildingProgrammeCard';
  powerCard.className='card sx-programme-card sx-pb-card';
  powerCard.setAttribute('aria-label','AscensionX Powerbuilding programme');
  // Legacy stand-alone Powerbuilding card is retired from the Workout stack.
  // Keep the feature and its stored data intact; new programme settings live
  // directly inside AscensionX's Build / Manage Cycle screen.
  powerCard.hidden=true;
  card.insertAdjacentElement('afterend',powerCard);
  powerCard.addEventListener('click',event=>{
    if(event.target.closest('[data-pb-open]'))openPowerbuilding();
  });
  function openPowerbuilding(){
    renderCompanion();
    if(typeof window.spartanxNavigateScreen==='function')window.spartanxNavigateScreen('sxPowerbuildingScreen',{instant:true});
    else {document.querySelectorAll('.screen.active').forEach(el=>el.classList.remove('active'));powerScreen.classList.add('active');}
    window.scrollTo(0,0);
  }
  function backPowerbuilding(){
    if(typeof window.spartanxReturnToScreen==='function')window.spartanxReturnToScreen('workout');
    else if(typeof window.spartanxNavigateScreen==='function')window.spartanxNavigateScreen('workout',{back:true,instant:true});
    else {powerScreen.classList.remove('active');document.getElementById('workout')?.classList.add('active');}
  }
  function renderPowerHero(cycle,prefs){
    const host=$('sxPBHero');if(!host)return;
    if(!cycle){
      host.innerHTML='<article class="card sx-pb-hero sx-pb-no-cycle">'+
        '<div class="eyebrow">STEP 1 · ASCENSIONX</div><h2>No active AscensionX cycle</h2>'+
        '<p>Create or activate your chosen squat, bench, deadlift and/or overhead press cycle from the Workout page. Then return here to link supporting hypertrophy work.</p>'+
        '<button type="button" class="sx-bb-secondary" data-pb-back>RETURN TO WORKOUT</button></article>';
      return;
    }
    const api=window.SXAscensionCompanion;
    host.innerHTML='<article class="card sx-pb-hero"><div class="eyebrow">ASCENSIONX · ACTIVE STRENGTH CYCLE</div>'+
      '<h2>Build strength. Add size. Manage fatigue.</h2>'+
      '<p>Your main lifts stay in AscensionX; Powerbuilding schedules optional accessories and support-only sessions around them.</p>'+
      '<div class="sx-pb-hero-lifts">'+cycle.lifts.map(lift=>{
        const w=Object.entries(cycle.weeks).find(([name])=>api.canonical(name)===lift);
        const week=Math.max(1,Math.min(6,Number(w?.[1]||cycle.currentWeek)||1));
        return '<span><strong>'+esc(lift)+'</strong><small>Week '+week+' / 6</small></span>';
      }).join('')+'</div>'+
      '<div class="sx-pb-status">'+(prefs.powerbuilding?'POWERBUILDING ENABLED':'POWERBUILDING OFF · OPTIONAL')+
      ' · '+prefs.trainingDays+' TRAINING DAYS</div></article>';
  }
  function renderPowerCard(){
    const api=window.SXAscensionCompanion,cycle=api?.cycle?.(),pref=api?.preference?.();
    powerCard.innerHTML='<div class="sx-programme-head"><div><div class="sx-programme-kicker">ASCENSIONX · INTELLIGENT POWERBUILDING</div>'+
     '<h3 class="sx-programme-title">Powerbuilding</h3></div><span class="sx-programme-tag">'+
     (pref?.powerbuilding?'ENABLED':'OPTIONAL')+'</span></div>'+
     '<p class="sx-programme-meta">'+(cycle?
      esc(cycle.lifts.join(' · '))+' · '+(pref?.trainingDays||4)+' training days/week':
      'Connect a six-week AscensionX strength cycle for tailored sessions built around its selected main lifts.')+'</p>'+
     '<div class="sx-programme-footer"><span class="sx-programme-next">'+
     (pref?.powerbuilding?'COORDINATED TRAINING ACTIVE':'RECOVERY-AWARE SUPPORTING WORK')+'</span>'+
     '<button type="button" class="sx-programme-continue" data-pb-open>VIEW / CONFIGURE ›</button></div>';
  }
  function renderCompanion(){
    const api=window.SXAscensionCompanion;
    const cycle=api?.cycle?.();
    // Read-only; refreshes when the user opens Powerbuilding or saves a linked
    // workout. The decision layer never advances AscensionX weeks.
    window.SXDecisionPanels?.power?.('sxPBDecisionPanel');
    if(!cycle){companionCard.hidden=true;renderPowerCard();renderPowerHero(null,null);return}
    companionCard.hidden=false;
    const prefs=api.preference();
    renderPowerHero(cycle,prefs);
    const schedule=api.schedule(prefs.trainingDays);
    renderPowerCard();
    const currentWeeks=cycle.lifts.map(lift=>{
      const item=Object.entries(cycle.weeks).find(([key])=>api.canonical(key)===lift);
      return {lift,week:Math.max(1,Math.min(6,Number(item?.[1]||cycle.currentWeek)||1))};
    });
    companionCard.innerHTML='<div class="eyebrow">POWERBUILDING · TRAINING CONTROL</div>'+
      '<h2>Programme configuration</h2>'+
      '<p class="sx-bb-help">Designed around the compound lifts selected in your active AscensionX cycle. Primary lift loads, training maxes and AscensionX week completion are never changed.</p>'+
      '<div class="sx-pb-config"><label class="sx-bb-companion-toggle">'+
      '<input type="checkbox" id="sxBBPowerEnabled" '+(prefs.powerbuilding?'checked':'')+'>'+
      '<span><strong>ENABLE POWERBUILDING</strong><small>Coordinate the AscensionX main lifts with comprehensive accessory work</small></span></label>'+
      '<label>TRAINING DAYS PER WEEK<select id="sxBBPowerDays">'+
      [3,4,5].map(n=>'<option value="'+n+'" '+(prefs.trainingDays===n?'selected':'')+'>'+n+' days</option>').join('')+'</select></label></div>'+
      '<div class="sx-pb-schedule"><div class="eyebrow">SUGGESTED WEEKLY TRAINING SPLIT</div>'+
      (schedule.valid?schedule.slots.map((slot,i)=>'<div class="sx-pb-slot"><div><strong>'+esc(slot.day)+' · '+esc(slot.title)+'</strong>'+
        '<small>'+esc(slot.kind==='ascension'?
         'MAIN: '+slot.lift+' (AscensionX warm-ups and working sets) · '+
         (slot.exercises.length?'AFTER: '+slot.exercises.map(e=>e.sets+'× '+e.name).join(' · '):
          'No added accessory sets during peak/recovery'):
         slot.exercises.length?slot.exercises.map(e=>e.sets+'× '+e.name).join(' · '):
          'Reduced workload during peak/recovery')+'</small></div>'+
        (prefs.powerbuilding&&slot.kind==='support'&&slot.exercises.length?
          '<button type="button" class="sx-bb-secondary" data-pb-support="'+i+'">START</button>':'')+
        '</div>').join(''):
        '<p class="sx-bb-help sx-pb-warning">'+esc(schedule.message)+'</p>')+
      '<p class="sx-bb-help">Warm-up and ramp-up sets for the main lift are provided by AscensionX, not counted as accessory working sets here. This is scheduling guidance, not a recovery guarantee; adjust around fatigue and performance.</p></div>'+
      '<div class="sx-bb-companion-config"><label class="sx-bb-companion-toggle">'+
      '<input type="checkbox" id="sxBBCompanionEnabled" '+(prefs.enabled?'checked':'')+'>'+
      '<span><strong>ENABLE LINKED ACCESSORIES</strong><small>Load additional hypertrophy work only when importing an AscensionX compound lift</small></span></label>'+
      '<label>ACCESSORY VOLUME<select id="sxBBCompanionVolume">'+
      '<option value="balanced" '+(prefs.volume==='balanced'?'selected':'')+'>Balanced · conservative</option>'+
      '<option value="low" '+(prefs.volume==='low'?'selected':'')+'>Low · extra recovery</option></select></label></div>'+
      '<div class="sx-bb-companion-lifts">'+currentWeeks.map(({lift,week})=>{
        const enabled=!prefs.excluded.includes(lift);
        const planned=api.plan(lift,week,{volume:prefs.volume,powerbuilding:prefs.powerbuilding,lifts:cycle.lifts});
        const legacy=lift==='Bench Press'?'Existing AscensionX: Paused Bench Press':
          lift==='Deadlift'?'Existing AscensionX: Romanian Deadlift':'';
        return '<div class="sx-bb-companion-lift">'+
          '<label class="sx-bb-companion-lift-header"><input type="checkbox" data-bb-companion-lift="'+esc(lift)+'" '+(enabled?'checked':'')+'>'+
          '<span><strong>'+esc(lift)+'</strong><small>Week '+week+' of 6</small></span></label>'+
          (legacy?'<div class="sx-bb-companion-existing">'+esc(legacy)+' · Existing optional accessory, not duplicated</div>':'')+
          (planned.length?planned.map(ex=>'<div class="sx-bb-companion-ex"><strong>'+esc(ex.name)+'</strong><span>'+
            ex.sets+' × '+ex.min+'–'+ex.max+' · '+ex.rir+' RIR</span></div>').join(''):
            '<p class="sx-bb-help">Recovery week: no new companion exercises.</p>')+
          '</div>';
      }).join('')+'</div>'+
      '<p class="sx-bb-help sx-bb-companion-note">Week 1–3: steady controlled volume · Week 4: reduced volume · Week 5: one low-fatigue accessory per lift · Week 6: no new companion exercises. All companion sets start unchecked and never count toward AscensionX cycle completion. Reopen AscensionX Continue Training to load them.</p>';
  }
  companionCard.addEventListener('change',event=>{
    const api=window.SXAscensionCompanion;if(!api?.cycle?.())return;
    const target=event.target,prefs=api.preference();
    if(target.id==='sxBBPowerEnabled'){
      const proposed=api.schedule(prefs.trainingDays);
      if(target.checked&&!proposed.valid){target.checked=false;window.alert(proposed.message);return;}
      api.savePreference({powerbuilding:target.checked,enabled:target.checked?true:prefs.enabled});
    }
    else if(target.id==='sxBBPowerDays'){
      const proposed=api.schedule(Number(target.value));
      api.savePreference({trainingDays:Number(target.value)});
      if(!proposed.valid&&prefs.powerbuilding)api.savePreference({powerbuilding:false});
    }
    else if(target.id==='sxBBCompanionEnabled')api.savePreference({enabled:target.checked});
    else if(target.id==='sxBBCompanionVolume')api.savePreference({volume:target.value});
    else if(target.dataset.bbCompanionLift){
      const lift=target.dataset.bbCompanionLift;
      const excludes=new Set(prefs.excluded);
      if(target.checked)excludes.delete(lift);else excludes.add(lift);
      api.savePreference({excluded:[...excludes]});
    }else return;
    renderCompanion();
  });
  companionCard.addEventListener('click',event=>{
    const btn=event.target.closest('[data-pb-support]');
    if(!btn)return;
    const api=window.SXAscensionCompanion,pref=api?.preference?.(),plan=api?.schedule?.(pref.trainingDays);
    const slot=plan?.slots?.[Number(btn.dataset.pbSupport)];
    if(!pref?.enabled||!pref?.powerbuilding||!plan.valid||slot?.kind!=='support'||!slot.exercises.length)return;
    if(typeof window.SpartanXStartPowerbuildingSupportSession!=='function'){
      window.alert('Powerbuilding workout import is unavailable. Reload SpartanX.');return;
    }
    window.SpartanXStartPowerbuildingSupportSession({
      cycleId:pref.cycleId,week:plan.week,day:slot.day,name:slot.title,exercises:slot.exercises
    });
  });
  const favourites=['Bench Press','Incline Dumbbell Press','Chest-Supported Row','Lat Pulldown','Overhead Press','Lateral Raise',
    'Triceps Pushdown','Dumbbell Curl','Back Squat','Romanian Deadlift','Leg Press','Hack Squat','Leg Extension','Seated Leg Curl','Hip Thrust','Standing Calf Raise'];
  const library=()=>{
    let names=[];
    try{if(typeof exerciseNames!=='undefined'&&Array.isArray(exerciseNames))names=exerciseNames}catch(_){}
    return [...new Set(names.length?names:favourites)].filter(x=>!/(stairmaster|treadmill|rowing machine|bike$|cross trainer|skierg)/i.test(x));
  };
  function muscles(name){
    try{
      if(typeof exerciseMuscles==='function'){
        const p=exerciseMuscles(name)?.primary;
        if(p?.length)return typeof muscleNames==='function'?muscleNames(p):p.join(', ');
      }
    }catch(_){}
    return 'Not classified';
  }
  function current(){return store.programmes.find(p=>p.id===selectedId)||store.programmes.find(p=>p.id===store.activeId)||store.programmes[0]||null}
  function copy(x){return JSON.parse(JSON.stringify(x))}
  function showMessage(msg){$('sxBBNotice').textContent=msg;$('sxBBNotice').hidden=false}
  function trainingHistory(){
    try{
      const raw=localStorage.getItem('spartx_db');
      if(!raw||raw.length>12*1024*1024)return [];
      const db=JSON.parse(raw);
      return Array.isArray(db.sessions)?db.sessions:[];
    }catch(_){return []}
  }
  function currentProgress(program){return M.progress(program,trainingHistory())}
  function plannedDay(p,day,week){
    return E?.planDay?.(day,week,trainingHistory(),{programmeId:p.id,dayId:day.id})||day;
  }
  function continueTraining(dayId){
    const programme=current();if(!programme)return open();
    if(mode==='edit'){window.alert('Save or discard your programme changes before starting training.');return}
    const state=currentProgress(programme);
    if(state.finished){window.alert('All planned sessions are complete. Edit or create a new programme to continue.');return}
    const day=programme.sessions.find(item=>item.id===(dayId||state.dayId));
    if(!day)return;
    if(!window.SpartanXStartBodybuildingSession){
      window.alert('Workout import is not available. Reload SpartanX and try again.');return;
    }
    // The logger checks for an existing active workout and asks for explicit
    // confirmation before replacing the current screen with prescribed sets.
    window.SpartanXStartBodybuildingSession({
      link:{programmeId:programme.id,dayId:day.id,week:state.week},
      day
    });
  }
  function cardRender(){
    const active=store.programmes.find(p=>p.id===store.activeId)||store.programmes[0];
    const progress=active?currentProgress(active):null;
    const completed=progress?progress.completeCount:0;
    const count=progress?progress.plannedCount:0;
    const percent=count?Math.round(100*completed/count):0;
    const next=progress?.days.find(d=>d.dayId===progress.dayId);
    card.classList.remove('sx-programme-upcoming');
    card.setAttribute('aria-label','Strength and Bodybuilding programme builder');
    card.innerHTML='<div class="sx-programme-head"><div><div class="sx-programme-kicker">INDEPENDENT · 8-WEEK TRAINING</div>'+
      '<h3 class="sx-programme-title">Strength &amp; Bodybuilding</h3></div><span class="sx-programme-tag">'+
      (active?(progress.finished?'PROGRAMME COMPLETE':'PROGRAMME ACTIVE'):'READY TO BUILD')+'</span></div>'+
      '<p class="sx-programme-meta">'+(active?esc(active.name)+' · '+active.days+' days/week · '+active.weeks+' weeks':'Build a fully editable standalone strength and hypertrophy programme.')+'</p>'+
      (active?'<div class="sx-programme-progressline"><span>PROGRAMME PROGRESS</span><strong>'+percent+'%</strong></div>'+
      '<div class="sx-programme-progress" role="progressbar" aria-label="Bodybuilding programme completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div>':'')+
      '<div class="sx-programme-footer"><span class="sx-programme-next">'+
      (active?progress.finished?'ALL '+count+' SESSIONS COMPLETE': 'NEXT: Week '+progress.week+' · '+esc(next?.dayName||'Training'):
        '8-week, 4-day Upper/Lower starting template')+'</span>'+
      (active?'<button type="button" class="sx-programme-continue" id="sxBBContinue" '+(progress.finished?'disabled':'')+'>CONTINUE ›</button>':
        '<button type="button" class="sx-programme-continue" id="sxBBOpen">BUILD PROGRAMME ›</button>')+
      '</div>'+(active?'<button type="button" class="sx-bb-card-view" id="sxBBOpen">VIEW / MANAGE PROGRAMME</button>':'');
    $('sxBBOpen')?.addEventListener('click',open);
    $('sxBBContinue')?.addEventListener('click',()=>continueTraining());
  }
  function selectRender(){
    const el=$('sxBBSelect');el.replaceChildren();
    store.programmes.forEach(p=>{
      const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name+(p.id===store.activeId?' · Active':'');el.appendChild(opt);
    });
    $('sxBBLibrary').hidden=store.programmes.length===0;
    if(store.programmes.length){el.value=current()?.id||store.programmes[0].id;}
    $('sxBBLibraryMeta').textContent=store.programmes.length+' saved · Selecting a programme makes it active but never deletes other programmes or workouts.';
  }
  function open(){
    store=M.read();selectedId=store.activeId;
    mode=store.programmes.length?'view':'edit';draft=mode==='edit'?M.fresh({name:'8-Week Upper / Lower Bodybuilding'}):null;dirty=false;
    render();
    if(typeof window.spartanxNavigateScreen==='function')window.spartanxNavigateScreen('sxBodybuildingBuilder',{instant:true});
    else {document.querySelectorAll('.screen.active').forEach(el=>el.classList.remove('active'));screen.classList.add('active');}
    window.scrollTo(0,0);
  }
  function back(){
    if(mode==='edit'&&dirty&&!window.confirm('Discard unsaved programme changes?'))return;
    pickerClose();draft=null;dirty=false;
    if(typeof window.spartanxReturnToScreen==='function')window.spartanxReturnToScreen('workout');
    else if(typeof window.spartanxNavigateScreen==='function')window.spartanxNavigateScreen('workout',{back:true,instant:true});
    else {screen.classList.remove('active');document.getElementById('workout')?.classList.add('active');}
  }
  function newProgramme(){
    if(mode==='edit'&&dirty&&!window.confirm('Discard unsaved programme changes?'))return;
    if(store.programmes.length>=30)return window.alert('Maximum 30 programmes.');
    draft=M.fresh({name:'8-Week Upper / Lower Bodybuilding'});mode='edit';dirty=false;render();window.scrollTo(0,0);
  }
  function edit(){
    const p=current();if(!p)return newProgramme();
    draft=copy(p);mode='edit';dirty=false;render();window.scrollTo(0,0);
  }
  function discard(){
    if(dirty&&!window.confirm('Discard unsaved programme changes?'))return;
    draft=null;dirty=false;mode='view';if(!store.programmes.length)return back();render();
  }
  function statsHTML(p){
    const s=M.summary(p);
    return '<div><strong>'+s.sessions+'</strong><span>Sessions/wk</span></div>'+
      '<div><strong>'+s.exercises+'</strong><span>Exercises</span></div>'+
      '<div><strong>'+s.sets+'</strong><span>Sets/wk</span></div>';
  }
  function renderView(){
    const p=current(),host=$('sxBBView');
    if(!p){host.innerHTML='<div class="card">No saved programme. <button data-bb-action="new">CREATE PROGRAMME</button></div>';return}
    const progress=currentProgress(p);
    const finished=progress.finished,completed=progress.completeCount,planned=progress.plannedCount;
    const donePercent=planned?Math.round(100*completed/planned):0;
    host.innerHTML='<article class="card sx-bb-view-hero"><div class="eyebrow">'+(p.kind==='hybrid'?'STRENGTH & SIZE':'BODYBUILDING')+' · DOUBLE PROGRESSION</div>'+
      '<h2>'+esc(p.name)+'</h2><p class="sx-bb-help">'+p.days+' training days/week · '+p.weeks+' weeks · '+esc(p.priority)+' emphasis · '+esc(p.experience)+'</p>'+
      '<div class="sx-bb-stats">'+statsHTML(p)+'</div>'+
      '<div class="sx-bb-programme-status"><div><span>PROGRAMME PROGRESS</span><strong>'+completed+' / '+planned+' complete</strong></div>'+
      '<div class="sx-bb-status-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+donePercent+'"><i style="width:'+donePercent+'%"></i></div>'+
      '<p class="sx-bb-help">'+(finished?'Programme complete. All scheduled training days logged.':
        'CURRENT WEEK '+progress.week+' OF '+p.weeks+' · Completed sets are checked against the programmed targets.')+'</p></div>'+
      '<div class="sx-bb-actions">'+
      '<button type="button" class="sx-bb-secondary sx-bb-delete" data-bb-action="delete">DELETE PROGRAMME</button>'+
      '<button type="button" class="sx-bb-secondary" data-bb-action="edit">EDIT PROGRAMME</button></div>'+
      '<button type="button" class="sx-bb-primary sx-bb-full" data-bb-action="start" '+(finished?'disabled':'')+'>'+
      (finished?'PROGRAMME COMPLETE':'CONTINUE TRAINING · WEEK '+progress.week)+'</button></article>'+
      '<div class="sx-bb-sectionhead"><div class="eyebrow">YOUR TRAINING WEEK</div><h2>Programme sessions</h2>'+
      '<p>Open a training day to review the exercises. Start a session to load its planned sets into SpartanX.</p></div>'+
      '<div class="sx-bb-days">'+p.sessions.map((day,i)=>{
        const status=progress.days.find(item=>item.dayId===day.id);
        const complete=!!status?.complete,logged=!!status?.logged;
        return '<details class="card sx-bb-day" '+(i===0?'open':'')+'><summary><div><span class="sx-bb-day-index">DAY '+(i+1)+'</span>'+
          '<strong>'+esc(day.name)+'</strong></div><span class="sx-bb-day-state '+(complete?'is-done':'')+'">'+
          (complete?'✓ COMPLETE':logged?'PARTIAL LOG':'PLANNED')+'</span></summary>'+
          '<div class="sx-bb-day-body">'+plannedDay(p,day,progress.week).exercises.map(e=>
            '<div class="sx-bb-preview-ex"><strong>'+esc(e.name)+'</strong><span>'+e.sets+' × '+e.repsMin+'–'+e.repsMax+
            ' reps · '+e.rir+' RIR · RPE '+(e.targetRpe||10-e.rir)+
            (e.startingKg>0?' · '+e.startingKg+' kg':'')+'</span>'+
            (e.recommendation?'<small>'+esc(e.recommendation.reason)+'</small>':'')+
            '</div>').join('')+
            (!finished?'<button type="button" class="sx-bb-secondary sx-bb-full sx-bb-day-start" data-bb-action="start" data-day-id="'+esc(day.id)+'">'+
            (complete?'REPEAT THIS DAY':'START '+esc(day.name).toUpperCase())+' · WEEK '+progress.week+'</button>':'')+'</div></details>';
      }).join('')+'</div>'+
      '<article class="card sx-bb-info"><div class="eyebrow">SPARTANX WORKOUT INTEGRATION</div>'+
      '<p>Continue Training loads planned exercises and unchecked working sets into the normal SpartanX logger. Programme completion is calculated from saved working sets, not merely from starting a workout. Future loads are calculated from your previous completed sets, rep targets and recorded RPE. Week 5 automatically reduces training volume; planned sets remain adjustable.</p></article>';
    const hero=host.querySelector('.sx-bb-view-hero');
    if(hero){
      hero.insertAdjacentHTML('afterend','<section id="sxBBDecisionPanel" aria-label="Spartan Intelligence bodybuilding programme decisions"></section>');
      window.SXDecisionPanels?.body?.('sxBBDecisionPanel');
    }
  }
  function input(label,key,value,day,ex,min,max,step){
    return '<label>'+label+'<input type="number" inputmode="decimal" data-bb-ex-field="'+key+'" data-day="'+day+
      '" data-ex="'+ex+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(value)+'"></label>';
  }
  function renderEdit(){
    const p=draft;if(!p)return;
    $('sxBBName').value=p.name;$('sxBBKind').value=p.kind;
    $('sxBBExperience').value=p.experience;$('sxBBDays').value=String(p.days);
    $('sxBBWeeks').value=String(p.weeks);$('sxBBPriority').value=p.priority;
    $('sxBBDraftStats').innerHTML=statsHTML(p);
    $('sxBBBalanceLegs').hidden=![4,5,6].includes(Number(p.days));
    const muscle=E?.coverage?.(p);
    $('sxBBMuscleCoverage').textContent=muscle?
      (muscle.missing.length?'MUSCLE COVERAGE TO REVIEW: '+muscle.missing.join(', ')+'. Add appropriate exercises before saving.':
       'MUSCLE COVERAGE: Chest, back, shoulders, quads, hamstrings, glutes, calves, biceps, triceps and core represented.'):
      '';
    $('sxBBEditorDays').innerHTML=p.sessions.map((day,i)=>
      '<article class="card sx-bb-day sx-bb-edit-day"><div class="sx-bb-day-heading">'+
        '<span class="sx-bb-day-index">DAY '+(i+1)+'</span><input maxlength="65" data-bb-day-name="'+i+'" aria-label="Day '+(i+1)+' name" value="'+esc(day.name)+'">'+
        '<span class="sx-bb-day-count">'+day.exercises.length+' EXERCISES · '+
          day.exercises.reduce((total,ex)=>total+Number(ex.sets||0),0)+' SETS</span></div>'+
        '<div class="sx-bb-day-body">'+day.exercises.map((ex,j)=>
          '<div class="sx-bb-exercise"><div class="sx-bb-ex-top"><div><strong>'+esc(ex.name)+'</strong><small>PRIMARY: '+esc(muscles(ex.name))+'</small></div>'+
          '<div class="sx-bb-ex-actions">'+
          '<button type="button" data-bb-action="up" data-day="'+i+'" data-ex="'+j+'" aria-label="Move up" '+(j===0?'disabled':'')+'>↑</button>'+
          '<button type="button" data-bb-action="down" data-day="'+i+'" data-ex="'+j+'" aria-label="Move down" '+(j===day.exercises.length-1?'disabled':'')+'>↓</button>'+
          '<button type="button" class="sx-bb-remove" data-bb-action="remove" data-day="'+i+'" data-ex="'+j+'" aria-label="Remove exercise">×</button></div></div>'+
          '<div class="sx-bb-ex-fields">'+
          input('SETS','sets',ex.sets,i,j,1,8,1)+
          input('MIN REPS','repsMin',ex.repsMin,i,j,1,40,1)+
          input('MAX REPS','repsMax',ex.repsMax,i,j,1,50,1)+
          input('TARGET RIR','rir',ex.rir,i,j,0,5,1)+
          input('START KG','startingKg',ex.startingKg,i,j,0,1000,0.5)+
          input('REST SEC','restSeconds',ex.restSeconds,i,j,30,600,15)+
          '</div></div>').join('')+
        '<button type="button" class="sx-bb-add" data-bb-action="add" data-day="'+i+'" '+(day.exercises.length>=20?'disabled':'')+'>＋ ADD EXERCISE</button></div></article>').join('');
  }
  function render(){
    selectRender();$('sxBBView').hidden=mode==='edit';$('sxBBEdit').hidden=mode!=='edit';
    $('sxBBModePill').textContent=mode==='edit'?'EDIT PROGRAMME':'PROGRAMME OVERVIEW';
    $('sxBBNotice').hidden=true;
    if(mode==='edit')renderEdit();else renderView();
    cardRender();renderCompanion();
  }
  function save(){
    if(!draft)return;
    if(!draft.name.trim())return window.alert('Enter a programme name.');
    if(draft.sessions.some(day=>!day.exercises.length))return window.alert('Each training day must include an exercise.');
    if(draft.sessions.some(day=>day.exercises.some(e=>!Number.isFinite(+e.repsMin)||!Number.isFinite(+e.repsMax)||+e.repsMin>+e.repsMax))){
      return window.alert('Maximum reps must be greater than or equal to minimum reps.');
    }
    try{
      store=M.save(store,draft);selectedId=store.activeId;draft=null;dirty=false;mode='view';render();
      $('sxBBNotice').textContent='Programme saved. Workout history and AscensionX are untouched.';$('sxBBNotice').hidden=false;
      window.scrollTo(0,0);
    }catch(e){window.alert(e.message||'Unable to save programme.')}
  }
  function removeProgramme(){
    const p=current();if(!p||!window.confirm('Delete "'+p.name+'"? Only its planned programme will be deleted, never workout records.'))return;
    store=M.remove(store,p.id);selectedId=store.activeId;mode=store.programmes.length?'view':'edit';
    draft=store.programmes.length?null:M.fresh();dirty=false;render();
    $('sxBBNotice').textContent='Programme deleted. Completed workouts remain saved.';$('sxBBNotice').hidden=false;
  }
  function pickerOpen(i){
    if(!draft?.sessions[i]||draft.sessions[i].exercises.length>=20)return;
    pickerDay=i;$('sxBBPicker').hidden=false;$('sxBBSearch').value='';
    $('sxBBPickerTitle').textContent='Add exercise · '+draft.sessions[i].name;
    pickerRender();$('sxBBSearch').focus();
  }
  function pickerClose(){pickerDay=null;$('sxBBPicker').hidden=true;}
  function pickerRender(){
    const q=$('sxBBSearch').value.trim().toLowerCase();
    let names=library();
    names=q?names.filter(n=>n.toLowerCase().includes(q)||muscles(n).toLowerCase().includes(q)):favourites.filter(n=>names.includes(n));
    names=names.slice(0,45);
    $('sxBBPickerList').innerHTML=names.length?names.map(n=>
      '<button type="button" data-bb-action="pick" data-exercise-name="'+esc(n)+'"><strong>'+esc(n)+'</strong><span>'+esc(muscles(n))+'</span></button>').join(''):
      '<p class="sx-bb-help">No exercises found. Try another name or muscle group.</p>';
  }
  function pickerChoose(name){
    if(!draft||pickerDay===null||!library().includes(name))return;
    draft.sessions[pickerDay].exercises.push(M.exercise({name,sets:3,repsMin:8,repsMax:12,rir:2,restSeconds:120,startingKg:0}));
    dirty=true;pickerClose();renderEdit();
  }
  screen.addEventListener('click',e=>{
    const el=e.target.closest('[data-bb-action]');if(!el||el.disabled)return;
    const action=el.dataset.bbAction,day=Number(el.dataset.day),idx=Number(el.dataset.ex);
    if(action==='back')return back();
    if(action==='new')return newProgramme();
    if(action==='edit')return edit();
    if(action==='discard')return discard();
    if(action==='save')return save();
    if(action==='start')return continueTraining(el.dataset.dayId||undefined);
    if(action==='delete')return removeProgramme();
    if(action==='close-picker')return pickerClose();
    if(action==='add')return pickerOpen(day);
    if(action==='pick')return pickerChoose(el.dataset.exerciseName);
    if(action==='rebuild'){
      if(!draft||!window.confirm('Replace ALL training days with the current balanced templates? Any unsaved exercise edits will be lost.'))return;
      draft.sessions=M.buildDays(draft.days,draft.priority);dirty=true;renderEdit();return;
    }
    if(action==='balance-legs'){
      if(!draft||![4,5,6].includes(Number(draft.days)))return;
      if(!window.confirm('Replace only Lower / Legs training days with the lighter, balanced defaults? Upper days and completed workouts remain untouched. Review the exercises, then Save Programme to apply.'))return;
      draft=M.rebalanceLegDays(draft);dirty=true;renderEdit();return;
    }
    const list=draft?.sessions?.[day]?.exercises;
    if(!list||!Number.isInteger(idx)||idx<0||idx>=list.length)return;
    if(action==='remove'){
      if(list.length<=1)return window.alert('Each training day needs at least one exercise.');
      list.splice(idx,1);dirty=true;renderEdit();return;
    }
    if(action==='up'&&idx>0){[list[idx-1],list[idx]]=[list[idx],list[idx-1]];dirty=true;renderEdit()}
    if(action==='down'&&idx<list.length-1){[list[idx+1],list[idx]]=[list[idx],list[idx+1]];dirty=true;renderEdit()}
  });
  screen.addEventListener('input',e=>{
    const el=e.target;if(el.id==='sxBBSearch')return pickerRender();
    if(!draft)return;
    if(el.dataset.bbField==='name'){draft.name=el.value;dirty=true;return}
    if(el.dataset.bbDayName!==undefined&&draft.sessions[+el.dataset.bbDayName]){
      draft.sessions[+el.dataset.bbDayName].name=el.value;dirty=true;return;
    }
    if(el.dataset.bbExField){
      const ex=draft.sessions[+el.dataset.day]?.exercises[+el.dataset.ex];
      if(ex){ex[el.dataset.bbExField]=Number(el.value);dirty=true}
    }
  });
  screen.addEventListener('change',e=>{
    const el=e.target;
    if(el.id==='sxBBSelect'){
      if(mode==='edit'&&dirty&&!window.confirm('Discard your unsaved edits?')){el.value=current()?.id||'';return}
      store=M.activate(store,el.value);selectedId=store.activeId;draft=null;mode='view';dirty=false;render();return;
    }
    if(!draft)return;
    const field=el.dataset.bbField;
    if(!field||field==='name')return;
    if(field==='days'){
      const days=Number(el.value);
      if(days===draft.days)return;
      if(!window.confirm('Change to '+days+' training days? This rebuilds the current exercise split.')){
        el.value=String(draft.days);return;
      }
      draft.days=days;draft.sessions=M.buildDays(days,draft.priority);dirty=true;renderEdit();return;
    }
    draft[field]=field==='weeks'?Number(el.value):el.value;
    dirty=true;renderEdit();
  });
  $('sxBBPicker').addEventListener('click',e=>{if(e.target===$('sxBBPicker'))pickerClose()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sxBBPicker').hidden){e.preventDefault();pickerClose()}});
  window.addEventListener('storage',e=>{
    if(e.key!=='spartx_db'&&e.key!==M.KEY)return;
    if(mode==='edit'&&dirty)return;
    store=M.read();selectedId=store.activeId;
    if(screen.classList.contains('active'))render();else cardRender();
  });
  window.addEventListener('storage',e=>{
    if(e.key==='ascensionx_strength_v1'||e.key==='sx_ascension_companion_v1')renderCompanion();
  });
  window.addEventListener('spartx:ascensionLinkedSessionSaved',renderCompanion);
  window.addEventListener('spartx:bodybuildingSessionSaved',()=>{
    store=M.read();selectedId=store.activeId;
    if(screen.classList.contains('active')&&mode!=='edit')render();else cardRender();
  });
  window.SXBodybuildingProgrammes=Object.freeze({open,openPowerbuilding,refresh:()=>{store=M.read();selectedId=store.activeId;cardRender();renderCompanion()},storageKey:M.KEY});
  cardRender();
  renderCompanion();
  // Intelligence links open the relevant distinct programme dashboard.
  const launch=new URLSearchParams(window.location.search).get('sxOpen');
  if(launch==='bodybuilding'||launch==='powerbuilding'){
    requestAnimationFrame(()=>{
      if(launch==='powerbuilding')openPowerbuilding();
      else open();
    });
  }
})();