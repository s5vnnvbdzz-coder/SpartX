'use strict';
const assert=require('node:assert/strict');
const S=require('../assets/workouts/completion-summary.js');
const session={id:2,date:'2026-11-27',duration:3120,exercises:[{name:'Deadlift',sets:[{weight:100,reps:5,done:true},{weight:140,reps:3,done:true},{weight:160,reps:1,done:false}]},{name:'Row',sets:[{weight:50,reps:10,done:true}]}]};
assert.equal(S.metrics(session).sets,3);assert.equal(S.metrics(session).volume,1420);assert.equal(S.metrics(session).duration,3120);
const coverage=S.muscleCoverage(S.metrics(session).exercises,n=>n==='Deadlift'?{primary:['glutes'],secondary:['lats']}:{primary:['lats'],secondary:['core']});
assert.deepEqual(coverage,{primary:['glutes','lats'],secondary:['core']});
const snapshot=JSON.stringify(session);S.metrics(session);assert.equal(JSON.stringify(session),snapshot);
console.log('PASS: saved-only totals, roles and read-only summary data.');
