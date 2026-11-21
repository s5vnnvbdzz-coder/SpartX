/* node assets/ascension/adaptive-priority.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8');
const id='2026-11-21T12:00:00.000Z';
function boot(lifts=['Back Squat','Bench Press','Deadlift'],week=1) {
 const values=new Map([['ascensionx_strength_v1',JSON.stringify({cycle:{
  created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(lift=>[lift,week])),currentWeek:week
 },logs:[]})]]);
 const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),snapshot:()=>Object.fromEntries(values)};
 const win={localStorage:storage,addEventListener(){}};
 vm.runInNewContext(code,{window:win},{filename:'adaptive-programming.js'});
 return {A:win.SXAscensionAdaptive,storage};
}
const names=slot=>slot.exercises.map(ex=>ex.name);
const signature=schedule=>schedule.slots.map(slot=>[slot.day,slot.title,
 ...slot.exercises.map(e=>e.name+':'+e.sets)]).join('|')).join('\n');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
check('draft goal priority changes the actual prescription before a cycle exists',()=>{
 const {A,storage}=boot();
 const opts={enabled:true,days:4};
 const result=['strength','balanced','hypertrophy'].map(focus=>
  A.previewSchedule(['Back Squat','Bench Press','Deadlift'],{...opts,focus},null,storage));
 assert(result.every(x=>x.valid&&x.slots.length===4));
 assert.equal(new Set(result.map(signature)).size,3);
 assert(result[2].slots[1].exercises.some(x=>x.name==='Machine Chest Press'));
 assert(result[1].slots[1].exercises.some(x=>x.name==='Incline Dumbbell Press'));
 assert(!result[0].slots[1].exercises.some(x=>x.name==='Incline Dumbbell Press'));
});
check('all priorities produce different fifth-day content from Saturday',()=>{
 const {A,storage}=boot();
 for(const focus of ['strength','balanced','hypertrophy']){
  const p=A.previewSchedule(['Back Squat','Bench Press','Deadlift'],{enabled:true,focus,days:5},null,storage);
  assert.equal(p.slots.length,5);
  assert.equal(p.slots[3].day,'SAT');
  assert.equal(p.slots[4].day,'SUN');
  assert.equal(p.slots[3].kind,'support');
  assert.equal(p.slots[4].kind,'support');
  const saturday=new Set(names(p.slots[3]));
  const sunday=names(p.slots[4]);
  assert(sunday.length>=2);
  assert(sunday.every(n=>!saturday.has(n)),focus+' repeats Saturday exercises on Sunday');
  assert(p.slots[4].exercises.every(e=>e.sets<=2),focus+' Sunday support is not low fatigue');
  assert(p.slots[3].exercises.every(e=>e.sets>=2),focus+' Saturday support disappeared');
 }
});
check('live schedule agrees with editor preview for selected priority and 5-day structure',()=>{
 const {A,storage}=boot(['Back Squat','Bench Press','Deadlift'],2);
 for(const focus of ['strength','balanced','hypertrophy']){
  A.save({enabled:true,focus,days:5},storage);
  const settings=A.read(id,storage);
  const actual=A.schedule(null,storage);
  const editor=A.previewSchedule(['Back Squat','Bench Press','Deadlift'],settings,A.activeCycle(storage),storage);
  assert(actual.valid&&editor.valid);
  assert.equal(actual.slots.length,5);
  for(let i=0;i<actual.slots.length;i++){
   assert.deepEqual(names(actual.slots[i]),names(editor.slots[i]),focus+' day '+(i+1)+' differed from editor preview');
   assert.deepEqual(Array.from(actual.slots[i].exercises,e=>e.sets),
      Array.from(editor.slots[i].exercises,e=>e.sets));
  }
 }
});
check('different focus choices alter live assistance, not only labels',()=>{
 const {A,storage}=boot();
 let previews=[];
 for(const focus of ['strength','balanced','hypertrophy']){
  A.save({enabled:true,focus,days:4},storage);
  previews.push(signature(A.schedule(null,storage)));
 }
 assert.equal(new Set(previews).size,3);
});
check('deadlift assistance never injects a second heavy hinge',()=>{
 const {A,storage}=boot();
 for(const focus of ['strength','balanced','hypertrophy']){
  A.save({enabled:true,focus,days:4},storage);
  const ex=A.plan('Deadlift',1,{},storage);
  assert(ex.length>0);
  assert(ex.every(x=>!/romanian|rdl|good morning|deadlift|squat/i.test(x.name)),focus+' heavy hinge overlap');
 }
});
check('four main lifts in five days still use exactly four main sessions and one distinct support',()=>{
 const lifts=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const {A,storage}=boot(lifts);
 A.save({enabled:true,focus:'balanced',days:5},storage);
 const scheduled=A.schedule(null,storage);
 assert.equal(scheduled.slots.filter(s=>s.kind==='ascension').length,4);
 assert.equal(scheduled.slots.filter(s=>s.kind==='support').length,1);
 assert.equal(scheduled.slots[4].kind,'support');
 assert(scheduled.slots[4].exercises.length>=2);
});
check('scheduling and editor preview do not alter existing AscensionX main cycle',()=>{
 const {A,storage}=boot();
 const before=storage.getItem('ascensionx_strength_v1');
 A.previewSchedule(['Back Squat','Bench Press','Deadlift'],{enabled:true,focus:'hypertrophy',days:5},null,storage);
 A.save({enabled:true,focus:'hypertrophy',days:5},storage);
 A.schedule(null,storage);
 assert.equal(storage.getItem('ascensionx_strength_v1'),before);
});
check('recovery in Week 6 still removes all optional accessory work',()=>{
 const {A,storage}=boot(['Back Squat','Bench Press','Deadlift'],6);
 A.save({enabled:true,focus:'hypertrophy',days:5},storage);
 const result=A.schedule(null,storage);
 assert(result.slots.every(x=>x.exercises.length===0));
});
check('preview only creates the requested number of support sessions',()=>{
 const {A,storage}=boot();
 for(const days of [3,4,5]){
  const p=A.previewSchedule(['Back Squat','Bench Press','Deadlift'],{enabled:true,focus:'balanced',days},null,storage);
  assert.equal(p.slots.length,days);
  assert.equal(p.slots.filter(x=>x.kind==='support').length,days-3);
 }
});
console.log('Passed '+passed+' AscensionX priority and support-day regression checks.');
