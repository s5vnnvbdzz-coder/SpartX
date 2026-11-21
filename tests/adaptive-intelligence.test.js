/* node tests/adaptive-intelligence.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const page={innerHTML:''};
const storage={getItem(){return null},setItem(){throw Error('Read-only module attempted to write')}};
const browser={localStorage:storage,document:{getElementById(id){return id==='sxAdaptiveIntelligence'?page:null}}};
vm.runInNewContext(fs.readFileSync('assets/bodybuilding/adaptive-intelligence.js','utf8'),
 {window:browser,module:{exports:{}}});
const A=browser.SXAdaptiveIntelligence;
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS',name)}
const session=(id,rpe,linked=true,type='Working Set',weight=100,reps=3)=>({
 id:'saved-'+id,date:new Date(Date.UTC(2026,10,10+id,12)).toISOString(),
 exercises:[{name:'Bench Press',
  ...(linked?{ascensionLink:{cycleId:'2026-11-01T00:00:00Z',week:id,lift:'Bench Press'}}:{}),
  sets:[{done:true,type,weight,reps,rpe}]}]
});
test('minimum three linked sessions needed for athlete-response interpretation',()=>{
 const row=A.profiles([session(1,9),session(2,8)])[0];
 assert.equal(row.status,'collect');
 assert.equal(row.confidence,'insufficient');
});
test('same weight and reps with lower RPE are shown as tentative evidence',()=>{
 const raw=[session(1,9),session(2,8.5),session(3,8)];
 const unchanged=JSON.stringify(raw),row=A.profiles(raw)[0];
 assert.equal(row.status,'easier');
 assert.equal(row.comparison.weight,100);
 assert.equal(row.comparison.reps,3);
 assert.equal(row.comparison.deltaRpe,-0.5);
 assert.equal(row.readOnly,true);
 assert.equal(JSON.stringify(raw),unchanged);
});
test('increased RPE warns instead of prescribing heavier main lifts',()=>{
 const row=A.profiles([session(1,8),session(2,8.5),session(3,9)])[0];
 assert.equal(row.status,'harder');
 assert(!Object.hasOwn(row,'prescribedKg'));
});
test('unlinked standalone workouts and uncompleted sets never qualify',()=>{
 assert.equal(A.profiles([session(1,9,false)]).length,0);
 const incomplete=session(1,9);incomplete.exercises[0].sets[0].done=false;
 assert.equal(A.profiles([incomplete]).length,0);
});
test('back-off working sets count but warm-ups do not',()=>{
 assert.equal(A.profiles([session(1,9,true,'B')])[0].sessions,1);
 assert.equal(A.profiles([session(1,9,true,'W')]).length,0);
});
test('unknown or missing RPE does not invent individual progression',()=>{
 const rows=A.profiles([session(1,null),session(2,null),session(3,null)]);
 assert.equal(rows[0].status,'collect');
 assert.equal(rows[0].comparison,null);
});
test('high effort in multiple dissimilar sessions is a caution, not a strength trend',()=>{
 const row=A.profiles([session(1,9.5,true,'Working Set',100),session(2,9.5,true,'Working Set',105),
  session(3,7.5,true,'Working Set',110)])[0];
 assert.equal(row.status,'watch');
 assert.equal(row.comparison,null);
});
test('above-target live RPE produces advisory only and never edits source sets',()=>{
 const live={status:'live',exercises:[{name:'Bench Press',targetRpe:8,programmed:true,
  sets:[{done:true,type:'Working Set',weight:140,reps:3,rpe:9.5}]}]};
 const before=JSON.stringify(live),advice=A.reviewLive(live);
 assert.equal(advice[0].status,'review');
 assert.match(advice[0].detail,/never silently change/i);
 assert.equal(JSON.stringify(live),before);
});
test('missing target RPE cannot be treated as a missed prescribed effort target',()=>{
 const live={status:'live',exercises:[{name:'Bench Press',
  sets:[{done:true,type:'Working Set',weight:140,reps:3,rpe:9}]}]};
 assert.deepEqual(Array.from(A.reviewLive(live)),[]);
});
test('pressing support on previous calendar day is flagged without declaring injury risk',()=>{
 const slots=[
  {kind:'support',day:'MON',exercises:[{name:'Triceps Pushdown'}]},
  {kind:'ascension',day:'TUE',lift:'Bench Press'}
 ];
 const result=A.upperOverlap({valid:true,slots});
 assert.equal(result.length,1);
 assert.match(result[0].detail,/potential|check|recovery/i);
 assert.equal(A.upperOverlap({valid:false,slots}).length,0);
});
test('render never modifies workout storage or adds an independent app',()=>{
 browser.SXDecisionEngine={safeSessions:()=>({status:'ready',
  sessions:[session(1,9),session(2,8.5),session(3,8)]}),
  reviewSchedule:()=>[]};
 browser.SXBridge={readLive:()=>({status:'idle',exercises:[]})};
 A.render('sxAdaptiveIntelligence',{mode:'spartanx'});
 assert.match(page.innerHTML,/Same work feels easier/);
 assert.match(page.innerHTML,/No automatic changes/i);
 const main=fs.readFileSync('intelligence/index.html','utf8');
 const controller=fs.readFileSync('intelligence/app.js','utf8');
 const bridge=fs.readFileSync('intelligence/bridge.js','utf8');
 const live=fs.readFileSync('intelligence/live.js','utf8');
 assert(main.includes('adaptive-intelligence.js?v=369'));
 assert(main.includes('id="sxAdaptiveIntelligence"'));
 assert(controller.includes("SXAdaptiveIntelligence?.render?.('sxAdaptiveIntelligence'"));
 assert(bridge.includes('targetRpe,programmed:'));
 assert(live.includes("title:'Effort above programme target'"));
});
console.log('Passed '+checks+' Adaptive Intelligence checks.');
