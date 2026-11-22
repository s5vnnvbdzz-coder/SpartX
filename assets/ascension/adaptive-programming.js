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
   {name:'Leg Extension',sets:4,min:10,max:15,rir:3,rest:90,muscles:'quadriceps',cost:1},
   {name:'Seated Leg Curl',sets:4,min:10,max:15,rir:3,rest:90,muscles:'hamstrings',cost:1},
   {name:'45° Back Extension',sets:4,min:10,max:15,rir:2,rest:90,muscles:'glutes and spinal erectors',cost:1,cue:'Controlled hip hinge and neutral spine; avoid hyperextension.'},
   {name:'Standing Calf Raise',sets:4,min:10,max:20,rir:3,rest:75,muscles:'calves',cost:1},
   {name:'Pallof Press',sets:4,min:10,max:15,rir:3,rest:75,muscles:'trunk',cost:1}
  ],
  'Bench Press':[
   {name:'Iso-Lateral Row',sets:4,min:8,max:12,rir:3,rest:120,muscles:'upper back',cost:1},
   {name:'Triceps Pushdown (Bar)',sets:4,min:10,max:15,rir:3,rest:75,muscles:'triceps',cost:1},
   {name:'Hanging Knee Raise',sets:4,min:10,max:15,rir:2,rest:90,muscles:'abdominals and hip flexors',cost:1,cue:'Lift the pelvis without swinging.'},
   {name:'Rear Delt Reverse Fly',sets:4,min:12,max:20,rir:3,rest:75,muscles:'shoulder stabilisers',cost:1},
   {name:'Lat Pulldown',sets:4,min:8,max:12,rir:3,rest:105,muscles:'lats',cost:1}
  ],
  'Deadlift':[
   {name:'Lat Pulldown',sets:4,min:8,max:12,rir:3,rest:105,muscles:'lats',cost:1},
   {name:'Romanian Deadlift',sets:3,min:8,max:8,rir:3,rest:150,muscles:'hamstrings and glutes',cost:2,cue:'A controlled hinge directly after deadlifts. Stop at target RPE 7; reduce weight if needed.'},
   {name:'Seated Leg Curl',sets:4,min:10,max:15,rir:3,rest:90,muscles:'hamstrings',cost:1},
   {name:'Pallof Press',sets:4,min:10,max:15,rir:3,rest:75,muscles:'trunk',cost:1},
   {name:'Seated Calf Raise',sets:4,min:12,max:20,rir:3,rest:75,muscles:'calves',cost:1}
  ],
  'Overhead Press':[
   {name:'Dumbbell Row',sets:4,min:8,max:12,rir:3,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:4,min:12,max:20,rir:3,rest:75,muscles:'delts',cost:1},
   {name:'Triceps Pushdown (Bar)',sets:4,min:10,max:15,rir:3,rest:75,muscles:'triceps',cost:1},
   {name:'Dumbbell Curl',sets:4,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1}
  ]
 };
 // Coach-prescribed accessories are reserved before optional movements fill a day.
 const PINNED={'Back Squat':'45° Back Extension','Bench Press':'Hanging Knee Raise'};
 const FOURTH={
  strength:[
   {name:'Machine Chest Press',sets:4,min:8,max:12,rir:3,rest:105,muscles:'chest',cost:1},
   {name:'Iso-Lateral Row',sets:4,min:8,max:12,rir:3,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:4,min:12,max:20,rir:3,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:4,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1}
  ],
  balanced:[
   {name:'Machine Chest Press',sets:4,min:8,max:12,rir:2,rest:105,muscles:'chest',cost:1},
   {name:'Iso-Lateral Row',sets:4,min:8,max:12,rir:2,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:4,min:12,max:20,rir:2,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:4,min:10,max:15,rir:2,rest:75,muscles:'biceps',cost:1}
  ],
  hypertrophy:[
   {name:'Machine Chest Press',sets:4,min:8,max:12,rir:2,rest:105,muscles:'chest',cost:1},
   {name:'Seated Cable Row',sets:4,min:10,max:15,rir:2,rest:105,muscles:'upper back',cost:1},
   {name:'Lateral Raise',sets:4,min:12,max:20,rir:2,rest:75,muscles:'delts',cost:1},
   {name:'Dumbbell Curl',sets:4,min:10,max:15,rir:2,rest:75,muscles:'biceps',cost:1}
  ]
 };
 // A different priority must change the actual exercise prescription,
 // not merely the select label or RIR text. These are conservative, editable
 // starting choices; the shared Spartan Intelligence policy doses working sets.
 const LOOKUP=[...Object.values(LIB).flat(),...Object.values(FOURTH).flat()];
 const ADDITIONAL={
  'Incline Dumbbell Press':{name:'Incline Dumbbell Press',sets:4,min:8,max:12,rir:3,rest:120,muscles:'chest',cost:1},
  'Leg Press':{name:'Leg Press',sets:4,min:10,max:15,rir:3,rest:120,muscles:'quadriceps',cost:2},
  'Hack Squat':{name:'Hack Squat',sets:3,min:8,max:10,rir:2,rest:150,muscles:'quadriceps and glutes',cost:2,
   cue:'Controlled deep knee bend with a stable torso; use the machine range that feels comfortable.'},
  'Cable Curl':{name:'Cable Curl',sets:4,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1}
 };
 const itemFor=name=>{
  const found=LOOKUP.find(x=>x.name===name)||ADDITIONAL[name];
  if(!found)throw Error('Missing adaptive assistance specification: '+name);
  return {...found};
 };
 const pickItems=names=>names.map(itemFor);
 const FOCUS_LIFTS={
  // Strength: modest support for the main lifts. Deadlift-day exercise order
  // is handled separately by its dedicated adaptive prescription.
  strength:{
   'Back Squat':['Leg Extension','Seated Leg Curl','45° Back Extension','Standing Calf Raise','Pallof Press'],
   'Bench Press':['Iso-Lateral Row','Triceps Pushdown (Bar)','Hanging Knee Raise','Rear Delt Reverse Fly','Lat Pulldown'],
   'Deadlift':['Lat Pulldown','Seated Leg Curl','Pallof Press','Seated Calf Raise'],
   'Overhead Press':['Dumbbell Row','Lateral Raise','Triceps Pushdown (Bar)','Dumbbell Curl']
  },
  balanced:{
   'Back Squat':['Seated Leg Curl','Leg Extension','Standing Calf Raise','Pallof Press'],
   'Bench Press':['Iso-Lateral Row','Incline Dumbbell Press','Triceps Pushdown (Bar)','Rear Delt Reverse Fly'],
   'Deadlift':['Seated Leg Curl','Lat Pulldown','Pallof Press','Seated Calf Raise'],
   'Overhead Press':['Dumbbell Row','Lateral Raise','Dumbbell Curl','Triceps Pushdown (Bar)']
  },
  hypertrophy:{
   'Back Squat':['Leg Extension','Seated Leg Curl','Standing Calf Raise','Pallof Press'],
   'Bench Press':['Machine Chest Press','Seated Cable Row','Rear Delt Reverse Fly','Triceps Pushdown (Bar)'],
   'Deadlift':['Seated Leg Curl','Rear Delt Reverse Fly','Lat Pulldown','Seated Calf Raise'],
   'Overhead Press':['Lateral Raise','Dumbbell Row','Triceps Pushdown (Bar)','Dumbbell Curl']
  }
 };
 const SUPPORT_ROLES={
  // Explicit Upper, Lower and Balanced templates are selected by the
  // coverage/recovery planner, never by a fixed Day 4 index.
  strength:{
   upper:['Machine Chest Press','Iso-Lateral Row','Lateral Raise','Triceps Pushdown (Bar)','Dumbbell Curl'],
   lower:['Leg Extension','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   balanced:['Rear Delt Reverse Fly','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   recovery:['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press']
  },
  balanced:{
   upper:['Incline Dumbbell Press','Iso-Lateral Row','Rear Delt Reverse Fly','Triceps Pushdown (Bar)','Dumbbell Curl'],
   lower:['Leg Extension','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   balanced:['Rear Delt Reverse Fly','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   recovery:['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press']
  },
  hypertrophy:{
   upper:['Machine Chest Press','Seated Cable Row','Lateral Raise','Triceps Pushdown (Bar)','Dumbbell Curl'],
   lower:['Leg Extension','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   balanced:['Rear Delt Reverse Fly','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   recovery:['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press']
  }
 };
 const FOCUS_EXPLANATIONS={
  strength:'Prioritises specific squat, bench and deadlift performance; assistance is deliberately restrained.',
  balanced:'Balances strength practice with upper-body and lower-body hypertrophy at recoverable volume.',
  hypertrophy:'Prioritises additional muscle stimulus through lower-fatigue accessories while main strength work stays fixed.'
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

 // Machine loading is individual to an athlete and machine, so NEVER infer
 // a Hack Squat / Leg Extension load from barbell squat training max.
 // Use only completed exercise-specific history, without changing that history.
 function latestSquatAccessoryHistory(name,storage=global.localStorage){
  try{
   const raw=storage.getItem('spartx_db');
   if(!raw||raw.length>12000000)return null;
   const sessions=JSON.parse(raw)?.sessions;
   if(!Array.isArray(sessions))return null;
   const records=[];
   for(const session of sessions.slice(0,600)){
    for(const exercise of Array.isArray(session.exercises)?session.exercises:[]){
     if(norm(exercise.name)!==norm(name))continue;
     const sets=(exercise.sets||[]).filter(set=>set?.done===true&&
      !/^(?:w|warm.?up)$/i.test(String(set.type||''))&&
      Number.isFinite(Number(set.weight))&&Number(set.weight)>0&&
      Number.isInteger(Number(set.reps))&&Number(set.reps)>0);
     if(sets.length)records.push({sets,when:Date.parse(session.date)||0});
    }
   }
   records.sort((a,b)=>b.when-a.when);
   return records[0]||null;
  }catch(_){return null}
 }
 function recommendSquatAccessory(item,week,storage=global.localStorage){
  const first={targetReps:item.min,suggestedKg:null,
   reason:'Select a comfortable first working weight on this machine. Log actual reps and RPE so SpartanX can prescribe the next session.'};
  // Cable/core work stays athlete-selected; machine weights are only compared
  // against the exact same exercise, not a different machine or squat 1RM.
  if(!['Hack Squat','Leg Extension','45° Back Extension','Leg Press'].includes(item.name))
   return first;
  const history=latestSquatAccessoryHistory(item.name,storage);
  if(!history)return first;
  const sets=history.sets,weights=sets.map(s=>Number(s.weight));
  const base=Math.min(...weights);
  const sameLoad=weights.every(n=>Math.abs(n-base)<0.01);
  const rpes=sets.map(s=>s.rpe===''||s.rpe==null?NaN:Number(s.rpe));
  const reliable=rpes.every(n=>Number.isFinite(n)&&n>=1&&n<=10);
  // Do not award a progression for a partially completed 3-set hack squat.
  const requiredSets=item.name==='Hack Squat'?3:2;
  const achieved=sets.length>=requiredSets&&sets.every(s=>Number(s.reps)>=item.max);
  const easy=reliable&&rpes.every(n=>n<=item.targetRpe);
  const hard=reliable&&rpes.some(n=>n>=9);
  const missed=sets.some(s=>Number(s.reps)<item.min);
  const rounding=n=>Math.max(2.5,Math.round(n/2.5)*2.5);
  // Taper weeks do not drive load increases. Reduced volume and modestly
  // reduced load target lower fatigue, without editing any recorded set.
  if(week>=4)return {targetReps:item.min,suggestedKg:rounding(base*(week===4?.95:.90)),
   reason:'Reduced loading for the AscensionX taper. Adjust to the prescribed RPE on this machine.'};
  if(hard||missed)return {targetReps:item.min,suggestedKg:rounding(base*.95),
   reason:'Previous exposure was too demanding or missed the minimum reps. Suggest a small load reduction; athlete may override.'};
  if(reliable&&achieved&&easy&&sameLoad){
   const increment=item.name==='Hack Squat'||item.name==='Leg Press'?5:2.5;
   return {targetReps:item.min,suggestedKg:rounding(base+increment),
    reason:'Previous completed sets reached the top of the range at the target RPE. Suggest a small load increase; athlete may override.'};
  }
  return {targetReps:item.min,suggestedKg:rounding(base),
   reason:reliable?'Hold the previous successful working load and progress repetitions within the target RPE.':
    'Previous weight is known, but RPE was not fully logged. Hold the weight until enough intensity data is available.'};
 }
 // Squat strength is the priority: a knee-dominant compound immediately after
 // the barbell squat, followed by rectus-femoris, posterior-chain and core work.
 // During Weeks 4–5 sets/intensity taper; Week 6 has no accessories.
 function squatAdaptivePlan(week,storage=global.localStorage){
  if(week>=6)return [];
  const prescriptions=[
   {name:'Hack Squat',sets:week<=3?3:week===4?2:1,min:8,max:10,targetRpe:week<=3?8:week===4?7:6.5},
   {name:'Leg Extension',sets:week<=4?2:1,min:12,max:15,targetRpe:week<=3?8:7},
   {name:'45° Back Extension',sets:week<=3?2:1,min:10,max:12,targetRpe:7},
   {name:'Pallof Press',sets:week<=4?2:1,min:10,max:15,targetRpe:7}
  ];
  return prescriptions.map(spec=>{
   const base=itemFor(spec.name);
   const item={...base,...spec,rir:10-spec.targetRpe,sourceLift:'Back Squat',week};
   const loading=recommendSquatAccessory(item,week,storage);
   return {...item,...loading,reason:loading.reason+' '+
    (base.cue||'Contribute useful support volume without another heavy barbell squat.')};
  });
 }
 function dose(item,week,focus,main,cycleId,storage){
  // RDLs are a fixed Deadlift-day prescription, not a generic adaptive
  // exercise. Their sets, reps and target RPE must not drift with heuristics.
  if(item.name==='Romanian Deadlift')return null;
  // Keep useful low-fatigue accessories during heavy weeks. Week 6 is the
  // deliberate no-assistance recovery week; Week 5 isn't a blanket one-set week.
  const factor=[0,1,1,1,.75,.75,0][week]||0;
  const isSupportDay=main==='Support';
  const added=focus==='hypertrophy'&&!isSupportDay&&main!=='Deadlift'?1:0;
  const V=global.SXVolumeIntelligence;
  const cycle=activeCycle(storage);
  // Main-lift exposure is an internal planning proxy, not a claim about
  // AscensionX's real prescription or the athlete's completed working sets.
  const mainProxy=V&&cycle?V.countExposure((cycle.lifts||[]).map(lift=>({
    exercises:[{name:lift,sets:3}]
  }))):null;
  const info=V?.classify?.(item.name);
  const existingWeekly=info?mainProxy?.[info.primary]?.effective||0:0;
  const advisory=V?.recommendWorkingSets?.({
    name:item.name,goal:focus==='strength'?'powerlifting':focus==='hypertrophy'?'bodybuilding':'powerbuilding',
    experience:'intermediate',weeklyExposure:existingWeekly,remainingSlots:2,
    existingSets:item.sets+added,afterHeavyLift:main==='Deadlift'||item.cost>1
  });
  // A previous arithmetic blend with the advisory often reduced three-set
  // prescriptions to two. Four is now the preferred normal-week allocation
  // for low-fatigue support; higher-axial-fatigue work stays more conservative.
  const baseline=item.cost>=2?Math.min(3,item.sets+added):Math.min(4,item.sets+added);
  // Only athlete-approved next-cycle accessory changes are applied.
  // Never edit main-lift loading, current-cycle history or taper weeks.
  const approvedDelta=week<=3&&cycleId&&activeCycle(storage)?.id===cycleId?
   global.SXAscensionCycleIntelligence?.adjustment?.(cycleId,item.name,storage)||0:0;
  const adjustedBaseline=clamp(baseline+approvedDelta,item.cost>=2?2:1,4);
  let sets=isSupportDay&&week<=3?adjustedBaseline:Math.round(adjustedBaseline*factor);
  // More demanding accessories receive a steeper taper than low-fatigue
  // rows, calves, core and isolation movements.
  if(week>=4&&item.cost>=2)sets=Math.min(sets,1);
  if(main==='Deadlift'&&week>=4)sets=Math.min(sets,2);
  if(week===6)sets=0;
  if(sets<1)return null;
  const rir=clamp(item.rir+(week>=4?1:0)+(focus==='strength'?1:0),2,5);
  const ex={...item,sets,rir,sourceLift:main,week};
  const rec=recommend(ex,cycleId,week,storage);
  return {...ex,...rec,reason:rec.reason+' '+(item.cue||'Supports '+item.muscles+' without additional heavy spinal loading.')+
    (advisory?' Spartan Intelligence: '+advisory.reason+' The set allocation is a reviewable heuristic.':'')+
    (approvedDelta?' Approved next-cycle set adjustment: '+(approvedDelta>0?'+':'')+approvedDelta+'.':'')};
 }
 // Single selection function shared by draft preview and live cycle plans.
 function buildLiftPlan(lift,week,focus,cycleId,storage=global.localStorage){
  const w=Number(week);
  if(!LIFTS.includes(lift)||!Number.isInteger(w)||w<1||w>6)return [];
  const chosen=FOCUS_LIFTS[focus]||FOCUS_LIFTS.strength;
  // A requested, fixed RDL block takes first position after the main Deadlift,
  // in every working week. Week 6 retains AscensionX's no-accessory recovery
  // rule. The training max for the actual session is supplied on import.
  const fixedRdl=lift==='Deadlift'&&w<6?{
   ...itemFor('Romanian Deadlift'),sets:3,min:8,max:8,rir:3,targetRpe:7,
   targetReps:8,tmPercent:45,sourceLift:lift,week:w,
   reason:'3 × 8 at target RPE 7, using 45% of the current deadlift training max. Adjust load down if RPE exceeds 7.'
  }:null;
  // Deadlift-day Adaptive Support has a fixed exercise ORDER, independent
  // of the strength/balanced/hypertrophy focus. The final two accessories
  // retain Adaptive Programming's dose and RPE recommendation rules.
  // Reserve their three-set normal-week baseline before applying taper logic.
  if(lift==='Deadlift'){
   if(!fixedRdl)return [];
   const tail=['Lat Pulldown','Seated Leg Curl'].map(name=>
    dose(itemFor(name),w,focus,lift,cycleId,storage)).filter(Boolean)
    .map(ex=>({...ex,sets:Math.min(3,ex.sets)}));
   return [fixedRdl,...tail];
  }
  if(lift==='Back Squat')return squatAdaptivePlan(w,storage);
  const candidates=pickItems(chosen[lift]||FOCUS_LIFTS.strength[lift])
   .filter(item=>item.name!=='Romanian Deadlift');
  const cap=focus==='strength'?12:16;
  const maxExercises=focus==='strength'?3:4;
  const prescribed=candidates.map(item=>dose(item,w,focus,lift,cycleId,storage)).filter(Boolean);
  const pinnedName=focus==='strength'?PINNED[lift]:null;
  const pinnedSets=prescribed.find(ex=>ex.name===pinnedName)?.sets||0;
  let count=fixedRdl?.sets||0,pinnedSelected=false;
  const selected=fixedRdl?[fixedRdl]:[];
  for(const ex of prescribed){
   if(selected.length>=maxExercises)break;
   const isPinned=ex.name===pinnedName;
   const reserved=!isPinned&&!pinnedSelected?pinnedSets:0;
   if(count+ex.sets+reserved>cap)continue;
   selected.push(ex);count+=ex.sets;
   if(isPinned)pinnedSelected=true;
  }
  return selected;
 }
 function plan(lift,week,opts={},storage=global.localStorage){
  const c=activeCycle(storage),w=Number(week);
  if(!c||!c.lifts.includes(lift)||!Number.isInteger(w)||w<1||w>6)return [];
  const prefs=read(c.id,storage);
  if(!prefs.enabled)return [];
  return buildLiftPlan(lift,w,prefs.focus,c.id,storage);
 }
 function weekFor(c,lift){return clamp(Number(c.weeks?.[lift]||c.currentWeek||1),1,6)}
 // Interpret completed main-lift RPE as a conservative fatigue warning.
 // This is not a recovery guarantee and never changes the barbell prescription.
 function recentMainFatigue(c,storage=global.localStorage){
  const result={upper:false,lower:false};
  if(!c?.id)return result;
  try{
   const raw=storage.getItem('spartx_db');
   if(!raw||raw.length>12000000)return result;
   const sessions=JSON.parse(raw)?.sessions;
   if(!Array.isArray(sessions))return result;
   const cutoff=Date.now()-10*86400000;
   for(const session of sessions.slice(0,150)){
    const timestamp=Date.parse(session?.date);
    if(!Number.isFinite(timestamp)||timestamp<cutoff||timestamp>Date.now()+86400000)continue;
    for(const ex of Array.isArray(session.exercises)?session.exercises:[]){
     const link=ex?.ascensionLink;
     if(link?.cycleId!==c.id)continue;
     const hardSets=(ex.sets||[]).filter(set=>set?.done===true&&
      String(set.type||'Working Set')==='Working Set'&&
      set.rpe!==''&&set.rpe!==null&&Number(set.rpe)>=9);
     // One RPE 9 top set is common during strength weeks. Treat two hard
     // sets, or one RPE 9.5+ set, as a stronger signal to protect recovery.
     const strained=hardSets.length>=2||hardSets.some(set=>Number(set.rpe)>=9.5);
     if(strained){
      if(['Back Squat','Deadlift'].includes(link.lift))result.lower=true;
      if(['Bench Press','Overhead Press'].includes(link.lift))result.upper=true;
     }
    }
   }
  }catch(_){}
  return result;
 }
 // The support planner fills the least-served movement region first, based
 // on selected compounds, day count and support days already allocated.
 // A day only 24h before the next compound must avoid stressing that region.
 function supportProfile(c,prefs,index,week,storage=global.localStorage){
  const days=DAYS[prefs.days]||[];
  const shortNext=days[index]==='SUN'&&days[0]==='MON';
  const firstLift=c.lifts[0];
  const nextGroup=['Back Squat','Deadlift'].includes(firstLift)?'lower':'upper';
  const fatigue=recentMainFatigue(c,storage);
  let upper=(c.lifts.includes('Bench Press')?3:0)+(c.lifts.includes('Overhead Press')?3:0);
  let lower=(c.lifts.includes('Back Squat')?3:0)+(c.lifts.includes('Deadlift')?3:0);
  let previous=null,role='balanced';
  for(let slot=c.lifts.length;slot<=index;slot++){
   role=lower-upper>=1.5?'upper':upper-lower>=1.5?'lower':'balanced';
   if(previous===role)role='balanced';
   if(fatigue[role])role='balanced';
   if(shortNext&&slot===index&&role===nextGroup)role='balanced';
   if(slot<index){
    if(role==='upper')upper+=3;
    else if(role==='lower')lower+=3;
    else {upper+=1.5;lower+=1.5}
    previous=role;
   }
  }
  // A late support day deliberately uses only easy, low-axial-fatigue
  // exercises. Do not programme a hack squat/leg press or second heavy hinge.
  const guarded=shortNext||index>c.lifts.length||fatigue.upper||fatigue.lower;
  return {role,guarded,shortNext,fatigue};
 }
 function supportExercises(c,prefs,index,week,storage=global.localStorage){
  if(week>=6||!c?.lifts||index<c.lifts.length)return [];
  const profile=supportProfile(c,prefs,index,week,storage);
  const roles=SUPPORT_ROLES[prefs.focus]||SUPPORT_ROLES.strength;
  const names=profile.shortNext&&profile.role==='balanced'?roles.recovery:
   roles[profile.role]||roles.balanced;
  return pickItems(names).map(item=>dose(item,week,prefs.focus,'Support',c.id||null,storage))
   .filter(Boolean).map(item=>{
    const group=['Leg Extension','Seated Leg Curl','Seated Calf Raise','Standing Calf Raise'].includes(item.name)?
     'lower':'upper';
    const core=item.name==='Pallof Press'||item.name==='Hanging Knee Raise';
    const stressed=!core&&profile.fatigue[group];
    const base=week<=3?3:2;
    const cap=profile.guarded?Math.min(2,base):base;
    const sets=Math.max(1,Math.min(item.sets,stressed?Math.min(2,cap):cap));
    const directArms=item.name==='Dumbbell Curl'||item.name==='Triceps Pushdown (Bar)';
    const easyRir=week>=4||profile.shortNext||stressed?4:3;
    // Direct arms retain the approved RPE 7 target on normal Upper days,
    // then drop to RPE 6 when tapering or protecting a nearby main lift.
    const rir=directArms?easyRir:Math.max(item.rir,easyRir);
    return {...item,sets,rir,targetRpe:10-rir,supportRole:profile.role,
     ...(directArms?{min:10,max:15,targetReps:10}:{}),
     reason:item.reason+' Low-fatigue '+profile.role+' assistance, adjusted to selected compounds and recent main-lift effort.'};
   });
 }
 function supportTitle(c,prefs,index,week,storage=global.localStorage){
  const role=supportProfile(c,prefs,index,week,storage).role;
  return role.charAt(0).toUpperCase()+role.slice(1)+' Assistance (Week '+week+')';
 }
 function completedSupportDay(c,day,week,expected,storage){
  // Only saved, completed exercises for this exact cycle/week/day count.
  // Partial support workouts must not make the next suggested day disappear.
  try{
   const raw=storage.getItem('spartx_db');
   if(!raw||raw.length>12000000)return false;
   const sessions=JSON.parse(raw)?.sessions;
   if(!Array.isArray(sessions))return false;
   return sessions.some(session=>{
    const exercises=(session?.exercises||[]).filter(ex=>{
     const link=ex?.sxPowerbuildingSupport;
     return link?.cycleId===c.id&&Number(link.week)===week&&link.day===day;
    });
    const valid=ex=>(ex.sets||[]).filter(set=>set?.done===true&&
      !/^(w|warm.?up|cardio)$/i.test(String(set.type||''))&&
      Number.isFinite(Number(set.weight))&&Number(set.weight)>=0&&
      Number.isInteger(Number(set.reps))&&Number(set.reps)>0).length;
    // Prefer the number of exercises and sets prescribed WHEN this workout
    // was started. A later engine upgrade must not invalidate saved training.
    const originalCount=Number(exercises[0]?.sxPowerbuildingSupport?.plannedExerciseCount);
    if(exercises.length&&Number.isInteger(originalCount)&&originalCount>0){
      return exercises.length>=originalCount&&exercises.every(ex=>{
       const original=Number(ex.sxPowerbuildingSupport?.plannedSets);
       return Number.isInteger(original)&&original>0&&valid(ex)>=original;
      });
    }
    // Grandfather legacy Week 5 workouts generated by the old blanket
    // one-set rule; they may have contained only two supporting exercises.
    if(week===5&&exercises.length>=2&&exercises.every(ex=>
      (ex.sets||[]).length===1&&valid(ex)===1))return true;
    return expected.length>0&&expected.every(target=>exercises.some(ex=>
     norm(ex.name)===norm(target.name)&&valid(ex)>=target.sets));
   });
  }catch(_){return false}
 }
 function pendingSupportDay(cycleArg,storage=global.localStorage){
  const c=cycleArg||activeCycle(storage);
  if(!c||!c.lifts?.length)return null;
  const prefs=read(c.id,storage),days=DAYS[prefs.days]||[];
  if(!prefs.enabled||prefs.days<=c.lifts.length||prefs.days<c.lifts.length)return null;
  const start=Date.parse(c.id);
  const logs=Array.isArray(c.logs)?c.logs:[];
  // The 4th day belongs to the week JUST completed by all main lifts.
  // The next main lift's week counter has already advanced by this point.
  let completedWeek=0;
  for(let week=5;week>=1;week--){
   if(c.lifts.every(lift=>logs.some(log=>
    log?.lift===lift&&Number(log.week)===week&&log.setsComplete===true&&
    (log.cycleId?log.cycleId===c.id:
     Number.isFinite(Date.parse(log.date))&&Date.parse(log.date)>=start)))){
    completedWeek=week;break;
   }
  }
  if(!completedWeek||c.lifts.some(lift=>weekFor(c,lift)<=completedWeek))return null;
  for(let index=c.lifts.length;index<days.length;index++){
   const day=days[index];
   const exercises=supportExercises(c,prefs,index,completedWeek,storage);
   if(!exercises.length)continue;
   if(!completedSupportDay(c,day,completedWeek,exercises,storage))
    return {day,index,kind:'support',week:completedWeek,
     title:supportTitle(c,prefs,index,completedWeek,storage),role:supportProfile(c,prefs,index,completedWeek,storage).role,exercises};
  }
  return null;
 }
 function schedule(cycleArg,storage=global.localStorage){
  const c=cycleArg||activeCycle(storage);
  if(!c)return {valid:false,message:'No active AscensionX cycle.',slots:[]};
  const prefs=read(c.id,storage),count=prefs.days;
  if(count<c.lifts.length)return {valid:false,message:'Choose at least as many days as selected compound lifts.',slots:[]};
  const pending=pendingSupportDay(c,storage);
  // Support gets its *own* completed week; compound prescriptions keep
  // their independently advancing current weeks.
  // The latest lift must not force a premature Week 5 taper on support
  // when another lift is still at Week 4 (or earlier).
  const week=pending?.week||Math.min(...c.lifts.map(l=>weekFor(c,l)));
  const slots=DAYS[count].map((day,index)=>{
   const lift=c.lifts[index];
   if(lift)return {day,kind:'ascension',lift,week:weekFor(c,lift),
    title:lift+' · AscensionX · Week '+weekFor(c,lift),exercises:plan(lift,weekFor(c,lift),{},storage)};
   return {day,kind:'support',title:supportTitle(c,prefs,index,week,storage),
    week,lift:null,role:supportProfile(c,prefs,index,week,storage).role,
    exercises:supportExercises(c,prefs,index,week,storage)};
  });
  return {valid:true,message:'Suggested layout, not guaranteed recovery. Main sets stay owned by AscensionX; reschedule around sleep, soreness and performance.',week,slots};
 }
 // This is the SAME planner used by the new-cycle editor. Previously it
 // rendered LIB[lift].slice(0,3) and FOURTH[..].slice(...), so changing
 // priority only changed a label, and day five repeated day four.
 function previewSchedule(selectedLifts,settings={},cycleArg=null,storage=global.localStorage){
  const lifts=(Array.isArray(selectedLifts)?selectedLifts:[]).filter(x=>LIFTS.includes(x));
  const focus=FOCUS_LIFTS[settings.focus]?settings.focus:'strength';
  const count=Math.round(Number(settings.days)||4);
  if(!DAYS[count]||count<lifts.length)return {valid:false,slots:[],
   message:'Choose at least as many days as selected compound lifts.'};
  const match=!!cycleArg&&lifts.length===cycleArg.lifts.length&&
   lifts.every(lift=>cycleArg.lifts.includes(lift));
  const lastWeek=cycleArg?Math.min(...lifts.map(lift=>
   cycleArg.lifts.includes(lift)?weekFor(cycleArg,lift):1)):1;
  const prefs={...settings,focus,days:count};
  const pending=match&&settings.enabled?pendingSupportDay(cycleArg,storage)?.week:null;
  const supportWeek=pending||lastWeek;
  const holder={id:match?cycleArg.id:null,lifts};
  const slots=DAYS[count].map((day,index)=>{
   const lift=lifts[index];
   if(lift){
    const inCycle=!!cycleArg&&cycleArg.lifts.includes(lift);
    const week=inCycle?weekFor(cycleArg,lift):1;
    return {day,kind:'ascension',lift,week,title:lift+' · Week '+week,
     exercises:match&&settings.enabled?plan(lift,week,{},storage):
      buildLiftPlan(lift,week,focus,inCycle?cycleArg.id:null,storage)};
   }
   const week=supportWeek;
   return {day,kind:'support',lift:null,week,
    title:supportTitle(holder,prefs,index,week,storage),
    role:supportProfile(holder,prefs,index,week,storage).role,
    exercises:supportExercises(holder,prefs,index,week,storage)};
  });
  return {valid:true,focus,week:supportWeek,slots};
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
  const anchor=document.getElementById('sxCycleLiftSection');
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
    '<p class="sx-adaptive-rule">Assistance is selected for the gaps between your main lifts, with lighter work when recovery is limited.</p>',
    '<details id="sxAscAdaptivePlanDetails" class="sx-adaptive-details" open>',
     '<summary>YOUR TRAINING DAYS · LIVE PROGRAMME <span aria-hidden="true">⌄</span></summary>',
     '<div id="sxAscAdaptivePreview" class="sx-adaptive-preview"></div>',
    '</details>',
   '</div>',
   '<p id="sxAscAdaptiveStatus" class="sx-adaptive-status" role="status" aria-live="polite"></p>'
  ].join('');
  anchor.insertAdjacentElement('afterend',card);
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
   const previewSettings={...pref,days:previewDays};
   const built=previewSchedule(selected,previewSettings,current&&!incompatible?current:null);
   if(!built.valid){
    const error=document.createElement('p');
    error.textContent=built.message;preview.appendChild(error);return;
   }
   for(const slot of built.slots){
    const box=document.createElement('div');
    box.className='sx-adaptive-preview-day';
    const heading=document.createElement('strong');
    heading.textContent=slot.kind==='support'?slot.title:slot.day+' · '+slot.title;
    box.appendChild(heading);
    const details=document.createElement('div');
    details.className='sx-adaptive-preview-exercises';
    if(!slot.exercises.length){
     const line=document.createElement('div');
     line.textContent='No accessories · recovery week';
     details.appendChild(line);
    }else for(const ex of slot.exercises){
     const line=document.createElement('div');
     line.className='sx-adaptive-preview-exercise';
     const reps=ex.min===ex.max?String(ex.min):ex.min+'–'+ex.max;
     const target=ex.targetRpe??(10-ex.rir);
     line.textContent=ex.name+' '+ex.sets+' × '+reps+' - RPE '+target;
     details.appendChild(line);
    }
    box.appendChild(details);
    preview.appendChild(box);
   }
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
   if(typeof global.renderSXCycleManageLiveSnapshot==='function')
    global.renderSXCycleManageLiveSnapshot();
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
  // SpartanX mounts the AscensionX iframe inside an *open shadow root*
  // (#sxAscensionPortalHost). document.getElementById cannot see it there.
  // Resolve the actual frame before checking the trusted message source.
  const host=global.document?.getElementById('sxAscensionPortalHost');
  const frame=host?.shadowRoot?.getElementById('ascensionXEmbedFrame')||
   global.document?.getElementById('ascensionXEmbedFrame');
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
 global.SXAscensionAdaptive=Object.freeze({KEY,LIB,FOURTH,FOCUS_LIFTS,SUPPORT_ROLES,activeCycle,read,enabled,save,plan,previewSchedule,schedule,pendingSupportDay,recommend,beginEditor,discardDraft,commitDraft,previewEnabled,refreshEditor});
 if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',mountEditor,{once:true});
 else mountEditor();
})(window);
