/* SpartanX Strength & Bodybuilding programme model.
 * Independent planning storage: never edits spartx_db or AscensionX/5-3-1 cycles.
 * v1: build, validate, save, edit, delete, set active. Workout import is a
 * deliberately separate integration step.
 */
(function (global) {
  'use strict';
  const KEY='sx_bodybuilding_programmes_v1';
  const DAYS=[3,4,5,6], WEEKS=[4,6,8,12];
  const KINDS=['bodybuilding','hybrid'], PRIORITIES=['balanced','upper','lower'];
  const EXPERIENCES=['beginner','intermediate','advanced'];
  const defaults={kind:'bodybuilding',days:4,weeks:8,priority:'balanced',experience:'intermediate'};
  const fin=n=>Number.isFinite(Number(n));
  const bounded=(n,min,max,fallback)=>{
    const value=Number(n);
    return Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
  };
  const clean=(s,max=90)=>String(s==null?'':s).trim().slice(0,max);
  const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  const tuple=(name,sets,repsMin,repsMax,rir=2,restSeconds=120)=>({name,sets,repsMin,repsMax,rir,restSeconds,startingKg:0,progression:'double'});
  const U_A=[
    tuple('Bench Press',3,6,10,2,150),tuple('Chest-Supported Row',3,8,12),
    tuple('Incline Dumbbell Press',3,8,12),tuple('Lat Pulldown',3,8,12),
    tuple('Lateral Raise',3,12,20,2,75),tuple('Triceps Pushdown',2,10,15),
    tuple('Dumbbell Curl',2,10,15)
  ];
  const U_B=[
    tuple('Overhead Press',3,6,10,2,150),tuple('Seated Cable Row',3,8,12),
    tuple('Machine Chest Press',3,8,12),tuple('Pull-Up',3,6,10),
    tuple('Cable Lateral Raise',3,12,20,2,75),tuple('Cable Curl',2,10,15),
    tuple('Overhead Triceps Extension',2,10,15)
  ];
  const L_A=[
    tuple('Back Squat',3,6,10,2,180),tuple('Romanian Deadlift',3,8,12,2,150),
    tuple('Leg Press',3,10,15,2,150),tuple('Seated Leg Curl',3,10,15),
    tuple('Standing Calf Raise',3,10,15)
  ];
  const L_B=[
    tuple('Hack Squat',3,8,12,2,150),tuple('Hip Thrust',3,8,12),
    tuple('Bulgarian Split Squat',3,8,12),tuple('Lying Leg Curl',3,10,15),
    tuple('Seated Calf Raise',3,10,15)
  ];
  const FULL_A=[tuple('Back Squat',3,6,10),tuple('Bench Press',3,6,10),tuple('Chest-Supported Row',3,8,12),tuple('Seated Leg Curl',2,10,15),tuple('Lateral Raise',2,12,20),tuple('Cable Curl',2,10,15)];
  const FULL_B=[tuple('Romanian Deadlift',3,8,12),tuple('Incline Dumbbell Press',3,8,12),tuple('Lat Pulldown',3,8,12),tuple('Leg Extension',2,10,15),tuple('Overhead Triceps Extension',2,10,15),tuple('Standing Calf Raise',2,10,15)];
  const FULL_C=[tuple('Leg Press',3,10,15),tuple('Overhead Press',3,6,10),tuple('Seated Cable Row',3,8,12),tuple('Hip Thrust',2,8,12),tuple('Chest Fly',2,12,15),tuple('Dumbbell Curl',2,10,15)];
  const PUSH=[tuple('Bench Press',3,6,10),tuple('Incline Dumbbell Press',3,8,12),tuple('Overhead Press',3,8,12),tuple('Lateral Raise',3,12,20),tuple('Triceps Pushdown',3,10,15)];
  const PULL=[tuple('Chest-Supported Row',3,8,12),tuple('Lat Pulldown',3,8,12),tuple('Seated Cable Row',2,10,15),tuple('Rear Delt Fly',3,12,20),tuple('Dumbbell Curl',3,10,15)];
  const LEGS=[tuple('Back Squat',3,6,10),tuple('Romanian Deadlift',3,8,12),tuple('Leg Press',3,10,15),tuple('Lying Leg Curl',3,10,15),tuple('Standing Calf Raise',3,10,15)];
  const TEMPLATES={
    3:[['Full Body A',FULL_A],['Full Body B',FULL_B],['Full Body C',FULL_C]],
    4:[['Upper A',U_A],['Lower A',L_A],['Upper B',U_B],['Lower B',L_B]],
    5:[['Upper',U_A],['Lower',L_A],['Push',PUSH],['Pull',PULL],['Legs',LEGS]],
    6:[['Push A',PUSH],['Pull A',PULL],['Legs A',LEGS],['Push B',U_B],['Pull B',PULL],['Legs B',L_B]]
  };
  function buildDays(days=4,priority='balanced'){
    const d=DAYS.includes(Number(days))?Number(days):4;
    return TEMPLATES[d].map(([label,exercises])=>{
      const list=exercises.map(e=>({...e,id:uid()}));
      // A small extra emphasis is a planning suggestion, not a universal target.
      if(priority==='upper' && /upper|push|pull/i.test(label)) {
        const found=list.find(e=>/lateral raise|chest fly|lat pulldown/i.test(e.name));
        if(found)found.sets=Math.min(8,found.sets+1);
      }
      if(priority==='lower'&& /lower|legs/i.test(label)){
        const found=list.find(e=>/leg curl|leg press|leg extension/i.test(e.name));
        if(found)found.sets=Math.min(8,found.sets+1);
      }
      return {id:uid(),name:label,exercises:list};
    });
  }
  function fresh(options={}){
    const kind=KINDS.includes(options.kind)?options.kind:defaults.kind;
    const days=DAYS.includes(Number(options.days))?Number(options.days):defaults.days;
    const weeks=WEEKS.includes(Number(options.weeks))?Number(options.weeks):defaults.weeks;
    const priority=PRIORITIES.includes(options.priority)?options.priority:defaults.priority;
    const experience=EXPERIENCES.includes(options.experience)?options.experience:defaults.experience;
    const now=new Date().toISOString();
    return {id:uid(),name:clean(options.name)||'My Bodybuilding Programme',kind,days,weeks,priority,experience,
      createdAt:now,updatedAt:now,sessions:buildDays(days,priority)};
  }
  function exercise(raw){
    if(!raw||typeof raw!=='object')return null;
    const name=clean(raw.name,110);
    if(!name)return null;
    const sets=Math.round(bounded(raw.sets,1,8,3));
    const repsMin=Math.round(bounded(raw.repsMin,1,40,8));
    const repsMax=Math.round(bounded(raw.repsMax,repsMin,50,Math.max(12,repsMin)));
    const rir=Math.round(bounded(raw.rir,0,5,2));
    const restSeconds=Math.round(bounded(raw.restSeconds,30,600,120)/15)*15;
    const startingKg=Math.round(bounded(raw.startingKg,0,1000,0)*2)/2;
    return {id:clean(raw.id,64)||uid(),name,sets,repsMin,repsMax,rir,restSeconds,startingKg,progression:'double'};
  }
  function normalize(raw){
    if(!raw||typeof raw!=='object')return null;
    const days=DAYS.includes(Number(raw.days))?Number(raw.days):4;
    const weeks=WEEKS.includes(Number(raw.weeks))?Number(raw.weeks):8;
    const sessions=Array.isArray(raw.sessions)?raw.sessions.slice(0,6).map((session,i)=>{
      const exercises=Array.isArray(session?.exercises)?session.exercises.slice(0,20).map(exercise).filter(Boolean):[];
      return {id:clean(session?.id,64)||uid(),name:clean(session?.name,65)||'Training Day '+(i+1),exercises};
    }):[];
    if(sessions.length!==days||sessions.some(s=>!s.exercises.length))return null;
    return {
      id:clean(raw.id,64)||uid(),name:clean(raw.name,80)||'Bodybuilding Programme',
      kind:KINDS.includes(raw.kind)?raw.kind:'bodybuilding',
      days,weeks,
      priority:PRIORITIES.includes(raw.priority)?raw.priority:'balanced',
      experience:EXPERIENCES.includes(raw.experience)?raw.experience:'intermediate',
      createdAt:clean(raw.createdAt,40)||new Date().toISOString(),
      updatedAt:clean(raw.updatedAt,40)||new Date().toISOString(),
      sessions
    };
  }
  function read(storage=global.localStorage){
    try{
      const raw=storage.getItem(KEY);
      if(!raw||raw.length>2000000)return {version:1,activeId:null,programmes:[]};
      const parsed=JSON.parse(raw);
      const programmes=(Array.isArray(parsed?.programmes)?parsed.programmes:[]).slice(0,30).map(normalize).filter(Boolean);
      const activeId=programmes.some(p=>p.id===parsed.activeId)?parsed.activeId:(programmes[0]?.id||null);
      return {version:1,activeId,programmes};
    }catch(_){return {version:1,activeId:null,programmes:[]}}
  }
  function write(store,storage=global.localStorage){
    const programmes=(Array.isArray(store?.programmes)?store.programmes:[]).slice(0,30).map(normalize).filter(Boolean);
    const activeId=programmes.some(p=>p.id===store?.activeId)?store.activeId:(programmes[0]?.id||null);
    const finalStore={version:1,activeId,programmes};
    storage.setItem(KEY,JSON.stringify(finalStore));
    return finalStore;
  }
  function save(store,program,storage=global.localStorage){
    const normalized=normalize({...program,updatedAt:new Date().toISOString()});
    if(!normalized)throw Error('Every training day must contain at least one exercise with valid set and rep targets.');
    const previous=store.programmes.find(p=>p.id===normalized.id);
    if(previous)normalized.createdAt=previous.createdAt;
    const programmes=store.programmes.filter(p=>p.id!==normalized.id);
    if(programmes.length>=30)throw Error('A maximum of 30 saved programmes is supported.');
    programmes.push(normalized);
    return write({...store,activeId:normalized.id,programmes},storage);
  }
  function remove(store,id,storage=global.localStorage){
    const programmes=store.programmes.filter(p=>p.id!==id);
    return write({...store,activeId:store.activeId===id?programmes[0]?.id:null,programmes},storage);
  }
  function activate(store,id,storage=global.localStorage){
    if(!store.programmes.some(p=>p.id===id))return store;
    return write({...store,activeId:id},storage);
  }
  function summary(program){
    const sessions=Array.isArray(program?.sessions)?program.sessions:[];
    const exercises=sessions.reduce((n,d)=>n+d.exercises.length,0);
    const sets=sessions.reduce((total,d)=>total+d.exercises.reduce((n,e)=>n+e.sets,0),0);
    return {sessions:sessions.length,exercises,sets,weeklySets:sets,plannedSessions:sessions.length*Number(program?.weeks||8)};
  }
  global.SXBodybuildingModel=Object.freeze({KEY,DAYS,WEEKS,KINDS,PRIORITIES,EXPERIENCES,
    fresh,buildDays,exercise,normalize,read,write,save,remove,activate,summary});
})(window);