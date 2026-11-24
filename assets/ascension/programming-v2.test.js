const api=require('./programming-v2.js');
const base={"age":36,"bodyweight":92,"height":175,"sleep":6,"job":"moderate","nutrition":"maintenance","activity":"low","experience":"advanced","equipment":"full","minutes":120,"weeks":8,"availability":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"maxes":{"Back Squat":185,"Bench Press":160,"Deadlift":215}};
const runTests=function runTests(api,base){
 let checks=0;const assert=(v,msg)=>{checks++;if(!v)throw Error(msg);};
 const normal=api.generate(base);
 assert(normal.days.length===4,"Expected 4 days");assert(normal.weeks.length===8,"8 weeks");assert(normal.validation.passed,"Valid normal plan");assert(normal.weeks[3].phase==="Deload","Deload");assert(normal.weeks[6].phase==="Taper","Taper");assert(normal.weeks[7].phase==="Assessment","Assessment");
 assert(normal.weeks[0].sessions[0].exercises[0].sets.find(s=>s.type==="top").kg===145,"Squat top load");
 const poor=api.generate({...base,sleep:5,job:"high"});assert(poor.days.length===3,"Recovery changes schedule");
 assert(api.assessSet({plannedKg:135,plannedReps:3,targetRpe:8,actualReps:3,actualRpe:9.5,backdownKg:125}).kg===117.5,"Backdown decision");
 assert(api.assessSet({pain:true}).decision==="stop-review","Pain");
 assert(api.assessSet({}).decision==="insufficient","Missing data");
 for(const weeks of [8,12,16])for(const experience of ["beginner","intermediate","advanced"])for(const sleep of [5,6,8])for(const equipment of ["full","basic"])for(const availability of [base.availability,["Mon","Wed","Fri"],["Tue","Thu","Sat","Sun"]]){
 const p=api.generate({...base,weeks,experience,sleep,equipment,availability});
 assert(p.weeks.length===weeks,"Length");assert(p.validation.passed,"Time and load checks");assert(p.days.every(d=>availability.includes(d)),"Availability");
 for(const w of p.weeks){assert(w.sessions.every(s=>s.estimatedMinutes<=120),"Time budget");assert(w.sessions.every(s=>new Set(s.exercises.map(e=>e.name)).size===s.exercises.length),"No duplicates");if(w.phase!=="Assessment")for(const lift of Object.keys(base.maxes))assert(w.sessions.some(s=>s.exercises.some(e=>e.role==="primary"&&e.name===lift)),"Main lift coverage");}
 }
 let rejected=false;try{api.generate({...base,maxes:{}})}catch(e){rejected=true;}assert(rejected,"Missing maxes rejected");return checks;
};
console.log('AscensionX v2: '+runTests(api,base)+' assertions passed');
