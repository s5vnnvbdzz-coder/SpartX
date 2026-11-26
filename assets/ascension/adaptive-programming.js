/* AscensionX Adaptive Programming — performance-led loading
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
  // Technical bench volume for Upper Assistance: separate from the
  // AscensionX main-lift top-set/back-down prescription.
  'Bench Press':{name:'Bench Press',sets:3,min:8,max:10,rir:3,rest:150,
   muscles:'chest and triceps',cost:1,
   cue:'Controlled, repeatable bench technique. No maximal or grinding reps; leave at least three reps in reserve.'},
  'Incline Dumbbell Press':{name:'Incline Dumbbell Press',sets:4,min:8,max:12,rir:3,rest:120,muscles:'chest',cost:1},
  'Leg Press':{name:'Leg Press',sets:4,min:10,max:15,rir:3,rest:120,muscles:'quadriceps',cost:2},
  'Hack Squat':{name:'Hack Squat',sets:3,min:8,max:10,rir:2,rest:150,muscles:'quadriceps and glutes',cost:2,
   cue:'Controlled deep knee bend with a stable torso; use the machine range that feels comfortable.'},
  'Cable Curl':{name:'Cable Curl',sets:4,min:10,max:15,rir:3,rest:75,muscles:'biceps',cost:1},
  'Bulgarian Split Squat':{name:'Bulgarian Split Squat',sets:3,min:8,max:10,rir:3,rest:120,
   muscles:'quadriceps and glutes',cost:2,
   cue:'Controlled unilateral knee-dominant work for quad and hip development. Each side counts as one set.'},
  'Cable Crunch':{name:'Cable Crunch',sets:3,min:12,max:15,rir:3,rest:75,
   muscles:'abdominals',cost:1,cue:'Direct trunk training without hanging from an irritated shoulder.'},
  'Pause Squat':{name:'Pause Squat',sets:3,min:4,max:4,rir:4,rest:180,
   muscles:'quadriceps, glutes and trunk',cost:2,
   cue:'Submaximal, controlled pause squat for technique. Do not treat these as competition top sets.'}
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
   'Bench Press':['Iso-Lateral Row','Machine Chest Press','Triceps Pushdown (Bar)','Rear Delt Reverse Fly'],
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
   upper:['Bench Press','Iso-Lateral Row','Lateral Raise','Triceps Pushdown (Bar)','Dumbbell Curl'],
   lower:['Leg Extension','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   balanced:['Rear Delt Reverse Fly','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   recovery:['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press']
  },
  balanced:{
   upper:['Bench Press','Iso-Lateral Row','Rear Delt Reverse Fly','Triceps Pushdown (Bar)','Dumbbell Curl'],
   lower:['Leg Extension','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   balanced:['Rear Delt Reverse Fly','Seated Leg Curl','Seated Calf Raise','Pallof Press'],
   recovery:['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press']
  },
  hypertrophy:{
   upper:['Bench Press','Seated Cable Row','Lateral Raise','Triceps Pushdown (Bar)','Dumbbell Curl'],
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
 // All saved workout history is eligible, not only the current cycle or a
 // particular slice of the session array. Exact exercise/equipment identity
 // matters; competition bench is never a secondary-bench loading reference.
 const EQUIPMENT_KEY='sx_ascension_equipment_v1';
 function equipmentRules(storage=global.localStorage){
  try{const rules=JSON.parse(storage.getItem(EQUIPMENT_KEY)||'{}');return rules&&typeof rules==='object'&&!Array.isArray(rules)?rules:{}}catch(_){return {}}
 }
 function setEquipment(name,rule,storage=global.localStorage){
  const key=norm(name);if(!key)throw Error('Exercise required');
  const rules=equipmentRules(storage);
  if(rule==null){delete rules[key]}else{
   const step=Number(rule.step),offset=Number(rule.offset??0);
   if(!Number.isFinite(step)||step<=0||step>100||!Number.isFinite(offset)||offset<0||offset>=step)throw Error('Invalid increment or offset');
   rules[key]={step,offset,equipmentId:String(rule.equipmentId||'')};
  }
  storage.setItem(EQUIPMENT_KEY,JSON.stringify(rules));return rules[key]||null;
 }
 function exerciseHistory(name,cycleId,week,storage, equipmentId=''){
  try{
   const sessions=JSON.parse(storage.getItem('spartx_db')||'{}')?.sessions;
   if(!Array.isArray(sessions))return [];
   const records=[];
   for(const session of sessions){
    const when=Date.parse(session?.date);
    if(!Number.isFinite(when))continue;
    const setsByEquipment=new Map();
    for(const exercise of Array.isArray(session.exercises)?session.exercises:[]){
     if(norm(exercise?.name)!==norm(name))continue;
     const link=exercise.sxStrengthSizeCompanion||exercise.sxPowerbuildingSupport;
     if(cycleId&&link?.cycleId===cycleId&&Number(link.week)>=week)continue;
     if(name==='Bench Press'&&(!link||exercise.ascensionLink))continue;
     const equipment=String(exercise.equipmentId||'');
     if(equipmentId&&equipment!==equipmentId)continue;
     const sets=(Array.isArray(exercise.sets)?exercise.sets:[]).filter(s=>s?.done===true&&
      !/^(?:w\d*|warm[ -]?up(?: set)?)$/i.test(String(s.type||''))&&
      Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&
      Number.isInteger(Number(s.reps))&&Number(s.reps)>0);
     if(sets.length)setsByEquipment.set(equipment,[...(setsByEquipment.get(equipment)||[]),...sets]);
    }
    for(const [equipment,sets] of setsByEquipment)records.push({when,sets,equipment});
   }
   records.sort((a,b)=>b.when-a.when);
   if(!records.length)return [];
   // Do not blend distinct known machines, even when their exercise names match.
   const chosen=equipmentId||records[0].equipment;
   return records.filter(r=>r.equipment===chosen);
  }catch(_){return []}
 }
 function recommend(ex,cycleId,week,storage=global.localStorage){
  const min=Number(ex.min),max=Number(ex.max),count=Number(ex.sets)||3;
  const target=clamp(Number(ex.targetRpe)||(10-Number(ex.rir||3)),6,9);
  const rule=equipmentRules(storage)[norm(ex.name)];
  const history=exerciseHistory(ex.name,cycleId,week,storage,String(ex.equipmentId||rule?.equipmentId||''));
  const manual=(reason,evidence=null)=>({targetReps:min,suggestedKg:null,reason,confidence:'low',evidence});
  if(!history.length)return manual('No comparable completed weighted sets. Choose starting weight, or progress bodyweight repetitions, and log actual RPE.');
  const records=history.slice(0,5),last=records[0];
  // Repeated working load, with the final/lowest rep set as conservative anchor.
  const weights=last.sets.map(s=>Number(s.weight)),base=Math.min(...weights);
  const comparable=last.sets.filter(s=>Number(s.weight)===base);
  const full=comparable.length>=count,same=weights.every(w=>w===base);
  const validRpe=s=>s.rpe!==''&&s.rpe!=null&&Number.isFinite(Number(s.rpe))&&Number(s.rpe)>=6&&Number(s.rpe)<=10;
  const known=comparable.every(validRpe),low=Math.min(...comparable.map(s=>Number(s.reps)));
  const effort=known?Math.max(...comparable.map(s=>Number(s.rpe))):null;
  const observed=[...new Set(history.flatMap(r=>r.sets.map(s=>Number(s.weight))))].sort((a,b)=>a-b);
  // An observed weight is known to have been used, but its spacing is not
  // assumed to be the machine increment. Never extrapolate an unconfirmed ladder.
  const explicit=Number(ex.incrementKg||rule?.step),offset=Number(rule?.offset||0);
  const confirmed=Number.isFinite(explicit)&&explicit>0&&explicit<=100&&offset>=0&&offset<explicit;
  const round=n=>Math.round(n*10000)/10000;
  const previousLoad=confirmed?round(offset+(Math.ceil((base-offset)/explicit-1e-8)-1)*explicit):observed.filter(w=>w<base).at(-1);
  const nextLoad=confirmed?round(offset+(Math.floor((base-offset)/explicit+1e-8)+1)*explicit):observed.find(w=>w>base);
  const equipmentSource=confirmed?'confirmed increment '+explicit+' kg':'previously logged loads only';
  const evidence={sessions:records.length,totalSessions:history.length,sets:comparable.length,previousKg:base,previousReps:low,previousRpe:effort,date:new Date(last.when).toISOString(),equipmentSource};
  const prefix='Last comparable performance: '+comparable.length+' × '+base+' kg × '+low+' reps'+(known?' (highest RPE '+effort+')':' (RPE incomplete)')+'. ';
  const out=(kg,reps,reason)=>({suggestedKg:kg,targetReps:clamp(Math.floor(reps),min,max),reason:prefix+reason,confidence:known&&full&&same?'moderate':'low',evidence});
  const down=reason=>Number.isFinite(previousLoad)&&previousLoad>0&&previousLoad>=base*.8?
   out(previousLoad,min,reason+' Reduce to the next confirmed or observed lower load; reassess RPE.'):
   {...manual(prefix+reason+' Select a lower available weight; no suitable lower load is verified.',evidence)};
  // When the athlete moves up within a session, retain the successful new
  // working-load reference instead of averaging it back down to the first set.
  // A high-effort or missed-rep set is not evidence of consolidation.
  const latest=last.sets.at(-1),newKg=Number(latest?.weight);
  const newSets=last.sets.filter(s=>Number(s.weight)===newKg);
  if(!same&&newKg>base&&newSets.length&&newSets.every(s=>validRpe(s)&&Number(s.reps)>=min&&Number(s.rpe)<=Math.min(8.5,target+1.5))){
   const newReps=Math.min(...newSets.map(s=>Number(s.reps)));
   const newRpe=Math.max(...newSets.map(s=>Number(s.rpe)));
   return {suggestedKg:newKg,targetReps:clamp(newReps,min,max),reason:'Athlete-selected '+newKg+' kg achieved '+newReps+' reps at RPE '+newRpe+'. Consolidate at this load until effort improves; no additional increase advised.',confidence:'low',evidence:{...evidence,previousKg:newKg,previousReps:newReps,previousRpe:newRpe,sets:newSets.length}};
  }
  // A rep at the same weight is a rough RIR-based estimate, not a measured RPE.
  // Never convert machine performance into a barbell 1RM.
  if(known&&(effort>=9.5||low<min))return down('Previous effort was too high or minimum reps were missed.');
  if(!known){
   if(low<min)return down('Minimum reps were missed, and RPE is missing.');
   return out(base,low,'Hold established load; no increase without complete RPE.');
  }
  const achievable=low+Math.floor(target-effort);
  if(achievable<min)return down('Estimated reps at the target RPE fall below the prescribed range.');
  if(!same||!full)return out(base,Math.min(low,achievable),'Mixed-load or incomplete exposure; no automatic increase.');
  const earned=week<=3&&records.length>=2&&records.slice(0,2).every(r=>r.sets.length>=count&&
   r.sets.every(s=>Number(s.weight)===base&&Number(s.reps)>=max&&validRpe(s)&&Number(s.rpe)<=target-1));
  if(earned&&Number.isFinite(nextLoad)&&nextLoad>base&&nextLoad<=base*1.10){
   // Conservative estimate of reps at the new load; cap the assumed rep
   // capacity to limit extrapolation at high-rep machine exercises.
   const capacity=base*(1+Math.min(20,low+10-effort)/30);
   const atNew=Math.floor(30*(capacity/nextLoad-1)-(10-target));
   if(atNew>=min)return out(nextLoad,Math.min(max,atNew),'Two full controlled exposures earned an available load increase ('+equipmentSource+'). Estimated reps; adjust to target RPE.');
  }
  return out(base,achievable,earned?'Maintain the established load or select the next available gym weight if the target RPE permits; no fixed increment required.':'Retain established load and adjust reps to target effort; no blanket taper reduction.');
 }
 function latestSquatAccessoryHistory(name,storage=global.localStorage){
  return exerciseHistory(name,null,Infinity,storage)[0]||null;
 }
 function recommendSquatAccessory(item,week,storage){
  return recommend(item,activeCycle(storage)?.id,week,storage);
 }
 // Intelligent exercise selection for an already-active classic cycle:
 // preserve the quad-priority slot, but select the familiar machine using
 // actual completed exercise history. Never infer machine kg from squat max.
 function preferredQuadAccessory(storage=global.localStorage){
  const hack=latestSquatAccessoryHistory('Hack Squat',storage);
  const press=latestSquatAccessoryHistory('Leg Press',storage);
  if(!press)return 'Hack Squat';
  if(!hack)return 'Leg Press';
  return press.when>hack.when?'Leg Press':'Hack Squat';
 }
 function currentTrainingMax(lift,storage=global.localStorage){
  try{
   const x=JSON.parse(storage.getItem(CYCLE_KEY)||'null');
   if(!x?.cycle?.created||!x?.profile?.max)return null;
   const step=Number(x.profile.rounding)||2.5;
   const approved=Number(x.cycle.trainingMaxes?.[lift]);
   const oneRm=Number(x.profile.max[lift]);
   const pct=Number(x.profile.tmPct)||95;
   const tm=approved>0?approved:oneRm>0?oneRm*pct/100:0;
   return tm>0&&Number.isFinite(tm)?Math.round(tm/step)*step:null;
  }catch(_){return null}
 }
 function secondaryBenchSuggestion(week,storage=global.localStorage){
  const tm=currentTrainingMax('Bench Press',storage);
  if(!tm)return null;
  // A technique/volume prescription, not a second classic top set.
  const fraction=week<=3?.65:week===4?.60:.55;
  return Math.max(2.5,Math.round(tm*fraction/2.5)*2.5);
 }
 function formatPrescription(ex){
  const count=Math.max(0,Number(ex?.sets)||0),reps=Number(ex?.targetReps||ex?.min)||0;
  const kg=Number(ex?.suggestedKg)>0?Number(ex.suggestedKg)+' kg':'choose starting kg';
  const range=ex?.min===ex?.max?String(ex.min):ex?.min+'–'+ex?.max;
  return String(ex?.name||'Exercise')+' · '+count+' × '+kg+' × '+reps+
   ' reps (range '+range+') · RPE '+(ex?.targetRpe??(10-Number(ex?.rir||3)));
 }

 // Squat strength is the priority: a knee-dominant compound immediately after
 // the barbell squat, followed by rectus-femoris, posterior-chain and core work.
 // If hanging aggravates a shoulder, substitute Cable Crunch without touching the main lift.
 // During Weeks 4–5 sets/intensity taper; Week 6 has no accessories.
 function squatAdaptivePlan(week,storage=global.localStorage){
  if(week>=6)return [];
  const quad=preferredQuadAccessory(storage);
  const selection=global.SXAscensionSelection?.squat?.(week,quad);
  const prescriptions=selection?.length?selection.map(name=>{
   const quadMachine=name==='Hack Squat'||name==='Leg Press';
   const singleLeg=name==='Bulgarian Split Squat';
   const extension=name==='Leg Extension';
   return {name,sets:3,min:quadMachine||singleLeg?8:extension||name==='Cable Crunch'?12:10,
    max:quadMachine||singleLeg?10:extension||name==='Cable Crunch'?15:12,
    targetRpe:name==='45° Back Extension'||name==='Cable Crunch'?7:
     week<=3?8:week===4?7:6.5};
  }):[
   {name:quad,sets:3,min:8,max:10,targetRpe:week<=3?8:week===4?7:6.5},
   {name:'Leg Extension',sets:3,min:12,max:15,targetRpe:week<=3?8:7},
   {name:'45° Back Extension',sets:3,min:10,max:12,targetRpe:7},
   {name:'Hanging Knee Raise',sets:3,min:10,max:15,targetRpe:7}
  ];
  return prescriptions.map(spec=>{
   const base=itemFor(spec.name);
   const item={...base,...spec,rir:10-spec.targetRpe,sourceLift:'Back Squat',week};
   const loading=recommendSquatAccessory(item,week,storage);
   // The squad-specific exercise order and three-set baseline are fixed
   // coach rules, but review the dose against the same central evidence
   // advisory used by other AscensionX support exercises.
   const V=global.SXVolumeIntelligence;
   const group=V?.classify?.(item.name);
   const prior=V?.countExposure?.([{exercises:[{name:'Back Squat',sets:3}]}]);
   const weekly=group?prior?.[group.primary]?.effective||0:0;
   const advisory=V?.recommendWorkingSets?.({
    name:item.name,goal:'powerlifting',experience:'intermediate',
    weeklyExposure:weekly,remainingSlots:2,existingSets:item.sets,
    afterHeavyLift:item.name==='45° Back Extension'
   });
   return {...item,...loading,reason:(item.name==='Hanging Knee Raise'?
    'Controlled trunk flexion, raise the pelvis without swinging. If hanging irritates a shoulder, swap for Cable Crunch. ':item.name==='Bulgarian Split Squat'?
    'Unilateral quad development without a second heavy barbell squat. ':item.name==='Cable Crunch'?
    'Trunk strength without requiring a painful overhead hang. ':'')+loading.reason+' '+
    (base.cue||'Contribute useful support volume without another heavy barbell squat.')+
    (advisory?' Spartan Intelligence: '+advisory.reason+
     ' Current cycle set allocation is a reviewable coach prescription.':'')};
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
  const rir=clamp(week>=4?Math.max(item.rir,3)+(item.cost>=2?1:0):Math.max(item.rir,focus==='strength'?3:2),2,4);
  const ex={...item,sets,rir,targetRpe:10-rir,sourceLift:main,week};
  const rec=recommend(ex,cycleId,week,storage);
  return {...ex,...rec,reason:rec.reason+' '+(item.cue||'Supports '+item.muscles+' without additional heavy spinal loading.')+
    (advisory?' Spartan Intelligence: '+advisory.reason+' The set allocation is a reviewable heuristic.':'')+
    (approvedDelta?' Approved next-cycle set adjustment: '+(approvedDelta>0?'+':'')+approvedDelta+'.':'')};
 }
 // Single selection function shared by draft preview and live cycle plans.
 function rawLiftPlan(lift,week,focus,cycleId,storage=global.localStorage){
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
    .map(ex=>({...ex,sets:3,
     // Maintain accessory volume through loading weeks; lower effort in taper.
     targetRpe:w<=3?7:w===4?6.5:6,rir:w<=3?3:w===4?3.5:4})).map(ex=>({...ex,...recommend(ex,cycleId,w,storage)}));
   return [fixedRdl,...tail];
  }
  if(lift==='Back Squat')return squatAdaptivePlan(w,storage);
  const chosenNames=lift==='Bench Press'&&global.SXAscensionSelection?.bench?
   global.SXAscensionSelection.bench(focus,w):(lift==='Bench Press'&&focus==='strength'&&w<=3?['Iso-Lateral Row','Incline Dumbbell Press','Triceps Pushdown (Bar)','Rear Delt Reverse Fly']:(chosen[lift]||FOCUS_LIFTS.strength[lift]));
  const candidates=pickItems(chosenNames)
   .filter(item=>item.name!=='Romanian Deadlift');
  const cap=16;
  const maxExercises=4;
  const prescribed=candidates.map(item=>{
   const chest=lift==='Bench Press'&&focus==='strength'&&['Incline Dumbbell Press','Machine Chest Press'].includes(item.name);
   if(!chest)return dose(item,w,focus,lift,cycleId,storage);
   const ex=dose({...item,min:8,max:w>=3?10:12,rir:3,cue:'Direct chest development to support bench strength; use a comfortable range and do not press through shoulder pain.'},w,focus,lift,cycleId,storage);
   if(!ex)return null;
   const adjusted={...ex,sets:3,targetRpe:7,rir:3};
   return {...adjusted,...recommend(adjusted,cycleId,w,storage),reason:'Direct chest assistance for bench strength. '+recommend(adjusted,cycleId,w,storage).reason};
  }).filter(Boolean);
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
 function rawSupportExercises(c,prefs,index,week,storage=global.localStorage){
  if(week>=6||!c?.lifts||index<c.lifts.length)return [];
  const profile=supportProfile(c,prefs,index,week,storage);
  const roles=SUPPORT_ROLES[prefs.focus]||SUPPORT_ROLES.strength;
  let names=profile.shortNext&&profile.role==='balanced'?roles.recovery:
   roles[profile.role]||roles.balanced;
  // The standard SBD four-day cycle has a low-RPE secondary squat/bench
  // exposure and direct pulling, delts and arm work. This never changes
  // the three competition-lift prescriptions or already logged sessions.
  const selected=global.SXAscensionSelection?.fourth?.({
   days:prefs.days,lifts:c.lifts,role:profile.role,week,fatigue:profile.fatigue
  });
  if(selected?.length)names=selected;
  // In five-day programmes Saturday and Sunday are consecutive. Do not
  // prescribe the same accessories on both days. Fill with low-fatigue
  // alternatives, maintaining the last-day two-set recovery cap.
  if(prefs.days===5&&index>c.lifts.length){
   const previous=new Set(rawSupportExercises(c,prefs,index-1,week,storage).map(ex=>norm(ex.name)));
   const distinct=names.filter(name=>!previous.has(norm(name)));
   const backup=['Rear Delt Reverse Fly','Seated Calf Raise','Pallof Press',
    'Dumbbell Curl','Triceps Pushdown (Bar)','Lateral Raise','Seated Leg Curl'];
   for(const name of backup){
    if(distinct.length>=3)break;
    if(!previous.has(norm(name))&&!distinct.some(item=>norm(item)===norm(name)))distinct.push(name);
   }
   names=distinct;
  }
  return pickItems(names).map(item=>dose(item,week,prefs.focus,'Support',c.id||null,storage))
   .filter(Boolean).map(item=>{
    const group=['Leg Extension','Seated Leg Curl','Seated Calf Raise','Standing Calf Raise'].includes(item.name)?
     'lower':'upper';
    const core=item.name==='Pallof Press'||item.name==='Hanging Knee Raise';
    const stressed=!core&&profile.fatigue[group];
    // Four-day plans keep three working sets in Weeks 1–5.
    // Reduce target effort rather than silently deleting volume.
    // Five-day plans may use two sets for close-together support sessions.
    const sets=prefs.days===4?3:
     Math.max(1,Math.min(3,item.sets,profile.guarded||stressed?2:3));
    const directArms=item.name==='Dumbbell Curl'||item.name==='Triceps Pushdown (Bar)';
    const supportBench=item.name==='Bench Press';
    const supportSquat=item.name==='Pause Squat';
    const easyRir=week>=4||profile.shortNext||stressed?4:3;
    // Bench assistance is controlled technique/volume work, never a second
    // heavy top-set day. Three working sets in a four-day plan; RPE 7 in
    // normal weeks, easing to RPE 6 when recovery is limited.
    const rir=supportSquat?4:
     directArms||supportBench?easyRir:Math.max(item.rir,easyRir);
    // dose() ran before the final day-specific RPE adjustment. Recalculate
    // the accessory recommendation using the actual prescribed effort.
    const final={...item,sets,rir:Math.min(4,rir),targetRpe:Math.max(6,10-rir),supportRole:profile.role,
     ...(directArms?{min:10,max:15,targetReps:10}:{}),
     reason:item.reason+' Low-fatigue '+profile.role+' assistance, adjusted to selected compounds and recent main-lift effort.'};
    if(supportSquat){
     const tm=currentTrainingMax('Back Squat',storage);
     const pct=week<=3?.60:week===4?.55:.50;
     final.suggestedKg=tm===null?null:Math.max(2.5,Math.round(tm*pct/2.5)*2.5);
     final.targetReps=4;
     final.reason+=' Low-RPE squat practice only; do not grind reps or alter main-lift progression.';
    }else if(supportBench){
     const benchKg=secondaryBenchSuggestion(week,storage);
     const previous=Number(item.suggestedKg)>0?Number(item.suggestedKg):null;
     final.suggestedKg=benchKg===null?null:previous===null?benchKg:Math.min(benchKg,previous);
     final.reason+=' Secondary bench volume at an appropriately low share of the CURRENT AscensionX training max.';
    }else{
     const updated=recommend(final,c.id,week,storage);
     final.suggestedKg=updated.suggestedKg;
     final.targetReps=updated.targetReps; final.evidence=updated.evidence; final.confidence=updated.confidence;
     final.reason+=' '+updated.reason;
    }
    return final;
   });
 }
 // Weekly volume guidance is calculated on the complete selected microcycle,
 // including secondary days and actual classic main-lift working-set counts.
 // It is a planning heuristic, not a measured hypertrophy dose.
 function weeklyVolumePlan(c,prefs,week,storage=global.localStorage){
  const w=Number(week),lifts=c?.lifts||[];
  const slots=lifts.map(lift=>({lift,exercises:rawLiftPlan(lift,w,prefs.focus,c.id,storage)}));
  for(let i=lifts.length;i<prefs.days;i++)slots.push({lift:null,exercises:rawSupportExercises(c,prefs,i,w,storage)});
  const V=global.SXVolumeIntelligence;
  const primary=global.SXAscensionPrescription?.PLAN?.[w-1];
  if(!V||!primary||w<1||w>=6)return slots;
  const goal=prefs.focus==='hypertrophy'?'bodybuilding':prefs.focus==='balanced'?'powerbuilding':'powerlifting';
  const count=primary.deload?3:1+primary.backSets;
  const fatigue=recentMainFatigue(c,storage);
  const protectedSet=(e,slot)=>e.tmPercent===45||e.name==='Romanian Deadlift'||
    (slot.lift===null&&['Bench Press','Pause Squat'].includes(e.name));
  // Preserve technical prescriptions, fixed RDLs, recovery-limited five-day
  // support and athlete-approved next-cycle overrides. Normal baseline is 3.
  const entries=slots.flatMap(slot=>slot.exercises.map(e=>({slot,e,info:V.classify(e.name)})));
  for(const {slot,e} of entries){
   if(protectedSet(e,slot))continue;
   const approved=w<=3&&c.id?global.SXAscensionCycleIntelligence?.adjustment?.(c.id,e.name,storage)||0:0;
   const guarded=slot.lift===null&&prefs.days===5&&e.sets<=2;
   e.sets=approved?clamp(3+approved,2,4):guarded?Math.min(2,e.sets):w>=4&&e.cost>=2?2:3;
  }
  const exposure=()=>V.countExposure(slots.map(slot=>({exercises:[
    ...(slot.lift?[{name:slot.lift,sets:count}]:[]),...slot.exercises]})));
  for(const {slot,e,info} of entries){
   if(!info||protectedSet(e,slot))continue;
   const approved=w<=3&&c.id?global.SXAscensionCycleIntelligence?.adjustment?.(c.id,e.name,storage)||0:0;
   if(approved||slot.lift===null&&prefs.days===5&&e.sets<=2)continue;
   const band=V.bandFor(info.primary,{goal,experience:'intermediate'});
   const effective=exposure()[info.primary]?.effective??0;
   const region=['Quads','Glutes','Hamstrings','Calves'].includes(info.primary)?'lower':'upper';
   const rule=equipmentRules(storage)[norm(e.name)];
   const records=exerciseHistory(e.name,c.id,w,storage,String(rule?.equipmentId||'')).slice(0,2);
   const full=records.length===2&&records.every(r=>r.sets.length>=3&&r.sets.every(s=>
    s.rpe!==''&&s.rpe!=null&&Number(s.rpe)>=6&&Number(s.rpe)<=10));
   const low=full&&records.every(r=>r.sets.every(s=>Number(s.reps)>=e.min&&Number(s.rpe)<=Number(e.targetRpe)+.5));
   const hard=full&&records.every(r=>r.sets.some(s=>Number(s.rpe)>=Math.max(9,Number(e.targetRpe)+1.5)));
   const insufficient=effective<band.min;
   const baseline=e.sets;
   if(hard&&(fatigue[region]||effective>=band.min||w>=4))e.sets=2;
   else if(w<=3&&e.cost<2&&e.sets===3&&insufficient&&low&&!fatigue[region])e.sets=4;
   const why=e.sets>baseline?'Below weekly starting range with two controlled prior exposures; add one low-fatigue set.':
    e.sets<baseline?'Repeated high effort plus fatigue or sufficient exposure; reduce accessory sets.':
    'Keep the normal assistance allocation; no automatic extra set without evidence.';
   e.volumeEvidence={muscle:info.primary,weeklyEffective:effective,targetRange:[band.min,band.max],previousExposures:records.length,controlled:low,highEffort:hard};
   const rec=recommend(e,c.id,w,storage);
   Object.assign(e,rec,{reason:e.reason+' Weekly volume: '+why+' Planned '+info.primary+' exposure '+effective+' effective sets (heuristic range '+band.min+'–'+band.max+').'});
  }
  return slots;
 }
 function buildLiftPlan(lift,week,focus,cycleId,storage=global.localStorage,context=null){
  const active=context||activeCycle(storage);
  if(!active?.lifts?.includes(lift)||active.id!==cycleId)return rawLiftPlan(lift,week,focus,cycleId,storage);
  const prefs={...read(active.id,storage),focus,...(context?.prefs||{})};
  return weeklyVolumePlan(active,prefs,week,storage).find(s=>s.lift===lift)?.exercises||[];
 }
 function supportExercises(c,prefs,index,week,storage=global.localStorage){
  return weeklyVolumePlan(c,prefs,week,storage)[index]?.exercises||[];
 }
 function supportTitle(c,prefs,index,week,storage=global.localStorage){
  const profile=supportProfile(c,prefs,index,week,storage);
  const selected=global.SXAscensionSelection?.fourth?.({
   days:prefs.days,lifts:c.lifts,role:profile.role,week,fatigue:profile.fatigue
  });
  if(selected?.includes('Pause Squat')&&selected.includes('Bench Press'))
   return 'Secondary Squat & Bench - Week '+week;
  const role=profile.role;
  return role.charAt(0).toUpperCase()+role.slice(1)+' Assistance - Week '+week;
 }
 const SUPPORT_CONFIRM_KEY='sx_ascension_support_confirm_v1';
 function supportCandidates(c,day,week,storage=global.localStorage){
  try{
   const sessions=JSON.parse(storage.getItem('spartx_db')||'{}')?.sessions;
   if(!Array.isArray(sessions))return [];
   return sessions.filter(s=>{
    if(s?.id==null||!Number.isFinite(Date.parse(s.date))||Date.parse(s.date)<Date.parse(c.id))return false;
    const ex=s.exercises||[];
    if(!ex.some(e=>(e.sets||[]).some(z=>z.done===true&&!/^(w|warm.?up|cardio)$/i.test(String(z.type||''))&&Number.isFinite(Number(z.weight))&&Number(z.weight)>=0&&Number.isInteger(Number(z.reps))&&Number(z.reps)>0)))return false;
    const links=ex.map(e=>e.sxPowerbuildingSupport).filter(Boolean);
    if(links.length)return links.every(l=>l.cycleId===c.id&&Number(l.week)===week&&String(l.day).toUpperCase()===day);
    if(ex.some(e=>e.ascensionLink||e.bodybuildingLink||e.sxStrengthSizeCompanion)||read(c.id,storage).days!==4||day!=='SAT')return false;
    const name=String(s.name||'').trim().replace(/[–—·]/g,'-');
    return new RegExp('^(?:(?:Upper|Lower|Balanced|Adaptive) Assistance|Secondary Squat & Bench|Secondary Bench & Assistance|Secondary Squat & Assistance)\\s*-\\s*Week\\s+'+week+'$','i').test(name);
   }).map(s=>({id:String(s.id),name:String(s.name||'Assistance workout'),date:s.date,sets:(s.exercises||[]).reduce((n,e)=>n+(e.sets||[]).filter(z=>z.done===true).length,0)}));
  }catch(_){return []}
 }
 function confirmSavedSupport(id,storage=global.localStorage){
  const c=activeCycle(storage),p=c&&pendingSupportDay(c,storage);
  if(!p||!supportCandidates(c,p.day,p.week,storage).some(s=>s.id===String(id)))return false;
  let data={};try{data=JSON.parse(storage.getItem(SUPPORT_CONFIRM_KEY)||'{}')||{}}catch(_){}
  if(typeof data!=='object'||Array.isArray(data))data={};
  data[c.id+'|'+p.week+'|'+p.day]=String(id);
  storage.setItem(SUPPORT_CONFIRM_KEY,JSON.stringify(data));return true;
 }
 function completedSupportDay(c,day,week,expected,storage){
  try{const id=JSON.parse(storage.getItem(SUPPORT_CONFIRM_KEY)||'{}')[c.id+'|'+week+'|'+day];if(typeof id==='string'&&supportCandidates(c,day,week,storage).some(s=>s.id===id))return true;}catch(_){}
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
     return link?.cycleId===c.id&&Number(link.week)===week&&String(link.day).toUpperCase()===day;
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
 // Keep the next unfinished assistance session available to select even
 // before the primary lifts are complete. Only pendingSupportDay determines
 // automatic Continue order. Manual scheduling never changes main counters.
 function selectableSupportDay(cycleArg,storage=global.localStorage){
  const c=cycleArg||activeCycle(storage);
  if(!c||!read(c.id,storage).enabled)return null;
  const pending=pendingSupportDay(c,storage);
  if(pending)return {...pending,ready:true};
  const layout=schedule(c,storage);
  if(!layout.valid)return null;
  const slot=layout.slots.find(x=>x.kind==='support'&&x.week<6&&x.exercises?.length&&
    !completedSupportDay(c,x.day,x.week,x.exercises,storage));
  return slot?{...slot,ready:false}:null;
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
      buildLiftPlan(lift,week,focus,holder.id,storage,{...holder,prefs})};
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
    '<details class="sx-adaptive-details" id="sxAscEquipmentSettings">',
    '<summary>OPTIONAL EQUIPMENT LOAD SETTINGS</summary>',
    '<p class="sx-adaptive-intro">Optional: enter a known increment for equipment with consistent loading. Cable stacks and machines differ between gyms; leave them unset and use your own logged weight and target RPE. No equipment setup is required.</p>',
    '<div class="field"><label for="sxAscEquipmentExercise">Exercise</label><select id="sxAscEquipmentExercise"></select></div>',
    '<div class="sx-adaptive-fields"><div class="field"><label for="sxAscEquipmentStep">Increment (kg)</label><input id="sxAscEquipmentStep" type="number" min="0.25" max="100" step="any" placeholder="e.g. 5"></div>',
    '<div class="field"><label for="sxAscEquipmentOffset">Starting offset (kg)</label><input id="sxAscEquipmentOffset" type="number" min="0" step="any" placeholder="0"></div></div>',
    '<button type="button" class="secondary" id="sxAscEquipmentSave">SAVE LOAD RULE</button> <button type="button" class="secondary" id="sxAscEquipmentClear">CLEAR RULE</button>',
    '<p class="sx-adaptive-status" id="sxAscEquipmentStatus" role="status" aria-live="polite"></p>',
   '</details>',
   '<p class="sx-adaptive-rule">The same live prescriptions apply to the remaining weeks of your active AscensionX cycle. Main-lift top sets and back-down sets remain unchanged.</p>',
    '<details id="sxAscAdaptivePlanDetails" class="sx-adaptive-details" open>',
     '<summary>YOUR TRAINING DAYS · LIVE PROGRAMME <span aria-hidden="true">⌄</span></summary>',
     '<div id="sxAscAdaptivePreview" class="sx-adaptive-preview"></div>',
    '</details>',
   '</div>',
   '<p id="sxAscAdaptiveStatus" class="sx-adaptive-status" role="status" aria-live="polite"></p>'
  ].join('');
  anchor.insertAdjacentElement('afterend',card);
  const equipmentPicker=document.getElementById('sxAscEquipmentExercise');
  const equipmentNames=[...new Set([...Object.values(LIB).flat().map(x=>x.name),
   ...Object.values(FOURTH).flat(Infinity).map(x=>typeof x==='string'?x:x?.name),...Object.keys(ADDITIONAL),'Hack Squat','Leg Press','Bulgarian Split Squat','Cable Crunch','Pause Squat'])].filter(Boolean).sort();
  for(const name of equipmentNames){const option=document.createElement('option');option.value=name;option.textContent=name;equipmentPicker.appendChild(option)}
  const equipmentStep=document.getElementById('sxAscEquipmentStep'),equipmentOffset=document.getElementById('sxAscEquipmentOffset'),equipmentStatus=document.getElementById('sxAscEquipmentStatus');
  function showRule(){const rule=equipmentRules()[norm(equipmentPicker.value)];equipmentStep.value=rule?.step??'';equipmentOffset.value=rule?.offset??0;equipmentStatus.textContent=rule?'Confirmed increment for '+equipmentPicker.value:'Optional — no increment required. Use your recorded working weight and target RPE.'}
  equipmentPicker.addEventListener('change',showRule);
  document.getElementById('sxAscEquipmentSave').addEventListener('click',()=>{try{setEquipment(equipmentPicker.value,{step:equipmentStep.value,offset:equipmentOffset.value});showRule();render()}catch(_){equipmentStatus.textContent='Enter a positive increment and an offset smaller than that increment.'}});
  document.getElementById('sxAscEquipmentClear').addEventListener('click',()=>{try{setEquipment(equipmentPicker.value,null);showRule();render()}catch(_){equipmentStatus.textContent='Unable to clear the setting.'}});
  showRule();
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
     const headline=document.createElement('strong');
     headline.className='sx-adaptive-exercise-name';
     headline.textContent=ex.name;
     const prescription=document.createElement('span');
     prescription.className='sx-adaptive-exercise-dose';
     prescription.textContent=formatPrescription(ex).split(' · ').slice(1).join(' · ');
     const context=document.createElement('small');
     context.className='sx-adaptive-exercise-why';
     // Show exercise rationale without inventing readiness scores.
     context.textContent=String(ex.reason||'Assistance selected for your strength priority.');
     line.append(headline,prescription,context);
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
 global.SXAscensionAdaptive=Object.freeze({KEY,LIB,FOURTH,FOCUS_LIFTS,SUPPORT_ROLES,activeCycle,read,enabled,save,plan,previewSchedule,schedule,pendingSupportDay,selectableSupportDay,supportCandidates,confirmSavedSupport,recommend,equipmentRules,setEquipment,formatPrescription,weeklyVolumePlan,beginEditor,discardDraft,commitDraft,previewEnabled,refreshEditor});
 if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',mountEditor,{once:true});
 else mountEditor();
})(window);
