/* Run: node assets/ascension/selection-quality.test.js */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const created='2026-11-01T10:00:00.000Z';
function boot(week=2,focus='strength',sessions=[]){
 const base={profile:{max:{'Back Squat':185,'Bench Press':160,'Deadlift':215},tmPct:95,rounding:2.5},
  cycle:{created,exercises:['Back Squat','Bench Press','Deadlift'],
   weeks:{'Back Squat':week,'Bench Press':week,'Deadlift':week},currentWeek:week},logs:[]};
 const values=new Map([['ascensionx_strength_v1',JSON.stringify(base)],
  ['spartx_db',JSON.stringify({sessions})]]);
 const localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
 const window={localStorage,addEventListener(){}};
 for(const file of ['selection-quality.js','adaptive-programming.js'])
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),{window});
 const api=window.SXAscensionAdaptive;
 api.save({enabled:true,days:4,focus});
 return {api,localStorage,original:JSON.stringify(base),window};
}
const names=items=>Array.from(items,x=>x.name);
const normal=boot();
assert.deepEqual(names(normal.api.plan('Back Squat',2)),
 ['Hack Squat','Bulgarian Split Squat','45° Back Extension','Cable Crunch']);
assert.deepEqual(names(normal.api.plan('Bench Press',2)),
 ['Iso-Lateral Row','Triceps Pushdown (Bar)','Rear Delt Reverse Fly','Lat Pulldown']);
assert.deepEqual(names(normal.api.plan('Deadlift',2)),
 ['Romanian Deadlift','Lat Pulldown','Seated Leg Curl']);
assert.equal(normal.api.plan('Deadlift',2)[0].tmPercent,45);
assert.equal(normal.api.plan('Deadlift',2)[0].targetRpe,7);
const support=normal.api.schedule().slots[3];
assert.equal(support.title,'Secondary Squat & Bench - Week 2');
assert.deepEqual(names(support.exercises),['Pause Squat','Bench Press','Seated Cable Row',
 'Lateral Raise','Dumbbell Curl','Triceps Pushdown (Bar)']);
assert.ok(support.exercises.every(x=>x.sets===3));
assert.equal(support.exercises[0].targetRpe,6);
assert.ok(support.exercises[0].suggestedKg>0);
assert.ok(support.exercises.every(x=>x.targetRpe>=6&&x.targetRpe<=8));
assert.equal(normal.localStorage.getItem('ascensionx_strength_v1'),normal.original,
 'Exercise selection never changes current main programming or logs');
const proposed=normal.api.previewSchedule(['Back Squat','Bench Press','Deadlift'],
 {enabled:true,days:4,focus:'strength'},normal.api.activeCycle());
assert.deepEqual(names(proposed.slots[3].exercises),names(support.exercises),
 'Preview and live schedule must use the same exercise choices');
const week5=boot(5);
assert.deepEqual(names(week5.api.plan('Back Squat',5)),
 ['Hack Squat','Leg Extension','45° Back Extension','Cable Crunch']);
assert.equal(week5.api.schedule().slots[3].exercises[0].name,'Pause Squat');
assert.equal(week5.api.schedule().slots[3].exercises[0].targetRpe,6);
assert.ok(week5.api.schedule().slots[3].exercises.every(x=>x.sets===3));
for(const focus of ['strength','balanced','hypertrophy']){
 const sample=boot(2,focus);
 assert.ok(sample.api.plan('Bench Press',2).some(x=>x.name==='Rear Delt Reverse Fly'));
 assert.equal(sample.api.schedule().slots[3].exercises.length,6);
}
const fatigued=boot(2,'strength',[{
 date:new Date().toISOString(),exercises:[{name:'Back Squat',
 ascensionLink:{cycleId:created,lift:'Back Squat'},
 sets:[{type:'Working Set',done:true,rpe:9.5,weight:170,reps:2}]}]
}]);
const guarded=fatigued.api.schedule().slots[3];
assert.equal(guarded.title,'Upper Assistance - Week 2');
assert.ok(!guarded.exercises.some(x=>x.name==='Pause Squat'));
assert.equal(guarded.exercises[0].name,'Bench Press');
const recovery=boot(6);
assert.equal(recovery.api.plan('Back Squat',6).length,0);
assert.equal(recovery.api.plan('Bench Press',6).length,0);
assert.equal(recovery.api.plan('Deadlift',6).length,0);
assert.equal(recovery.api.schedule().slots[3].exercises.length,0);
for(const file of ['../../index.html','../../AscensionX/index.html'])
 assert.ok(fs.readFileSync(path.join(__dirname,file),'utf8').includes('selection-quality.js?v=420'));
console.log('AscensionX smart selection / classic-cycle preservation tests passed');
