/* Run with: node intelligence/tests.js
   Independent engine regression tests; no SpartanX app files are changed. */
'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('./engine.js');
const E=global.SXEngine;
assert.ok(E,'Engine export should exist');

for(const type of ['strength','hypertrophy','beginner']){
  const profile=E.makeDemoProfile(type);
  assert.ok(profile.sessions.length>40,type+' sample session count');
  const all=E.analyse(profile.sessions,0);
  const month=E.analyse(profile.sessions,30);
  assert.ok(month.sessions30>0,'Recent sample data exists');
  assert.ok(all.volumeRange>month.volumeRange,'All-time volume larger');
  assert.ok(month.volume30>0,'Last 30 day workload positive');
  for(const lift of E.CORE){
    assert.ok(all.strength[lift].latest,'Compound strength data exists for '+lift);
    const rec=E.recommendation(lift,all.strength[lift].records);
    assert.ok(rec.title && rec.detail && rec.confidence,'Recommendation explains itself');
    assert.ok(['Low','Moderate'].includes(rec.confidence),'No overstated confidence');
  }
}
assert.equal(E.estimatedMax({weight:100,reps:5}),116.7,'Epley 100 kg x5');
assert.equal(E.estimatedMax({weight:100,reps:15}),null,'Epley limited to 12 reps');
assert.equal(E.canonical('Barbell Bench Press'),'Bench Press');
assert.equal(E.canonical('rdl'),'Romanian Deadlift');
const original=[{id:'s1',date:new Date().toISOString(),name:'Test session',exercises:[
  {name:'Barbell Bench Press',sets:[
    {weight:100,reps:5,rpe:8,type:'Working Set',done:true},
    {weight:50,reps:10,rpe:6,type:'Warmup',done:true},
    {weight:9999,reps:5,type:'Working Set',done:true},
    {weight:110,reps:1,type:'Working Set',done:false}
  ]}]}];
