/* AscensionX athlete intake helpers: no storage writes and no dependency on SpartanX globals. */
(function(root){
'use strict';
const WEEK=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const valid=(v,min,max)=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;
const finiteOrNull=(v,min,max)=>valid(v,min,max)?Number(v):null;
function readSpartanProfile(storage){
 let db={},classic={};
 try{db=JSON.parse(storage.getItem('spartx_db')||'{}')||{}}catch(_){}
 try{classic=JSON.parse(storage.getItem('ascensionx_strength_v1')||'{}')||{}}catch(_){}
 const entries=(Array.isArray(db.measurements)?db.measurements:[])
  .filter(x=>x&&typeof x.date==='string'&&x.values&&typeof x.values==='object')
  .slice().sort((a,b)=>b.date.localeCompare(a.date));
 const latest=(key,min,max)=>{
  const e=entries.find(x=>valid(x.values?.[key],min,max));
  return e?{value:Number(e.values[key]),date:e.date,source:'Measures'}:null;
 };
 const weight=latest('bodyweight',30,350);
 const height=latest('height',100,250);
 const profile=db.profile&&typeof db.profile==='object'?db.profile:{};
 const maxes=classic.profile?.max||{};
 return {
  age:finiteOrNull(profile.age,18,90),
  weight:weight||(
   valid(profile.bodyweight,30,350)?{value:Number(profile.bodyweight),date:null,source:'SpartanX Profile'}:null
  ),
  height:height||(
   valid(profile.heightCm,100,250)?{value:Number(profile.heightCm),date:null,source:'SpartanX Profile'}:
   valid(profile.height,100,250)?{value:Number(profile.height),date:null,source:'SpartanX Profile'}:null
  ),
  maxes:Object.fromEntries(['Back Squat','Bench Press','Deadlift'].map(lift=>[
   lift,finiteOrNull(maxes[lift],30,500)
  ])),
  sources:{measures:entries.length,classic:!!classic?.profile?.max}
 };
}
function days(input){
 const out=Array.isArray(input)?input.filter(x=>WEEK.includes(x)):[];
 return WEEK.filter(x=>out.includes(x));
}
function recommendSchedule(availability,count){
 const possible=days(availability).map(x=>WEEK.indexOf(x));
 if(!Number.isInteger(count)||count<3||count>5||possible.length<count)return null;
 const combos=[];
 function recurse(previous,index){
  if(previous.length===count){combos.push(previous);return;}
  for(let j=index;j<possible.length;j++)recurse([...previous,possible[j]],j+1);
 }
 recurse([],0);
 const ideal=count===3?[0,2,4]:count===4?[0,1,3,5]:[0,1,3,4,5];
 const minDist=(a,b)=>{const diff=Math.abs(a-b);return Math.min(diff,7-diff);};
 function score(combo){
  let cost=combo.reduce((v,day,i)=>v+Math.abs(day-ideal[i])*.7,0);
  // Day 1 squat, Day 3 deadlift. Avoid placing either next to the other.
  if(minDist(combo[0],combo[2])<=1)cost+=100;
  if(count>=4&&minDist(combo[2],combo[3])<=1)cost+=18;
  if(count>=4&&minDist(combo[3],combo[0])<=1)cost+=12;
  if(count===5&&minDist(combo[4],combo[0])<=1)cost+=6;
  for(let i=0;i<combo.length;i++)if(minDist(combo[i],combo[(i+1)%combo.length])<=1)cost+=2;
  return cost;
 }
 const chosen=combos.sort((a,b)=>score(a)-score(b))[0];
 return chosen.map(i=>WEEK[i]);
}
function assessmentInput(fields){
 const selected=days(fields.availability);
 const daysCount=Number(fields.days);
 const schedule=recommendSchedule(selected,daysCount);
 if(!schedule)throw Error('Select at least '+daysCount+' available training days.');
 const maxes={'Back Squat':fields.squatMax,'Bench Press':fields.benchMax,Deadlift:fields.deadliftMax};
 const goals={'Back Squat':fields.squatGoal,'Bench Press':fields.benchGoal,Deadlift:fields.deadliftGoal};
 return {
  weeks:Number(fields.weeks),days:daysCount,minutes:Number(fields.minutes),
  step:Number(fields.step),sleep:Number(fields.sleep),
  recovery:fields.recovery,equipment:fields.equipment,
  maxes,goals,
  weakPoints:{'Back Squat':fields.weakSquat||[],
   'Bench Press':fields.weakBench||[],Deadlift:fields.weakDeadlift||[]},
  // These are real athlete fields and remain available to the evolving AX engine.
  age:fields.age,bodyweight:fields.weight,height:fields.height,
  experience:fields.experience,job:fields.job,nutrition:fields.nutrition,
  activity:fields.activity,focus:fields.focus,
  availability:selected,trainingDays:schedule
 };
}
root.AXAssessment=Object.freeze({WEEK,readSpartanProfile,recommendSchedule,assessmentInput});
if(typeof module!=='undefined'&&module.exports)module.exports=root.AXAssessment;
})(typeof window!=='undefined'?window:globalThis);
