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
test('Iso-Lateral Row replacement retains AscensionX support notes and rep targets',()=>{
 const link={cycleId:'c1',lift:'Bench Press',week:2,adaptive:true,
  plannedSets:3,repsMin:8,repsMax:12,targetRir:3};
 const original={name:'Chest-Supported Row',rest:120,
  notes:'AscensionX Adaptive Programming · Bench Press · Week 2 · 8–12 reps · ~3 RIR',
  sxStrengthSizeCompanion:link,sets:[
   {weight:'45',reps:'8',rpe:'8',type:'Working Set',done:true},
   {weight:'50',reps:'10',rpe:'',type:'Working Set',done:false},
   {weight:'',reps:'12',rpe:'',type:'Working Set',done:false}
  ]};
 const source=JSON.parse(JSON.stringify(original));
 const prepared=R.prepare(original,'Iso-Lateral Row',cardio);
 assert.equal(prepared.exercise.name,'Iso-Lateral Row');
 assert.equal(prepared.exercise.notes,original.notes);
 assert.equal(prepared.exercise.sxStrengthSizeCompanion.cycleId,'c1');
 assert.equal(prepared.exercise.sxStrengthSizeCompanion.plannedSets,3);
 assert.deepEqual(Array.from(prepared.exercise.sets,x=>x.reps),['8','10','12']);
 assert(prepared.exercise.sets.every(x=>x.weight===''&&x.rpe===''&&!x.done),
  'Original lifting performance must not transfer between exercises');
 assert.deepEqual(original,source,'Source record remains untouched');
});
test('existing manually replaced Iso-Lateral Row recovers prescription without losing logged data',()=>{
 const link={cycleId:'c1',lift:'Bench Press',week:2,adaptive:true,
  plannedSets:2,repsMin:8,repsMax:12,targetRir:3};
 const existing={name:'Iso-Lateral Row',replacementOf:'Chest-Supported Row',
  sxStrengthSizeCompanion:link,rest:120,notes:'',
  sets:[{weight:'42.5',reps:'',rpe:'',type:'Working Set',done:false},
   {weight:'',reps:'',rpe:'',type:'Working Set',done:false}]};
 const unrelated={name:'Lat Pulldown',notes:'my notes',sets:[{weight:'80',reps:'9',done:true}]};
 const originalUnrelated=JSON.stringify(unrelated);
 const items=[existing,unrelated];
 const adaptive={activeCycle:()=>({id:'c1',lifts:['Bench Press']}),
  enabled:()=>true,plan:()=>[{name:'Iso-Lateral Row',sets:3,min:8,max:12,rir:3}]};
 assert.equal(R.repairActiveIsoLateralRows(items,adaptive),1);
 assert.equal(existing.name,'Iso-Lateral Row');
 assert.equal(existing.rest,120);
 assert.equal(existing.sets.length,3);
 assert.equal(existing.sets[0].weight,'42.5');
 assert.deepEqual(Array.from(existing.sets,x=>x.reps),['8','8','8']);
 assert.equal(existing.sxStrengthSizeCompanion.plannedSets,3);
 assert.match(existing.notes,/AscensionX Adaptive Programming.*Bench Press.*Week 2/);
 assert.equal(JSON.stringify(unrelated),originalUnrelated);
 assert.equal(R.repairActiveIsoLateralRows(items,adaptive),0,
  'Recovery is idempotent across refreshes');
});
test('active draft repair does not overwrite completed sets or unrelated free exercises',()=>{
 const linked={name:'Iso-Lateral Row',replacementOf:'Chest-Supported Row',
  sxStrengthSizeCompanion:{cycleId:'c1',lift:'Bench Press',week:4,
   repsMin:8,repsMax:12,targetRir:4,plannedSets:2},
  notes:'',sets:[{weight:'55',reps:'11',rpe:'8',type:'Working Set',done:true}]};
 const manual={name:'Iso-Lateral Row',sets:[{weight:'70',reps:'10',done:true}]};
 const adaptive={activeCycle:()=>({id:'c1',lifts:['Bench Press']}),
  enabled:()=>true,plan:()=>[{name:'Iso-Lateral Row',sets:2,min:8,max:12,rir:4}]};
 assert.equal(R.repairActiveIsoLateralRows([linked,manual],adaptive),1);
 assert.equal(linked.sets.length,1,'Never append when any set is complete');
 assert.equal(linked.sets[0].weight,'55');
 assert.equal(linked.sets[0].reps,'11');
 assert.equal(linked.sets[0].rpe,'8');
 assert.equal(manual.notes,undefined);
});
test('bar and rope triceps swaps retain AscensionX prescription but never copy logged results',()=>{
 const original={name:'Triceps Pushdown (Bar)',rest:75,
  notes:'AscensionX Adaptive Programming · Bench Press · Week 2 · 10–15 reps',
  sxStrengthSizeCompanion:{cycleId:'current',lift:'Bench Press',week:2,repsMin:10,repsMax:15,plannedSets:3},
  sets:[{weight:'25',reps:'12',rpe:'8',type:'Working Set',done:true},
   {weight:'25',reps:'12',rpe:'',type:'Working Set',done:false},
   {weight:'',reps:'',rpe:'',type:'Working Set',done:false}]};
 const rope=R.prepare(original,'Triceps Pushdown (Rope)',cardio);
 assert.equal(rope.exercise.name,'Triceps Pushdown (Rope)');
 assert.equal(rope.exercise.notes,original.notes);
 assert.equal(rope.exercise.rest,75);
 assert.equal(rope.exercise.sxStrengthSizeCompanion.cycleId,'current');
 assert.deepEqual(Array.from(rope.exercise.sets,x=>x.reps),['12','12','10']);
 assert(rope.exercise.sets.every(x=>x.weight===''&&x.rpe===''&&x.done===false),
  'Do not carry logged load or completion into a different attachment');
 assert.equal(original.sets[0].weight,'25','No mutation of source');
});
test('active AscensionX pushdown rename keeps tracked sets and excludes manual rows',()=>{
 const link={cycleId:'current',lift:'Bench Press',week:2,repsMin:10,repsMax:15,plannedSets:3};
 const linked={name:'Triceps Pushdown',notes:'AscensionX Adaptive Programming · Bench Press',
  rest:75,sxStrengthSizeCompanion:link,
  sets:[{weight:'35',reps:'12',rpe:'8',done:true,type:'Working Set'},
   {weight:'35',reps:'12',rpe:'',done:false,type:'Working Set'}]};
 const separate={name:'Triceps Pushdown',notes:'User choice',sets:[{weight:'45',reps:'10',done:true}]};
 const manuallyReplaced={name:'Triceps Pushdown',replacementOf:'Cable Curl',
  sxStrengthSizeCompanion:link,sets:[{weight:'20',reps:'10',done:false}]};
 const otherCycle={name:'Triceps Pushdown',
  sxStrengthSizeCompanion:{...link,cycleId:'old'},sets:[{weight:'40',reps:'10',done:true}]};
 const rope={name:'Triceps Pushdown (Rope)',sxStrengthSizeCompanion:link,
  sets:[{weight:'22',reps:'15',done:true}]};
 const work=[linked,separate,manuallyReplaced,otherCycle,rope];
 const snapshots=work.map(x=>JSON.parse(JSON.stringify(x)));
 const adaptive={activeCycle:()=>({id:'current',lifts:['Bench Press']})};
 assert.equal(R.renameActiveAscensionPushdowns(work,adaptive),1);
 assert.equal(linked.name,'Triceps Pushdown (Bar)');
 assert.deepEqual(linked.sets,snapshots[0].sets,'Entered weight/reps/RPE/done remain intact');
 assert.deepEqual(linked.sxStrengthSizeCompanion,link,'Preserve the AscensionX programme link');
 for(let i=1;i<work.length;i++)assert.deepEqual(work[i],snapshots[i],'Unaffected record '+i);
 assert.equal(R.renameActiveAscensionPushdowns(work,adaptive),0,'Safe on repeated refresh');
 assert.equal(R.renameActiveAscensionPushdowns([{...snapshots[0]}],
  {activeCycle:()=>({id:'different',lifts:['Bench Press']})}),0,'Do not rename another cycle');
});
test('active AscensionX programme migrates unfinished Rear Delt Fly to Rear Delt Reverse Fly',()=>{
 const link={cycleId:'current',lift:'Bench Press',week:2,adaptive:true,
  targetRir:4,repsMin:12,repsMax:20,plannedSets:3};
 const exercise={name:'Rear Delt Fly',notes:'AscensionX Adaptive Programming · Bench Press · Week 2 · 12–20 reps',
  rest:75,sxStrengthSizeCompanion:link,
  sets:[{weight:'',reps:'12',rpe:'',type:'Working Set',done:false},
   {weight:'25',reps:'15',rpe:'7.5',type:'Working Set',done:false},
   {weight:'',reps:'12',rpe:'',type:'Working Set',done:false}]};
 const source=JSON.parse(JSON.stringify(exercise));
 const adaptive={activeCycle:()=>({id:'current',lifts:['Bench Press']}),
  enabled:()=>true,plan:(lift,week)=>lift==='Bench Press'&&week===2?
   [{name:'Rear Delt Reverse Fly',sets:3,min:12,max:20,rir:4}]:[]};
 assert.equal(R.renameActiveAscensionRearDelts([exercise],adaptive),1);
 assert.equal(exercise.name,'Rear Delt Reverse Fly');
 assert.deepEqual(exercise.sets,source.sets,'Preserve all active weights/reps/RPE/set count');
 assert.equal(exercise.notes,source.notes,'Preserve AscensionX notes');
 assert.deepEqual(exercise.sxStrengthSizeCompanion,link,'Preserve programme provenance');
 assert.equal(exercise.rest,75,'Preserve rest prescription');
 assert.equal(R.renameActiveAscensionRearDelts([exercise],adaptive),0,
  'Do not rename twice on reload');
});
test('already-migrated Iso Rear Delt Fly upgrades to the final programme exercise',()=>{
 const link={cycleId:'current',lift:'Bench Press',week:2,plannedSets:3,repsMin:12,repsMax:20};
 const iso={name:'Iso Rear Delt Fly',replacementOf:'Rear Delt Fly',
  sxStrengthSizeCompanion:link,rest:75,notes:'Custom notes',
  sets:[{weight:'20',reps:'15',rpe:'7',done:false,type:'Working Set'},
   {weight:'',reps:'12',rpe:'',done:false,type:'Working Set'}]};
 const before=JSON.parse(JSON.stringify(iso));
 const adaptive={activeCycle:()=>({id:'current',lifts:['Bench Press']}),
  enabled:()=>true,plan:()=>[{name:'Rear Delt Reverse Fly',sets:3,min:12,max:20}]};
 assert.equal(R.renameActiveAscensionRearDelts([iso],adaptive),1);
 assert.equal(iso.name,'Rear Delt Reverse Fly');
 assert.deepEqual(iso.sets,before.sets,'Keep entered weights and reps from existing draft');
 assert.equal(iso.notes,before.notes);
 assert.deepEqual(iso.sxStrengthSizeCompanion,link);
 assert.equal(R.renameActiveAscensionRearDelts([iso],adaptive),0,'Safe if reloaded twice');
 const completed={...before,sets:[{weight:'20',reps:'15',rpe:'7',done:true,type:'Working Set'}]};
 assert.equal(R.renameActiveAscensionRearDelts([completed],adaptive),0,
  'Already performed Iso Rear Delt Fly remains recorded under its real movement name');
});
test('programme change does not relabel completed movements or independent workouts',()=>{
 const base={name:'Rear Delt Fly',rest:75,sxStrengthSizeCompanion:{
  cycleId:'current',lift:'Bench Press',week:2,plannedSets:3},
  sets:[{weight:'',reps:'12',type:'Working Set',done:false}]};
 const complete={...base,sets:[{weight:'12',reps:'18',rpe:'8',done:true}]};
 const unlinked={name:'Rear Delt Fly',sets:[{done:false}]};
 const otherCycle={...base,sxStrengthSizeCompanion:{
  ...base.sxStrengthSizeCompanion,cycleId:'old'}};
 const userReplaced={...base,replacementOf:'Cable Rear Delt Fly'};
 const mainLift={...base,ascensionLink:{lift:'Bench Press'}};
 const bodybuilder={...base,bodybuildingLink:{programmeId:'p1'}};
 const list=[complete,unlinked,otherCycle,userReplaced,mainLift,bodybuilder];
 const before=JSON.stringify(list);
 const adaptive={activeCycle:()=>({id:'current',lifts:['Bench Press']}),
  enabled:()=>true,plan:()=>[{name:'Rear Delt Reverse Fly',sets:3}]};
 assert.equal(R.renameActiveAscensionRearDelts(list,adaptive),0);
 assert.equal(JSON.stringify(list),before,
  'Completed sets, historical links, independent and manually substituted work stay untouched');
 assert.equal(R.renameActiveAscensionRearDelts([{...base}],
  {...adaptive,enabled:()=>false}),0,'Disabled adaptive programmes do not migrate');
 assert.equal(R.renameActiveAscensionRearDelts([{...base}],
  {...adaptive,plan:()=>[]}),0,'No migration when exercise is not programmed this week');
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
test('both workout cards expose Replace through the options menu and existing exercise library',()=>{
 assert(html.includes("onclick=\"openExerciseActions('+i+')\""));
 assert(cardioSource.includes("onclick=\"openExerciseActions('+i+')\""));
 assert(!cardioSource.includes("onclick=\"removeEx('+i+')\""));
 assert(html.includes('onReplace:i=>window.replaceExercise(i)'));
 assert(html.includes('window.replaceExercise=i=>'));
 assert(html.includes('pendingReplacementIndex'));
 assert(html.includes("returnFromExerciseLibrary()"));
 assert(html.includes('window.SpartanXExerciseReplacement?.prepare'));
 assert(html.includes('repairActiveIsoLateralRows(work,window.SXAscensionAdaptive)'));
 assert(html.includes('renameActiveAscensionPushdowns(work,window.SXAscensionAdaptive)'));
 assert(html.includes('renameActiveAscensionRearDelts(work,window.SXAscensionAdaptive)'));



 assert(html.includes('window.spartanxNavigateScreen'));
 assert(html.includes('sx-exercise-menu-trigger'));
});
console.log('Passed '+checks+' active exercise replacement checks.');
