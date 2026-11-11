/* node tests/active-exercise-actions.test.js
 * Checks superset rules without needing a browser or changing saved history.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('assets/workouts/active-exercise-actions.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const cardio=fs.readFileSync('assets/cardio/cardio.js','utf8');
const css=fs.readFileSync('assets/workouts/active-exercise-actions.css','utf8');
const window={};vm.runInNewContext(src,{window});
const A=window.SXActiveExerciseActions;
const ex=(name,sets=2)=>({name,rest:90,sets:Array.from({length:sets},()=>({type:'Working Set',reps:'10',weight:'25',done:false}))});
let checks=0;
const test=(label,fn)=>{fn();checks++;console.log('PASS',label)};
const initial=[ex('Incline Dumbbell Press'),ex('Lat Pulldown'),ex('Cable Curl'),ex('Triceps Pushdown')];
test('only exactly two distinct exercise indices can become a superset',()=>{
 assert.equal(A.setPair(initial,[0],0),null);
 assert.equal(A.setPair(initial,[0,0],0),null);
 assert.equal(A.setPair(initial,[0,3],2),null);
 assert.equal(A.setPair(initial,[0,99],0),null);
});
const p=A.setPair(initial,[0,1],0,()=> 'ss-one');
test('pair creation labels A1/A2, remembers partner and preserves source exercises',()=>{
 assert(p&&p[0].sxSupersetId==='ss-one'&&p[1].sxSupersetId==='ss-one');
 assert.equal(initial[0].sxSupersetId,undefined);
 assert.equal(A.badge(p,0).label,'SS1 · A1');
 assert.equal(A.badge(p,1).label,'SS1 · A2');
 assert.equal(A.badge(p,0).partnerName,'Lat Pulldown');
 assert.equal(A.badge(p,2),null);
});
test('no overlapping pairs: existing member must be dissolved before reuse',()=>{
 const p2=A.setPair(p,[2,1],2,()=> 'ss-two');
 assert.equal(p2,null);
 const pairs=A.setPair(p,[2,3],2,()=> 'ss-two');
 assert.equal(A.badge(pairs,2).label,'SS2 · A1');
 assert.equal(A.badge(pairs,3).label,'SS2 · A2');
});
test('editing an existing pair only changes its participants, not working sets',()=>{
 const previousSets=p[0].sets;
 const changed=A.setPair(p,[0,2],0);
 assert.equal(changed[0].sxSupersetId,'ss-one');
 assert.equal(changed[1].sxSupersetId,undefined);
 assert.equal(changed[2].sxSupersetId,'ss-one');
 assert.equal(changed[0].sets,previousSets);
});
test('remove superset detaches both without deleting exercises',()=>{
 const removed=A.removePair(p,0);
 assert.equal(removed.length,4);
 assert.equal(A.badge(removed,0),null);
 assert.equal(A.badge(removed,1),null);
 assert.equal(removed[0].sets,p[0].sets);
});
test('safe reorder changes display order but not workout entries',()=>{
 const reordered=A.reorder(p,[3,1,0,2]);
 assert.deepEqual(Array.from(reordered,x=>x.name),['Triceps Pushdown','Lat Pulldown','Incline Dumbbell Press','Cable Curl']);
 assert.equal(reordered[2],p[0]);
 assert.equal(reordered[1],p[1]);
 assert.equal(A.badge(reordered,1).partnerIndex,2);
 assert.equal(A.badge(reordered,1).label,'SS1 · A1');
 assert.equal(A.reorder(p,[0,0,1,2]),null);
 assert.equal(A.reorder(p,[0,1]),null);
 assert.equal(A.reorder(p,[0,1,2,99]),null);
});
test('a completed A1 working set schedules the next available A2 set',()=>{
 p[0].sets[0].done=true;
 const n=A.next(p,0,0);
 assert.equal(n.index,1);
 assert.equal(n.setIndex,0);
 assert.equal(n.name,'Lat Pulldown');
});
test('completing A2 alternates back to the next available A1 working set',()=>{
 p[1].sets[0].done=true;
 const n=A.next(p,1,0);
 assert.equal(n.index,0);
 assert.equal(n.setIndex,1);
});
test('when partner has finished, resume remaining source sets',()=>{
 p[1].sets[1].done=true;
 const n=A.next(p,0,0);
 assert.equal(n.index,0);
 assert.equal(n.setIndex,1);
});
test('no countdown after the last working set in both paired exercises',()=>{
 p[0].sets[1].done=true;
 assert.equal(A.next(p,0,1),null);
});
test('warm-up completion does not trigger superset alternation',()=>{
 const warm=A.setPair([{name:'Squat',sets:[{type:'Warm-up',done:true},{type:'Working Set',done:false}]},ex('Row')],[0,1],0,()=> 'ss-warm');
 assert.equal(A.next(warm,0,0),null);
});
test('menu and management screens are active-session actions and always cancellable',()=>{
 for(const token of [
  "overlay.id='sxExerciseActionsOverlay'",'Reorder Exercises','Replace Exercise',
  'Add to Superset','Remove Exercise','sxActiveExerciseReorder','sxActiveExerciseSuperset',
  'data-sx-cancel','data-sx-save','pointerdown','pointermove','pointerup',
  'Hold and drag','SAVE SUPERSET','REMOVE EXISTING SUPERSET'
 ])assert(src.includes(token),token);
 assert(css.includes('env(safe-area-inset-bottom'));
 assert(css.includes('sx-exercise-actions-sheet'));
});
test('rest timer preserves countdown and identifies next superset movement',()=>{
 for(const token of [
  'nextSupersetIndex','SUPERSET · NEXT:','sxActiveActionsUI?.flashNext',
  'function remapActiveExerciseTimer(order)','window.SXActiveExerciseActions.next(work,i,completedSetIndex)',
  'snapshotActiveRest()','attachRestCountdown(newIndex,timer)','if(superset&&!next'
 ])assert(html.includes(token),token);
 assert(html.includes('openExerciseActions(\'+i+\')'));
 assert(cardio.includes('openExerciseActions(\'+i+\')'));
 assert(!cardio.includes('sx-replace-exercise" onclick='));
});
console.log('Passed '+checks+' active exercise actions and supersets checks.');
