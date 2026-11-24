const science=require('../science/evidence-engine.js');const v=require('../science/volume-intelligence.js');const api=require('./programming-v2.js');const l=require('./programme-v2-lifecycle.js');
const base={"age":36,"bodyweight":92,"height":175,"sleep":6,"job":"moderate","nutrition":"maintenance","activity":"low","experience":"advanced","equipment":"full","minutes":120,"weeks":8,"availability":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"maxes":{"Back Squat":185,"Bench Press":160,"Deadlift":215}};
const checks=function checks(api,v,l,base){
 let n=0;function check(a,msg){n++;if(!a)throw Error(msg);}
 const plan=api.generate(base,v),mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,x)=>mem.set(k,x)};
 storage.setItem("ascensionx_strength_v1","legacy-sentinel");storage.setItem("spartx_db",'{"sessions":[]}');
 const saved=l.save(storage,plan,"test"),entry=l.read(storage);check(entry.id==="test","save/read");check(storage.getItem("ascensionx_strength_v1")==="legacy-sentinel","legacy untouched");check(storage.getItem("spartx_db")==='{"sessions":[]}',"history untouched");
 const first=l.progress(entry,[]).next,work=l.makeWorkout(entry,first,[]);
 check(work.every(e=>e.sets.every(s=>!s.done&&s.rpe==="")),"unchecked");
 const record={exercises:work.map(e=>({...e,sets:e.sets.filter(s=>s.type!=="Warm-up").map(s=>({...s,weight:s.weight||"40",rpe:8,done:true}))}))};
 const partial=JSON.parse(JSON.stringify(record));partial.exercises[0].sets.pop();check(l.progress(entry,[partial]).completed===0,"partial");
 check(l.progress(entry,[record]).completed===1,"complete");check(l.progress(entry,[record]).next.id!==first.id,"advance");check(l.progress(entry,[record,record]).completed===1,"idempotent");
 const renamed=JSON.parse(JSON.stringify(record));renamed.exercises[0].name="Other";check(l.progress(entry,[renamed]).completed===0,"replacement not credited");
 const forged=JSON.parse(JSON.stringify(record));forged.exercises.forEach(e=>delete e.sxAscensionV2);check(l.progress(entry,[forged]).completed===0,"unlinked excluded");
 const h=[];for(const slot of l.slots(entry).filter(s=>s.week<=2)){const exercises=l.makeWorkout(entry,slot,[]).map(e=>({...e,sets:e.sets.map(s=>({...s,weight:s.weight||"40",done:true,rpe:9.5}))}));h.push({exercises});}
 const next=l.progress(entry,h).next;check(next.week===3,"two weeks advance");const adjusted=l.prescribe(entry,next,h),original=next.exercises[0].sets.find(z=>z.type==="top").kg;check(adjusted.exercises[0].sets.find(z=>z.type==="top").kg<original,"repeated hard lower main");check(entry.plan.weeks[2].sessions[0].exercises[0].sets.find(z=>z.type==="top").kg===original,"no plan mutation");
 for(const weeks of [8,12,16])for(const experience of ["beginner","intermediate","advanced"])for(const sleep of [5,6,8])for(const equipment of ["full","basic"])for(const availability of [base.availability,["Mon","Wed","Fri"],["Tue","Thu","Sat","Sun"]]){const p=api.generate({...base,weeks,experience,sleep,equipment,availability},v);check(p.validation.passed,"generated");for(const w of p.weeks){check(w.exposure&&Object.values(w.exposure).every(x=>Number.isFinite(x.effective)),"exposure");check(w.sessions.every(s=>s.estimatedMinutes<=120),"time");}}
 return n;
};
console.log('AscensionX lifecycle: '+checks(api,v,l,base)+' assertions passed');
