/* node tests/rest-timer.test.js
   Regression tests against the actual rest planner embedded in index.html. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync(require('node:path').resolve(__dirname,'../index.html'),'utf8');
const begin=src.indexOf('function isNumberedWorkoutSet(set){');
const end=src.indexOf('function attachRestCountdown(i,timer){',begin);
assert.ok(begin!==-1&&end>begin,'Rest planner functions must exist');
const section=src.slice(begin,end);
const working=(done=false)=>({type:'Working Set',done});
const warmup=(done=false)=>({type:'Warm-up',done});
const fixtures=[
 {name:'Bench Press',rest:120,sets:[warmup(true),warmup(false),working(),working()]},
 {name:'Back Squat',rest:150,sets:[working(),working()]},
 {name:'Lateral Raise',rest:60,sets:[working(),working()]},
 {name:'Deadlift',rest:120,notes:'Imported from AscensionX',sets:[warmup(true),working(),working()]},
 {name:'Overhead Press',rest:120,sets:[working(),working()]}
];
const rest=new Function('work',section+'\nreturn ascensionRestPlan;')(fixtures);
assert.deepEqual(rest(0),{seconds:120,phase:'WARM-UP'},'Warm-up defaults to baseline');
assert.deepEqual(rest(0,0),{seconds:120,phase:'WARM-UP'},'Intermediate warm-up has no boost');
assert.deepEqual(rest(0,1),{seconds:180,phase:'MAIN SETS'},'Boost after final warm-up');
assert.deepEqual(rest(0,2),{seconds:180,phase:'MAIN SETS'},'Boost after numbered working set');
assert.deepEqual(rest(1),{seconds:210,phase:'MAIN SETS'},'Saved-routine squats get 60s over baseline');
assert.deepEqual(rest(2),{seconds:60,phase:''},'Accessory intervals remain unchanged');
assert.deepEqual(rest(3,1),{seconds:180,phase:'MAIN SETS'},'AscensionX imports retain original boost');
assert.deepEqual(rest(4),{seconds:180,phase:'MAIN SETS'},'Overhead Press also gets routine boost');
console.log('PASS — SpartanX saved routine and main-set rest boost.');
