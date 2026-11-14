/* node tests/intelligence-muscle-parity.test.js
 * SpartanX and Intelligence must classify the same exercise consistently.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('const exerciseNames=['),end=html.indexOf('const BODYWEIGHT_EXERCISES=',start);
const host=new Function(html.slice(start,end)+
 '\nreturn {exerciseNames,exerciseMuscles};')();
const window={};
vm.runInNewContext(fs.readFileSync('intelligence/muscle-library.js','utf8'),{window});
vm.runInNewContext(fs.readFileSync('intelligence/engine.js','utf8'),{window});
const intel=window.SXMuscleLibrary,engine=window.SXEngine;
for(const name of host.exerciseNames)
 assert.deepEqual(intel.muscles(name),host.exerciseMuscles(name),
  name+' has identical roles in SpartanX and Intelligence');
for(const [name,target] of [
 ['Barbell Row','Upper Back'],['Iso-Lateral Row','Upper Back'],
 ['Seated Cable Row','Upper Back'],['Lat Pulldown','Lats'],
 ['Close-Grip Lat Pulldown','Lats'],['Pull-Up','Lats']
 ])assert.equal(intel.primaryGroup(name),target,name+' Intelligence priority');
const date='2026-11-11T12:00:00.000Z',now=Date.parse('2026-11-14T12:00:00Z');
const sessions=engine.normalizeSessions([{id:'test',date,name:'Back',
 exercises:[
  {name:'Barbell Row',sets:[{weight:'50',reps:'10',done:true,type:'Working Set'}]},
  {name:'Lat Pulldown',sets:[{weight:'45',reps:'12',done:true,type:'Working Set'}]},
  {name:'Iso-Lateral Row',sets:[{weight:'40',reps:'8',done:true,type:'Working Set'}]}
 ]}]);
const out=engine.analyse(sessions,90,now);
const byName=Object.fromEntries(out.muscleRows.map(row=>[row.name,row.sets]));
assert.equal(byName['Upper Back'],2,'Both row types count as upper-back exposure');
assert.equal(byName['Lats'],1,'Pulldowns count as lat exposure');
assert.equal(byName['Back'],undefined,'No generic back category replaces specific groups');
const app=fs.readFileSync('intelligence/app.js','utf8');
assert(app.includes('window.SXMuscleLibrary?.muscles?.(ex.name)'),
 'Intelligence anatomy uses source primary/secondary roles');
assert(app.includes('anatomy.render(primary,secondary,{gender})'),
 'Intelligence anatomical map distinguishes primary and secondary highlights');
console.log('PASS: '+host.exerciseNames.length+
 ' exercise names match Intelligence, with separate row and pulldown workload totals.');
