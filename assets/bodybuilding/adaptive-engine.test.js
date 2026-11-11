/* node assets/bodybuilding/adaptive-engine.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function load(file,win){
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),{window:win},{filename:file});
}
function storage(){
 const data={};
 return {getItem:key=>data[key]??null,setItem:(key,value)=>{data[key]=String(value)}};
}
const win={localStorage:storage()};
load('programme-model.js',win);
load('adaptive-engine.js',win);
load('ascension-companion.js',win);
const M=win.SXBodybuildingModel,E=win.SXProgrammeIntelligence,A=win.SXAscensionCompanion;
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS',name)}
const ex={id:'ex1',name:'Incline Dumbbell Press',sets:3,repsMin:8,repsMax:12,rir:2,startingKg:40};
const link={programmeId:'p1',dayId:'d1'};
function session(week,reps,rpe=8,weight=40){
 return {date:'2026-11-'+String(week).padStart(2,'0'),bodybuildingLink:{...link,week},
   exercises:[{bodybuildingLink:{...link,exerciseId:'ex1'},sets:reps.map(rep=>({weight,reps:rep,rpe,done:true,type:'Working Set'}))}]};
}
test('3/4/5-day templates cover all major muscles',()=>{
 for(const days of [3,4,5]){
  const p=M.fresh({days,weeks:8});
  assert.equal(p.sessions.length,days);
  assert.equal(p.weeks,8);
  assert.deepEqual(E.coverage(p).missing,[]);
 }
});
test('progresses weights only when full target with RPE',()=>{
 const p=E.prescribe(ex,3,[session(2,[12,12,12])],link);
 assert.equal(p.startingKg,42.5);
 assert.equal(p.recommendation.status,'increase');
 assert.equal(p.targetRpe,8);
});
test('holds weight if reps miss targets',()=>{
 const p=E.prescribe(ex,3,[session(2,[11,9,8])],link);
 assert.equal(p.startingKg,40);
 assert.equal(p.recommendation.status,'hold');
});
test('holds weight when required RPE evidence is missing',()=>{
 const p=E.prescribe(ex,3,[session(2,[12,12,12],null)],link);
 assert.equal(p.recommendation.status,'hold');
});
test('ignores another programme or a future week',()=>{
 const unrelated=session(2,[12,12,12]);
 unrelated.bodybuildingLink.programmeId='other';
 const p=E.prescribe(ex,3,[unrelated,session(4,[12,12,12])],link);
 assert.equal(p.startingKg,40);
 assert.equal(p.recommendation.status,'baseline');
});
test('reduces prescription after repeated low performance',()=>{
 const p=E.prescribe(ex,3,[session(1,[6,5,6],9.5),session(2,[7,6,5],9.5)],link);
 assert.equal(p.startingKg,39);
 assert.equal(p.recommendation.status,'reduce');
});
test('week 5 volume and effort are recovery-aware',()=>{
 const p=E.prescribe(ex,5,[session(4,[12,12,12])],link);
 assert.equal(p.sets,2);
 assert.equal(p.rir,4);
 assert.equal(p.targetRpe,6);
});
test('default companion is opt-in only',()=>{
 const c=A.preference(win.localStorage);
 assert.equal(c.enabled,false);
 assert.equal(c.powerbuilding,false);
});
win.localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle:{
 created:'2026-11-11T00:00:00.000Z',
 exercises:['Back Squat','Bench Press','Deadlift','Overhead Press'],
 currentWeek:2, weeks:{'Back Squat':2,'Bench Press':2,'Deadlift':2,'Overhead Press':2}
}}));
test('refuses impossible four main lifts in three days',()=>{
 const plan=A.schedule(3,win.localStorage);
 assert.equal(plan.valid,false);
});
test('four and five day schedules separate selected main lifts',()=>{
 for(const days of [4,5]){
  const plan=A.schedule(days,win.localStorage);
  assert.equal(plan.valid,true);
  assert.equal(plan.slots.length,days);
  assert.equal(plan.slots.filter(s=>s.kind==='ascension').length,4);
 }
});
test('Powerbuilding opt-in enables only cycle-scoped accessories',()=>{
 A.savePreference({powerbuilding:true,trainingDays:5},win.localStorage);
 const p=A.preference(win.localStorage);
 assert.equal(p.enabled,true);
 assert.equal(p.powerbuilding,true);
 assert.equal(p.trainingDays,5);
 const items=A.forImport({source:'AscensionX',cycleId:p.cycleId,exercise:'Back Squat',week:2},
  ['Leg Press'],win.localStorage);
 assert(items.some(x=>x.name==='Standing Calf Raise'));
 assert(!items.some(x=>x.name==='Leg Press'));
 assert(items.every(x=>!x.ascensionLink&&x.sets.every(s=>s.done===false)));
});
test('never adds companion volume in the sixth week',()=>{
 assert.deepEqual(A.plan('Deadlift',6,{powerbuilding:true}),[]);
});
test('saved programme remains independent of the companion',()=>{
 const p=M.fresh({days:4,weeks:8});
 const store=M.save(M.read(win.localStorage),p,win.localStorage);
 assert.equal(store.programmes.length,1);
 assert.equal(store.programmes[0].weeks,8);
 assert.equal(A.cycle(win.localStorage).lifts.length,4);
});
console.log('Passed '+checks+' training integration tests.');
