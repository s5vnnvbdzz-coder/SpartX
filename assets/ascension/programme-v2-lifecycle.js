/* AscensionX 2.0 isolated programme lifecycle. Never writes legacy cycle or workout database. */
(function(root){const api=(function lifecycleFactory(){
"use strict";
const KEY="sx_ascension_v2_programme_v1",HANDOFF="sx_ascension_v2_import_v1",DB="spartx_db";
const clone=x=>JSON.parse(JSON.stringify(x));
const parse=(storage,k)=>{try{return JSON.parse(storage.getItem(k)||"null")}catch{return null}};
function read(storage){const a=parse(storage,KEY);return a?.schema===1&&typeof a.id==="string"&&a.plan?.version?.startsWith("2.0-preview.")&&Array.isArray(a.plan.weeks)&&a.plan.validation?.passed===true?a:null;}
function save(storage,plan,id){
 if(!plan?.validation?.passed||!plan.version?.startsWith("2.0-preview.")||!Array.isArray(plan.weeks)||typeof id!=="string"||!id)throw Error("Only a validated programme draft can be saved.");
 const entry={schema:1,id,createdAt:new Date().toISOString(),plan:clone(plan)};
 storage.setItem(KEY,JSON.stringify(entry));return entry;
}
function sessions(storage){const a=parse(storage,DB);return Array.isArray(a?.sessions)?a.sessions:[];}
function slots(entry){return entry.plan.weeks.flatMap(w=>w.sessions.map(s=>({...s,week:w.week,phase:w.phase,id:"w"+w.week+"-d"+s.index})));}
function linkedExercise(record,entry,slot,exercise,i){
 return (record?.exercises||[]).find(ex=>ex.sxAscensionV2?.programmeId===entry.id&&ex.sxAscensionV2?.slotId===slot.id&&ex.sxAscensionV2?.exerciseId===slot.id+"-e"+i&&ex.name===exercise.name);
}
function doneSet(ex,id){
 return (ex?.sets||[]).find(s=>s.sxAscensionV2SetId===id&&s.done===true&&s.weight!==null&&s.weight!==""&&Number.isFinite(Number(s.weight))&&Number(s.weight)>=0&&Number.isInteger(Number(s.reps))&&Number(s.reps)>0);
}
function completion(entry,slot,record){
 slot=entry.prescriptions?.[slot.id]||slot;
 return slot.exercises.every((e,i)=>{
  const ex=linkedExercise(record,entry,slot,e,i);
  return e.sets.every((s,j)=>{if(s.type==="warmup")return true;const z=doneSet(ex,slot.id+"-e"+i+"-s"+j);return !!z&&(s.kg==null||Number(z.weight)>0);});
 });
}
function progress(entry,history){
 const all=slots(entry),completed=all.filter(s=>history.some(r=>completion(entry,s,r))).map(s=>s.id);
 return {total:all.length,completed:completed.length,next:all.find(s=>!completed.includes(s.id))||null,completedIds:completed};
}
function comparable(entry,slot,exercise,history){
 const earlier=slots(entry).filter(s=>s.week<slot.week||(s.week===slot.week&&s.index<slot.index));
 const out=[];
 for(const raw of earlier){
  const s=entry.prescriptions?.[raw.id]||raw;
  if(s.phase==="Deload"||s.phase==="Taper"||s.phase==="Assessment")continue;
  s.exercises.forEach((e,i)=>{
   if(e.name!==exercise.name||e.role!==exercise.role)return;
   const row=history.find(r=>completion(entry,s,r));if(!row)return;
   const ex=linkedExercise(row,entry,s,e,i);
   const actual=e.sets.map((z,j)=>({planned:z,actual:doneSet(ex,s.id+"-e"+i+"-s"+j)})).filter(x=>x.planned.type!=="warmup");
   if(actual.length&&actual.every(x=>x.actual&&Number(x.actual.rpe)>=6&&Number(x.actual.rpe)<=10))out.push({week:s.week,index:s.index,actual});
  });
 }
 return out;
}
function prescribe(entry,slot,history,readiness="unknown"){
 if(entry.prescriptions?.[slot.id])return clone(entry.prescriptions[slot.id]);
 const copy=clone(slot),step=entry.plan.profile.step||2.5,down=(x,increment)=>Math.max(increment,Math.floor((x+1e-8)/increment)*increment);
 let volumeChange=false;
 for(const e of copy.exercises){
  const past=comparable(entry,slot,e,history),last=past.at(-1),prev=past.at(-2);
  if(!last||["Deload","Taper","Assessment"].includes(slot.phase))continue;
  if(e.role==="accessory"){
   const a=last.actual,weights=a.map(x=>Number(x.actual.weight));
   if(weights.every(w=>w>0&&Math.abs(w-weights[0])<.001)){
    let kg=weights[0],decision="Repeat the last comparable exercise load.";
    const easy=x=>x.actual.every(y=>Number(y.actual.reps)>=y.planned.reps&&Number(y.actual.rpe)<=y.planned.rpe-1);
    const hard=x=>x.actual.some(y=>Number(y.actual.reps)<y.planned.reps||Number(y.actual.rpe)>=9.5);
    const increment=["Dumbbell Curl","Dumbbell Lateral Raise","Dumbbell Triceps Extension"].includes(e.name)?1:step;
    if(prev&&easy(prev)&&easy(last)&&prev.actual.every(y=>Math.abs(Number(y.actual.weight)-kg)<.001)){kg+=increment;decision="Two comparable easy exposures: small load increase suggested.";}
    else if(prev&&hard(prev)&&hard(last)){kg=Math.min(kg,down(kg*.95,increment));decision="Two difficult exposures: reduce load and review recovery.";}
    e.sets.forEach(z=>z.kg=kg);e.reason+=" "+decision;
    const third=past.at(-3),onTarget=x=>x.actual.every(y=>Number(y.actual.reps)===y.planned.reps&&Math.abs(Number(y.actual.rpe)-y.planned.rpe)<=.5&&Math.abs(Number(y.actual.weight)-weights[0])<.001);
    if(!volumeChange&&prev&&hard(prev)&&hard(last)&&e.sets.length>2){e.sets.pop();volumeChange=true;e.reason+=" Reduce one accessory set after repeated excessive effort; not a diagnosis of under-recovery.";}
    else if(!volumeChange&&readiness==="good"&&third&&prev&&[third,prev,last].every(onTarget)&&["Accumulation","Strength"].includes(slot.phase)&&e.sets.length===3&& !/deadlift|extension|squat|press/i.test(e.name)&&copy.estimatedMinutes+1+e.restSeconds/60<=entry.plan.profile.minutes){
     const muscle=/curl/i.test(e.name)?"Biceps":/row|pulldown|pull up/i.test(e.name)?"Back":/lateral/i.test(e.name)?"Shoulders":/calf/i.test(e.name)?"Calves":null;
     const exposure=entry.plan.weeks.find(w=>w.week===slot.week)?.exposure?.[muscle]?.effective;
     if(Number.isFinite(exposure)&&exposure<=8){e.sets.push({...e.sets.at(-1)});copy.estimatedMinutes+=Math.ceil(1+e.restSeconds/60);volumeChange=true;e.reason+=" Three stable exposures plus good reported recovery: trial one extra set. Monitor next exposure.";}
    }
   }
  }else if(e.role==="primary"&&prev){
   const top=x=>x.actual.find(y=>y.planned.type==="top"),hard=x=>{const y=top(x);return !!y&&(Number(y.actual.reps)<y.planned.reps||Number(y.actual.rpe)>=9.5||Number(y.actual.rpe)>y.planned.rpe+1);};
   if(hard(last)&&hard(prev)){
    const recent=Number(top(last).actual.weight),planned=e.sets.find(z=>z.type==="top").kg;
    const cap=Math.min(down(planned*.95,step),down(recent,step)),factor=cap/planned;
    for(const z of e.sets)if(z.kg!==null)z.kg=Math.min(z.kg,down(z.kg*factor,step));
    e.reason+=" Two difficult primary exposures: cap the next top set and proportionally reduce remaining planned loads. Review recovery.";
   }
  }
 }
 return copy;
}
function prepare(storage,entry,slot,history,readiness="unknown"){
 const fresh=read(storage);if(!fresh||fresh.id!==entry.id||progress(fresh,history).next?.id!==slot.id)throw Error("Programme changed. Reopen it before loading.");
 if(fresh.prescriptions?.[slot.id])return fresh;
 const chosen=prescribe(fresh,slot,history,readiness);fresh.prescriptions={...(fresh.prescriptions||{}),[slot.id]:chosen};storage.setItem(KEY,JSON.stringify(fresh));return fresh;
}
function makeWorkout(entry,slot,history){
 const chosen=prescribe(entry,slot,history);
 return chosen.exercises.map((e,i)=>({name:e.name,rest:e.restSeconds,notes:"AscensionX 2.0 · Week "+slot.week+" · "+slot.phase+" · "+e.reason+" · Targets: "+e.sets.filter(z=>z.type!=="warmup").map(z=>z.reps+" reps @ RPE "+z.rpe).join("; "),
 sxAscensionV2:{programmeId:entry.id,slotId:slot.id,exerciseId:slot.id+"-e"+i,week:slot.week},
 sets:e.sets.map((z,j)=>({weight:z.kg==null?"":String(z.kg),reps:String(z.reps),rpe:"",type:z.type==="warmup"?"Warm-up":z.type==="backdown"?"Backdown Set":"Working Set",done:false,sxV2Target:{role:z.type,kg:z.kg,reps:z.reps,rpe:z.rpe},sxAscensionV2SetId:slot.id+"-e"+i+"-s"+j}))}));
}
function liveReview(ex,step=2.5,pain=false){
 if(!ex?.sxAscensionV2)return {decision:"unavailable"};
 if(pain)return {decision:"stop",reason:"Stop the affected lift; do not continue through concerning pain."};
 const top=ex.sets.find(z=>z.sxV2Target?.role==="top"),pending=ex.sets.filter(z=>!z.done&&z.sxV2Target?.role==="backdown");
 if(!top?.done||!pending.length||top.rpe==null||top.rpe===""||!Number.isFinite(+top.rpe)||+top.rpe<6||+top.rpe>10||!Number.isInteger(+top.reps)||+top.reps<0)return {decision:"unavailable",reason:"Complete the top set and record RPE first."};
 const t=top.sxV2Target,miss=+top.reps<t.reps,hard=+top.rpe>=9.5||miss,moderate=+top.rpe>t.rpe+.5;
 if(!hard&&!moderate)return {decision:"hold",reason:"No immediate reduction indicated. Do not increase load from one easy set."};
 const changes=pending.filter(z=>Number(z.weight)>0&&Number(z.sxV2Target.kg)>0).map(z=>({id:z.sxAscensionV2SetId,kg:Math.min(+z.weight,Math.max(step,Math.floor((z.sxV2Target.kg*(hard?.95:.975)+1e-8)/step)*step))})).filter(x=>pending.some(z=>z.sxAscensionV2SetId===x.id&&+z.weight>x.kg));
 return {decision:changes.length?"reduce":"hold",changes,reason:hard?"Excessive effort or missed reps: consider reducing remaining back-downs or ending the lift.":"Higher than intended effort: consider a small reduction."};
}
function cycleReview(entry,history){
 const status=progress(entry,history),maxes={...entry.plan.profile.maxes},suggestions=[];
 if(status.next)return {ready:false,status,maxes,suggestions};
 for(const raw of slots(entry).filter(s=>s.phase==="Assessment")){
  const slot=entry.prescriptions?.[raw.id]||raw,record=history.find(r=>completion(entry,slot,r));
  slot.exercises.forEach((e,i)=>{if(e.role!=="assessment")return;
   const x=doneSet(linkedExercise(record,entry,slot,e,i),slot.id+"-e"+i+"-s0"),rpe=Number(x?.rpe),kg=Number(x?.weight);
   if(!x||+x.reps!==1||rpe<7||rpe>9||!Number.isFinite(rpe)||kg<=0)return;
   const pct={7:.89,7.5:.905,8:.92,8.5:.94,9:.955}[rpe];if(!pct)return;
   const old=maxes[e.name],step=entry.plan.profile.step||2.5,estimate=kg/pct,rounded=Math.round(estimate/step)*step;
   const suggested=Math.min(Math.floor(old*1.05/step)*step,Math.max(Math.ceil(old*.95/step)*step,rounded));
   maxes[e.name]=suggested;suggestions.push({lift:e.name,old,estimated:Math.round(estimate*10)/10,suggested,reason:"Submaximal single and RPE estimate; bounded to ±5%, requires athlete approval."});
  });
 }
 return {ready:true,status,maxes,suggestions};
}
return {KEY,HANDOFF,read,save,sessions,slots,progress,completion,prescribe,prepare,makeWorkout,liveReview,cycleReview};
})();root.SXAscensionV2Lifecycle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis);
