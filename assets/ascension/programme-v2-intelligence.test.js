require('../science/evidence-engine.js');const v=require('../science/volume-intelligence.js'),api=require('./programming-v2.js'),l=require('./programme-v2-lifecycle.js');
const base={"age":36,"bodyweight":92,"height":175,"sleep":6,"job":"moderate","nutrition":"maintenance","activity":"low","experience":"advanced","equipment":"full","minutes":120,"weeks":8,"availability":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"maxes":{"Back Squat":185,"Bench Press":160,"Deadlift":215}};
function test3(api,v,l,base){
 let n=0;const ok=(x,m)=>{n++;if(!x)throw Error(m);},store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 const p=api.generate({...base,weakPoints:{squat:"position",bench:"lockout",deadlift:"lockout"}},v);
 ok(p.weeks[0].sessions.some(s=>s.exercises.some(e=>e.name==="Tempo Squat")),"tempo");ok(p.weeks[0].sessions.some(s=>s.exercises.some(e=>e.name==="Close-Grip Bench Press")),"close grip");ok(p.weeks[3].sessions.every(s=>s.exercises.every(e=>e.name!=="Tempo Squat")),"deload stable");
 let entry=l.save(storage,api.generate(base,v),"abc"),first=l.progress(entry,[]).next;entry=l.prepare(storage,entry,first,[]);ok(entry.prescriptions[first.id].id===first.id,"snapshot");
 const exercise=l.makeWorkout(entry,first,[])[0],top=exercise.sets.find(z=>z.sxV2Target.role==="top"),back=exercise.sets.filter(z=>z.sxV2Target.role==="backdown");top.done=true;top.rpe=9.5;back[0].done=true;
 const d=l.liveReview(exercise);ok(d.decision==="reduce"&&d.changes.length===back.length-1,"only pending backdowns");ok(!d.changes.some(z=>z.id===back[0].sxAscensionV2SetId),"completed unchanged");ok(l.liveReview(exercise,2.5,true).decision==="stop","pain");top.rpe="";ok(l.liveReview(exercise).decision==="unavailable","missing rpe");
 const hist=[];
 for(const raw of l.slots(entry)){const slot=l.progress(entry,hist).next;ok(slot.id===raw.id,"ordered");entry=l.prepare(storage,entry,slot,hist,"good");const ex=l.makeWorkout(entry,slot,hist).map(e=>({...e,sets:e.sets.map(z=>({...z,done:true,weight:z.weight||"40",rpe:z.sxV2Target.role==="warmup"?null:z.sxV2Target.rpe}))}));hist.push({exercises:ex});ok(l.completion(entry,slot,hist.at(-1)),"snapshot complete");}
 const review=l.cycleReview(entry,hist);ok(review.ready&&review.suggestions.length===3,"cycle review");ok(review.suggestions.every(x=>Math.abs(x.suggested/x.old-1)<=.05001),"bounded");
 return n;
}
console.log('AscensionX preview 3: '+test3(api,v,l,base)+' assertions passed');

function volumeTests(api,v,l,base){
 let n=0;const ok=(a,m)=>{n++;if(!a)throw Error(m);};
 const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
 let entry=l.save(storage,api.generate({...base,weeks:12},v),"dose"),hist=[];
 // Two weeks of hard accessories (all primary sets remain normal).
 for(const slot of l.slots(entry).filter(x=>x.week<=2)){
 const e=l.makeWorkout(entry,slot,[]).map(x=>({...x,sets:x.sets.map(z=>({...z,weight:z.weight||"40",rpe:z.sxV2Target.kg===null?9.5:z.sxV2Target.rpe,done:true}))}));
 hist.push({exercises:e});}
 const next=l.progress(entry,hist).next,proposed=l.prescribe(entry,next,hist,"good");
 ok(proposed.exercises.some(e=>e.reason.includes("Reduce one accessory set")),"hard exposures reduce volume");
 entry=l.prepare(storage,entry,next,hist,"good");
 const record={exercises:l.makeWorkout(entry,next,hist).map(e=>({...e,sets:e.sets.map(s=>({...s,weight:s.weight||"40",done:true,rpe:8}))}))};
 ok(l.completion(entry,next,record),"adapted reduced slot completes");
 ok(l.prescribe(entry,next,hist,"poor").exercises.length===proposed.exercises.length,"snapshot retained");
 // Stable effort on the same assistance exercise in multiple slots: trial a single
 // additional set only if the athlete reports good recovery and the weekly cap permits.
 entry=l.save(storage,api.generate({...base,weeks:12},v),"increase");
 hist=[];
 for(const slot of l.slots(entry).filter(s=>s.week<3)){
 hist.push({exercises:l.makeWorkout(entry,slot,[]).map(e=>({...e,sets:e.sets.map(s=>({...s,weight:s.weight||"40",done:true,rpe:s.sxV2Target.rpe}))}))});}
 const day=l.slots(entry).find(s=>s.week===3&&s.day==="Tue");
 const good=l.prescribe(entry,day,hist,"good"),unknown=l.prescribe(entry,day,hist,"unknown");
 ok(unknown.exercises.every(e=>!e.reason.includes("trial one extra")),"no volume increase without recovery");
 // Synthetic exposure reduction isolates the trial branch; this is a unit fixture,
 // not a recommendation for the example athlete.
 entry.plan.weeks[2].exposure.Back.effective=6;
 const trial=l.prescribe(entry,day,hist,"good");
 ok(trial.exercises.some(e=>e.reason.includes("trial one extra")),"bounded increase on eligible fixture");
 ok(trial.exercises.filter(e=>e.reason.includes("trial one extra")).length===1,"one increase");
 ok(trial.estimatedMinutes<=entry.plan.profile.minutes,"time cap");
 return n;
}
console.log('AscensionX adaptive volume: '+volumeTests(api,v,l,base)+' assertions passed');