const before=JSON.stringify(original);
const sessions=E.normalizeSessions(original);
assert.equal(JSON.stringify(original),before,'Normalizer must not mutate source workouts');
assert.equal(sessions.length,1);
assert.equal(sessions[0].exercises[0].name,'Bench Press');
assert.equal(sessions[0].exercises[0].sets.length,2,'Invalid and unfinished sets excluded');
assert.equal(E.analyse(sessions,30).strength['Bench Press'].latest.max,116.7,'Warmup not used as top working set');
const lacking=E.recommendation('Squat',[]);
assert.equal(lacking.next,null,'No weight suggested without evidence');
const rpeMissing=E.recommendation('Bench Press',[
  {max:105,set:{weight:95,reps:3,rpe:null}},
  {max:110,set:{weight:100,reps:3,rpe:null}}
]);
assert.equal(rpeMissing.next,100,'Conservative suggestion when RPE missing');
// Overview KPIs must reflect the SELECTED lift, including kg volume,
// and the active date range; global workout totals must not leak into cards.
const daysAgo=days=>new Date(Date.now()-days*86400000).toISOString();
const exercise=(name,sets)=>({name,sets:sets.map(set=>({type:'Working Set',done:true,...set}))});
const overviewSessions=[
  {id:'b1',date:daysAgo(10),exercises:[
    exercise('Bench Press',[{weight:100,reps:5,rpe:7},{weight:100,reps:5,rpe:8}]),
    exercise('Back Squat',[{weight:120,reps:5,rpe:8}])
  ]},
  {id:'b2',date:daysAgo(12),exercises:[exercise('Bench Press',[{weight:110,reps:3,rpe:8}])]},
  {id:'s2',date:daysAgo(15),exercises:[exercise('Back Squat',[{weight:125,reps:5,rpe:8}])]},
  {id:'bOld',date:daysAgo(55),exercises:[exercise('Bench Press',[{weight:80,reps:5,rpe:8}])]},
  {id:'oOld',date:daysAgo(60),exercises:[exercise('Overhead Press',[{weight:50,reps:5,rpe:8}])]}
];
const overview30=E.analyse(overviewSessions,30);
const overview90=E.analyse(overviewSessions,90);
assert.equal(overview30.byLift['Bench Press'].sessions,2,'Bench only counts sessions containing bench');
assert.equal(overview30.byLift['Bench Press'].activeDays,2,'Bench only counts dates with bench sets');
assert.equal(overview30.byLift['Bench Press'].workingSets,3,'All completed bench work sets are counted');
assert.equal(overview30.byLift['Bench Press'].volumeKg,1330,'Volume is in kilograms, not tonnes');
assert.equal(overview30.byLift['Squat'].sessions,2,'Squat sessions independent from Bench');
assert.equal(overview30.byLift['Squat'].volumeKg,1225,'Squat volume independent from Bench');
assert.equal(overview30.byLift['Deadlift'].sessions,0,'No invented deadlift sessions');
assert.equal(overview30.byLift['Deadlift'].volumeKg,0,'No invented deadlift kg');
assert.equal(overview30.byLift['Deadlift'].trend,null,'Missing data has no invented trend');
assert.equal(overview90.byLift['Bench Press'].sessions,3,'Time range changes per-lift sessions');
assert.equal(overview90.byLift['Bench Press'].volumeKg,1730,'Time range changes per-lift kg');
assert.equal(overview30.byLift['Bench Press'].trend,overview30.strength['Bench Press'].delta,'KPI trend matches chart');
assert.equal(overview90.byLift['Bench Press'].trend,overview90.strength['Bench Press'].delta,'Trend matches chart after range change');
assert.ok(overview90.weeklyByLift['Bench Press'].some(w=>w.count>0),'Bench consistency shows actual Bench sessions');
assert.ok(overview90.weeklyByLift['Squat'].some(w=>w.count>0),'Squat consistency independent');
// Real AscensionX Week 3 squat regression: 4 reps are prescribed, not an
// arbitrary failure of the generic five-rep progression heuristic.
const ascDate=new Date(Date.now()-3600000).toISOString();
const ascWeek3={
 id:'asc-squat-w3',date:ascDate,name:'Back Squat - Week 3',
 exercises:[{
  name:'Back Squat',
  ascensionLink:{
   cycleId:'2026-10-01T12:00:00.000Z',lift:'Back Squat',week:3,
   plannedSets:[{weight:140,reps:4},...Array.from({length:4},()=>({weight:132.5,reps:4}))],
   targetRpe:7.5
  },
  sets:[
   ...[67.5,92.5,110,127.5].map((weight,i)=>({
    weight,reps:[5,3,2,1][i],rpe:6,type:'Warm-up',done:true
   })),
   ...[7,7.5,7.5,8,8.5].map((rpe,i)=>({
    weight:i===0?140:132.5,reps:4,rpe,type:'Working Set',done:true
   }))
  ]
 }]
};
const ascInput=JSON.stringify(ascWeek3);
const ascNormalized=E.normalizeSessions([ascWeek3]);
assert.equal(JSON.stringify(ascWeek3),ascInput,'AscensionX analysis does not alter original session');
assert.equal(ascNormalized[0].exercises[0].ascensionLink.week,3,'Programme metadata preserved');
const ascAnalysis=E.analyse(ascNormalized,90);
const ascRec=E.recommendation('Squat',ascAnalysis.strength.Squat.records);
assert.equal(ascRec.title,'Proceed to Week 4','Prescribed four-rep Week 3 advances');
assert.equal(ascRec.kind,'positive');
assert.equal(ascRec.programme,true);
assert.equal(ascRec.next,null,'No arbitrary kg increase for linked programme');
assert.match(ascRec.nextLabel,/AscensionX Week 4/);
assert.match(ascRec.detail,/140 kg × 4 at RPE 7/);
assert.match(ascRec.detail,/Average working-set RPE 7.7/);
assert.match(ascRec.detail,/RPE 8.5/);
assert.match(ascRec.detail,/not a recommendation to increase your Training Max/);
const partialWeek3=JSON.parse(ascInput);
partialWeek3.exercises[0].sets.pop();
const partialRec=E.recommendation('Squat',E.analyse([partialWeek3],90).strength.Squat.records);
assert.equal(partialRec.title,'Review Week 3 before advancing','Incomplete working sets must not advance');
const missedReps=JSON.parse(ascInput);
missedReps.exercises[0].sets.at(-1).reps=3;
assert.equal(E.recommendation('Squat',E.analyse([missedReps],90).strength.Squat.records).kind,
 'caution','Missed prescribed reps trigger review');
const week6=JSON.parse(ascInput);
week6.exercises[0].ascensionLink.week=6;
assert.match(E.recommendation('Squat',E.analyse([week6],90).strength.Squat.records).title,
 /review the cycle/,'Final week prompts cycle review rather than arbitrary Week 7');
const unlinked=[{max:150,set:{weight:135,reps:4,rpe:7.5}},
 {max:158.7,set:{weight:140,reps:4,rpe:7}}];
assert.equal(E.recommendation('Squat',unlinked).title,'Repeat before progressing',
 'Generic non-programme workouts retain the existing rule');
console.log('PASS — SpartanX Intelligence engine regression tests.');
