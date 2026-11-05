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
console.log('PASS — SpartanX Intelligence engine regression tests.');
