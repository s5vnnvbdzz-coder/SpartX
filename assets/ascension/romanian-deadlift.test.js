/* Run: node assets/ascension/romanian-deadlift.test.js */
'use strict';
const assert=require('node:assert/strict');
require('./romanian-deadlift.js');
const rdl=global.SpartanXRomanianDeadlift;
assert.ok(rdl);
const tops=[150,160,170,180,190];
const weights=[97.5,105,102.5,100,95];
const sets=[3,3,3,2,2],reps=[8,8,6,6,5];
for(let week=1;week<=5;week++){
 const a=rdl.fromTopSet({week,topLoad:tops[week-1],cycleId:'2026-11-01T10:00:00Z',tm:205});
 assert.equal(a.weight,weights[week-1], 'Week '+week+' weight');
 assert.equal(a.sets,sets[week-1], 'Week '+week+' sets');
 assert.equal(a.reps,reps[week-1], 'Week '+week+' reps');
 const ex=rdl.createExercise(a);
 assert.equal(ex.name,'Romanian Deadlift');
 assert.equal(ex.sets.length,sets[week-1]);
 assert.ok(ex.sets.every(set=>set.done===false),'All sets must start unchecked');
 assert.equal(ex.ascensionLink,undefined,'Do not make the accessory a mandatory AscensionX lift');
}
assert.equal(rdl.fromTopSet({week:6,topLoad:122.5}),null,'No RDL during deload');
assert.equal(rdl.fromTopSet({week:2,topLoad:0}),null);
const cycle={created:'2026-11-01T10:00:00Z',exercises:['Bench Press','Deadlift'],weeks:{Deadlift:2}};
const profile={max:{Deadlift:215},tmPct:95,rounding:2.5};
const active=rdl.fromAscensionState({cycle,profile});
assert.equal(active.trainingMax,205);
assert.equal(active.topLoad,160);
assert.equal(active.weight,105);
assert.equal(active.sets,3);assert.equal(active.reps,8);
const heavier=rdl.fromAscensionState({cycle,profile:{...profile,max:{Deadlift:230}}});
assert.ok(heavier.weight>active.weight,'Exercise weight updates when TM rises');
assert.equal(rdl.fromAscensionState({cycle:{...cycle,exercises:['Bench Press']},profile}),null);
console.log('PASS: Romanian Deadlift 5 weeks, deload exclusion, independence and TM updates');
