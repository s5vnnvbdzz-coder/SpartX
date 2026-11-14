/* node assets/ascension/load-guard.test.js
 * Reproduce November 2026 deadlift discrepancy without changing old data.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const window={};
vm.runInNewContext(fs.readFileSync('assets/ascension/load-guard.js','utf8'),{window});
const reconcile=window.SXAscensionLoadGuard.reconcile;
const id='2026-11-01T10:00:00.000Z';
const plan=[
 {week:1,topPct:72.5,backPct:67.5},
 {week:2,topPct:77.5,backPct:72.5},
 {week:3,topPct:82.5,backPct:77.5},
 {week:4,topPct:87.5,backPct:82.5},
 {week:5,topPct:92.5,backPct:87.5},
 {week:6,topPct:60,backPct:null,deload:true}
];
const week2={cycleId:id,lift:'Deadlift',week:2,date:'2026-11-10T13:45:00Z',
 setsComplete:true,topWeight:160,sets:[
  {weight:160,reps:5,label:'Top set'},
  ...Array.from({length:4},()=>({weight:147.5,reps:5,label:'Back-off'}))
 ]};
const values={lift:'Deadlift',week:3,trainingMax:217.5,rounding:2.5,plan,cycleId:id,logs:[week2]};
const original=JSON.stringify(week2);
const next=reconcile(values);
assert.equal(next.nominalTop,180,'Current TM would prescribe 180 kg for week 3');
assert.equal(next.topLoad,165,'Bridge from logged 160 to 165, not a 20 kg jump');
assert.equal(next.nominalBack,167.5);
assert.equal(next.backLoad,152.5,'Back-off is limited from logged 147.5');
assert.equal(next.sourceTop,160);
assert.equal(next.currentPreviousNominal,167.5,'Week 2 currently displays 167.5');
assert.equal(next.changeKg,5);
assert.equal(next.projected,false);
assert.equal(JSON.stringify(week2),original,'Historical week 2 must stay unchanged');
const week4=reconcile({...values,week:4});
const week5=reconcile({...values,week:5});
assert.equal(week4.topLoad,170,'Projected week 4 cannot jump ahead');
assert.equal(week5.topLoad,175,'Projected week 5 cannot jump ahead');
assert.equal(week4.projected,true);
assert.equal(reconcile({...values,week:6}).adjusted,false,'Week 6 deload is never bridged');
const completeAtTarget={...week2,topWeight:167.5};
assert.equal(reconcile({...values,logs:[completeAtTarget]}).topLoad,180,
 'Normal progression remains unchanged when previous target was achieved');
assert.equal(reconcile({...values,logs:[{...week2,setsComplete:false}]}).topLoad,180,
 'Unfinished sessions cannot drive the safety calculation');
assert.equal(reconcile({...values,logs:[{...week2,cycleId:'other'}]}).topLoad,180,
 'Different programme history cannot alter this cycle');
const bench={...values,lift:'Bench Press',week:3,trainingMax:100,logs:[
 {...week2,lift:'Bench Press',topWeight:70,sets:[{weight:70},{weight:67.5}]}
]};
const benchNext=reconcile(bench);
assert.equal(benchNext.topLoad,72.5,'Bench bridge caps next increment to 2.5 kg');
const session={date:'2026-11-10T13:45:00Z',exercises:[{
 name:'Deadlift',
 ascensionLink:{cycleId:id,lift:'Deadlift',week:2,
  plannedSets:[{weight:160,reps:5},...Array.from({length:4},()=>({weight:147.5,reps:5}))]},
 sets:[{type:'Working Set',weight:160,reps:5,done:true},
  ...Array.from({length:4},()=>({type:'Working Set',weight:147.5,reps:5,done:true}))]
}]};
const fallback=reconcile({...values,logs:[],sessions:[session]});
assert.equal(fallback.topLoad,165,'Completed SpartanX workout is a valid fallback when Ascension sync is missing');
session.exercises[0].sets[0].done=false;
assert.equal(reconcile({...values,logs:[],sessions:[session]}).topLoad,180,
 'An incomplete unsynchronised workout cannot affect progression');
const html=fs.readFileSync('AscensionX/index.html','utf8');
assert(html.includes('SXAscensionLoadGuard?.reconcile('),'Single shared prescription function applies bridge');
assert(html.includes("const x=prescribed(lift,p.week)"),'View Cycle uses the shared prescription');
assert(html.includes('const week=currentWeekFor(lift),info=prescribed(lift,week)'),
 'SpartanX import uses exactly the same prescription');
assert(html.includes('spartanHistoryForLoadGuard'),'On-device completed workouts provide safety fallback');
assert(html.includes('loadGuardSummary('),'Preview explains why load is adjusted');
console.log('PASS: Exact 160-to-180 deadlift discrepancy is bridged safely and displayed consistently, with immutable history.');
