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
   exercises:[{name:'Incline Dumbbell Press',bodybuildingLink:{...link,exerciseId:'ex1'},sets:reps.map(rep=>({weight,reps:rep,rpe,done:true,type:'Working Set'}))}]};
}
test('3/4/5-day templates cover all major muscles',()=>{
 for(const days of [3,4,5]){
  const p=M.fresh({days,weeks:8});
  assert.equal(p.sessions.length,days);
  assert.equal(p.weeks,8);
  assert.equal(E.coverage(p).missing.length,0);
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
 assert(items.some(x=>x.name==='Lying Leg Curl'));
 assert(items.some(x=>x.name==='Leg Extension'));
 assert(!items.some(x=>x.name==='Leg Press'));
 assert(!items.some(x=>/Back Squat|Romanian Deadlift/i.test(x.name)));
 assert(items.every(x=>!x.ascensionLink&&x.sets.every(s=>s.done===false)));
});
test('never adds companion volume in the sixth week',()=>{
 assert.equal(A.plan('Deadlift',6,{powerbuilding:true}).length,0);
});
test('saved programme remains independent of the companion',()=>{
 const p=M.fresh({days:4,weeks:8});
 const store=M.save(M.read(win.localStorage),p,win.localStorage);
 assert.equal(store.programmes.length,1);
 assert.equal(store.programmes[0].weeks,8);
 assert.equal(A.cycle(win.localStorage).lifts.length,4);
});
test('coach-style lower sessions use 11 and 10-11 working sets',()=>{
 for(const [days,expected] of [[4,[11,11]],[5,[11,10]]]){
  const programme=M.fresh({days,weeks:8});
  const actual=programme.sessions.filter(day=>/^(Lower|Legs)/.test(day.name))
    .map(day=>day.exercises.reduce((count,ex)=>count+ex.sets,0));
  assert.deepEqual(Array.from(actual),expected);
 }
});
test('rebalancing existing programmes is opt-in and retains upper-day edits',()=>{
 const programme=M.fresh({days:4,weeks:8});
 const upper=programme.sessions[0],lower=programme.sessions[1];
 upper.exercises[0].startingKg=125;
 lower.exercises[0].startingKg=160;
 const updated=M.rebalanceLegDays(programme);
 assert.equal(updated.sessions[0],upper);
 assert.equal(updated.sessions[1].id,lower.id);
 assert.equal(updated.sessions[1].exercises[0].startingKg,160);
 assert.equal(programme.sessions[0].exercises[0].startingKg,125);
});
test('coach-style squat stays away from redundant heavy lower compounds',()=>{
 const items=A.plan('Back Squat',2,{powerbuilding:true,lifts:A.cycle(win.localStorage).lifts});
 assert.deepEqual(Array.from(items,ex=>ex.name),['Lying Leg Curl','Leg Extension','Walking Lunge']);
 assert.equal(items.reduce((total,ex)=>total+ex.sets,0),6);
});
test('bench press avoids duplicate shoulder strength day when OHP selected',()=>{
 const mainLifts=A.cycle(win.localStorage).lifts;
 assert.equal(A.plan('Bench Press',2,{powerbuilding:true,lifts:mainLifts})
   .some(ex=>ex.name==='Seated Dumbbell Shoulder Press'),false);
 assert.equal(A.plan('Bench Press',2,{powerbuilding:true,lifts:['Bench Press']})
   .some(ex=>ex.name==='Seated Dumbbell Shoulder Press'),true);
});
test('fourth day becomes Upper B when no AscensionX overhead press is selected',()=>{
 win.localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle:{
  created:'2026-11-11T12:00:00.000Z',
  exercises:['Back Squat','Bench Press','Deadlift'],
  currentWeek:3,weeks:{'Back Squat':3,'Bench Press':3,'Deadlift':3}
 }}));
 const proposed=A.schedule(4,win.localStorage);
 assert.equal(proposed.valid,true);
 assert.equal(proposed.slots[3].title,'Upper B · Hypertrophy');
 assert.equal(proposed.slots[3].exercises.length,6);
 assert.equal(proposed.slots[3].exercises.reduce((sum,ex)=>sum+ex.sets,0),12);
});
test('accessory working sets taper ahead of AscensionX peak',()=>{
 assert.equal(A.plan('Back Squat',5,{powerbuilding:true}).reduce((total,ex)=>total+ex.sets,0),1);
 assert.equal(A.plan('Back Squat',6,{powerbuilding:true}).length,0);
});
console.log('Passed '+checks+' training integration tests.');
