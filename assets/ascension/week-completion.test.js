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
const sourceMain=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const sourceAsc=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
assert.ok(sourceMain.slice(sourceMain.indexOf('function queueAscensionWorkoutCompletion')).includes("'Backdown Set'"),'SpartanX accepts B-labelled backdown sets in linked completion');
assert.ok(sourceAsc.slice(sourceAsc.indexOf('function findAscSpartanRecoverySessions')).includes("'Backdown Set'"),'Recover Previous Workouts accepts saved backdown rows');
console.log('AscensionX Week 5 -> 6 completion and B-backdown regression checks passed');
