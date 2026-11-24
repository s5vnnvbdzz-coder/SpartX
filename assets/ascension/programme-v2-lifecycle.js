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
 for(const s of earlier){
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
function prescribe(entry,slot,history){
 const copy=clone(slot),step=entry.plan.profile.step||2.5,down=(x,increment)=>Math.max(increment,Math.floor((x+1e-8)/increment)*increment);
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
function makeWorkout(entry,slot,history){
 const chosen=prescribe(entry,slot,history);
 return chosen.exercises.map((e,i)=>({name:e.name,rest:e.restSeconds,notes:"AscensionX 2.0 · Week "+slot.week+" · "+slot.phase+" · "+e.reason+" · Targets: "+e.sets.filter(z=>z.type!=="warmup").map(z=>z.reps+" reps @ RPE "+z.rpe).join("; "),
 sxAscensionV2:{programmeId:entry.id,slotId:slot.id,exerciseId:slot.id+"-e"+i,week:slot.week},
 sets:e.sets.map((z,j)=>({weight:z.kg==null?"":String(z.kg),reps:String(z.reps),rpe:"",type:z.type==="warmup"?"Warm-up":"Working Set",done:false,sxAscensionV2SetId:slot.id+"-e"+i+"-s"+j}))}));
}
return {KEY,HANDOFF,read,save,sessions,slots,progress,completion,prescribe,makeWorkout};
})();root.SXAscensionV2Lifecycle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis);
