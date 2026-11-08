/* Run: node assets/ascension/paused-bench.test.js */
'use strict';
const assert=require('node:assert/strict');
require('./paused-bench.js');
const accessory=global.SpartanXPausedBench;
assert.ok(accessory);
const loads=[110,117.5,125,132.5,140,92.5];
const weights=[92.5,100,100,100,97.5];
const sets=[3,3,3,2,2],reps=[5,5,4,4,3];
for(let week=1;week<=5;week++){
 const result=accessory.fromTopSet({week,topLoad:loads[week-1],cycleId:'2026-11-01T10:00:00Z',tm:152.5});
 assert.equal(result.weight,weights[week-1]);
 assert.equal(result.sets,sets[week-1]);
 assert.equal(result.reps,reps[week-1]);
 const exercise=accessory.createExercise(result);
 assert.equal(exercise.name,'Paused Bench Press');
 assert.equal(exercise.sets.length,result.sets);
 assert.ok(exercise.sets.every(set=>set.done===false));
 assert.equal(exercise.ascensionLink,undefined,'Accessory must not affect the main AscensionX cycle');
}
assert.equal(accessory.fromTopSet({week:6,topLoad:92.5}),null,'Deload has no paused bench');
assert.equal(accessory.fromTopSet({week:2,topLoad:0}),null);
const cycle={created:'2026-11-01T10:00:00Z',exercises:['Bench Press'],weeks:{'Bench Press':2}};
const profile={max:{'Bench Press':160},tmPct:95,rounding:2.5};
const selected=accessory.fromAscensionState({cycle,profile});
assert.equal(selected.topLoad,117.5,'Week 2 main top load from current TM');
assert.equal(selected.weight,100);
assert.equal(selected.sets,3);
assert.equal(selected.reps,5);
const heavier=accessory.fromAscensionState({cycle,profile:{...profile,max:{'Bench Press':170}}});
assert.notEqual(heavier.weight,100,'Paused load must respond to live changes in 1RM');
assert.equal(accessory.fromAscensionState({cycle:{...cycle,exercises:['Deadlift']},profile}),null);
console.log('PASS: AscensionX paused bench weights, deload, independence and TM updates');
