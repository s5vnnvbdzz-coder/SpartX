const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('tools/replica.js','utf8');
const from=source.indexOf("const calculatorInputIds=['ormWeight'");
const to=source.indexOf('// Select the existing value when a numeric field receives focus',from);
const finderFrom=source.indexOf('function calcTrainingMaxFinder()');
const finderTo=source.indexOf('\n\nconst TOOL_VISIBILITY_KEY',finderFrom);
assert.ok(from>=0&&to>from&&finderFrom>=0&&finderTo>finderFrom,'Calculator source must be found');
const core=source.slice(from,to);
const finder=source.slice(finderFrom,finderTo);
const preamble=[
 "const ids=['ormWeight','ormReps','tmFinderOneRm','tmFinderRound','tm','applyLift','week','target','bar'];",
 "const inputs=Object.fromEntries(ids.map(id=>[id,{",
 "value:id==='applyLift'?'Back Squat':id==='week'?'1':'',checked:false,handlers:{},",
 "addEventListener(event,fn){(this.handlers[event]??=[]).push(fn)}",
 "}]));",
 "const $=id=>inputs[id];",
 "const localStorage={getItem:key=>memory[key]??null,setItem:(key,value)=>{memory[key]=String(value)}};",
 "const toKg=n=>unit==='lb'?n/2.2046226218:n;",
 "const fromKg=n=>unit==='lb'?n*2.2046226218:n;",
 "const fmt=n=>String(Number(n.toFixed(2)));",
 "const window={addEventListener(){}};",
 "function calc531(){}"
].join('\n');
const epilogue=[
 "$('tmFinderOneRm').addEventListener('input',calcTrainingMaxFinder);",
 "const emit=(id,event)=>{(inputs[id].handlers[event]||[]).forEach(fn=>fn())};",
 "return {",
 " enter(value){inputs.tmFinderOneRm.value=String(value);emit('tmFinderOneRm','input')},",
 " lift(name){inputs.applyLift.value=name;emit('applyLift','change')},",
 " current(){return {lift:inputs.applyLift.value,oneRm:inputs.tmFinderOneRm.value,tm:inputs.tm.value}},",
 " saved(){return JSON.parse(memory.spartxToolsInputs)}",
 "};"
].join('\n');
const makeApp=new Function('memory','unit',preamble+'\n'+finder+'\n'+core+'\n'+epilogue);
const saved={};
const app=makeApp(saved,'kg');
for(const [lift,rm,tm] of [
 ['Bench Press','160','145'],
 ['Back Squat','180','162.5'],
 ['Conventional Deadlift','210','190']
]){
 app.lift(lift);
 app.enter(rm);
 assert.deepEqual(app.current(),{lift,oneRm:rm,tm});
}
for(const [lift,rm,tm] of [
 ['Bench Press','160','145'],
 ['Back Squat','180','162.5'],
 ['Conventional Deadlift','210','190']
]){
 app.lift(lift);
 assert.deepEqual(app.current(),{lift,oneRm:rm,tm});
}
assert.deepEqual(app.saved().oneRmsByLiftKg,{
 'Bench Press':160,'Back Squat':180,'Conventional Deadlift':210
});
assert.deepEqual(makeApp(saved,'kg').current(),{
 lift:'Conventional Deadlift',oneRm:'210',tm:'190'
});
const lb=makeApp(saved,'lb');
assert.equal(lb.current().oneRm,'462.97');
assert.equal(lb.saved().oneRmsByLiftKg['Conventional Deadlift'],210,
 'Unit conversions must not change canonical saved kg 1RM');
assert.equal(makeApp(saved,'kg').current().oneRm,'210');

const blank={};
const empty=makeApp(blank,'kg');
empty.lift('Bench Press');assert.equal(empty.current().oneRm,'');
assert.equal(empty.current().tm,'');
empty.enter(100);
empty.enter('');
assert.equal(empty.current().tm,'');
assert.equal(empty.saved().oneRmsByLiftKg['Bench Press'],undefined);

const legacy={spartxToolsInputs:JSON.stringify({tmFinderOneRm:'185',week:'2'})};
const migrated=makeApp(legacy,'kg');
assert.equal(migrated.current().oneRm,'185');
assert.equal(migrated.current().tm,'167.5');
migrated.lift('Bench Press');
assert.equal(migrated.current().oneRm,'');
assert.equal(migrated.current().tm,'');
migrated.lift('Back Squat');
assert.equal(migrated.current().oneRm,'185');

console.log('PASS: Per-lift Bench, Squat and Deadlift 1RMs, 90% TM, persistence, migration, empty values and unit stability');
