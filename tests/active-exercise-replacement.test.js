/* node tests/active-exercise-replacement.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/workouts/exercise-replacement.js','utf8');
const adaptive=fs.readFileSync('assets/bodybuilding/adaptive-engine.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const cardioSource=fs.readFileSync('assets/cardio/cardio.js','utf8');
const window={};
vm.runInNewContext(source,{window});
vm.runInNewContext(adaptive,{window});
const R=window.SpartanXExerciseReplacement;
const engine=window.SXProgrammeIntelligence;
const cardio={
 isCardio:name=>['Rowing Machine','Bike','StairMaster (Floors)'].includes(name),
 blank:()=>({durationSeconds:0,distanceKm:0,floors:0,steps:0,calories:0,
  weight:0,reps:0,rpe:'',type:'Cardio',done:false})
};
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS',name)};
const strength={name:'Incline Dumbbell Press',rest:90,notes:'8–12 reps',sets:[
 {weight:'42.5',reps:'10',rpe:'8',type:'Warm-up',done:true},
 {weight:'50',reps:'8',rpe:'9',type:'Working Set',done:true},
 {weight:'50',reps:'9',rpe:'8',type:'Working Set',done:false}
]};
test('replacement retains set count/type but clears logged weights, reps, RPE and done',()=>{
 const original=JSON.parse(JSON.stringify(strength));
 const updated=R.prepare(strength,'Machine Chest Press',cardio);
 assert(updated.hadLoggedData);
 assert.equal(updated.exercise.name,'Machine Chest Press');
 assert.equal(updated.exercise.rest,90);
 assert.equal(updated.exercise.sets.length,3);
 assert.deepEqual(Array.from(updated.exercise.sets,s=>s.type),
   ['Warm-up','Working Set','Working Set']);
 assert(updated.exercise.sets.every(s=>s.weight===''&&s.reps===''&&s.rpe===''&&!s.done));
 assert.deepEqual(strength,original,'source should not be mutated');
});
test('blank replacement does not trigger destructive-data warning',()=>{
 const original={name:'Lat Pulldown',rest:120,sets:[{weight:'',reps:'',rpe:'',type:'Working Set',done:false}]};
 assert.equal(R.prepare(original,'Seated Cable Row',cardio).hadLoggedData,false);
});
test('selecting the same movement is a no-op',()=>{
 assert.equal(R.prepare(strength,'incline dumbbell press',cardio),null);
});
test('cardio replacement creates exactly one clean interval',()=>{
 const updated=R.prepare(strength,'Rowing Machine',cardio);
 assert.equal(updated.exercise.sets.length,1);
 assert.equal(updated.exercise.sets[0].type,'Cardio');
 assert.equal(updated.exercise.sets[0].done,false);
 const c=R.prepare({name:'Rowing Machine',sets:[{done:true,durationSeconds:600,distanceKm:2}]},'Bike',cardio);
 assert(c.hadLoggedData);
 assert.equal(c.exercise.sets[0].durationSeconds,0);
 const fromCardio=R.prepare({name:'Bike',sets:[{durationSeconds:0}]},'Squat',cardio);
 assert.equal(fromCardio.exercise.sets.length,3);
});
test('AscensionX main lift substitution unlinks its progression',()=>{
 const ex={...strength,ascensionLink:{cycleId:'cycle1',lift:'Bench Press',week:2}};
 const changed=R.prepare(ex,'Incline Bench Press',cardio);
 assert(changed.unlinksAscension);
 assert(!Object.hasOwn(changed.exercise,'ascensionLink'));
 assert.deepEqual(ex.ascensionLink,{cycleId:'cycle1',lift:'Bench Press',week:2});
});
test('5/3/1 main lift substitutions request cycle protection',()=>{
 const fromSaved={name:'Squat',notes:'SpartanX cycle: Strength · Week 2 · TM 160 kg',sets:[]};
 const fromTools={name:'Bench Press',notes:'Imported from SpartanX Tools · Week 2',sets:[]};
 assert.equal(R.prepare(fromSaved,'Hack Squat',cardio).source531,true);
 assert.equal(R.prepare(fromTools,'Dumbbell Chest Press',cardio).source531,true);
});
test('bodybuilding substitutes satisfy their scheduled slot without losing the plan link',()=>{
 const link={programmeId:'p1',dayId:'d1',week:2,exerciseId:'e1',plannedSets:3};
 const changed=R.prepare({...strength,bodybuildingLink:link},'Machine Chest Press',cardio);
 assert.equal(changed.exercise.bodybuildingLink.exerciseId,'e1');
 assert.equal(changed.exercise.bodybuildingLink.substitutedFrom,'Incline Dumbbell Press');
 assert.equal(link.substitutedFrom,undefined);
 const cardioChange=R.prepare({...strength,bodybuildingLink:link},'Bike',cardio);
 assert(cardioChange.unlinksBodybuilding);
 assert.equal(cardioChange.exercise.bodybuildingLink,undefined);
});
test('powerbuilding support metadata remains on same category substitution',()=>{
 const linked={...strength,sxPowerbuildingSupport:{cycleId:'c1',week:2,day:'SAT'}};
 const result=R.prepare(linked,'Machine Chest Press',cardio);
 assert.equal(result.exercise.sxPowerbuildingSupport.day,'SAT');
});
test('substituted movement performance never advances a different planned movement',()=>{
 const ex={id:'e1',name:'Incline Dumbbell Press',sets:2,repsMin:8,repsMax:12,rir:2,startingKg:40};
 const session={date:'2026-11-01',bodybuildingLink:{programmeId:'p1',dayId:'d1',week:1},
  exercises:[{name:'Machine Chest Press',
   bodybuildingLink:{programmeId:'p1',dayId:'d1',week:1,exerciseId:'e1'},
   sets:[{weight:60,reps:12,rpe:8,done:true,type:'Working Set'},{weight:60,reps:12,rpe:8,done:true,type:'Working Set'}]}]};
 const prescribed=engine.prescribe(ex,2,[session],{programmeId:'p1',dayId:'d1'});
 assert.equal(prescribed.startingKg,40);
 assert.equal(prescribed.recommendation.status,'baseline');
});
test('both workout exercise cards show Replace instead of X, using existing library',()=>{
 assert(html.includes("onclick=\"replaceExercise('+i+')\""));
 assert(cardioSource.includes("onclick=\"replaceExercise('+i+')\""));
 assert(!cardioSource.includes("onclick=\"removeEx('+i+')\""));
 assert(html.includes('pendingReplacementIndex'));
 assert(html.includes("returnFromExerciseLibrary()"));
 assert(html.includes('window.SpartanXExerciseReplacement?.prepare'));
 assert(html.includes('window.spartanxNavigateScreen'));
 assert(html.includes('sx-replace-exercise'));
});
console.log('Passed '+checks+' active exercise replacement checks.');
