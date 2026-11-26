/* Run: node assets/ascension/adaptive-warmups.test.js */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'workout-prescription.js'),'utf8'),{window});
const api=window.SXAscensionPrescription,id='2026-11-01T00:00:00Z',lift='Bench Press',storage={getItem:()=>null};
const state=week=>({cycle:{created:id,exercises:[lift],weeks:{[lift]:week},trainingMaxes:{[lift]:152.5}},profile:{max:{[lift]:160},rounding:2.5,tmPct:95},logs:[]});
const plan=Array.from({length:6},(_,i)=>api.build(state(i+1),lift,storage));
assert.equal(plan[4].sets[0].weight,140);
assert.equal(plan[4].sets[0].reps,2);
assert.equal(plan[4].sets.length,4);
assert.equal(plan[4].warmupSets.map(s=>s.weight+'x'+s.reps).join(','),'60x5,85x3,100x2,115x1,130x1');
assert.ok(plan[4].sets.slice(1).every(s=>s.weight===132.5&&s.reps===2));
for(let i=1;i<5;i++)for(let j=0;j<4;j++)assert.ok(plan[i].warmupSets[j].weight>=plan[i-1].warmupSets[j].weight);
assert.equal(plan[5].warmupSets.length,4);
assert.ok(plan[5].warmupSets.at(-1).weight<plan[4].warmupSets.at(-1).weight);
for(const l of api.LIFTS)for(const step of [1.25,2.5,5])for(const top of [step,2*step,20,60,100,140,185,215]){
 if(Math.abs(top/step-Math.round(top/step))>1e-8)continue;
 for(let week=1;week<=6;week++){
  const rows=api.warmupPlan(l,week,top,step);
  assert.ok(rows.every((s,i)=>s.weight>0&&s.weight<top&&s.weight%step===0&&(!i||s.weight>rows[i-1].weight)));
  assert.ok(rows.length<=5);
 }
}
const draft=()=>({name:lift,ascensionLink:{cycleId:id,lift,week:5,plannedSets:[{weight:140,reps:2}]},sets:[...[[60,5],[85,3],[100,2],[115,1]].map(([weight,reps])=>({weight:String(weight),reps:String(reps),type:'Warm-up',done:true,rpe:''})),{weight:'140',reps:'2',type:'Working Set',done:false,rpe:''},{weight:'132.5',reps:'2',type:'Working Set',done:false,rpe:''}]});
let d=draft(),original=d.sets.slice(),link=JSON.stringify(d.ascensionLink.plannedSets);
assert.ok(api.upgradeActiveWarmups(d,id));
assert.equal(d.sets[4].weight,'130');
assert.equal(d.sets[4].reps,'1');
assert.equal(d.sets[4].type,'Warm-up');
assert.equal(d.sets[4].done,false);
assert.ok(d.sets.slice(0,4).every((s,i)=>s===original[i]));
assert.ok(d.sets.slice(5).every((s,i)=>s===original[i+4]));
assert.equal(JSON.stringify(d.ascensionLink.plannedSets),link);
assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();d.sets[4].done=true;assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();d.sets[4].rpe='8';assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();assert.equal(api.upgradeActiveWarmups(d,'wrong-cycle'),false);
d=draft();d.sets[3].weight='130';assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();d.ascensionLink.warmupVersion=424;assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();d.ascensionLink.week=6;assert.equal(api.upgradeActiveWarmups(d,id),false);
d=draft();d.sets[4].weight='125';assert.equal(api.upgradeActiveWarmups(d,id),false);
const host=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
assert.ok(host.includes('upgradeRestoredAscensionWarmups')&&host.includes('if(!sessionActive||editingSessionId!==null)return;'));
assert.ok(host.includes('if(linked&&editingSessionId===null)window.SXAscensionPrescription?.upgradeActiveWarmups'));
assert.ok(host.includes('warmupVersion:Number(d.warmupVersion)||0'));
const standalone=fs.readFileSync(path.join(__dirname,'../../AscensionX/index.html'),'utf8');
assert.ok(standalone.includes('SXAscensionPrescription?.warmupPlan(lift,week,main,step)'));
console.log('Adaptive warm-up tests passed');
