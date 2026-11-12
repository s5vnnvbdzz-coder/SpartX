/* AscensionX Adaptive Programming v1
 * Six-week, cycle-scoped supporting programme. Main lift prescriptions are never changed.
 * Deterministic training-dose heuristics, not medical recovery predictions.
 */
(function(global){
 'use strict';
 const KEY='sx_ascension_adaptive_v1',CYCLE_KEY='ascensionx_strength_v1';
 const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const DAYS={3:['MON','WED','SAT'],4:['MON','TUE','THU','SAT'],5:['MON','TUE','THU','SAT','SUN']};
 const LIB={
  'Back Squat':[
   {name:'Leg Extension',sets:2,min:10,max:15,rir:3,rest:90,muscles:'quadriceps',cost:1},
   {name:'Seated Leg Curl',sets:2,min:10,max:15,rir:3,rest:90,muscles:'hamstrings',cost:1},
   {name:'Standing Calf Raise',sets:2,min:10,max:20,rir:3,rest:75,muscles:'calves',cost:1},
   {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75,muscles:'trunk',cost:1}
  ],
  'Bench Press':[
   {name:'Chest-Supported Row',sets:3,min:8,max:12,rir:3,rest:120,muscles:'upper back',cost:1},
   {name:'Triceps Pushdown',sets:2,min:10,max:15,rir:3,rest:75,muscles:'triceps',cost:1},
   {name:'Rear Delt Fly',sets:2,min:12,max:20,rir:3,rest:75,muscles:'shoulder stabilisers',cost:1},
   {name:'Lat Pulldown',sets:2,min:8,max:12,rir:3,rest:105,muscles:'lats',cost:1}
  ],
  'Deadlift':[
   {name:'Lat Pulldown',sets:2,min:8,max:12,rir:3,rest:105,muscles:'lats',cost:1},
   {name:'Seated Leg Curl',sets:2,min:10,max:15,rir:3,rest:90,muscles:'hamstrings',cost:1},
   {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75,muscles:'trunk',cost:1},
   {name:'Seated Calf Raise',sets:2,min:12,max:20,rir:3,rest:75,muscles:'calves',cost:1}
  ],
  'Overhead Press':[
   {name:'Dumbbell Row',sets:2,min:8,max:12,rir:3,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:2,min:12,max:20,rir:3,rest:75,muscles:'delts',cost:1},
   {name:'Triceps Pushdown',sets:2,min:10,max:15,rir:3,rest:75,muscles:'triceps',cost:1},
   {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1}
  ]
 };
 const FOURTH={
  strength:[
   {name:'Paused Bench Press',sets:2,min:5,max:7,rir:3,rest:150,muscles:'bench technique',cost:2},
   {name:'Chest-Supported Row',sets:2,min:8,max:12,rir:3,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:2,min:12,max:20,rir:3,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1}
  ],
  balanced:[
   {name:'Machine Chest Press',sets:2,min:8,max:12,rir:2,rest:105,muscles:'chest',cost:1},
   {name:'Chest-Supported Row',sets:3,min:8,max:12,rir:2,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:2,min:12,max:20,rir:2,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:2,rest:75,muscles:'biceps',cost:1}
  ],
  hypertrophy:[
   {name:'Machine Chest Press',sets:3,min:8,max:12,rir:2,rest:105,muscles:'chest',cost:1},
   {name:'Seated Cable Row',sets:3,min:10,max:15,rir:2,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:3,min:12,max:20,rir:2,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:2,rest:75,muscles:'biceps',cost:1}
  ]
 };
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function activeCycle(storage=global.localStorage){
  try{
   const x=JSON.parse(storage.getItem(CYCLE_KEY)||'null'),c=x?.cycle;
   if(!c||typeof c.created!=='string'||!Number.isFinite(Date.parse(c.created)))return null;
   const lifts=(Array.isArray(c.exercises)?c.exercises:[]).filter(l=>LIFTS.includes(l));
   return lifts.length?{id:c.created,lifts,weeks:c.weeks||{},currentWeek:c.currentWeek||1,logs:x.logs||[]}:null;
  }catch(_){return null}
 }
 function read(id,storage=global.localStorage){
  const initial={cycleId:id||null,enabled:false,focus:'strength',days:4};
  if(!id)return initial;
  try{
   const raw=storage.getItem(KEY);
   if(!raw||raw.length>30000)return initial;
   const p=JSON.parse(raw)?.[id]||{};
   return {cycleId:id,enabled:p.enabled===true,
    focus:['strength','balanced','hypertrophy'].includes(p.focus)?p.focus:'strength',
    days:[3,4,5].includes(Number(p.days))?Number(p.days):4};
  }catch(_){return initial}
 }
 function enabled(id,storage=global.localStorage){
  const c=id||activeCycle(storage)?.id;
  return !!c&&read(c,storage).enabled;
 }
 function save(update,storage=global.localStorage){
  const c=activeCycle(storage);if(!c)return null;
  let all={};
  try{const raw=storage.getItem(KEY);if(raw&&raw.length<30000){const x=JSON.parse(raw);if(x&&typeof x==='object'&&!Array.isArray(x))all=x}}catch(_){}
  const old=read(c.id,storage);
  all[c.id]={enabled:update.enabled===undefined?old.enabled:update.enabled===true,
   focus:['strength','balanced','hypertrophy'].includes(update.focus)?update.focus:old.focus,
   days:[3,4,5].includes(Number(update.days))?Number(update.days):old.days};
  const keys=Object.keys(all);while(keys.length>25)delete all[keys.shift()];
  storage.setItem(KEY,JSON.stringify(all));
  return read(c.id,storage);
 }
 function lastLinked(name,cycleId,week,storage=global.localStorage){
  try{
   const raw=storage.getItem('spartx_db');
   if(!raw||raw.length>8000000)return null;
   const sessions=JSON.parse(raw)?.sessions;
   if(!Array.isArray(sessions))return null;
   const found=[];
   for(const session of sessions.slice(-500)){
    for(const ex of Array.isArray(session.exercises)?session.exercises:[]){
     const link=ex.sxStrengthSizeCompanion||ex.sxPowerbuildingSupport;
     if(link?.cycleId!==cycleId||!(Number(link.week)<week)||norm(ex.name)!==norm(name))continue;
     const sets=(ex.sets||[]).filter(s=>s.done===true&&s.type!=='Warm-up'&&Number(s.weight)>0&&Number(s.reps)>0);
     if(sets.length)found.push({when:Date.parse(session.date)||0,sets,week:Number(link.week)});
    }
   }
   found.sort((a,b)=>a.week-b.week||a.when-b.when);
   return found[found.length-1]||null;
  }catch(_){return null}
 }
 function recommend(ex,cycleId,week,storage){
  const old=lastLinked(ex.name,cycleId,week,storage);
  if(!old)return {targetReps:ex.min,suggestedKg:null,reason:'Establish a comfortable load at the prescribed RIR.'};
  const weights=old.sets.map(s=>Number(s.weight));
  const sameLoad=weights.every(w=>Math.abs(w-weights[0])<0.01);
  const repMin=Math.min(...old.sets.map(s=>Number(s.reps)));
  const hasRpe=old.sets.every(s=>s.rpe!==''&&s.rpe!==null&&Number.isFinite(Number(s.rpe))&&Number(s.rpe)>=1&&Number(s.rpe)<=10);
  const easy=hasRpe&&old.sets.every(s=>Number(s.rpe)<=10-ex.rir+.5);
  const hard=hasRpe&&old.sets.every(s=>Number(s.rpe)>=9.5);
  const kg=sameLoad?weights[0]:null;
  if(kg!==null&&repMin>=ex.max&&easy){
   const increase=kg>=50?2.5:kg>=20?1.25:0.5;
   return {targetReps:ex.min,suggestedKg:Math.round((kg+increase)*4)/4,
    reason:'All logged sets reached the top of the rep range at controlled RPE; suggest a small load increase.'};
  }
  if(hard)return {targetReps:ex.min,suggestedKg:kg,
   reason:'Previous sets were very demanding; hold load and leave repetitions in reserve.'};
  return {targetReps:clamp(repMin+1,ex.min,ex.max),suggestedKg:kg,
   reason:'Retain load and progress repetitions before increasing weight.'};
 }
 function dose(item,week,focus,main,cycleId,storage){
  const factor=[0,1,1,1,.75,.45,0][week]||0;
  const added=focus==='hypertrophy'&&main!=='Deadlift'?1:0;
  let sets=Math.round((item.sets+added)*factor);
  if(week===5)sets=Math.min(sets,1);
  if(week===6)sets=0;
  if(main==='Deadlift')sets=Math.min(sets,week>=4?1:2);
  if(sets<1)return null;
  const rir=clamp(item.rir+(week>=4?1:0)+(focus==='strength'?1:0),2,5);
  const ex={...item,sets,rir,sourceLift:main,week};
  const rec=recommend(ex,cycleId,week,storage);
  return {...ex,...rec,reason:rec.reason+' Supports '+item.muscles+' without additional heavy spinal loading.'};
 }
 function plan(lift,week,opts={},storage=global.localStorage){
  const c=activeCycle(storage),w=Number(week);
  if(!c||!c.lifts.includes(lift)||!Number.isInteger(w)||w<1||w>6)return [];
  const prefs=read(c.id,storage),focus=prefs.focus,main=lift;
  if(!prefs.enabled)return [];
  const candidates=LIB[main]||[];
  const cap=main==='Deadlift'?4:focus==='strength'?7:9;
  let count=0;
  const selected=[];
  for(const item of candidates){
   const ex=dose(item,w,focus,main,c.id,storage);
   if(!ex||count+ex.sets>cap)continue;
   // Avoid repetitive isolated work when most energy should be reserved for the main lift.
   if(main==='Deadlift'&&selected.length>=2&&w>=3)break;
   selected.push(ex);count+=ex.sets;
  }
  return selected;
 }
 function weekFor(c,lift){return clamp(Number(c.weeks?.[lift]||c.currentWeek||1),1,6)}
 function schedule(cycleArg,storage=global.localStorage){
  const c=cycleArg||activeCycle(storage);
  if(!c)return {valid:false,message:'No active AscensionX cycle.',slots:[]};
  const prefs=read(c.id,storage),count=prefs.days;
  if(count<c.lifts.length)return {valid:false,message:'Choose at least as many days as selected compound lifts.',slots:[]};
  const week=Math.max(...c.lifts.map(l=>weekFor(c,l)));
  const slots=DAYS[count].map((day,index)=>{
   const lift=c.lifts[index];
   if(lift)return {day,kind:'ascension',lift,week:weekFor(c,lift),
    title:lift+' · AscensionX · Week '+weekFor(c,lift),exercises:plan(lift,weekFor(c,lift),{},storage)};
   const supportIndex=index-c.lifts.length;
   const base=(FOURTH[prefs.focus]||FOURTH.strength);
   const isFourth=!(supportIndex>0);
   let exercises=[];
   if(week<6){
    exercises=base.map(item=>dose(item,week,prefs.focus,'Support',c.id,storage)).filter(Boolean);
    if(!isFourth)exercises=exercises.filter(item=>/calf|curl|pallof|delt/i.test(item.name));
   }
   return {day,kind:'support',title:isFourth?'Day '+(index+1)+' · Supporting strength & size':'Day '+(index+1)+' · Low-fatigue support',
    week,lift:null,exercises};
  });
  return {valid:true,message:'Suggested layout, not guaranteed recovery. Main sets stay owned by AscensionX; reschedule around sleep, soreness and performance.',week,slots};
 }
 // A new cycle has no stable ID yet: keep the builder's choices in memory
 // and commit them ONLY after the athlete confirms creating that cycle.
 const DEFAULT_DRAFT=()=>({enabled:false,focus:'strength',days:4});
 let draft=DEFAULT_DRAFT();
 function selectedDraftLifts(){
  if(!global.document)return [];
  return [...global.document.querySelectorAll('#cycleExerciseOptions input[type="checkbox"]:checked')]
   .map(input=>input.value).filter(lift=>LIFTS.includes(lift));
 }
 function previewEnabled(){
  const active=activeCycle();
  return active?read(active.id).enabled:draft.enabled;
 }
 function beginEditor(){
  if(!activeCycle())draft=DEFAULT_DRAFT();
  refreshEditor();
 }
 function discardDraft(){
  if(!activeCycle())draft=DEFAULT_DRAFT();
 }
 function commitDraft(){
  const current=activeCycle();
  if(!current||!draft.enabled)return null;
  const configured={...draft};
  draft=DEFAULT_DRAFT();
  return save(configured);
 }
 function refreshEditor(){
  const card=global.document?.getElementById('sxAscAdaptiveCard');
  if(card&&typeof card.sxRender==='function')card.sxRender();
 }
 function mountEditor(){
  if(!global.document)return;
  const anchor=document.getElementById('cycleAccessorySettings');
  if(!anchor||document.getElementById('sxAscAdaptiveCard'))return;
  const card=document.createElement('section');
  card.id='sxAscAdaptiveCard';card.className='card sx-cycle-setup-section';
  card.setAttribute('aria-label','Adaptive Programming settings');
  card.innerHTML=[
   '<div class="sx-adaptive-head">',
    '<div><div class="eyebrow">03 · INTELLIGENT ASSISTANCE</div><h3>Adaptive Programming</h3></div>',
    '<label class="sx-adaptive-switch" for="sxAscAdaptiveEnabled">',
     '<input id="sxAscAdaptiveEnabled" type="checkbox" role="switch">',
     '<span class="sx-adaptive-track" aria-hidden="true"></span>',
     '<span class="sx-adaptive-state" id="sxAscAdaptiveToggleLabel">OFF</span>',
    '</label>',
   '</div>',
   '<p class="sx-adaptive-intro">Build complete training days around your AscensionX lifts. Supporting exercises are selected to develop weak points and muscle size without unnecessary heavy overlap.</p>',
   '<div id="sxAscAdaptiveOptions" hidden>',
    '<div class="sx-adaptive-fields">',
     '<div class="field"><label for="sxAscAdaptiveFocus">TRAINING PRIORITY</label><select id="sxAscAdaptiveFocus">',
      '<option value="strength">Maximum Compound Strength · Powerlifting</option>',
      '<option value="balanced">Balanced Powerbuilding · Strength + Size</option>',
      '<option value="hypertrophy">Hypertrophy + Strength · Size First</option>',
     '</select></div>',
     '<div class="field"><label for="sxAscAdaptiveDays">DAYS PER WEEK</label><select id="sxAscAdaptiveDays">',
      '<option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option>',
     '</select></div>',
    '</div>',
    '<p class="sx-adaptive-rule">Main-lift loading remains unchanged. Accessory volume reduces during heavy weeks, with no additional work on Week 6.</p>',
    '<details id="sxAscAdaptivePlanDetails" class="sx-adaptive-details">',
     '<summary>Preview your training days <span aria-hidden="true">⌄</span></summary>',
     '<div id="sxAscAdaptivePreview" class="sx-adaptive-preview"></div>',
    '</details>',
   '</div>',
   '<p id="sxAscAdaptiveStatus" class="sx-adaptive-status" role="status" aria-live="polite"></p>'
  ].join('');
  anchor.insertAdjacentElement('beforebegin',card);
  function render(){
   const current=activeCycle(), selected=selectedDraftLifts();
   const pref=current?read(current.id):draft;
   const enabledBox=document.getElementById('sxAscAdaptiveEnabled');
   const requiredDays=Math.max(3,Math.min(5,selected.length));
   const daysPicker=document.getElementById('sxAscAdaptiveDays');
   enabledBox.checked=pref.enabled;
   document.getElementById('sxAscAdaptiveToggleLabel').textContent=pref.enabled?'ON':'OFF';
   document.getElementById('sxAscAdaptiveFocus').value=pref.focus;
   [...daysPicker.options].forEach(option=>{option.disabled=Number(option.value)<selected.length});
   // Selecting an extra main lift never corrupts an existing saved programme.
   // Temporarily preview a valid layout; persist changes only on a user action.
   const previewDays=Math.max(requiredDays,pref.days);
   daysPicker.value=String(previewDays);
   document.getElementById('sxAscAdaptiveOptions').hidden=!pref.enabled;
   const status=document.getElementById('sxAscAdaptiveStatus');
   const preview=document.getElementById('sxAscAdaptivePreview');
   if(typeof global.syncCycleAccessoryEditor==='function')global.syncCycleAccessoryEditor();
   if(!pref.enabled){
    status.textContent='OFF · Manual assistance options remain available below.';
    preview.replaceChildren();return;
   }
   const waiting=!current;
   const incompatible=previewDays!==pref.days;
   status.textContent=waiting?'Settings will be saved when you create this cycle.':
     incompatible?'Select '+previewDays+' training days for '+selected.length+' primary lifts.':
     'Enabled for this cycle · changes to these controls save automatically.';
   preview.replaceChildren();
   const note=document.createElement('p');
   note.className='sx-adaptive-preview-note';
   note.textContent=waiting?'Illustrative Week 1 preview · prescriptions become cycle-specific after creation.':
    'Preview reflects your saved main-lift weeks; supporting sets do not advance AscensionX progression.';
   preview.appendChild(note);
   const days=DAYS[previewDays]||DAYS[4];
   const lastWeek=current?Math.max(1,...selected.map(lift=>
    clamp(Number(current.weeks?.[lift]||current.currentWeek||1),1,6))):1;
   for(const [index,day] of days.entries()){
    const lift=selected[index]||null,week=lift&&current?
     clamp(Number(current.weeks?.[lift]||current.currentWeek||1),1,6):lastWeek;
    const box=document.createElement('div');
    box.className='sx-adaptive-preview-day';
    const heading=document.createElement('strong');
    heading.textContent=day+' · '+(lift?lift+' · Week '+week:'Low-fatigue support');
    box.appendChild(heading);
    let exercises=[];
    if(lift){
     if(current&&current.lifts.includes(lift)&&pref.enabled&&!incompatible&&
      selected.length===current.lifts.length&&selected.every(l=>current.lifts.includes(l)))
      exercises=plan(lift,week);
     else if(week<6)exercises=(LIB[lift]||[]).slice(0,lift==='Deadlift'?2:3);
    }else if(lastWeek<6){
     exercises=(FOURTH[pref.focus]||FOURTH.strength).slice(0,index===selected.length?3:2);
    }
    const details=document.createElement('div');
    details.textContent=exercises.length?
     exercises.map(ex=>ex.name+' · '+ex.sets+' × '+ex.min+'–'+ex.max).join(' · '):
     'No additional assistance prescribed';
    box.appendChild(details);preview.appendChild(box);
   }
   const recovery=document.createElement('p');
   recovery.className='sx-adaptive-preview-note';
   recovery.textContent='Heavy Romanian deadlifts are not automatically stacked after heavy deadlifts while this option is on.';
   preview.appendChild(recovery);
  }
  card.sxRender=render;
  card.addEventListener('change',event=>{
   const id=event.target.id,current=activeCycle();
   const update=id==='sxAscAdaptiveEnabled'?{enabled:event.target.checked}:
     id==='sxAscAdaptiveFocus'?{focus:event.target.value}:
     id==='sxAscAdaptiveDays'?{days:Number(event.target.value)}:null;
   if(!update)return;
   if(id==='sxAscAdaptiveDays'&&Number(event.target.value)<selectedDraftLifts().length){render();return}
   if(current){
    try{save(update)}catch(_){
     const status=document.getElementById('sxAscAdaptiveStatus');
     status.textContent='Could not save the setting. Try again.';return;
    }
   }else draft={...draft,...update};
   render();
   if(typeof global.renderCycleLoads==='function')global.renderCycleLoads();
  });
  const dialog=document.getElementById('cycleEditorBackdrop');
  if(dialog&&typeof MutationObserver==='function')
   new MutationObserver(()=>{if(dialog.classList.contains('open'))render()})
    .observe(dialog,{attributes:true,attributeFilter:['class']});
  render();
 }
 // Verified same-origin message from the embedded AscensionX Continue Training dialog.
 // Only the host can create the support workout; no historical workout is ever modified.
 global.addEventListener('message',event=>{
  if(event?.data?.type!=='spartx:ascensionAdaptiveSupport')return;
  const frame=global.document?.getElementById('ascensionXEmbedFrame');
  if(!frame||event.origin!==global.location.origin||event.source!==frame.contentWindow)return;
  const payload=event.data.payload||{},c=activeCycle();
  let success=false,message='Unable to load the selected adaptive training day.';
  if(c&&read(c.id).enabled&&payload.cycleId===c.id){
   const approved=schedule(c),slot=approved.slots?.find(x=>x.kind==='support'&&x.day===payload.day&&x.title===payload.name);
   if(approved.valid&&slot&&slot.week===Number(payload.week)&&typeof global.SpartanXStartPowerbuildingSupportSession==='function'){
    try{
     success=global.SpartanXStartPowerbuildingSupportSession({
      cycleId:c.id,week:approved.week,day:slot.day,name:slot.title,exercises:slot.exercises
     })===true;
    }catch(_){}
   }
  }
  try{frame.contentWindow.postMessage({
   type:'spartx:ascensionImportResult',requestId:event.data.requestId,success,message
  },global.location.origin)}catch(_){}
  // The visible Workout Continue popup must close on success or show a retry message.
  try{global.dispatchEvent(new global.CustomEvent('spartx:ascensionAdaptiveSupportResult',
    {detail:{success,message}}))}catch(_){}
 });
 global.SXAscensionAdaptive=Object.freeze({KEY,LIB,FOURTH,activeCycle,read,enabled,save,plan,schedule,recommend,beginEditor,discardDraft,commitDraft,previewEnabled,refreshEditor});
 if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',mountEditor,{once:true});
 else mountEditor();
})(window);
