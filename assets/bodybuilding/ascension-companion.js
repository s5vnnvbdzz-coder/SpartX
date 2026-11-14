/* SpartanX AscensionX Strength & Size Companion
 * Optional assistance after an imported six-week AscensionX compound lift.
 * Never changes AscensionX cycle, loads, weeks, or cycle completion.
 * Uses conservative accessory sets, with week 6 reserved for recovery.
 */
(function(global){
  'use strict';
  const STORAGE='sx_ascension_companion_v1';
  const CYCLE_STORAGE='ascensionx_strength_v1';
  const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
  const PROFILES={
    'Back Squat':[
      {name:'Leg Press',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Seated Leg Curl',sets:2,min:10,max:15,rir:3,rest:90}
    ],
    'Bench Press':[
      {name:'Iso-Lateral Row',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Triceps Pushdown (Bar)',sets:2,min:10,max:15,rir:3,rest:90}
    ],
    'Deadlift':[
      {name:'Lat Pulldown',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:90}
    ],
    'Overhead Press':[
      {name:'Lateral Raise',sets:2,min:12,max:20,rir:3,rest:75},
      {name:'Rear Delt Reverse Fly',sets:2,min:12,max:20,rir:3,rest:75}
    ]
  };
  // Coach-style sessions: the main lift and all its warm-up/ramp sets are
  // already supplied by AscensionX. The following are accessory working sets.
  const POWER_PROFILES={
    'Back Squat':[
      {name:'Lying Leg Curl',sets:2,min:10,max:15,rir:3,rest:90},
      {name:'Leg Extension',sets:2,min:10,max:15,rir:3,rest:90},
      {name:'Walking Lunge',sets:2,min:8,max:12,rir:3,rest:120}
    ],
    'Bench Press':[
      {name:'Lat Pulldown',sets:3,min:8,max:12,rir:3,rest:120},
      {name:'Iso-Lateral Row',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Rear Delt Reverse Fly',sets:2,min:12,max:20,rir:3,rest:75}
    ],
    'Deadlift':[
      {name:'Lying Leg Curl',sets:2,min:10,max:15,rir:3,rest:90},
      {name:'Standing Calf Raise',sets:2,min:12,max:20,rir:3,rest:75},
      {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75}
    ],
    'Overhead Press':[
      {name:'Incline Dumbbell Press',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Dumbbell Row',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Triceps Pushdown (Bar)',sets:2,min:10,max:15,rir:3,rest:75},
      {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:3,rest:75}
    ]
  };
  const canonical=name=>{
    const n=String(name||'').trim().toLowerCase();
    if(/^(?:back |barbell )?squats?$/.test(n))return 'Back Squat';
    if(/^(?:barbell )?bench press$/.test(n))return 'Bench Press';
    if(/^(?:(?:conventional|sumo) )?deadlift$/.test(n))return 'Deadlift';
    if(/^(?:overhead press|ohp)$/.test(n))return 'Overhead Press';
    return null;
  };
  const normName=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function cycle(storage=global.localStorage){
    try{
      const state=JSON.parse(storage.getItem(CYCLE_STORAGE)||'null');
      const c=state?.cycle;
      if(!c||typeof c.created!=='string'||!Number.isFinite(Date.parse(c.created)))return null;
      const lifts=(Array.isArray(c.exercises)?c.exercises:[]).map(canonical).filter(Boolean);
      const selected=[...new Set(lifts)];
      if(!selected.length)return null;
      return {id:c.created,lifts:selected,weeks:c.weeks||{},currentWeek:c.currentWeek||1,
        accessories:c.accessories||{}};
    }catch(_){return null}
  }
  function preference(storage=global.localStorage){
    // Adaptive Programming is the ONLY automated source of supporting lifts.
    // Old Powerbuilding/Strength & Size preferences are ignored but left in
    // storage so already-recorded training history is never modified.
    const active=cycle(storage);
    if(!active)return {cycleId:null,enabled:false,powerbuilding:false,trainingDays:4,volume:'balanced',excluded:[]};
    const adaptive=global.SXAscensionAdaptive?.read(active.id,storage);
    const enabled=adaptive?.enabled===true;
    return {cycleId:active.id,enabled,powerbuilding:enabled,
      trainingDays:adaptive?.days||4,volume:'balanced',excluded:[],adaptive:enabled};
  }
  function savePreference(update,storage=global.localStorage){
    const active=cycle(storage);
    if(!active)return null;
    let all={};
    try{
      const raw=storage.getItem(STORAGE);
      if(raw&&raw.length<=25000){
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))all=parsed;
      }
    }catch(_){}
    const prev=preference(storage);
    all[active.id]={
      enabled:update.powerbuilding===true?true:(update.enabled===undefined?prev.enabled:update.enabled===true),
      powerbuilding:update.enabled===false?false:(update.powerbuilding===undefined?prev.powerbuilding:update.powerbuilding===true),
      trainingDays:[3,4,5].includes(Number(update.trainingDays))?Number(update.trainingDays):prev.trainingDays,
      volume:update.volume==='low'?'low':update.volume==='balanced'?'balanced':prev.volume,
      excluded:Array.isArray(update.excluded)?update.excluded.filter(x=>active.lifts.includes(x)):prev.excluded
    };
    // Avoid storing indefinitely many old local cycle preferences.
    const ids=Object.keys(all);
    if(ids.length>20)ids.slice(0,ids.length-20).forEach(k=>delete all[k]);
    storage.setItem(STORAGE,JSON.stringify(all));
    return preference(storage);
  }
  function setCount(base,week,volume){
    if(week===6)return 0;
    // Week 1–3: controlled stimulus, Week 4: reduce, Week 5: taper.
    let sets=volume==='low'?Math.max(1,base-1):base;
    if(week===4)sets=Math.max(1,sets-1);
    if(week===5)sets=1;
    return sets;
  }
  function plan(lift,week,opts={}){
    const main=canonical(lift),w=Number(week);
    if(!main||!Number.isInteger(w)||w<1||w>6)return [];
    if(!global.SXAscensionAdaptive?.enabled())return [];
    return global.SXAscensionAdaptive.plan(main,w,opts);
  }
  function forImport(details,existingNames=[],storage=global.localStorage){
    const active=cycle(storage),p=preference(storage);
    if(!active||!p.enabled||!p.adaptive||p.cycleId!==active.id)return [];
    if(details?.source!=='AscensionX'||details.cycleId!==active.id)return [];
    const main=canonical(details.exercise),week=Number(details.week);
    if(!main||!active.lifts.includes(main)||p.excluded.includes(main))return [];
    if(!Number.isInteger(week)||week<1||week>6)return [];
    // No legacy RDL/paused-bench insertion; only adaptive-selected exercises.
    const exists=new Set(existingNames.map(normName));
    return plan(main,week,{volume:p.volume,powerbuilding:p.powerbuilding,lifts:active.lifts})
      .filter(item=>!exists.has(normName(item.name)))
      .map(item=>({
        name:item.name,rest:item.rest,
        notes:(p.adaptive?'AscensionX Adaptive Programming':'AscensionX Strength & Size companion')+' · '+main+' · Week '+week+
          ' · '+item.min+'–'+item.max+' reps · ~'+item.rir+
          ' reps in reserve. Optional. Does not affect AscensionX cycle progression.'+
          (item.reason?' '+item.reason:''),
        sxStrengthSizeCompanion:{cycleId:active.id,lift:main,week,adaptive:p.adaptive===true,
          targetRir:item.rir,repsMin:item.min,repsMax:item.max,plannedSets:item.sets},
        sets:Array.from({length:item.sets},()=>({
          weight:Number(item.suggestedKg)>0?String(item.suggestedKg):'',reps:String(item.targetReps||item.min),
          rpe:'',type:'Working Set',done:false
        }))
      }));
  }
  /* Powerbuilding is scheduling guidance, not a second AscensionX cycle.
     Each primary lift remains owned by its own existing AscensionX import. */
  const WEEKDAYS={3:['MON','WED','SAT'],4:['MON','TUE','THU','SAT'],5:['MON','TUE','THU','SAT','SUN']};
  function supportExercises(position,week,lifts=[],lastDay=false,trainingDays=4){
    if(week>=5)return [];
    // Upper B fills the coached fourth-day slot when AscensionX has no OHP.
    // It is moderate hypertrophy work, not another 5/3/1-style main lift.
    if(trainingDays===4&&lastDay&&lifts.includes('Bench Press')&&!lifts.includes('Overhead Press')){
      const upper=[
        {name:'Incline Dumbbell Press',sets:2,min:8,max:12,rir:3,rest:120},
        {name:'Dumbbell Row',sets:2,min:8,max:12,rir:3,rest:120},
        {name:'Machine Chest Press',sets:2,min:10,max:15,rir:3,rest:90},
        {name:'Lat Pulldown',sets:2,min:10,max:15,rir:3,rest:90},
        {name:'Triceps Pushdown (Bar)',sets:2,min:10,max:15,rir:3,rest:75},
        {name:'Dumbbell Curl',sets:2,min:10,max:15,rir:3,rest:75}
      ];
      return upper.map(item=>({...item,sets:week===4?1:item.sets}));
    }
    // Keep the day immediately before the next week light on lower-body
    // and spinal loading. Heavy compound work belongs to AscensionX.
    const low=[
      {name:'Cable Curl',sets:2,min:10,max:15,rir:3,rest:75},
      {name:'Triceps Pushdown (Bar)',sets:2,min:10,max:15,rir:3,rest:75},
      {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75},
      {name:'Seated Calf Raise',sets:2,min:12,max:20,rir:3,rest:75}
    ];
    const balanced=[
      {name:'Machine Chest Press',sets:2,min:10,max:15,rir:3,rest:90},
      {name:'Cable Curl',sets:2,min:10,max:15,rir:3,rest:75},
      {name:'Rear Delt Reverse Fly',sets:2,min:12,max:20,rir:3,rest:75},
      {name:'Standing Calf Raise',sets:2,min:12,max:20,rir:3,rest:75}
    ];
    let items=lastDay?low:balanced;
    // Supply a missing lower-body movement only when no AscensionX squat is
    // prescribed, rather than layering redundant heavy work onto squat day.
    if(!lifts.includes('Back Squat')){
      const lower={name:'Leg Press',sets:2,min:10,max:15,rir:3,rest:120};
      items=lastDay?[lower,...items.slice(0,3)]:[lower,...items.slice(1)];
    }
    if(!lifts.includes('Back Squat')&&!lifts.includes('Deadlift')){
      const curl={name:'Seated Leg Curl',sets:2,min:10,max:15,rir:3,rest:90};
      items=[...items.slice(0,items.length-1),curl];
    }
    return items.map(item=>({...item,sets:week===4?1:item.sets}));
  }
  function schedule(days,storage=global.localStorage){
    const active=cycle(storage),prefs=preference(storage);
    if(!active)return {valid:false,message:'Create an AscensionX cycle before scheduling support.',slots:[]};
    if(!prefs.adaptive)return {valid:false,message:'Enable Adaptive Programming in AscensionX Manage Cycle.',slots:[]};
    return global.SXAscensionAdaptive.schedule(null,storage);
  }
  global.SXAscensionCompanion=Object.freeze({
    STORAGE,CYCLE_STORAGE,LIFTS,PROFILES,POWER_PROFILES,canonical,cycle,preference,savePreference,plan,forImport,schedule,supportExercises
  });
})(window);