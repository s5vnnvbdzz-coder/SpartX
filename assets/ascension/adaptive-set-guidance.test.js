'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};for(const f of ['assets/ascension/adaptive-set-guidance.js','assets/workouts/rpe-trend.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),{window});
const api=window.SXAdaptiveSetGuidance,trend=window.SpartanXRpeTrend;
const ex=(rpe,weight=68,reps=10,done=true)=>({name:'Lat Pulldown',notes:'AscensionX Adaptive Programming · Week 5 · 10 reps · Target RPE 6',sets:[{weight,reps,rpe,done,type:'Working Set'}]});
const history=trend.historyIndex([{date:'2026-11-20',exercises:[ex(7.5)]}]);
const ref=s=>trend.reference('Lat Pulldown',s,history,true);
const a=(r,w=68,n=10)=>api.advise(ex(r,w,n),ref);
assert.equal(a(7).field,'rpe');assert.equal(a(7).direction,'down');assert.equal(a(7).tone,'positive');assert.equal(a(7).previousRpe,7.5);
assert.equal(a(6).tone,'positive');assert.equal(a(7.5).tone,'negative');assert.equal(a(8).tone,'negative');
assert.equal(a(7,70).tone,'negative');assert.equal(a(7,68,9).tone,'negative');
assert.equal(api.advise(ex(7)).tone,'negative');assert.equal(api.advise(ex(7,68,10,false),ref),null);
const target7=ex(6);target7.notes=target7.notes.replace('RPE 6','RPE 7');assert.equal(api.advise(target7,ref).field,'weight');
assert.equal(api.advise(target7,ref).tone,'positive');
console.log('PASS: comparable RPE improvement, target, regression, different loads/reps, unlogged and progression.');

const manual={...ex(7),notes:''};
assert.equal(api.advise(manual,ref).tone,'positive');
assert.equal(api.advise({...manual,sets:ex(8).sets},ref).tone,'negative');
assert.equal(api.advise({...manual,sets:ex(7.5).sets},ref),null);
assert.equal(api.advise(manual),null);
assert.equal(api.advise({...manual,bodybuildingLink:{week:9,repsMin:10,repsMax:12,targetRpe:8}},ref).field,'weight');
for(const name of ['Back Squat','Bench Press','Deadlift','Overhead Press','OHP','Barbell Bench Press','Deadlift · BBB']){
 assert.equal(api.advise({...ex(7),name,notes:'SpartanX cycle: test · Target RPE 8'},ref),null);
}
assert.equal(api.advise({...ex(7),ascensionLink:{cycleId:'test'}},ref),null);
assert.equal(api.advise({...ex(7),notes:'AscensionX Adaptive Programming · Week 6 · 10 reps · Target RPE 8'},ref).field,'rpe');
assert.equal(api.advise({...ex(7),notes:'10 reps · Target RPE 8'},ref).field,'weight');
assert.equal(api.advise({...manual,sets:[{weight:0,reps:10,rpe:7,done:true,type:'Working Set'}]},()=>({weight:0,reps:10,rpe:8})).tone,'positive');
assert.equal(api.advise({...manual,sets:[{weight:68,reps:10,rpe:7,done:true,type:'Warm-up'}]},ref),null);
console.log('PASS: ordinary workouts, multi-week bodybuilding, prescribed main exclusion, recovery and zero-load comparisons.');
