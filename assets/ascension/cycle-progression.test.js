/* Run with: node assets/ascension/cycle-progression.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'cycle-progression.js'),'utf8'),{window});
const api=window.SXAscensionProgression;
const plan=[{rpe:7},{rpe:7},{rpe:7.5},{rpe:8},{rpe:8.5},{rpe:6}];
const id='2026-10-01T10:00:00.000Z';
const lifts=['Back Squat','Bench Press','Deadlift','Overhead Press'];
const cycle={created:id,exercises:lifts};
const example=lift=>Array.from({length:6},(_,i)=>({
 lift,cycleId:id,week:i+1,date:'2026-10-'+String(i+2).padStart(2,'0')+'T12:00:00Z',
 setsComplete:true,sets:[{rpe:plan[i].rpe}],avgRpe:plan[i].rpe
}));
const standard=lifts.flatMap(example);
let result=api.review(cycle,standard,plan);
assert.equal(result.ready,true);
assert.deepEqual(Array.from(result.lifts.map(x=>x.delta)),[5,2.5,5,2.5],
 'Strong completed six-week cycle recommends squat/deadlift +5 and bench/OHP +2.5');
assert.ok(api.choices('Back Squat',205).some(x=>x.delta===2.5),
 'Squat/deadlift also permit smaller increases');
assert.ok(api.choices('Deadlift',205).some(x=>x.delta<0),
 'Reduced TM remains an approval option');
const hard=structuredClone(standard);
hard.find(x=>x.lift==='Deadlift'&&x.week===5).sets[0].rpe=9.5;
result=api.review(cycle,hard,plan);
assert.equal(result.lifts.find(x=>x.lift==='Deadlift').delta,0,
 'Very hard final loading week should hold deadlift TM');
const cautious=structuredClone(standard);
cautious.find(x=>x.lift==='Back Squat'&&x.week===3).sets[0].rpe=8.5;
result=api.review(cycle,cautious,plan);
assert.equal(result.lifts.find(x=>x.lift==='Back Squat').delta,2.5,
 'Above-target RPE allows a cautious squat progression');
const missed=structuredClone(standard);
missed.find(x=>x.lift==='Bench Press'&&x.week===2).setsComplete=false;
result=api.review(cycle,missed,plan);
assert.equal(result.lifts.find(x=>x.lift==='Bench Press').delta,0,
 'Missed bench session stops the increase');
const unfinished=standard.filter(x=>!(x.lift==='Back Squat'&&x.week===6));
assert.equal(api.review(cycle,unfinished,plan).ready,false,
 'No next-cycle approval until ALL selected lifts complete Week 6');
const noRpe=structuredClone(standard).map(x=>({...x,sets:[{rpe:''}],avgRpe:null}));
result=api.review(cycle,noRpe,plan);
assert.ok(result.lifts.every(x=>x.delta>0&&/RPE data are limited/.test(x.reason)),
 'Completed sets without RPE receive an explicit evidence warning');
const unrelated=standard.concat(example('Deadlift').map(x=>({...x,cycleId:'old-cycle',week:x.week,setsComplete:false,date:'2026-11-01T10:00:00Z'})));
assert.equal(api.review(cycle,unrelated,plan).lifts.find(x=>x.lift==='Deadlift').delta,5,
 'Other cycle history cannot affect current progression');
const html=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
assert.ok(html.includes('id="ascApproveNextCycle"'),'Approval button exists');
assert.ok(html.includes('function approveAscensionNextCycle()'),'Approval handler exists');
assert.ok(html.includes('trainingMaxes:nextTms'),'Next cycle persists separate training maxes');
assert.ok(html.includes('previousCycleId:oldId'),'Previous cycle identity preserved');
assert.ok(html.includes('cycleNumber:'),'New cycle increments the counter');
assert.ok(html.includes('const previousAdaptive=window.SXAscensionAdaptive?.read?.(oldId)'),
 'Adaptive training settings carried forward');
assert.ok(html.includes('state.cycle?.trainingMaxes?.[lift]'),
 'Training-max override used by all loading calculations');
console.log('AscensionX six-week TM rollover: tests passed');
