/* node tests/adaptive-decision-engine.test.js
 * Safety-critical: two-week in-progress cycle, unrelated workout exclusion,
 * explainable early evidence and four-week block-review readiness.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const paths=[
 'assets/bodybuilding/programme-model.js',
 'assets/bodybuilding/adaptive-engine.js',
 'assets/bodybuilding/ascension-companion.js',
 'assets/bodybuilding/decision-engine.js'
];
const store=new Map();
const storage={getItem:key=>store.has(key)?store.get(key):null,
 setItem:()=>{throw Error('Decision engine attempted a write to athlete data')},
 removeItem:()=>{throw Error('Decision engine attempted a delete')}};
const browser={localStorage:storage};
for(const path of paths)vm.runInNewContext(fs.readFileSync(path,'utf8'),{window:browser});
const D=browser.SXDecisionEngine,M=browser.SXBodybuildingModel,A=browser.SXAscensionCompanion;
assert(D&&M&&A,'Required training modules loaded');
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS',name)};
const created='2026-11-01T09:00:00.000Z';
const today=new Date().toISOString().slice(0,10);
const cycle={created,exercises:['Squats','Bench Press','Deadlift'],
 weeks:{Squats:3,'Bench Press':3,Deadlift:3},currentWeek:3};
store.set('ascensionx_strength_v1',JSON.stringify({cycle}));
const liftSession=(lift,week,weight,reps,rpe=8,cycleId=created,entry='normal')=>({
 id:'session-'+lift+'-'+week+'-'+entry,date:today,name:lift+' - Week '+week,
 exercises:[{
  name:entry==='substitution'?'Hack Squat':lift,
  ascensionLink:{cycleId,lift,week,plannedSets:[{weight,reps}]},
  sets:[
   {type:'Warm-up',weight:60,reps:5,rpe:'',done:true},
   {type:'Working Set',weight,reps,rpe,done:true},
   {type:'Working Set',weight,reps,rpe,done:false}
  ]
 }]
});
const records=[
 liftSession('Squats',1,125,5,8),
 liftSession('Squats',2,137.5,3,8.5),
 liftSession('Bench Press',1,110,5,8),
 liftSession('Bench Press',2,122.5,3,8.5),
 liftSession('Deadlift',1,145,5,8),
 liftSession('Deadlift',2,162.5,3,8.5),
 {id:'manual-heavy',date:today,name:'Blank workout',
  exercises:[{name:'Deadlift',sets:[{type:'Working Set',weight:400,reps:10,done:true,rpe:9}]}]},
 liftSession('Squats',1,500,10,10,'older-cycle'),
 liftSession('Squats',2,500,10,10,created,'substitution'),
 {id:'unsaved-body',date:today,exercises:[{name:'Bench Press',bodybuildingLink:{programmeId:'other'},sets:[
   {type:'Working Set',weight:999,reps:3,done:true}]}]}
];
store.set('spartx_db',JSON.stringify({sessions:records,profile:{name:'Training User'}}));
test('cycle remains in progress at Week 3 for squat, bench and deadlift',()=>{
 const report=D.fromStorage(storage);
 assert.equal(report.ascension.lifts.length,3);
 for(const lift of report.ascension.lifts){
  assert.equal(lift.week,3);
  assert.equal(lift.recordedWeeks,2,lift.lift);
  assert.equal(lift.confidence,'early');
  assert.equal(lift.mainLiftProtected,true);
 }
 assert(!report.ascension.lifts.some(l=>l.lift==='Overhead Press'));
});
test('unrelated, different-cycle, incomplete and substituted sets are excluded',()=>{
 const r=D.fromStorage(storage).ascension;
 const squat=r.lifts.find(l=>l.lift==='Back Squat');
 const deadlift=r.lifts.find(l=>l.lift==='Deadlift');
 assert.equal(squat.records[1].heaviest,137.5);
 assert.equal(deadlift.records[1].heaviest,162.5);
 assert(squat.records.every(x=>x.heaviest<200));
 assert(deadlift.records.every(x=>x.heaviest<200));
});
test('comparisons show evidence, not ungrounded percentage changes to prescribed weights',()=>{
 const r=D.fromStorage(storage).ascension;
 for(const lift of r.lifts){
  assert(lift.latest.estimatedMax>0);
  assert(Number.isFinite(lift.delta));
  assert(lift.reason.length>25);
  assert.equal(lift.action,'keep_main_lift');
 }
 assert.equal(r.readOnly,true);
});
test('analysis never writes to AscensionX, programme keys or workout history',()=>{
 const before=JSON.stringify([...store]);
 const result=D.fromStorage(storage);
 assert(result.readOnly);
 assert.equal(JSON.stringify([...store]),before);
});
test('read-only engine does not fabricate performance from cycle week alone',()=>{
 store.set('spartx_db',JSON.stringify({sessions:[]}));
 const r=D.fromStorage(storage);
 assert.equal(r.ascension.status,'waiting');
 assert(r.ascension.lifts.every(l=>l.recordedWeeks===0&&l.status==='missing'));
 store.set('spartx_db',JSON.stringify({sessions:records}));
});
test('read-only cycle works with fewer completed weeks and absent RPE',()=>{
 const r=D.analyseAscension({id:created,lifts:['Back Squat'],
  weeks:{'Back Squat':2},currentWeek:2},[liftSession('Squats',1,120,5,'')]);
 assert.equal(r.lifts[0].recordedWeeks,1);
 assert.equal(r.lifts[0].confidence,'insufficient');
 assert.equal(r.lifts[0].delta,null);
});
test('duplicate saved week does not inflate evidence',()=>{
 const duplicate={...records[1],id:'repeat-squat',exercises:records[1].exercises};
 const r=D.analyseAscension(A.cycle(storage),[...records,duplicate]);
 assert.equal(r.lifts.find(l=>l.lift==='Back Squat').recordedWeeks,2);
});
test('consecutive high effort with decreasing e1rm triggers caution, not main lift changes',()=>{
 const r=D.analyseAscension({id:created,lifts:['Deadlift'],weeks:{Deadlift:3}},
  [liftSession('Deadlift',1,175,5,9.5),liftSession('Deadlift',2,160,3,9.5)]);
 assert.equal(r.lifts[0].status,'caution');
 assert.equal(r.lifts[0].action,'review_accessories');
 assert.equal(r.lifts[0].mainLiftProtected,true);
});
test('training exposure uses only linked recent working sets',()=>{
 const r=D.analyseAscension(A.cycle(storage),records);
 assert(r.exposure.totalWorkingSets<12,'Should not include unlinked 400 kg session');
 assert(!r.exposure.exercises.some(x=>x.name==='Hack Squat'&&x.sets>1));
});
test('warns about lower-body accessory scheduled right before deadlift day',()=>{
 const schedule={valid:true,slots:[
  {kind:'support',day:'WED',title:'Support',exercises:[{name:'Romanian Deadlift',sets:3}]},
  {kind:'ascension',day:'THU',lift:'Deadlift',exercises:[]}
 ]};
 const warnings=D.reviewSchedule(schedule,{groups:{}});
 assert.equal(warnings[0].status,'review');
 assert(warnings[0].detail.includes('Romanian Deadlift'));
});
test('read-only bodybuilding suggestions require matching programme-linked sessions',()=>{
 const programme=M.fresh({days:3,weeks:8});
 const day=programme.sessions[0],exercise=day.exercises[0];
 const link={programmeId:programme.id,dayId:day.id,week:1,plannedTotalSets:0,plannedExerciseCount:1};
 const saved={id:'linked',date:today,bodybuildingLink:link,exercises:[
  {name:exercise.name,bodybuildingLink:{...link,exerciseId:exercise.id,plannedSets:1},
   sets:[{type:'Working Set',weight:50,reps:10,rpe:8,done:true}]}
 ]};
 const report=D.analyseBodybuilding(programme,[saved,...records]);
 assert.equal(report.sessions,1);
 assert.equal(report.status,'evidence');
 assert(report.decisions.some(x=>x.observations===0));
 assert.equal(report.review.due,false);
});
test('four-week review does not become due until every programmed day is completed',()=>{
 const programme=M.fresh({days:3,weeks:8});
 const history=[];
 for(let week=1;week<=4;week++)for(const day of programme.sessions){
  if(week===4&&day===programme.sessions[2])continue;
  const total=day.exercises.reduce((n,ex)=>n+ex.sets,0);
  const meta={programmeId:programme.id,dayId:day.id,week,
   plannedTotalSets:total,plannedExerciseCount:day.exercises.length};
  history.push({id:'p-'+week+'-'+day.id,date:today,bodybuildingLink:meta,
   exercises:day.exercises.map(ex=>({
    name:ex.name,bodybuildingLink:{...meta,exerciseId:ex.id,plannedSets:ex.sets},
    sets:Array.from({length:ex.sets},()=>({type:'Working Set',weight:50,reps:12,rpe:8,done:true}))
   }))});
 }
 assert.equal(D.analyseBodybuilding(programme,history).review.due,false);
 const day=programme.sessions[2],week=4;
 const total=day.exercises.reduce((n,ex)=>n+ex.sets,0);
 const meta={programmeId:programme.id,dayId:day.id,week,
  plannedTotalSets:total,plannedExerciseCount:day.exercises.length};
 history.push({id:'last-day',date:today,bodybuildingLink:meta,exercises:day.exercises.map(ex=>({
  name:ex.name,bodybuildingLink:{...meta,exerciseId:ex.id,plannedSets:ex.sets},
  sets:Array.from({length:ex.sets},()=>({type:'Working Set',weight:50,reps:12,rpe:8,done:true}))
 }))});
 const result=D.analyseBodybuilding(programme,history);
 assert.equal(result.review.due,true);
 assert.equal(result.review.start,1);
 assert.equal(result.review.end,4);
 assert.equal(result.week,5);
});
test('corrupt and huge saved history fail safely without writes',()=>{
 const tooLong='X'.repeat(12*1024*1024+2);
 store.set('spartx_db',tooLong);
 assert.equal(D.fromStorage(storage).status,'unavailable');
 store.set('spartx_db','{');
 assert.equal(D.fromStorage(storage).status,'unavailable');
 store.set('spartx_db',JSON.stringify({sessions:records}));
});
console.log('Passed '+count+' adaptive programme decision tests.');
