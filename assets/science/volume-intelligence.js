/* Spartan Intelligence shared working-set and programme-volume policy v0.2.
 * No storage writes. The 2026 ACSM and Pelland et al. reviews justify weekly
 * volume and diminishing returns, NOT universal precise set prescriptions.
 * All starting bands and per-exercise caps below are auditable coaching
 * heuristics awaiting individual calibration and validation.
 */
(function(root){
'use strict';
const VERSION='0.2.0';
const SCI=root.SXScientificEngine||null;
const MUSCLES=SCI?.MUSCLES||['Chest','Back','Shoulders','Quads','Hamstrings','Glutes','Calves','Biceps','Triceps','Core'];
const EVIDENCE=['ACSM2026','PELLAND2026','ROBINSON2024'];
const n=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const safeCount=x=>Array.isArray(x)?x.length:(Number.isFinite(Number(x))?clamp(Math.round(Number(x)),0,20):0);
const catalogue=SCI?.EXERCISES||[];
const aliases={
 'is olateralrow':'chest-row','isolateralrow':'chest-row','isolateralrowmachine':'chest-row',
 'rear delt reverse fly':'rear-delt','reardeltreversefly':'rear-delt',
 'seatedcalfraise':'standing-calf','cablecurl':'cable-curl',
 'tricepspushdownbar':'pushdown','tricepspushdownrope':'pushdown',
 'hangingkneeraise':'plank','romanian deadlift':'romanian-deadlift',
 'legextension':'leg-extension','seatedlegcurl':'seated-curl','lyinglegcurl':'lying-curl',
 'inclinedumbbellpress':'incline-db','dumbbellrow':'db-row',
 'lateralraise':'lateral-raise','benchpress':'barbell-bench',
 'backsquat':'barbell-squat','squat':'barbell-squat','deadlift':'conventional-deadlift',
 'conventionaldeadlift':'conventional-deadlift','barbelldeadlift':'conventional-deadlift','conventionalbarbelldeadlift':'conventional-deadlift','pauseddeadlift':'conventional-deadlift','overheadpress':'ohp'
};
function classify(name){
 const key=n(name);if(!key)return null;
 let match=catalogue.find(e=>n(e.name)===key||n(e.id)===key);
 if(!match){const id=aliases[key];if(id)match=catalogue.find(e=>e.id===id);}
 if(match)return {name:String(name),primary:match.primary,primaryGroups:[...(match.primaryGroups||[match.primary])],secondary:match.secondary.slice(),axial:match.axial,pattern:match.pattern,main:match.kind==='main'};
 if(/triceps|pushdown|skullcrusher/.test(key))return {name,primary:'Triceps',secondary:[],axial:0,pattern:'triceps',main:false};
 if(/latpulldown|row|pullup|chinup/.test(key))return {name,primary:'Back',secondary:['Biceps'],axial:0,pattern:'row',main:false};
 if(/shoulderpress|militarypress/.test(key))return {name,primary:'Shoulders',secondary:['Triceps'],axial:1,pattern:'verticalPress',main:false};
 if(/rear.?delt|reversefly|reversepecdeck|lateralraise|facepull/.test(key))return {name,primary:'Shoulders',secondary:[],axial:0,pattern:'lateral',main:false};
 if(/legcurl|nordic/.test(key))return {name,primary:'Hamstrings',secondary:[],axial:0,pattern:'hamCurl',main:false};
 if(/rdl|backextension/.test(key))return {name,primary:'Hamstrings',secondary:['Glutes'],axial:2,pattern:'hinge',main:false};
 if(/legpress|hack|legextension|lunge/.test(key))return {name,primary:'Quads',secondary:['Glutes'],axial:1,pattern:'quad',main:false};
 if(/calf/.test(key))return {name,primary:'Calves',secondary:[],axial:0,pattern:'calves',main:false};
 if(/curl/.test(key))return {name,primary:'Biceps',secondary:[],axial:0,pattern:'biceps',main:false};
 if(/pallof|plank|crunch|knee.?raise|ab.?wheel/.test(key))return {name,primary:'Core',secondary:[],axial:0,pattern:'core',main:false};
 if(/chest|fly|pec/.test(key))return {name,primary:'Chest',secondary:[],axial:0,pattern:'chestAccessory',main:false};
 return null;
}
const blank=()=>Object.fromEntries(MUSCLES.map(m=>[m,{direct:0,indirect:0,effective:0,days:0}]));
function countExposure(days){
 const out=blank();
 for(const day of Array.isArray(days)?days:[]){
  const seen=new Set();
  for(const exercise of day?.exercises||[]){
   const info=classify(exercise?.name);
   const count=safeCount(exercise?.sets);
   if(!info||!count)continue;
   const direct=new Set(info.primaryGroups||[info.primary]);
   for(const muscle of direct){out[muscle].direct+=count;seen.add(muscle);}
   for(const muscle of info.secondary)if(!direct.has(muscle)){out[muscle].indirect+=count*.5;seen.add(muscle);}
  }
  for(const muscle of seen)out[muscle].days++;
 }
 for(const v of Object.values(out))v.effective=Number((v.direct+v.indirect).toFixed(1));
 return out;
}
const BANDS=Object.freeze({
 bodybuilding:{beginner:[6,10],intermediate:[8,14],advanced:[10,16]},
 powerbuilding:{beginner:[5,9],intermediate:[7,12],advanced:[8,14]},
 powerlifting:{beginner:[3,7],intermediate:[4,9],advanced:[5,11]}
});
function bandFor(muscle,opt={}){
 const goal=BANDS[opt.goal]?opt.goal:'bodybuilding';
 const experience=BANDS[goal][opt.experience]?opt.experience:'intermediate';
 const band=BANDS[goal][experience].slice();
 if(opt.priority===muscle){band[0]+=2;band[1]+=2;}
 if(muscle==='Core'||muscle==='Calves')band[0]=Math.max(2,band[0]-2);
 return {min:band[0],max:band[1],goal,experience,source:'ACSM2026 · PELLAND2026',status:'starting-range',note:'Coaching starting range, not a biological optimum.'};
}
function recommendWorkingSets(options={}){
 const info=classify(options.name);
 const main=options.main===true||info?.main&&options.keepMain===true;
 const existing=clamp(Math.round(Number(options.existingSets)||3),1,8);
 if(main)return {sets:existing,minimum:existing,maximum:existing,reason:'The selected strength system owns main-lift working sets. Intelligence does not override its progression.',status:'main-preserved',evidence:['ACSM2026']};
 if(!info)return {sets:existing,minimum:1,maximum:8,reason:'Muscle assignment is uncertain; retain the current prescription for review.',status:'unknown-exercise',evidence:[]};
 const b=bandFor(info.primary,options);
 const effective=clamp(Number(options.weeklyExposure)||0,0,100);
 const remaining=clamp(Math.round(Number(options.remainingSlots)||1),1,10);
 const deficit=b.min-effective;
 const highFatigue=options.highFatigue===true||info.axial>=2&&options.afterHeavyLift===true;
 let sets=deficit<=0?2:Math.ceil(deficit/remaining);
 sets=clamp(sets,2,4);
 if(info.axial>=2)sets=Math.min(sets,3);
 if(highFatigue||options.lowReadiness===true)sets=Math.min(sets,2);
 if(options.recoveryWeek===true)sets=Math.min(sets,1);
 if(options.lowReadiness===true&&options.recoveryWeek!==true)sets=Math.min(sets,2);
 const reason=options.recoveryWeek===true?'Recovery week: reduce accessory working sets while preserving planned main-lift progression.':
   highFatigue?'Limit additional axial or overlapping fatigue after demanding compound work.':
   deficit<=0?'This muscle already has substantial planned weekly exposure; avoid reflexively adding sets.':
   'Distribute the remaining weekly muscle exposure across eligible sessions; reassess against actual progress.';
 return {sets,minimum:options.recoveryWeek?1:2,maximum:4,weeklyEffectiveBefore:effective,
  targetRange:[b.min,b.max],muscle:info.primary,reason,
  status:sets===existing?'hold':sets>existing?'consider-more':'consider-less',
  evidence:EVIDENCE.slice(),confidence:'heuristic'};
}
function rebalancePlan(input,opt={}){
 const original=input?.sessions;
 if(!Array.isArray(original))return input;
 const goal=['bodybuilding','powerbuilding','powerlifting'].includes(opt.goal)?opt.goal:'bodybuilding';
 const experience=['beginner','intermediate','advanced'].includes(opt.experience)?opt.experience:'intermediate';
 const sessions=original.map(s=>({...s,exercises:(s.exercises||[]).map(e=>({...e}))}));
 const all=sessions.flatMap((day,i)=>(day.exercises||[]).map((e,j)=>({day:i,slot:j,info:classify(e.name),exercise:e})));
 const initial=countExposure(sessions);
 // Reserve main working sets as authored: never alter 5/3/1, AscensionX or
 // athlete-selected main prescriptions through this function.
 const priorities=all.filter(x=>x.info&&!x.info.main&&x.exercise.lockedSets!==true);
 for(const obj of priorities){
  const {exercise,info,day}=obj;
  const current=countExposure(sessions);
  const slots=priorities.filter(x=>x.info?.primary===info.primary&&
   (x.day>day||(x.day===day&&x.slot>=obj.slot))).length||1;
  const other=current[info.primary].effective-safeCount(exercise.sets);
  const sameDayHeavy=sessions[day].exercises.some(e=>e!==exercise&&['Back Squat','Deadlift'].includes(e.name));
  const suggestion=recommendWorkingSets({name:exercise.name,goal,experience,priority:opt.priority,
   weeklyExposure:Math.max(0,other),remainingSlots:slots,existingSets:exercise.sets,
   afterHeavyLift:sameDayHeavy,lowReadiness:opt.lowReadiness===true,recoveryWeek:opt.recoveryWeek===true});
  // Do not edit user-authored existing plans; caller must opt-in with a new draft.
  exercise.sets=suggestion.sets;
  exercise.sxVolumeReason=suggestion.reason;
  exercise.sxVolumePolicy=VERSION;
 }
 return {...input,sessions,volumeIntelligence:{version:VERSION,applied:'new-draft-only',initial,final:countExposure(sessions),
  method:'heuristic fractional weekly exposure with strength main-lift preservation'}};
}
function readJSON(storage,key,fallback){try{const raw=storage?.getItem?.(key);if(!raw||raw.length>8000000)return fallback;return JSON.parse(raw)}catch(_){return fallback}}
function pending531Week(c,lift){
 const done=new Set((c.completedSessions?.[lift]||(c.lift===lift?c.completedWeeks:[])||[]).map(Number));
 for(let n=1;n<=Number(c.weeks||4);n++)if(!done.has(n))return n;
 return null;
}
function next531Plan(c,lift,week){
 const blocks=c.liftPlans?.[lift]?.cycles||(c.lift===lift?c.cycles:[])||[];
 const record=blocks.flatMap(b=>b.weeks||[]).find(w=>Number(w.number)===week);
 if(!record)return null;
 return {exercise:lift,week,workingSets:Array.isArray(record.sets)?record.sets.length:0,
  bbbSets:record.bbb?safeCount(record.bbb.sets):0,bigButBoring:!!record.bbb,
  deload:/deload/i.test(record.name||'')||week%4===0};
}
function analyseSources(storage){
 const rows=[];
 const saved531=readJSON(storage,'spartanx_531_saved_cycles_v1',[]);
 if(Array.isArray(saved531)){
  for(const c of saved531.slice(-30)){
   const lifts=(Array.isArray(c.exercises)&&c.exercises.length?c.exercises:[c.lift]).filter(Boolean);
   const active=lifts.map(lift=>next531Plan(c,lift,pending531Week(c,lift))).filter(x=>x&&x.week!==null);
   if(active.length)rows.push({type:'531',name:c.name||'5/3/1 cycle',id:c.id,focus:'powerlifting',
    main:active,notes:'Main sets and optional BBB work are reserved; assistance should account for these loads.'});
  }
 }
 const asc=readJSON(storage,'ascensionx_strength_v1',null);
 if(asc?.cycle&&Array.isArray(asc.cycle.exercises)){
  const cycle=asc.cycle;
  const lifts=cycle.exercises.filter(x=>typeof x==='string');
  if(lifts.length)rows.push({type:'ascension',name:'AscensionX',id:cycle.created,focus:'powerlifting',
   main:lifts.map(lift=>({exercise:lift,week:Number(cycle.weeks?.[lift]||cycle.currentWeek||1),workingSets:null,bbbSets:0})),
   notes:'Main-lift set counts are owned by AscensionX; no assumed set totals are added.'});
 }
 const plans=readJSON(storage,'sx_bodybuilding_programmes_v1',null);
 if(plans?.programmes&&Array.isArray(plans.programmes)){
  const p=plans.programmes.find(x=>x.id===plans.activeId)||plans.programmes[0];
  if(p)rows.push({type:'bespoke',name:p.name||'Bespoke programme',id:p.id,
   focus:p.kind==='hybrid'?'powerbuilding':'bodybuilding',
   sessions:Array.isArray(p.sessions)?p.sessions:[],
   notes:'Saved bespoke plan: report existing working sets without replacing athlete edits.'});
 }
 return rows;
}
function mainWeekExposure(sources){
 const days=[];
 for(const row of sources)if(row.type==='531'){
  for(const m of row.main||[]){
   // Standard 5/3/1 three working sets and BBB five sets count once here.
   // Warm-ups are excluded and different lifts are not confused.
   days.push({exercises:[{name:m.exercise,sets:(m.workingSets||0)+(m.bbbSets||0)}]});
  }
 }else if(row.type==='bespoke')days.push(...(row.sessions||[]));
 return countExposure(days);
}
function recentCompleted(storage,now=Date.now()){
 const raw=readJSON(storage,'spartx_db',null);
 const recent=[];
 const cutoff=Number(now)-7*86400000;
 for(const session of Array.isArray(raw?.sessions)?raw.sessions.slice(-2000):[]){
  const when=Date.parse(session?.date||session?.savedAt||session?.createdAt||'');
  if(!Number.isFinite(when)||when<cutoff||when>Number(now)+86400000)continue;
  const exercises=[];
  for(const e of session.exercises||[]){
   const valid=(Array.isArray(e.sets)?e.sets:[]).filter(s=>
    s?.done===true&&!/^(w|warm.?up|cardio)$/i.test(String(s.type||''))&&
    Number(s.reps)>0&&Number.isFinite(Number(s.weight))&&Number(s.weight)>=0);
   if(valid.length)exercises.push({name:e.name,sets:valid.length});
  }
  if(exercises.length)recent.push({name:session.name,exercises});
 }
 return {sessions:recent.length,exposure:countExposure(recent),from:'saved completed working sets in last seven days'};
}
function adviseFor531(source,exposure,opt={}){
 const focus='powerlifting';
 const suggestions=[];
 const choices={'Back Squat':['Seated Leg Curl','Pallof Press'],'Bench Press':['Chest-Supported Row','Triceps Pushdown'],'Deadlift':['Lat Pulldown','Pallof Press'],'Overhead Press':['Dumbbell Lateral Raise','Dumbbell Curl']};
 for(const main of source.main||[]){
  if(main.deload){suggestions.push({lift:main.exercise,name:'Assistance',sets:0,reason:'5/3/1 deload week: reduce supplemental work; existing main cycle stays unchanged.'});continue;}
  const candidates=choices[main.exercise]||[];
  for(const name of candidates){
   const info=classify(name);if(!info)continue;
   const current=exposure[info.primary]?.effective||0;
   const suggestion=recommendWorkingSets({name,goal:focus,experience:opt.experience||'intermediate',
    weeklyExposure:current,remainingSlots:2,afterHeavyLift:main.exercise==='Deadlift'});
   suggestions.push({lift:main.exercise,name,sets:suggestion.sets,reason:suggestion.reason});
  }
 }
 return suggestions;
}
function report(storage,opt={}){
 const sources=analyseSources(storage);
 const planned=mainWeekExposure(sources);
 const recorded=recentCompleted(storage,opt.now||Date.now());
 const bbb=sources.filter(s=>s.type==='531').flatMap(s=>s.main).filter(m=>m.bigButBoring).length;
 const warnings=[];
 if(sources.some(s=>s.type==='ascension')&&sources.some(s=>s.type==='531'))
  warnings.push('Both AscensionX and 5/3/1 cycles are saved. Check that competing heavy-lift days are not double-programmed.');
 if(sources.some(s=>s.type==='ascension'))warnings.push('AscensionX planned main-set totals are not inferred; session-level totals are provisional.');
 if(bbb)warnings.push('5/3/1 BBB contributes five additional working sets on its own lift; do not treat it as a warm-up.');
 const suggestions=sources.filter(s=>s.type==='531').flatMap(s=>adviseFor531(s,planned,opt));
 return {version:VERSION,readOnly:true,sources,planned,recorded,bbbLiftCount:bbb,warnings,suggestions,
  evidence:EVIDENCE,limitations:'Planned source summaries are incomplete if sessions are stored in isolated browsers; no automatic workout edits.'};
}
const API=Object.freeze({VERSION,EVIDENCE,BANDS,classify,bandFor,countExposure,recommendWorkingSets,rebalancePlan,
 readJSON,pending531Week,next531Plan,analyseSources,mainWeekExposure,recentCompleted,adviseFor531,report});
root.SXVolumeIntelligence=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);