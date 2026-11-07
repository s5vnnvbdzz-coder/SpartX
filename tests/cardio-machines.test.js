const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/cardio/cardio.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const stats=fs.readFileSync('assets/exercises/exercise-stats-layout.js','utf8');
const asc=fs.readFileSync('AscensionX/index.html','utf8');
const context={
 window:{},
 document:{createElement:()=>({textContent:''}),head:{appendChild(){}}}
};
vm.runInNewContext(source,context);
const cardio=context.window.SpartanXCardio;
assert.ok(cardio,'Cardio module should load');
assert.deepEqual(Array.from(cardio.names),[
 'StairMaster (Floors)','StairMaster (Steps)','Treadmill','Rowing Machine',
 'Bike','Recumbent Bike','Cross Trainer','SkiErg'
]);
assert.equal(cardio.canonical('StairMaster'),'StairMaster (Floors)');
assert.equal(cardio.canonical('Rower'),'Rowing Machine');
assert.equal(cardio.metricName('StairMaster (Floors)','mi'),'FLOORS');
assert.equal(cardio.metricName('StairMaster (Steps)','mi'),'STEPS');
assert.equal(cardio.metricName('Rowing Machine','mi'),'M');
assert.equal(cardio.metricName('Rowing Machine','km'),'KM');
assert.equal(cardio.previousText({floors:138,durationSeconds:1800},'StairMaster (Floors)'),'138 floors in 30:00');
assert.equal(cardio.previousText({steps:2000,durationSeconds:1800},'StairMaster (Steps)'),'2000 steps in 30:00');
assert.equal(cardio.previousText({distanceKm:1.207008,durationSeconds:180},'Rowing Machine','mi'),'0.75 mi in 03:00');
assert.equal(cardio.parseTime('03:00'),180);
assert.equal(cardio.parseTime('0300'),180);
assert.equal(cardio.parseTime('3000'),1800);
assert.equal(cardio.parseTime('12500'),7500);
assert.equal(cardio.parseTime('03:60'),null);
assert.equal(cardio.formatTime(1800),'30:00');
assert.ok(cardio.valid({floors:138,durationSeconds:1800},'StairMaster (Floors)'));
assert.ok(cardio.valid({steps:2000,durationSeconds:1800},'StairMaster (Steps)'));
assert.ok(cardio.valid({distanceKm:1.2,durationSeconds:180},'Rowing Machine'));
assert.ok(!cardio.valid({floors:138,durationSeconds:0},'StairMaster (Floors)'));
assert.ok(!cardio.valid({steps:2000,durationSeconds:0},'StairMaster (Steps)'));
assert.ok(!cardio.valid({distanceKm:0,durationSeconds:180},'Rowing Machine'));
const row=cardio.render({name:'StairMaster (Floors)',notes:'',sets:[cardio.blank()]},0,'km',String);
for(const part of ['PREVIOUS','FLOORS','TIME','Add Set','setCardioValue','normalizeCardioTime','data-live-exercise-link'])assert.ok(row.includes(part),part+' missing in render');
assert.ok(index.includes("SpartanXCardio.valid(set,name)"));
assert.ok(index.includes("SpartanXCardio.canonical(e.name)"));
assert.ok(index.includes("cycleTitle+' Week '+d.week"));
assert.ok(asc.includes('cycleId:state.cycle.created,cycleTitle,exercise:lift'));
assert.ok(!index.includes('Confirm the details before saving to your training history.'));
assert.ok(stats.includes("id:'steps',name:'Steps Climbed'"));
console.log('PASS: Cardio floors, steps, rowing history, compact inputs, iPhone time format, AscensionX name and review layout');
