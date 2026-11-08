/* Run: node intelligence/live.test.js — provisional live-set regressions. */
'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('./engine.js');
require('./bridge.js');
require('./live.js');
const E=global.SXEngine,B=global.SXBridge,L=global.SXLive;
assert.ok(E&&B&&L);
const last=new Date(Date.now()-86400000).toISOString();
const saved={profile:{name:'Athlete'},sessions:[{
 id:'prior',name:'Bench strength',date:last,duration:3000,
 exercises:[{name:'Barbell Bench Press',sets:[
 {weight:105,reps:5,rpe:8,done:true,type:'Working Set'},
 {weight:105,reps:5,rpe:8,done:true,type:'Working Set'}]}]
}]};
const draft={
 version:1,sessionActive:true,editingSessionId:null,activeWorkoutName:'Bench live',elapsed:480,
 work:[{name:'Bench Press',notes:'',sets:[
  {weight:'40',reps:'5',type:'W',rpe:'',done:true},
  {weight:'110',reps:'5',type:'Working Set',rpe:'7',done:true},
  {weight:'110',reps:'5',type:'Working Set',rpe:'7',done:true},
  {weight:'125',reps:'3',type:'Working Set',rpe:'10',done:false},
  {weight:'',reps:'',type:'Working Set',done:true}
 ]},{name:'StairMaster (Floors)',sets:[{weight:0,reps:0,type:'Cardio',done:true}]}]
};
let writes=0;
const store={
 data:{spartx_db:JSON.stringify(saved),spartx_draft_v1:JSON.stringify(draft)},
 getItem(k){return this.data[k]??null},
 setItem(){writes++;throw new Error('Adapter must not write to SpartanX')},
 removeItem(){writes++;throw new Error('Adapter must not remove data')}
};
const history=B.read(store).sessions;
assert.equal(history.length,1);
const live=B.readLive(store);
assert.equal(live.status,'live');
assert.equal(live.sets,3,'Only checked valid resistance sets count');
const stats=L.summarise(live,history,'Bench Press');
assert.equal(stats.sets,3);
assert.equal(stats.workingSets,2);
assert.equal(stats.warmupSets,1);
assert.equal(stats.volumeKg,1300,'Total volume includes completed warm-ups');
assert.equal(stats.workingVolumeKg,1100);
assert.equal(stats.selected.bestE1rm,128.3,'Uses 1–12 rep work sets');
assert.equal(stats.selected.previousE1rm,122.5,'Compared with saved last session');
assert.ok(stats.selected.estimateDelta>0);
assert.equal(stats.selected.avgRpe,7);
assert.equal(stats.selected.advice.kind,'positive','Progression suggestion needs saved comparison plus low RPE');
assert.equal(writes,0);
assert.equal(store.data.spartx_db,JSON.stringify(saved),'History remains unchanged');
// Changing RPE affects advice but cannot save current set to historical stats.
draft.work[0].sets[1].rpe='9.5';
store.data.spartx_draft_v1=JSON.stringify(draft);
const hard=L.summarise(B.readLive(store),history,'Bench Press');
assert.equal(hard.selected.advice.kind,'caution');
assert.equal(history.length,1);
draft.work[0].notes='SpartanX cycle: Bench Week 2';
store.data.spartx_draft_v1=JSON.stringify(draft);
assert.match(L.summarise(B.readLive(store),history,'Bench Press').selected.advice.title,/cycle/i);
draft.editingSessionId='prior';
store.data.spartx_draft_v1=JSON.stringify(draft);
assert.equal(B.readLive(store).status,'idle','Editing historical workouts is not live');
draft.editingSessionId=null;draft.sessionActive=false;
store.data.spartx_draft_v1=JSON.stringify(draft);
assert.equal(B.readLive(store).status,'idle','Inactive sessions are not live');
draft.sessionActive=true;
draft.work[0].sets.forEach(s=>s.done=false);
store.data.spartx_draft_v1=JSON.stringify(draft);
assert.equal(B.readLive(store).status,'waiting','New workout with no completed sets');
delete store.data.spartx_draft_v1;
assert.equal(B.readLive(store).status,'idle','Discard clears provisional view');
store.data.spartx_draft_v1='broken json';
assert.equal(B.readLive(store).status,'unavailable','Malformed live draft does not crash');
assert.equal(writes,0,'Neither bridge writes to SpartanX');
console.log('PASS — SpartanX Intelligence live completed-set regression tests.');
