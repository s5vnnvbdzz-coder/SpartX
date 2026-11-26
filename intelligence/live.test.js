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
// Regression for live AscensionX Week 5: a rogue workout must not become
// the programme comparison, and a partial workout is not a volume decline.
const cycleId=new Date(Date.now()-30*86400000).toISOString();
const planned=[{weight:140,reps:2},...Array.from({length:3},()=>({weight:132.5,reps:2}))];
const link=(week,sets,targetRpe=8)=>({cycleId,lift:'Bench Press',week,plannedSets:sets,targetRpe});
const set=(weight,reps,rpe,type='Working Set',done=true)=>({weight,reps,rpe,type,done});
const older={id:'w4',name:'Week 4',date:new Date(Date.now()-7*86400000).toISOString(),exercises:[{name:'Bench Press',ascensionLink:link(4,[{weight:132.5,reps:3}]),sets:[set(132.5,3,8)]}]};
const rogue={id:'rogue',name:'Independent bench',date:last,exercises:[{name:'Bench Press',sets:[set(130,5,9)]}]};
const before=JSON.stringify({sessions:[rogue,older]});
store.data.spartx_db=before;
draft.work=[{name:'Bench Press',ascensionLink:link(5,planned,8.5),sets:[
 set(60,5,6,'Warm-up'),set(85,3,6,'Warm-up'),set(100,2,6,'Warm-up'),set(115,1,6,'Warm-up'),set(130,1,6,'Warm-up'),
 set(140,2,8.5),...Array.from({length:3},()=>set(132.5,2,null,'Backdown Set',false))]}];
store.data.spartx_draft_v1=JSON.stringify(draft);
const realHistory=B.read(store).sessions;
let week5=L.summarise(B.readLive(store),realHistory,'Bench Press').selected;
assert.equal(week5.bestE1rm,149.3);
assert.equal(week5.previousE1rm,145.8);
assert.equal(week5.previousSession.week,4);
assert.equal(week5.comparisonKind,'programme');
assert.match(week5.comparisonContext,/Different rep targets/);
assert.match(week5.comparisonContext,/RPE 8 → 8.5/);
assert.equal(week5.rpeDelta,0.5);
assert.equal(week5.workVolumeKg,280);
assert.equal(week5.plannedVolume,1075);
assert.equal(week5.volumeProgress,26);
assert.equal(week5.volumeDelta,null);
assert.equal(realHistory.length,2);
assert.equal(E.analyse(realHistory,90).sessions?.length??realHistory.length,2);
assert.equal(store.data.spartx_db,before);
let noPrior=L.summarise(B.readLive(store),realHistory.filter(s=>s.id==='rogue'),'Bench Press').selected;
assert.equal(noPrior.previousE1rm,null);
assert.equal(noPrior.estimateDelta,null);
assert.match(noPrior.comparisonContext,/No earlier linked/);
draft.work[0].sets.slice(6).forEach(s=>{s.done=true;s.rpe=8});
store.data.spartx_draft_v1=JSON.stringify(draft);
week5=L.summarise(B.readLive(store),realHistory,'Bench Press').selected;
assert.equal(week5.working,4);
assert.equal(week5.workVolumeKg,1075);
assert.equal(week5.volumeProgress,100);
assert.equal(week5.bestE1rm,149.3);
assert.equal(week5.volumeDelta,null);
delete draft.work[0].ascensionLink;
store.data.spartx_draft_v1=JSON.stringify(draft);
let independent=L.summarise(B.readLive(store),realHistory,'Bench Press').selected;
assert.equal(independent.previousE1rm,151.7);
assert.equal(independent.comparisonKind,'independent');
assert.equal(independent.plannedVolume,null);
assert.equal(independent.volumeDelta,null);
assert.equal(writes,0);
// Backdowns checked ahead of the top set cannot masquerade as a top set.
draft.work[0].ascensionLink=link(5,planned,8.5);
draft.work[0].sets[5].done=false;
store.data.spartx_draft_v1=JSON.stringify(draft);
let outOfOrder=L.summarise(B.readLive(store),realHistory,'Bench Press').selected;
assert.equal(outOfOrder.bestE1rm,null);
assert.equal(outOfOrder.workVolumeKg,795);
assert.match(outOfOrder.comparisonContext,/Complete the prescribed top set/);
draft.work[0].sets[5].done=true;
// Saved-session comparisons also exclude the independent workout.
global.document={addEventListener(){}};
require('./session-breakdown.js');
const savedWeek5={id:'w5',date:new Date().toISOString(),name:'Week 5',exercises:draft.work};
const report=global.SXSessionBreakdown.analyse([older,rogue,savedWeek5],90);
assert.match(report.latest.items[0].comparison,/linked Week 4/);
assert.match(report.latest.items[0].comparison,/1,075 kg vs 397.5 kg/);
assert.equal(report.history.get('bench press').length,3);
// Static holds are additional cycle evidence, not repetitions or a bench PB.
const holdName='Bench Press Static Hold';
const hold=(weight,durationSeconds)=>({weight,reps:0,durationSeconds,type:'Isometric Hold',rpe:8,done:true});
const extra={role:'additional',cycleId,week:5,lift:'Bench Press'};
const priorHold={name:holdName,sets:[hold(140,8)],sxUserAddedCycle:{...extra,week:4}};
const currentHold={name:holdName,sets:[hold(140,10),hold(130,12),{...hold(160,20),done:false}],sxUserAddedCycle:extra};
const holdHistory=E.normalizeSessions([{id:'hold-old',date:last,exercises:[priorHold,...rogue.exercises]}]);
draft.work=[currentHold];store.data.spartx_draft_v1=JSON.stringify(draft);
const holdLive=B.readLive(store),holdResult=L.summarise(holdLive,holdHistory,holdName).selected;
assert.equal(holdLive.status,'live');
assert.equal(holdResult.isometric,true);
assert.equal(holdResult.completed,2);
assert.equal(holdResult.holdSeconds,22);
assert.equal(holdResult.bestHold.weight,140);
assert.equal(holdResult.bestHold.durationSeconds,10);
assert.equal(holdResult.previousBestSeconds,8);
assert.equal(holdResult.workVolumeKg,0);
assert.equal(holdResult.bestE1rm,null);
assert.equal(E.estimatedMax(hold(160,10)),null);
assert.equal(E.analyse(holdHistory,90).strength['Bench Press'].best,151.7);
assert.equal(holdResult.programmeLink.role,'additional');
const holdReport=global.SXSessionBreakdown.analyse([{id:'hold-old',date:last,exercises:[priorHold]},{id:'hold-new',date:new Date().toISOString(),exercises:[currentHold]}]);
assert.equal(holdReport.latest.items[0].holdSeconds,22);
assert.match(holdReport.latest.items[0].comparison,/8 s/);
assert.equal(holdReport.latest.volume,0);
assert.equal(writes,0);
console.log('PASS — SpartanX Intelligence live completed-set regression tests.');
