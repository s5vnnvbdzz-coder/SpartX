/* Run: node assets/ascension/adaptive-programming.test.js */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function storage(values={}){
 const map=new Map(Object.entries(values));
 return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),
   removeItem:key=>map.delete(key),snapshot:()=>Object.fromEntries(map)};
}
const id='2026-11-01T10:00:00.000Z';
function cycle(lifts=['Back Squat','Bench Press','Deadlift'],week=2){
 return JSON.stringify({cycle:{created:id,exercises:lifts,weeks:Object.fromEntries(lifts.map(l=>[l,week])),currentWeek:week},logs:[]});
}
function boot(values){
 const localStorage=storage(values);
 const window={localStorage,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'adaptive-programming.js'),'utf8'),{window});
 return {api:window.SXAscensionAdaptive,localStorage};
}
let {api,localStorage}=boot({'ascensionx_strength_v1':cycle()});
assert.equal(api.enabled(),false,'Opt-in starts disabled');
assert.equal(api.plan('Deadlift',2).length,0,'No unsolicited accessory injection');
const before=localStorage.getItem('ascensionx_strength_v1');
api.save({enabled:true,days:4,focus:'strength'});
assert.equal(api.enabled(id),true);
assert.equal(localStorage.getItem('ascensionx_strength_v1'),before,'Existing strength programme is never overwritten');
assert.equal(api.read(id).days,4);
const deadlift=api.plan('Deadlift',2);
assert.ok(deadlift.length>=2);
assert.ok(deadlift.reduce((n,e)=>n+e.sets,0)<=4,'Deadlift accessories remain conservative');
assert.ok(deadlift.every(e=>!/romanian|rdl|good morning|deadlift|squat/i.test(e.name)),'No heavy hinge/squat after pulling');
assert.ok(deadlift.every(e=>e.rir>=3));
assert.equal(api.plan('Deadlift',6).length,0,'Week 6 allows full recovery');
const schedule=api.schedule();
assert.equal(schedule.valid,true);
assert.equal(schedule.slots.length,4);
assert.equal(schedule.slots.filter(x=>x.kind==='ascension').length,3);
assert.equal(schedule.slots.filter(x=>x.kind==='support').length,1);
assert.ok(schedule.slots[3].exercises.length>0);
assert.equal(schedule.slots[3].day,'SAT');
api.save({focus:'hypertrophy'});
assert.equal(api.read(id).focus,'hypertrophy');
assert.ok(api.schedule().slots[3].exercises.some(ex=>ex.name==='Machine Chest Press'));
const history={sessions:[{
 date:'2026-11-09T08:00:00Z',
 exercises:[{name:'Chest-Supported Row',sxStrengthSizeCompanion:{cycleId:id,week:2},
  sets:[{weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true},
        {weight:'40',reps:'12',rpe:'6',type:'Working Set',done:true}]}]
}]};
localStorage.setItem('spartx_db',JSON.stringify(history));
api.save({focus:'strength'});
assert.ok(api.plan('Bench Press',3).find(e=>e.name==='Chest-Supported Row').suggestedKg>40,
 'Advances controlled completed accessory sets only');
const noAdvance={sessions:[{date:'2026-11-09T09:00:00Z',exercises:[{
 name:'Chest-Supported Row',sxStrengthSizeCompanion:{cycleId:id,week:2},
 sets:[{weight:'40',reps:'12',rpe:'',type:'Working Set',done:false}]
}]}]};
localStorage.setItem('spartx_db',JSON.stringify(noAdvance));
assert.equal(api.plan('Bench Press',3).find(e=>e.name==='Chest-Supported Row').suggestedKg,null,
 'Incomplete sets never justify progression');
localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift','Overhead Press']));
api.save({days:3});
assert.equal(api.schedule().valid,false,'Cannot assign four independent compounds to three separate days');
localStorage.setItem('ascensionx_strength_v1',cycle(['Back Squat','Bench Press','Deadlift'],6));
api.save({days:4});
assert.equal(api.schedule().slots.find(x=>x.kind==='support').exercises.length,0,'Deload week has no support work');
const fresh='2026-11-10T11:00:00.000Z';
localStorage.setItem('ascensionx_strength_v1',JSON.stringify({cycle:{created:fresh,exercises:['Bench Press'],weeks:{'Bench Press':1}},logs:[]}));
assert.equal(api.enabled(fresh),false,'New cycle must opt in independently');
console.log('AscensionX adaptive programming: tests passed');
