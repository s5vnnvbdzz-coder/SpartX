/* node science/engine.test.js — Phase 2 engine regression tests */
'use strict';
const assert=require('node:assert/strict');
const E=require('../assets/science/evidence-engine.js');
let passed=0;
function test(label,fn){fn();passed++;console.log('PASS '+label);}
const full=['barbell','dumbbell','machine','cable','bodyweight'];
function plan(goal,days,options={}){return E.generate({goal,days,equipment:full,minutes:90,...options});}
test('evidence metadata is explicit and points to original indexed research',()=>{
 assert(E.EVIDENCE.length>=3);
 E.EVIDENCE.forEach(e=>{assert(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(e.url));assert(e.level);});
});
test('all three goals generate auditable 3-6 day weeks',()=>{
 for(const goal of ['bodybuilding','powerlifting','powerbuilding'])for(const days of [3,4,5,6]){
  const p=plan(goal,days);
  assert.equal(p.sessions.length,days,goal+': '+days);
  assert.equal(p.audit.errors.length,0,goal+': '+days+' '+p.audit.errors.join('; '));
  assert.equal(p.readOnly,true);
  assert(p.sessions.every(s=>s.exercises.length>=3));
  assert(p.sessions.every(s=>s.exercises.every(e=>p.profile.equipment.includes(e.equipment))));
 }
});
test('all powerlifting and powerbuilding plans include exact main-lift families',()=>{
 for(const goal of ['powerlifting','powerbuilding'])for(const days of [3,4,5,6]){
  const patterns=plan(goal,days).sessions.flatMap(s=>s.exercises.map(e=>e.pattern));
  for(const name of ['squat','bench','deadlift'])assert(patterns.includes(name),goal+' '+days+' '+name);
 }
});
test('no generated deadlift day contains redundant RDLs or other heavy hinges',()=>{
 for(const goal of ['bodybuilding','powerlifting','powerbuilding'])for(const days of [3,4,5,6]){
  const p=plan(goal,days);
  p.sessions.forEach(d=>{if(d.exercises.some(e=>e.pattern==='deadlift'))assert(!d.exercises.some(e=>e.pattern==='hinge'));});
 }
});
test('programme IDs and exercise selections are stable for equal inputs',()=>{
 const first=plan('bodybuilding',4),second=plan('bodybuilding',4);
 assert.deepEqual(first,second);
});
test('programme templates do not repeat identical exercise IDs within a day',()=>{
 for(const goal of ['bodybuilding','powerlifting','powerbuilding'])for(const days of [3,4,5,6]){
  plan(goal,days).sessions.forEach(d=>assert.equal(d.exercises.length,new Set(d.exercises.map(x=>x.id)).size));
 }
});
test('equipment limitations cannot invent competition lifts',()=>{
 const p=E.generate({goal:'powerlifting',equipment:['bodyweight'],days:4});
 assert.equal(p.audit.passed,false);
 assert.match(p.audit.errors.join(' '),/barbell/i);
});
test('available equipment is honoured, missing patterns are disclosed',()=>{
 const p=E.generate({goal:'bodybuilding',days:4,equipment:['bodyweight']});
 assert(p.sessions.every(d=>d.exercises.every(e=>e.equipment==='bodyweight')));
 assert(p.audit.warnings.some(w=>/No suitable/.test(w)));
});
test('fractional indirect sets are not counted as direct muscle sets',()=>{
 const p=plan('bodybuilding',4);
 assert(p.exposure.Chest.direct>0);
 assert(p.exposure.Triceps.indirect>0);
 assert.equal(p.exposure.Triceps.effective,p.exposure.Triceps.direct+p.exposure.Triceps.indirect);
});
test('generated prescriptions include explanation and source provenance',()=>{
 const p=plan('powerbuilding',4);
 p.sessions.flatMap(d=>d.exercises).forEach(ex=>{
  assert(ex.reason.length>10);assert(ex.evidence.length>=1);
  ex.evidence.forEach(id=>assert(E.EVIDENCE.some(ref=>ref.id===id)));
 });
});
function record(programmeId,ex,weight,reps,rpe){
 return {saved:true,programmeId,exerciseId:ex.id,sets:Array.from({length:ex.sets},()=>({done:true,type:'Working Set',weight,reps,rpe}))};
}
test('adaptation requires linked saved working sets',()=>{
 const p=plan('bodybuilding',4),ex=p.sessions[0].exercises[0];
 const other=record('another-programme',ex,40,ex.repsMax,8);
 assert.equal(E.adjustFromHistory(p,ex.id,[other]).status,'hold');
 const unsaved=record(p.id,ex,40,ex.repsMax,8);unsaved.saved=false;
 assert.equal(E.adjustFromHistory(p,ex.id,[unsaved]).status,'hold');
});
test('adaptation does not increase when effort evidence is absent',()=>{
 const p=plan('bodybuilding',4),ex=p.sessions[0].exercises[0];
 const log=record(p.id,ex,40,ex.repsMax,null);
 assert.equal(E.adjustFromHistory(p,ex.id,[log]).status,'hold');
});
test('adaptation suggests small progression only after targets and RPE align',()=>{
 const p=plan('bodybuilding',4),ex=p.sessions[0].exercises[0];
 const r=E.adjustFromHistory(p,ex.id,[record(p.id,ex,40,ex.repsMax,7)]);
 assert.equal(r.status,'increase-review');assert(r.suggestedKg>40);assert.equal(r.readOnly,true);
});
test('two difficult sessions suggest review rather than automatic editing',()=>{
 const p=plan('powerlifting',4),ex=p.sessions[0].exercises[0];
 const records=[record(p.id,ex,150,ex.repsMin-1,10),record(p.id,ex,150,ex.repsMin-1,10)];
 const r=E.adjustFromHistory(p,ex.id,records);
 assert.equal(r.status,'reduce-review');assert(r.suggestedKg<150);
});
test('pain or low readiness blocks automatic progression',()=>{
 const p=plan('powerlifting',4),ex=p.sessions[0].exercises[0],r=record(p.id,ex,100,ex.repsMax,7);
 assert.equal(E.adjustFromHistory(p,ex.id,[r],{pain:true}).status,'review');
 assert.equal(E.adjustFromHistory(p,ex.id,[r],{low:true}).status,'review');
});
test('inputs do not get mutated by generation or audit',()=>{
 const options={goal:'bodybuilding',days:4,equipment:full.slice()};
 const before=JSON.stringify(options),p=E.generate(options),snapshot=JSON.stringify(p);
 E.audit(p);
 assert.equal(JSON.stringify(options),before);
 assert.equal(JSON.stringify(p),snapshot);
});
test('old Science Lab URL redirects into the existing Spartan Intelligence',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.match(html,/location\.replace\('\.\.\/intelligence\/'\)/);
 assert.match(html,/now belongs to/);
});
console.log('Passed '+passed+' Phase 2 scientific-engine checks.');
