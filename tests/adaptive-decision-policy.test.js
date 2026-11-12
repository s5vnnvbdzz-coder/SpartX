/* node tests/adaptive-decision-policy.test.js */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const names=['assets/bodybuilding/decision-policy.js','assets/bodybuilding/decision-panels.js'];
const browser={};
vm.runInNewContext(fs.readFileSync(names[0],'utf8'),{window:browser});
const P=browser.SXDecisionPolicy;
let tests=0;
const test=(label,fn)=>{fn();tests++;console.log('PASS',label)};
const asc=(status,recordedWeeks,avgRpe=8)=>({
 status:'evidence',lifts:[{lift:'Back Squat',week:2,recordedWeeks,status,
 latest:recordedWeeks?{avgRpe}:null}]
});
test('Week 2 without previous completed logs never invents performance',()=>{
 for(const count of [0,1]){
  const r=P.powerbuilding(asc('positive',count));
  assert.equal(r.decisions[0].action,'collect');
  assert.equal(r.decisions[0].mainLiftAction,'preserve');
  assert.equal(r.decisions[0].automatic,false);
 }
});
test('two-week negative trend with high RPE suggests conservative accessory reduction only',()=>{
 const r=P.powerbuilding(asc('caution',2,9.5)).decisions[0];
 assert.equal(r.action,'review-reduction');
 assert.equal(r.accessorySetsDelta,-1);
 assert.equal(r.mainLiftProtected,true);
 assert.equal(r.automatic,false);
});
test('two-week positive trend is not enough to progress accessories automatically',()=>{
 const r=P.powerbuilding(asc('positive',2,7.5)).decisions[0];
 assert.equal(r.action,'maintain');
 assert.equal(r.accessorySetsDelta,0);
});
test('three positive linked sessions with controlled RPE suggest individual accessory progression review',()=>{
 const r=P.powerbuilding(asc('positive',3,7.5)).decisions[0];
 assert.equal(r.action,'progress-accessories');
 assert.equal(r.automatic,false);
});
test('missing RPE never justifies a load increase',()=>{
 const r=P.powerbuilding(asc('positive',3,null)).decisions[0];
 assert.equal(r.action,'maintain');
});
test('main lift always protected for missing, watch, caution, positive, steady',()=>{
 for(const status of ['missing','watch','caution','positive','steady']){
  const r=P.powerbuilding(asc(status,3)).decisions[0];
  assert.equal(r.mainLiftAction,'preserve');
  assert.equal(r.automatic,false);
 }
});
test('powerbuilding decisions remain specific to the selected three lifts',()=>{
 const input=asc('steady',2);
 input.lifts=[
  {lift:'Back Squat',week:2,recordedWeeks:2,status:'steady',latest:{avgRpe:8}},
  {lift:'Bench Press',week:2,recordedWeeks:2,status:'positive',latest:{avgRpe:8}},
  {lift:'Deadlift',week:2,recordedWeeks:2,status:'caution',latest:{avgRpe:9.5}}];
 const decisions=P.powerbuilding(input).decisions;
 assert.deepEqual(Array.from(decisions,x=>x.lift),['Back Squat','Bench Press','Deadlift']);
 assert.equal(decisions[2].action,'review-reduction');
 assert.equal(decisions[0].action,'maintain');
});
test('bodybuilding without two exposures collects evidence rather than randomly rotating',()=>{
 const result=P.bodybuilding({status:'evidence',sessions:1,review:{due:false},
  decisions:[{exercise:'Iso-Lateral Row',day:'Upper A',week:2,observations:1,reason:'Some improvement'}]});
 assert.equal(result.decisions[0].action,'maintain');
 assert.equal(result.review.due,false);
 assert.deepEqual(Array.from(result.review.reviewExerciseNames),[]);
});
test('four-week review proposes only flagged changes and does not rewrite programme',()=>{
 const original={status:'evidence',sessions:12,
  review:{due:true,start:1,end:4,completedBlockSessions:12,blockSessions:12},
  decisions:[
   {exercise:'Leg Curl',day:'Lower',week:5,observations:4,reason:'Two difficult sessions: suggest a small load reduction and reassess recovery.'},
   {exercise:'Iso-Lateral Row',day:'Upper',week:5,observations:4,reason:'Full upper rep target reached, progress when appropriate.'}
  ]};
 const before=JSON.stringify(original);
 const out=P.bodybuilding(original);
 assert.equal(out.review.due,true);
 assert.deepEqual(Array.from(out.review.reviewExerciseNames),['Leg Curl']);
 assert.deepEqual(Array.from(out.review.preserveExerciseNames),['Iso-Lateral Row']);
 assert.equal(out.decisions.every(x=>x.automatic===false),true);
 assert.equal(JSON.stringify(original),before);
});
test('manual standalone workout is not an input to decision policy',()=>{
 const input={ascension:asc('steady',2),bodybuilding:{status:'no-programme',decisions:[]}};
 const before=JSON.stringify(input);
 const out=P.evaluate(input);
 assert(out.safeguards.standaloneExcluded);
 assert(out.safeguards.mainLiftsPreserved);
 assert(out.safeguards.needsApprovalForStructuralEdits);
 assert.equal(JSON.stringify(input),before);
});
test('UI presents linked recommendations on both SpartanX and Intelligence',()=>{
 const js=fs.readFileSync(names[1],'utf8');
 const app=fs.readFileSync('index.html','utf8');
 const intelligence=fs.readFileSync('intelligence/index.html','utf8');
 assert(js.includes('NEXT-SESSION DECISIONS'));
 assert(js.includes('global.SXDecisionPolicy?.powerbuilding'));
 assert(js.includes('global.SXDecisionPolicy?.bodybuilding'));
 assert(app.includes('decision-policy.js?v=306'));
 assert(intelligence.includes('decision-policy.js?v=306'));
});
console.log('Passed '+tests+' new decision-policy checks.');
