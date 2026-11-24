/* Run: node assets/ascension/continue-support-sync.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=__dirname;
const id='2026-11-01T10:00:00.000Z';
const cycleState={cycle:{
  created:id,exercises:['Back Squat','Bench Press','Deadlift'],
  weeks:{'Back Squat':3,'Bench Press':3,'Deadlift':3},currentWeek:3,
  trainingMaxes:{'Back Squat':175,'Bench Press':150,'Deadlift':202.5}
 },profile:{max:{'Back Squat':185,'Bench Press':160,'Deadlift':215},tmPct:95,rounding:2.5},logs:[]};
const stored={sessions:[{date:'2026-11-13T15:00:00Z',exercises:[
 {name:'Leg Press',sets:[
  {weight:140,reps:10,rpe:7,done:true,type:'Working Set'},
  {weight:140,reps:10,rpe:7,done:true,type:'Working Set'}]},
 {name:'Iso-Lateral Row',sets:[
  {weight:40,reps:12,rpe:7,done:true,type:'Working Set'},
  {weight:40,reps:12,rpe:7,done:true,type:'Working Set'}]}
]}]};
function boot(extra={}){
 const map=new Map([['ascensionx_strength_v1',JSON.stringify(cycleState)],['spartx_db',JSON.stringify(stored)],...Object.entries(extra)]);
 const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const win={localStorage:storage,addEventListener(){}};
 const ctx=vm.createContext({window:win});
 for(const name of ['adaptive-programming.js','../bodybuilding/ascension-companion.js','continue-support-sync.js']){
  vm.runInContext(fs.readFileSync(path.join(dir,name),'utf8'),ctx,{filename:name});
 }
 return {api:win.SXAscensionAdaptive,companion:win.SXAscensionCompanion,sync:win.SXAscensionContinueSupport,storage};
}
const details=(lift='Back Squat')=>({source:'AscensionX',cycleId:id,exercise:lift,week:3,tm:lift==='Bench Press'?150:175});
const main=d=>({name:d.exercise,ascensionLink:{cycleId:id,lift:d.exercise,week:d.week,
 importedTm:d.tm,plannedSets:[{weight:145,reps:4}]},
 sets:[{weight:'145',reps:'4',rpe:'8',type:'Working Set',done:true}]});
const untouched=(name='Hack Squat')=>({name,rest:120,notes:'Old support prescription',
 sxStrengthSizeCompanion:{cycleId:id,lift:'Back Squat',week:3,plannedSets:2,repsMin:8,repsMax:12},
 sets:Array.from({length:2},()=>({weight:'',reps:'8',rpe:'',done:false,type:'Working Set'}))});
const originalCycle=JSON.stringify(cycleState),originalSessions=JSON.stringify(stored);
let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name)};
check('fresh Continue import uses active six-week assistance without a new 2.0 profile',()=>{
 const t=boot();t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 const d=details(),m=main(d),work=[m];
 const originalMain=JSON.stringify(m.sets);
 const response=t.sync.reconcile(work,d,t.companion,t.storage);
 assert.equal(response.handled,true);assert.equal(response.changed,true);
 assert.equal(work[0],m);assert.equal(JSON.stringify(m.sets),originalMain);
 assert.equal(m.ascensionLink.supportSyncVersion,419);
 const plan=t.api.plan(d.exercise,d.week,{},t.storage);
 assert.deepEqual(work.slice(1).map(e=>e.name),Array.from(plan,e=>e.name));
 assert.equal(work[1].name,'Leg Press');
 assert.ok(work[1].sets.every(s=>s.weight==='145'),'Recorded machine load must be used in recommended support work');
 assert.equal(work[1].sets.length,3,'New support set prescription is loaded, not the original two sets');
 assert.equal(t.storage.getItem('ascensionx_strength_v1'),originalCycle);
 assert.equal(t.storage.getItem('spartx_db'),originalSessions);
 const again=t.sync.reconcile(work,d,t.companion,t.storage);
 assert.equal(again.changed,false);assert.equal(work.length,1+plan.length);
});
check('Continue refreshes a stale untouched legacy companion but preserves completed main set and manual exercises',()=>{
 const t=boot();t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 const d=details(),m=main(d),old=untouched(),manual={name:'Custom Core',sets:[{weight:10,reps:10,done:true}]};
 const work=[m,old,manual];const sets=JSON.stringify(m.sets);
 const x=t.sync.reconcile(work,d,t.companion,t.storage);
 assert.equal(x.removed,1);assert.equal(x.changed,true);
 assert.equal(work[0],m);assert.equal(JSON.stringify(m.sets),sets);
 assert.ok(!work.includes(old));assert.ok(work.includes(manual));
 assert.equal(work[1].name,'Leg Press');assert.ok(work[1].sets.length===3);
 assert.equal(work.at(-1),manual);
});
check('Continue does not replace user-entered accessory weights or completed sets',()=>{
 const t=boot();t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 const d=details(),old=untouched();old.sets[0].weight='165';
 const m=main(d),work=[m,old],before=JSON.stringify(work);
 const x=t.sync.reconcile(work,d,t.companion,t.storage);
 assert.equal(x.protected,true);assert.equal(x.changed,false);assert.equal(JSON.stringify(work),before);
 old.sets[0].weight='';old.sets[0].done=true;
 assert.equal(t.sync.reconcile(work,d,t.companion,t.storage).protected,true);
});
check('tagged prescribed weights are safe to update while arbitrary prefilled weights are protected',()=>{
 const t=boot();t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 const d=details('Bench Press');
 const old=t.companion.forImport(d,[],t.storage)[0];
 assert.ok(Number(old.sxStrengthSizeCompanion.prescribedKg)>0);
 const work=[main(d),old];
 assert.equal(t.sync.reconcile(work,d,t.companion,t.storage).protected,undefined);
 const old2=t.companion.forImport(d,[],t.storage)[0];
 old2.sets[0].weight='999';
 assert.equal(t.sync.reconcile([main(d),old2],d,t.companion,t.storage).protected,true);
});
check('Week 5 existing squat is automatically re-ordered without changing a single logged or entered set',()=>{
 const t=boot();t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 const d={...details(),week:5},m=main(d);
 const planned=t.companion.forImport(d,[],t.storage);
 const names=Array.from(planned,ex=>ex.name);
 assert.deepEqual(names,['Leg Press','Leg Extension','45° Back Extension','Hanging Knee Raise']);
 const rows=planned.slice().reverse();
 rows[0].sets[0].done=true;rows[0].sets[0].rpe='8';
 const owned=rows.map(ex=>[ex,JSON.stringify(ex.sets)]);
 const athlete={name:'Manual Lat Raise',sets:[{weight:'16',reps:'12',done:true}]};
 const work=[athlete,rows[0],m,rows[1],rows[2],rows[3]];
 m.ascensionLink.supportSyncVersion=419; // current Continue used to skip all ordering corrections
 const original=JSON.stringify(m.sets);
 const aligned=t.sync.alignLinked(work,d,t.companion,t.storage);
 assert.equal(aligned.changed,true);
 assert.equal(work[0],athlete);
 assert.equal(work[1],m);
 assert.deepEqual(work.slice(2).map(ex=>ex.name),names);
 assert.equal(JSON.stringify(m.sets),original);
 for(const [ex,sets] of owned)assert.equal(JSON.stringify(ex.sets),sets);
 assert.equal(m.ascensionLink.supportOrderVersion,418);
 assert.equal(t.sync.alignLinked(work,d,t.companion,t.storage).changed,false,
  'Do not keep overwriting later manual workout ordering');
 assert.equal(t.storage.getItem('ascensionx_strength_v1'),originalCycle);
 assert.equal(t.storage.getItem('spartx_db'),originalSessions);
});
check('inactive support and unrelated programme links are not rewritten',()=>{
 const t=boot(),d=details(),m=main(d),legacy=untouched(),work=[m,legacy];
 const saved=JSON.stringify(work);
 assert.equal(t.sync.reconcile(work,d,t.companion,t.storage).changed,false);
 assert.equal(JSON.stringify(work),saved);
 t.api.save({enabled:true,days:4,focus:'strength'},t.storage);
 assert.equal(t.sync.reconcile(work,{...d,cycleId:'other-cycle'},t.companion,t.storage).handled,false);
 assert.equal(JSON.stringify(work),saved);
});
check('production Continue Training calls the live reconciliation before old name deduplication',()=>{
 const html=fs.readFileSync(path.join(dir,'../../index.html'),'utf8');
 const body=html.slice(html.indexOf('function ensureAscensionStrengthSizeCompanions('),
  html.indexOf('function import531IntoWorkout('));
 assert.ok(body.includes('SXAscensionContinueSupport?.reconcile?.(work,d,api,localStorage)'));
 assert.ok(body.indexOf('SXAscensionContinueSupport')<body.indexOf('const extras=api.forImport'));
 assert.ok(html.includes('continue-support-sync.js?v=419'));
 assert.ok(html.includes('if(linked||existingUnlinked){'));
 assert.ok(!html.includes('if(window.SXAscensionV2Bridge?.read(localStorage))return;'),
  'An old beta preference must not disable live active-cycle assistance recovery');
 assert.ok(html.includes('SXAscensionContinueSupport?.alignLinked?.(work,details,window.SXAscensionCompanion,localStorage)'),
  'Existing active workouts must restore support in the current generated order');
 assert.ok(html.includes('if(source===\'AscensionX\')ensureAscensionStrengthSizeCompanions(d)'));
 const classic=fs.readFileSync(path.join(dir,'workout-prescription.js'),'utf8');
 assert.ok(classic.includes("topPct:72.5")&&classic.includes("topPct:92.5")&&classic.includes("topPct:60"));
});
console.log('AscensionX Continue Training support synchronisation: '+checks+' regression checks passed');
