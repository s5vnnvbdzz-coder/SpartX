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
      {name:'Chest-Supported Row',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Triceps Pushdown',sets:2,min:10,max:15,rir:3,rest:90}
    ],
    'Deadlift':[
      {name:'Lat Pulldown',sets:2,min:8,max:12,rir:3,rest:120},
      {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:90}
    ],
    'Overhead Press':[
      {name:'Lateral Raise',sets:2,min:12,max:20,rir:3,rest:75},
      {name:'Rear Delt Fly',sets:2,min:12,max:20,rir:3,rest:75}
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
    const active=cycle(storage);
    if(!active)return {cycleId:null,enabled:false,powerbuilding:false,trainingDays:4,volume:'balanced',excluded:[]};
    try{
      const raw=storage.getItem(STORAGE);
      if(!raw||raw.length>25000)return {cycleId:active.id,enabled:false,powerbuilding:false,trainingDays:4,volume:'balanced',excluded:[]};
      const entries=JSON.parse(raw);
      const saved=entries?.[active.id]||{};
      return {cycleId:active.id,enabled:saved.enabled===true,
        powerbuilding:saved.powerbuilding===true,
        trainingDays:[3,4,5].includes(Number(saved.trainingDays))?Number(saved.trainingDays):4,
        volume:saved.volume==='low'?'low':'balanced',
        excluded:Array.isArray(saved.excluded)?saved.excluded.filter(x=>LIFTS.includes(x)) :[]};
    }catch(_){return {cycleId:active.id,enabled:false,powerbuilding:false,trainingDays:4,volume:'balanced',excluded:[]}}
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
    const volume=opts.volume==='low'?'low':'balanced';
    const extra=opts.powerbuilding?{
      'Back Squat':[{name:'Standing Calf Raise',sets:2,min:10,max:15,rir:3,rest:75}],
      'Bench Press':[{name:'Cable Curl',sets:2,min:10,max:15,rir:3,rest:75}],
      'Deadlift':[{name:'Rear Delt Fly',sets:2,min:12,max:20,rir:3,rest:75}],
      'Overhead Press':[{name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75}]
    }[main]:[];
    return PROFILES[main].concat(extra||[]).map((item,index)=>{
      // During peak week, one low-fatigue accessory per lift.
      const sets=w===5&&index>0?0:setCount(item.sets,w,volume);
      return {...item,sets,sourceLift:main,week:w};
    }).filter(x=>x.sets>0);
  }
  function forImport(details,existingNames=[],storage=global.localStorage){
    const active=cycle(storage),p=preference(storage);
    if(!active||!p.enabled||p.cycleId!==active.id)return [];
    if(details?.source!=='AscensionX'||details.cycleId!==active.id)return [];
    const main=canonical(details.exercise),week=Number(details.week);
    if(!main||!active.lifts.includes(main)||p.excluded.includes(main))return [];
    if(!Number.isInteger(week)||week<1||week>6)return [];
    // Existing paused bench and RDL are owned by their original AscensionX
    // accessory modules. Neither is generated or modified here.
    const exists=new Set(existingNames.map(normName));
    return plan(main,week,{volume:p.volume,powerbuilding:p.powerbuilding})
      .filter(item=>!exists.has(normName(item.name)))
      .map(item=>({
        name:item.name,rest:item.rest,
        notes:'AscensionX Strength & Size companion · '+main+' · Week '+week+
          ' · '+item.min+'–'+item.max+' reps · ~'+item.rir+
          ' reps in reserve. Optional. Does not affect AscensionX cycle progression.',
        sxStrengthSizeCompanion:{cycleId:active.id,lift:main,week,
          targetRir:item.rir,repsMin:item.min,repsMax:item.max,plannedSets:item.sets},
        sets:Array.from({length:item.sets},()=>({
          weight:'',reps:String(item.min),rpe:'',type:'Working Set',done:false
        }))
      }));
  }
  /* Powerbuilding is scheduling guidance, not a second AscensionX cycle.
     Each primary lift remains owned by its own existing AscensionX import. */
  const WEEKDAYS={3:['MON','WED','SAT'],4:['MON','TUE','THU','SAT'],5:['MON','TUE','THU','SAT','SUN']};
  function supportExercises(position,week){
    if(week>=5)return [];
    const slots=[
      [{name:'Machine Chest Press',sets:2,min:10,max:15,rir:3,rest:90},
       {name:'Seated Cable Row',sets:2,min:10,max:15,rir:3,rest:90},
       {name:'Leg Extension',sets:2,min:12,max:15,rir:3,rest:90},
       {name:'Standing Calf Raise',sets:2,min:12,max:20,rir:3,rest:75}],
      [{name:'Cable Curl',sets:2,min:10,max:15,rir:3,rest:75},
       {name:'Triceps Pushdown',sets:2,min:10,max:15,rir:3,rest:75},
       {name:'Pallof Press',sets:2,min:10,max:15,rir:3,rest:75},
       {name:'Seated Calf Raise',sets:2,min:12,max:20,rir:3,rest:75}]
    ];
    return slots[position%slots.length].map(item=>({...item,sets:week===4?1:item.sets}));
  }
  function schedule(days,storage=global.localStorage){
    const active=cycle(storage),preferenceData=preference(storage);
    if(!active)return {valid:false,message:'Create an AscensionX cycle before enabling Powerbuilding.',slots:[]};
    const count=[3,4,5].includes(Number(days))?Number(days):preferenceData.trainingDays;
    const lifts=(count===3?['Back Squat','Deadlift','Bench Press','Overhead Press']:LIFTS).filter(l=>active.lifts.includes(l));
    if(count<lifts.length)return {valid:false,message:
      'Your AscensionX cycle has '+lifts.length+' primary lifts, but you selected '+count+
      ' training days. Choose at least '+lifts.length+' days so separately imported main lifts are not combined unsafely.',slots:[]};
    const week=Math.max(1,Math.min(6,Number(active.currentWeek)||1));
    const slots=WEEKDAYS[count].map((day,index)=>{
      const lift=lifts[index];
      return lift?{day,kind:'ascension',title:lift+' · AscensionX',lift,
        exercises:plan(lift,week,{volume:preferenceData.volume,powerbuilding:true})}:
        {day,kind:'support',title:index===count-1?'Arms, Calves & Core':'Controlled Hypertrophy',
        lift:null,exercises:supportExercises(index-lifts.length,week)};
    });
    return {valid:true,message:'A suggested weekly layout: move sessions when needed and reassess effort, soreness and performance.',week,slots};
  }
  global.SXAscensionCompanion=Object.freeze({
    STORAGE,CYCLE_STORAGE,LIFTS,PROFILES,canonical,cycle,preference,savePreference,plan,forImport,schedule,supportExercises
  });
})(window);