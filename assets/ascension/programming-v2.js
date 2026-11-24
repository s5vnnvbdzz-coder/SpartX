/* AscensionX 2.0: isolated, read-only powerlifting preview. No storage or live cycle writes. */
(function(root){const api=(function factory(){
"use strict";
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], LIFTS=["Back Squat","Bench Press","Deadlift"], VERSION="2.0-preview.2";
const CATALOG={
quad:[["Hack Squat","full"],["Leg Press","full"],["Bulgarian Split Squat","basic"]],
curl:[["Seated Leg Curl","full"],["Sliding Leg Curl","basic"]],
row:[["Chest Supported Row","full"],["Dumbbell Row","basic"]],
pull:[["Lat Pulldown","full"],["Pull Up","basic"]],
chest:[["Incline Dumbbell Press","basic"]],
hinge:[["Romanian Deadlift","basic"]],
core:[["Cable Crunch","full"],["Plank","basic"]],
triceps:[["Triceps Pushdown","full"],["Dumbbell Triceps Extension","basic"]],
biceps:[["Dumbbell Curl","basic"]],
side:[["Dumbbell Lateral Raise","basic"]],
calf:[["Standing Calf Raise","basic"]]};
const finite=(v,min,max,name)=>{if(v===""||v==null||!Number.isFinite(+v)||+v<min||+v>max)throw Error("Enter a valid "+name+" ("+min+"–"+max+").");return +v;};
const round=(x,step)=>Math.max(step,Math.round(x/step)*step);
const down=(x,step)=>Math.max(step,Math.floor((x+1e-8)/step)*step);
function normalize(input){
 const p={age:finite(input.age,18,90,"age"),bodyweight:finite(input.bodyweight,30,350,"bodyweight"),height:finite(input.height,100,250,"height"),sleep:finite(input.sleep,3,12,"sleep"),minutes:finite(input.minutes,45,120,"session duration"),weeks:+input.weeks,experience:input.experience,job:input.job,nutrition:input.nutrition,activity:input.activity,equipment:input.equipment,step:input.step==null?2.5:finite(input.step,.5,5,"load increment"),availability:DAYS.filter(d=>Array.isArray(input.availability)&&input.availability.includes(d)),maxes:{}};
 if(![8,12,16].includes(p.weeks))throw Error("Choose 8, 12 or 16 weeks.");
 for(const [key,values] of Object.entries({experience:["beginner","intermediate","advanced"],job:["low","moderate","high"],nutrition:["deficit","maintenance","surplus"],activity:["low","moderate","high"],equipment:["full","basic"]}))if(!values.includes(p[key]))throw Error("Choose a valid "+key+".");
 if(p.availability.length<3)throw Error("This preview requires at least three available training days.");
 for(const lift of LIFTS)p.maxes[lift]=finite(input.maxes?.[lift],20,500,lift+" recent 1RM in kg");
 return p;
}
function schedule(p,count){
 const available=p.availability.map(d=>DAYS.indexOf(d)),combos=[];
 function visit(a,i){if(a.length===count){combos.push(a);return;}for(let j=i;j<available.length;j++)visit([...a,available[j]],j+1);}
 visit([],0);
 const pref=count===4?[0,1,3,5]:[0,2,4];
 const score=a=>{const gaps=a.map((x,i)=>(a[(i+1)%a.length]-x+7)%7); const deadIndex=count===4?2:2; const lowerGap=a[deadIndex]-a[0]; return (lowerGap<2?100:0)+((7-lowerGap)<2?100:0)+gaps.filter(g=>g===1).length*4+(count===4&&gaps[2]===1?9:0)+(count===4&&gaps[3]===1?9:0)+a.reduce((n,x,i)=>n+Math.abs(x-pref[i])*.2,0);};
 return combos.sort((a,b)=>score(a)-score(b))[0].map(i=>DAYS[i]);
}
function phaseFor(w,weeks){
 if(w===weeks)return "Assessment";
 if(w===weeks-1)return "Taper";
 if(w===4||(weeks>=12&&w===8)||(weeks===16&&w===12))return "Deload";
 if(w>=weeks-3)return "Intensification";
 if(w>=5)return "Strength";
 return "Accumulation";
}
function scheme(w,weeks,phase,beginner){
 if(phase==="Deload")return [.65,3,.60,3,2,6];
 if(phase==="Taper")return [.85,1,.70,2,1,7];
 if(phase==="Intensification")return w===weeks-2?[.90,1,.82,2,2,8]:[.87,2,.80,3,2,8];
 if(phase==="Strength")return [.81+Math.min(.04,((w-5)%4)*.015),3,.74,4,3,8];
 return [.78+(w-1)*.025, w===3?3:4,.73+(w-1)*.025,w===1?5:4,3,7.5];
}
function generate(input,volume){
 if(volume?.classify&&volume?.countExposure){
  const original=volume;
  // Shared v0.2 catalogue does not yet recognise "Paused Bench Press".
  // Use the known equivalent for muscle exposure only, not as an exercise replacement.
  volume={...original,classify:name=>original.classify(name==="Paused Bench Press"?"Bench Press":name),countExposure:days=>original.countExposure(days.map(d=>({...d,exercises:d.exercises.map(e=>({...e,name:e.name==="Paused Bench Press"?"Bench Press":e.name}))})))};
 }
 const p=normalize(input),beginner=p.experience==="beginner",risk=(p.sleep<7?1:0)+(p.sleep<6?1:0)+(p.job==="high"?2:p.job==="moderate"?1:0)+(p.nutrition==="deficit"?1:0)+(p.activity==="high"?2:p.activity==="moderate"?1:0);
 const count=p.availability.length>=4&&!beginner&&risk<4&&p.minutes>=60?4:3, days=schedule(p,count), warnings=[], reasons=[count+" sessions selected from "+p.availability.length+" available days; availability is not a training target.",risk>=2?"Conservative initial volume because of reported recovery demands.":"Normal initial workload; monitor actual response.",beginner?"Simplified practice and conservative loading.":"Primary and secondary lift exposures with progressive loading.","Bodyweight, age and height are recorded for context, not used as arbitrary strength multipliers.","Exact percentages, dose thresholds and phase boundaries are coaching heuristics, not validated individual optima."];
 const dayNums=days.map(d=>DAYS.indexOf(d));
 if(dayNums[2]-dayNums[0]<2||7-(dayNums[2]-dayNums[0])<2)warnings.push("Limited availability puts demanding lower-body days close together; review before use.");
 if(count===4&&((dayNums[3]-dayNums[2])<2||(7+dayNums[0]-dayNums[3])<2))warnings.push("Secondary squat is near another lower-body session; keep it easy and monitor recovery.");
 const phases=[];
 for(let w=1;w<=p.weeks;w++){
 const phase=phaseFor(w,p.weeks),sessions=days.map((day,i)=>({day,index:i+1,exercises:[],estimatedMinutes:0})),recovery=phase==="Deload"||phase==="Taper",scale=beginner?.94:risk>=4?.97:1;
 const add=(s,name,role,sets,rest,reason)=>s.exercises.push({name,role,sets,restSeconds:rest,reason});
 function main(s,lift){
  let [a,b,c,d,e,r]=scheme(w,p.weeks,phase,beginner);
  if(beginner&&!recovery){e=Math.min(e,2);r=Math.min(r,7);a=Math.min(a,.85);}
  if(lift==="Deadlift")e=Math.max(1,e-1);
  if(risk>=4&&!recovery)e=Math.max(1,e-1);
  const max=p.maxes[lift],top=round(max*a*scale,p.step),back=Math.min(top,round(max*c*scale,p.step));
  const warm=[.4,.55,.68,.85].map((f,i)=>({type:"warmup",kg:down(top*f,p.step),reps:[5,5,3,1][i],rpe:null})).filter((x,i,arr)=>x.kg<top&&(i===0||x.kg>arr[i-1].kg));
  add(s,lift,"primary",[...warm,{type:"top",kg:top,reps:b,rpe:r},...Array.from({length:e},()=>({type:"backdown",kg:back,reps:d,rpe:Math.min(r,7.5)}))],240,"Lift-specific practice; planned load is a starting target, with RPE taking precedence.");
 }
 function secondary(s,lift,name,base){
  const pct=phase==="Taper"?.62:phase==="Deload"?.55:phase==="Intensification"?base+.07:phase==="Strength"?base+.04:base+(w-1)*.015;
  const n=phase==="Taper"||phase==="Deload"||beginner||risk>=4?2:3;
  const kg=round(p.maxes[lift]*pct*scale,p.step);
  add(s,name,"secondary",Array.from({length:n},()=>({type:"work",kg,reps:recovery?3:phase==="Intensification"?3:5,rpe:recovery?6:7})),180,"Additional submaximal technical or volume exposure.");
 }
 function accessory(s,role,reps,why){
  const option=CATALOG[role].find(x=>p.equipment==="full"||x[1]==="basic");if(!option)return;
  let n=phase==="Taper"?1:phase==="Deload"?1:phase==="Intensification"?2:beginner||risk>=4?2:3;
  if(role==="hinge")n=Math.min(n,2);
  if(volume?.countExposure&&volume?.recommendWorkingSets&&!recovery&&role!=="hinge"){
   const current=volume.countExposure(sessions.map(x=>({exercises:x.exercises.map(e=>({name:e.name,sets:e.sets.filter(z=>z.type!=="warmup")}))})));
   const info=volume.classify(option[0]);if(info){const d=volume.recommendWorkingSets({name:option[0],goal:"powerlifting",experience:p.experience,weeklyExposure:current[info.primary]?.effective||0,remainingSlots:2,lowReadiness:risk>=4,existingSets:n});n=Math.min(n,d.status==="unknown-exercise"?n:(risk>=4||beginner||phase==="Intensification"?2:current[info.primary]?.effective>=d.targetRange?.[1]?2:Math.max(3,d.sets)));}
  }
  add(s,option[0],"accessory",Array.from({length:n},()=>({type:"work",kg:null,reps,rpe:recovery?6:role==="hinge"?7:8})),role==="hinge"?150:120,why+" Establish an exercise-specific load at the target effort.");
 }
 if(phase==="Assessment"){
  // No automatic max test. Keep final assessment submaximal, with adequate rest before it.
  const first=sessions[0],last=sessions[sessions.length-1];
  for(const lift of LIFTS){add(first,lift,"secondary",[{type:"work",kg:round(p.maxes[lift]*.60,p.step),reps:2,rpe:6}],180,"Easy primer; omit if fatigued.");
   add(last,lift,"assessment",[{type:"work",kg:round(p.maxes[lift]*.85,p.step),reps:1,rpe:8}],300,"Start conservatively; stop if technique, pain or readiness is concerning. No automatic maximal attempts.");}
  sessions.splice(1,sessions.length-2);
 }else{
 main(sessions[0],LIFTS[0]);main(sessions[1],LIFTS[1]);main(sessions[2],LIFTS[2]);
 if(count===4){secondary(sessions[2],LIFTS[1],"Paused Bench Press",.66);secondary(sessions[3],LIFTS[0],"Paused Squat",.675);secondary(sessions[3],LIFTS[1],"Bench Press",.70);}
 else {secondary(sessions[1],LIFTS[0],"Paused Squat",.60);secondary(sessions[2],LIFTS[1],"Paused Bench Press",.65);}
 accessory(sessions[0],"quad",10,"Additional knee-dominant work with lower axial demand.");accessory(sessions[0],"curl",12,"Hamstring coverage.");accessory(sessions[0],"core",12,"Trunk work.");
 accessory(sessions[1],"row",10,"Upper-back support.");accessory(sessions[1],"chest",10,"Supplemental pressing.");accessory(sessions[1],"triceps",12,"Elbow extension support.");accessory(sessions[1],"side",15,"Shoulder coverage.");
 accessory(sessions[2],"pull",10,"Vertical pulling.");accessory(sessions[2],"curl",12,"Knee-flexion work without another demanding hinge.");
 if(!recovery&&risk<=2&&p.experience!=="beginner"&&phase!=="Intensification")accessory(sessions[2],"hinge",8,"Optional controlled hinge; omit if deadlift effort or lower-back recovery is poor.");
 if(count===4){accessory(sessions[3],"row",10,"Upper-back coverage.");accessory(sessions[3],"biceps",12,"Elbow flexion.");accessory(sessions[3],"triceps",12,"Elbow extension.");accessory(sessions[3],"calf",15,"Lower-leg coverage.");}
 }
 function duration(s){return 8+s.exercises.reduce((n,e)=>n+3+((e.role==="secondary"||e.role==="assessment")?6:0)+e.sets.reduce((t,z)=>t+(z.type==="warmup"?2:1+e.restSeconds/60),0),0);}
 for(const s of sessions){
  while(duration(s)>p.minutes){let last=s.exercises.findLastIndex(e=>e.role==="accessory");if(last<0)break;const e=s.exercises[last];if(e.sets.length>2)e.sets.pop();else s.exercises.splice(last,1);}
  s.estimatedMinutes=Math.ceil(duration(s));
 }
 const exposure=volume?.countExposure?.(sessions.map(s=>({exercises:s.exercises.map(e=>({name:e.name,sets:e.sets.filter(z=>z.type!=="warmup")}))})))||null;
 phases.push({week:w,phase,sessions,exposure});
 }
 const errors=[];
 for(const w of phases)for(const s of w.sessions){
 if(!p.availability.includes(s.day))errors.push("Unavailable day.");
 if(s.estimatedMinutes>p.minutes)errors.push("Week "+w.week+" "+s.day+": required lift work exceeds time budget; increase session time or review manually.");
 for(const e of s.exercises)for(const z of e.sets)if(z.kg!==null&&(!Number.isFinite(z.kg)||z.kg<=0||Math.abs(z.kg/p.step-Math.round(z.kg/p.step))>1e-8))errors.push("Invalid load.");
 }
 return {version:VERSION,preview:true,profile:p,days,methodology:"Phased strength training with submaximal secondary exposures",reasons,weeks:phases,validation:{passed:!errors.length,errors:[...new Set(errors)],warnings},evidence:["ACSM 2026: https://pubmed.ncbi.nlm.nih.gov/41843416/","Tapering review: https://pubmed.ncbi.nlm.nih.gov/32917000/"]};
}
function assessSet({plannedKg,plannedReps,targetRpe,actualReps,actualRpe,backdownKg,step=2.5,pain=false,poorRecovery=false}){
 if(pain)return {decision:"stop-review",kg:null,reason:"Pain reported; stop the affected lift and review before proceeding."};
 if(![plannedKg,plannedReps,targetRpe,actualReps,actualRpe,backdownKg,step].every(x=>typeof x==="number"&&Number.isFinite(x))||plannedKg<=0||plannedReps<1||!Number.isInteger(plannedReps)||actualReps<0||!Number.isInteger(actualReps)||actualRpe<6||actualRpe>10||targetRpe<6||targetRpe>9||backdownKg<=0||step<=0)return {decision:"insufficient",kg:null,reason:"Complete valid performance data before recommending a change."};
 const missed=actualReps<plannedReps,excess=actualRpe>=9.5||missed;
 if(excess)return {decision:"reduce-review",kg:down(backdownKg*.95,step),reason:"Missed target or excessive effort. Consider reducing or ending remaining work; review recovery."};
 if(poorRecovery||actualRpe>targetRpe+.5)return {decision:"reduce-review",kg:down(backdownKg*.975,step),reason:"Higher than intended effort or poor readiness; consider a small reduction."};
 return {decision:"hold",kg:backdownKg,reason:actualRpe<=targetRpe-1?"Below target effort; review repeated comparable exposures before increasing future loads.":"Continue as planned."};
}
return {VERSION,generate,assessSet};
})();root.SXAscensionV2=api;if(typeof module!== 'undefined'&&module.exports)module.exports=api;})(typeof window!== 'undefined'?window:globalThis);
