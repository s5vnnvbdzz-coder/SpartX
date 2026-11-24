/* AscensionX 2.0 — independent PR-first development engine.
 * This file never reads, writes, imports or changes classic AscensionX data.
 * Percentages, workload and fatigue rules are provisional coaching heuristics.
 */
(function(root){
'use strict';
const VERSION='2.0-dev.1';
const LIFTS=['Back Squat','Bench Press','Deadlift'];
const DAYS=['Squat','Bench Press','Deadlift','Secondary Squat & Bench','Upper Assistance'];
const round=(n,step=2.5)=>Math.max(step,Math.round(n/step)*step);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const number=(v,lo,hi,name)=>{const n=Number(v);if(v===''||v==null||!Number.isFinite(n)||n<lo||n>hi)throw Error(name+' must be between '+lo+' and '+hi+'.');return n;};
const entry=(pct,reps,backPct,backSets,backReps,rpe,phase)=>({pct,reps,backPct,backSets,backReps,rpe,phase});
const CONFIG={
 4:[entry(.75,5,.68,3,5,7,'Foundation'),entry(.84,3,.76,3,3,7.5,'Strength'),entry(.91,1,.80,2,2,8,'Peak practice'),entry(0,0,0,0,0,0,'Assessment')],
 8:[entry(.74,5,.68,3,5,7,'Volume'),entry(.78,5,.72,3,5,7.5,'Volume'),entry(.82,4,.75,3,4,7.5,'Build'),entry(.60,5,.55,0,5,6,'Deload'),entry(.85,3,.78,3,3,8,'Strength'),entry(.88,2,.81,2,3,8,'Strength'),entry(.93,1,.82,2,2,8,'Peak practice'),entry(0,0,0,0,0,0,'Assessment')],
 12:[entry(.74,5,.67,3,5,7,'Volume'),entry(.775,5,.70,3,5,7.5,'Volume'),entry(.80,4,.73,3,4,7.5,'Volume'),entry(.60,5,.55,0,5,6,'Deload'),entry(.825,4,.76,3,4,7.5,'Build'),entry(.85,3,.79,3,3,8,'Strength'),entry(.875,3,.81,2,3,8,'Strength'),entry(.65,3,.60,0,3,6,'Recovery'),entry(.90,2,.84,2,2,8,'Intensification'),entry(.94,1,.86,2,2,8,'Heavy singles'),entry(.78,2,.70,1,2,6.5,'Taper'),entry(0,0,0,0,0,0,'Assessment')]
};
function normalize(raw){
 if(!raw||typeof raw!=='object')throw Error('Enter the athlete details.');
 const weeks=number(raw.weeks,4,12,'Cycle length');if(!CONFIG[weeks])throw Error('Choose 4, 8 or 12 weeks.');
 const days=number(raw.days,3,5,'Training days');if(!Number.isInteger(days))throw Error('Training days must be whole.');
 const maxes={},goals={};for(const lift of LIFTS){
  maxes[lift]=number(raw.maxes&&raw.maxes[lift],30,500,lift+' 1RM');
  goals[lift]=number(raw.goals&&raw.goals[lift],30,550,lift+' goal');
  if(goals[lift]<=maxes[lift])throw Error(lift+' PR goal must exceed your recorded 1RM.');
 }
 const step=number(raw.step==null?2.5:raw.step,0.5,5,'Plate increment');
 const weekMinutes=number(raw.minutes==null?105:raw.minutes,45,180,'Session minutes');
 const sleep=number(raw.sleep==null?7:raw.sleep,3,12,'Average sleep');
 const recovery=['good','normal','limited'].includes(raw.recovery)?raw.recovery:'normal';
 const equipment=['full','basic'].includes(raw.equipment)?raw.equipment:'full';
 const choices={
  'Back Squat':['out-of-hole','hips-first','torso','knees','depth'],
  'Bench Press':['off-chest','midpoint','lockout','bar-path','tightness'],
  'Deadlift':['off-floor','knees','lockout','back-position','tension']
 };
 const weakPoints={};for(const lift of LIFTS){
  weakPoints[lift]=(Array.isArray(raw.weakPoints&&raw.weakPoints[lift])?raw.weakPoints[lift]:[])
   .filter((v,i,a)=>choices[lift].includes(v)&&a.indexOf(v)===i);
 }
 return {weeks,days,maxes,goals,step,minutes:weekMinutes,sleep,recovery,equipment,weakPoints};
}
function makeSet(type,kg,reps,rpe){return {type,kg,reps,rpe};}
function main(lift,p,cfg,week){
 const max=p.maxes[lift],step=p.step;
 const phase=cfg.phase;
 const pct=lift==='Deadlift'&&['Volume','Build'].includes(phase)?cfg.pct-.015:cfg.pct;
 const mainKg=round(max*pct,step);
 const backKg=round(max*cfg.backPct,step);
 const warm=[.40,.55,.70,.85].map((ratio,i)=>makeSet('warmup',round(mainKg*ratio,step),[5,3,2,1][i]))
  .filter((x,i,arr)=>x.kg<mainKg&&(i===0||x.kg>arr[i-1].kg));
 const sets=[...warm,makeSet('top',mainKg,cfg.reps,cfg.rpe),
  ...Array.from({length:cfg.backSets},()=>makeSet('backdown',Math.min(mainKg,backKg),cfg.backReps,Math.min(cfg.rpe,7.5)))];
 return {name:lift,role:'primary',sets,rest:240,
  rationale:'Competition-lift practice, phase-specific loading and top-set RPE used for review.'};
}
function support(name,sets,reps,rpe,reason){
 return {name,role:'accessory',sets:Array.from({length:sets},()=>makeSet('work',null,reps,rpe)),rest:90,rationale:reason};
}
function variant(name,kg,sets,reps){
 return {name,role:'secondary',sets:Array.from({length:sets},()=>makeSet('work',kg,reps,7)),rest:180,rationale:'Submaximal technical exposure; stop or adjust if the movement causes discomfort.'};
}
function addDay(label,items){return {name:label,exercises:items};}
function workload(cfg,p){
 const recovering=['Deload','Recovery','Taper','Assessment'].includes(cfg.phase);
 const lower=p.recovery==='limited'||p.sleep<6?1:0;
 return recovering?1:lower?2:3;
}
function weekPlan(p,index){
 const w=index+1,cfg=CONFIG[p.weeks][index],phase=cfg.phase;
 if(phase==='Assessment'){
  const attempts={};
  for(const lift of LIFTS){
   const max=p.maxes[lift],goal=p.goals[lift],step=p.step;
   const opener=round(max*.92,step),second=round(max*.99,step);
   const third=Math.max(second+step,Math.min(goal,round(max*1.035,step)));
   attempts[lift]={opener,second,third,goal,previousMax:max};
  }
  return {week:w,phase,assessment:true,attempts,
   explanation:'Optional PR assessment, not an automatic maximum test. Attempt selection depends on warm-ups, bar speed, technique and readiness.',
   sessions:[addDay('Test or submaximal assessment',LIFTS.map(lift=>({
    name:lift,role:'assessment',
    sets:[makeSet('opener',attempts[lift].opener,1,7.5),makeSet('second',attempts[lift].second,1,8.5),makeSet('candidate',attempts[lift].third,1,null)],
    rest:300,rationale:'Candidate attempts only; never automatically attempt the third lift.'
   })))]};
 }
 const n=workload(cfg,p),lean=['Deload','Recovery','Taper'].includes(phase);
 const squat=main('Back Squat',p,cfg,w);
 const bench=main('Bench Press',p,cfg,w);
 const deadlift=main('Deadlift',p,cfg,w);
 const squatWeak=p.weakPoints['Back Squat'];
 const benchWeak=p.weakPoints['Bench Press'];
 const quad=p.equipment==='full'?(squatWeak.includes('out-of-hole')?'Leg Press':'Hack Squat'):'Bulgarian Split Squat';
 const chest=p.equipment==='full'?'Machine Chest Press':'Neutral-Grip Dumbbell Press';
 const core=p.equipment==='full'?'Cable Crunch':'Dead Bug';
 const arm=p.equipment==='full'?'Triceps Pushdown':'Dumbbell Triceps Extension';
 const rows=p.equipment==='full'?'Chest-Supported Row':'Dumbbell Row';
 const lat=p.equipment==='full'?'Lat Pulldown':'Pull-Up';
 const days=[
  addDay('Day 1 · Squat',[
   squat,
   support(quad,n,8,8,'Knee-dominant quad assistance with manageable axial demand.'),
   ...(lean?[]:[support(w<=3?'Bulgarian Split Squat':'Leg Extension',n,10,7.5,'Single-leg or quad capacity; reduces near peaking.')]),
   support('45° Back Extension',n,10,7,'Posterior-chain trunk endurance.'),
   support(core,n,12,7.5,'Trunk stability without shoulder-loaded hanging.')
  ]),
  addDay('Day 2 · Bench Press',[
   bench,support(chest,n,8,8,'Chest hypertrophy without excessive barbell specificity.'),
   support(rows,n,10,8,'Horizontal pulling and scapular control.'),
   support(arm,n,10,8,benchWeak.includes('lockout')?'Elbow-extension work complements lockout practice.':'Triceps capacity.'),
   support('Reverse Pec Deck',n,12,8,'Rear-delt and upper-back coverage.')
  ]),
  addDay('Day 3 · Deadlift',[
   deadlift,
   ...(!lean&&w<=7?[support('Romanian Deadlift',p.recovery==='limited'?2:3,8,7,'Hip-hinge practice after deadlifts, moderated for fatigue.')]:[]),
   support(lat,n,10,8,'Vertical pulling.'),
   support(p.equipment==='full'?'Seated Leg Curl':'Sliding Leg Curl',n,10,8,'Knee flexion and hamstring coverage.')
  ])
 ];
 if(p.days>=4){
  const fatigue=lean||w>=9;
  const secondaryReps=fatigue?3:w<=3?5:w<=7?4:3;
  const secondaryCount=fatigue?2:3;
  const pause=round(p.maxes['Back Squat']*(fatigue ? 0.55 : w<=3 ? 0.63 : w<=7 ? 0.68 : 0.70),p.step);
  const close=round(p.maxes['Bench Press']*(fatigue ? 0.55 : w<=3 ? 0.65 : w<=7 ? 0.71 : 0.73),p.step);
  days.push(addDay('Day 4 · Secondary Squat & Bench',[
   variant(squatWeak.includes('hips-first')?'Tempo Squat':'Paused Back Squat',pause,secondaryCount,secondaryReps),
   variant('Close-Grip Bench Press',close,secondaryCount,secondaryReps),
   support(p.equipment==='full'?'Seated Cable Row':'Dumbbell Row',n,10,8,'Back volume.'),
   support('Dumbbell Lateral Raise',n,12,8,'Deltoid coverage.'),
   support('Dumbbell Curl',n,10,8,'Elbow flexors.'),
   support(arm,n,10,8,'Triceps assistance.')
  ]));
 }else{
  // Three-day athletes get modest secondary exposures without another day.
  days[1].exercises.push(variant('Paused Back Squat',round(p.maxes['Back Squat']*.55,p.step),lean?1:2,4));
  days[2].exercises.push(variant('Close-Grip Bench Press',round(p.maxes['Bench Press']*.60,p.step),lean?1:2,5));
 }
 if(p.days===5){
  days.push(addDay('Day 5 · Upper Assistance',[
   support(rows,n,10,8,'Upper back.'),
   support(chest,lean?1:2,10,7,'Low-stress pressing.'),
   support('Dumbbell Curl',n,10,8,'Biceps.'),
   support(arm,n,10,8,'Triceps.')
  ]));
 }
 if(lean)for(const d of days)d.exercises=d.exercises.filter(e=>e.role!=='accessory'||['45° Back Extension','Cable Crunch','Dead Bug','Chest-Supported Row','Dumbbell Row','Lat Pulldown','Pull-Up'].includes(e.name));
 const warnings=[];
 for(const d of days){
  const names=d.exercises.map(e=>e.name);
  if(new Set(names).size!==names.length)warnings.push('Check repeated exercise in '+d.name);
  // Keep session-length heuristics visible. Do not silently delete primary lifts.
  const estimate=d.exercises.reduce((m,e)=>m+3+e.sets.reduce((time,set)=>time+(set.type==='warmup'?2.5:e.role==='primary'?5:e.role==='secondary'?4:3),0),5);
  d.estimatedMinutes=Math.round(estimate);
  if(estimate>p.minutes)warnings.push(d.name+' could exceed '+p.minutes+' minutes; consider assistance reductions.');
 }
 return {week:w,phase,assessment:false,sessions:days,warnings};
}
function generate(raw){
 const profile=normalize(raw);
 const weeks=Array.from({length:profile.weeks},(_,i)=>weekPlan(profile,i));
 const warnings=[...new Set(weeks.flatMap(w=>w.warnings||[]))];
 if(profile.sleep<6)warnings.unshift('Limited sleep: reduce working-set effort and consider a lower-volume split.');
 if(profile.goals['Back Squat']>profile.maxes['Back Squat']*1.07)warnings.push('Squat PR goal is ambitious; programme does not guarantee this increase.');
 return {version:VERSION,profile,weeks,
  warnings,method:'PR-first powerlifting, phase-based loading, top-set RPE review, fatigue safeguards and optional testing.',
  disclaimers:['Percentages and set counts are starting coaching heuristics, not personalised guarantees.',
   'Optional PR attempts require fresh readiness and technique review.'],
  independent:true};
}
function reviewTop(planned,actual,step=2.5){
 if(!planned||!actual||!Number.isFinite(+actual.kg)||+actual.kg<=0||!Number.isInteger(+actual.reps)||
   !Number.isFinite(+actual.rpe)||+actual.rpe<6||+actual.rpe>10)return {status:'insufficient',delta:0,reason:'Enter a valid top-set load, reps and RPE to review the next exposure.'};
 const target=planned.sets.find(s=>s.type==='top');
 if(!target)return {status:'assessment',delta:0,reason:'Test-week attempts are athlete-controlled.'};
 if(+actual.reps<target.reps||+actual.rpe>=9.5)
  return {status:'reduce-review',delta:-step,reason:'Missed reps or very high effort. Consider reducing upcoming load after reviewing technique and recovery.'};
 if(+actual.reps>=target.reps&&+actual.rpe<=target.rpe-1)
  return {status:'increase-candidate',delta:step,reason:'Work was easier than target. Consider a small upward adjustment after confirming repeated performance.'};
 return {status:'on-target',delta:0,reason:'On target. Continue the phase plan unless recovery suggests otherwise.'};
}
root.SX2Engine=Object.freeze({VERSION,LIFTS,DAYS,CONFIG,normalize,generate,reviewTop,round});
if(typeof module!=='undefined'&&module.exports)module.exports=root.SX2Engine;
})(typeof window!=='undefined'?window:globalThis);
