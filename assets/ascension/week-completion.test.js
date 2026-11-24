/* Run: node assets/ascension/week-completion.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const files=new Map();
const storage={
 getItem(k){return files.has(k)?files.get(k):null;},
 setItem(k,v){files.set(k,String(v));}
};
const window={localStorage:storage};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'workout-prescription.js'),'utf8'),{window});
const api=window.SXAscensionPrescription;
const id='2026-11-20T11:00:00.000Z',other='2026-11-01T11:00:00.000Z',key='ascensionx_strength_v1';
const logs=[
 {cycleId:id,date:'2026-11-24T12:00:00.000Z',lift:'Back Squat',week:5,setsComplete:true,topWeight:162.5,topReps:2,sets:[{weight:162.5,reps:2,rpe:8.5,done:true}]},
 {cycleId:id,date:'2026-11-24T12:10:00.000Z',lift:'Deadlift',week:5,setsComplete:false},
 {cycleId:other,date:'2026-11-02T12:10:00.000Z',lift:'Bench Press',week:5,setsComplete:true}
];
const original={profile:{max:{'Back Squat':185,'Bench Press':160,Deadlift:215, 'Overhead Press':105},tmPct:95,rounding:2.5,unit:'kg'},
 cycle:{created:id,currentWeek:5,exercises:['Back Squat','Bench Press','Deadlift'],weeks:{'Back Squat':5,'Bench Press':5,Deadlift:5}},
 logs};
files.set(key,JSON.stringify(original));
const restored=api.read(storage);
assert.equal(restored.cycle.weeks['Back Squat'],6,'Completed Week 5 squat progresses to Week 6');
assert.equal(restored.cycle.weeks['Bench Press'],5,'Unrelated old-cycle log cannot move bench');
assert.equal(restored.cycle.weeks.Deadlift,5,'Incomplete Week 5 deadlift cannot move');
assert.equal(JSON.parse(storage.getItem(key)).cycle.weeks['Back Squat'],6,'Repaired pointer persists');
assert.deepEqual(JSON.parse(storage.getItem(key)).logs,logs,'Session history is not rewritten');
const deload=api.build(restored,'Back Squat',storage);
assert.equal(deload.week,6,'Continue imports the correct week');
assert.equal(deload.sets.length,3,'Week 6 uses 3 prescribed deload working sets');
assert.equal(deload.sets.every(s=>s.reps===5),true,'Deload reps unchanged');
const unchanged=api.read(storage);
assert.deepEqual(JSON.parse(JSON.stringify(unchanged)),JSON.parse(JSON.stringify(restored)),'Repair is idempotent');
// Exact regression for 24 Nov: SpartanX has four completed squat working
// sets (157.5 x2; 150 x2 x3) but AscensionX retained Week 5, with no queue.
const prescribed=[
 {weight:157.5,reps:2},{weight:150,reps:2},
 {weight:150,reps:2},{weight:150,reps:2}
];
const recorded=[
 {type:'Warm-up',weight:67.5,reps:5,done:true},
 {type:'Warm-up',weight:92.5,reps:3,done:true},
 {type:'Warm-up',weight:110,reps:2,done:true},
 {type:'Warm-up',weight:127.5,reps:1,done:true},
 ...prescribed.map((p,i)=>({...p,type:i===2?'Backdown Set':'Working Set',done:true,rpe:8.5}))
];
const session={id:24680,date:'2026-11-24T12:55:00.000Z',name:'Back Squat - Week 5',
 exercises:[{name:'Back Squat',ascensionLink:{
  cycleId:id,lift:'Back Squat',week:5,plannedSets:prescribed
 },sets:recorded}]};
const pending={...original,cycle:{...original.cycle,weeks:{...original.cycle.weeks}},
 logs:[{id:111,cycleId:id,sourceSessionId:String(session.id),date:session.date,lift:'Back Squat',week:5,
  setsComplete:false,sets:recorded.slice(-3)}]};
function restoreWith(savedSession,stale=pending){
 files.set(key,JSON.stringify(stale));
 files.set('spartx_db',JSON.stringify({sessions:[savedSession]}));
 return api.read(storage);
}
let recovered=restoreWith(session);
assert.equal(recovered.cycle.weeks['Back Squat'],6,
 'Saved completed squat moves Week 5 to Week 6 without a completion queue');
assert.equal(recovered.logs.length,1,'Bad old Week 5 log is updated, not duplicated');
assert.equal(recovered.logs[0].setsComplete,true,'Recovered historical session is complete');
assert.equal(recovered.logs[0].sourceSessionId,String(session.id));
assert.equal(recovered.logs[0].topWeight,157.5);
assert.equal(recovered.logs[0].sets.length,4,'All four prescribed main-lift sets are retained');
assert.deepEqual(JSON.parse(files.get('spartx_db')).sessions[0],session,
 'Saved SpartanX workout must never be rewritten');
assert.equal(api.build(recovered,'Back Squat',storage).week,6);
assert.equal(api.read(storage).logs.length,1,'Recovery is repeatable without duplicates');
const missingRow=JSON.parse(JSON.stringify(session));
missingRow.exercises[0].sets.pop();
assert.equal(restoreWith(missingRow).cycle.weeks['Back Squat'],5,
 'Missing backdown does not qualify');
const tooLight=JSON.parse(JSON.stringify(session));
tooLight.exercises[0].sets.at(-1).weight=147.5;
assert.equal(restoreWith(tooLight).cycle.weeks['Back Squat'],5,
 'Below-prescription backdown does not qualify');
const unlinked=JSON.parse(JSON.stringify(session));
delete unlinked.exercises[0].ascensionLink;
assert.equal(restoreWith(unlinked).cycle.weeks['Back Squat'],5,
 'Identically named but unlinked workouts cannot advance the programme');
const wrongCycle=JSON.parse(JSON.stringify(session));
wrongCycle.exercises[0].ascensionLink.cycleId=other;
assert.equal(restoreWith(wrongCycle).cycle.weeks['Back Squat'],5,
 'Workouts from an older cycle cannot advance the current cycle');
const unfinished=JSON.parse(JSON.stringify(session));
unfinished.exercises[0].sets.at(-1).done=false;
assert.equal(restoreWith(unfinished).cycle.weeks['Back Squat'],5,
 'Unfinished working sets cannot advance the cycle');
files.delete('spartx_db');
files.set(key,JSON.stringify(original));
const sourceMain=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const sourceAsc=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
assert.ok(sourceMain.slice(sourceMain.indexOf('function queueAscensionWorkoutCompletion')).includes("'Backdown Set'"),'SpartanX accepts B-labelled backdown sets in linked completion');
assert.ok(sourceAsc.slice(sourceAsc.indexOf('function findAscSpartanRecoverySessions')).includes("'Backdown Set'"),'Recover Previous Workouts accepts saved backdown rows');
console.log('AscensionX Week 5 -> 6 completion and B-backdown regression checks passed');
