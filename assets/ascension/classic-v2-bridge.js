/* Opt-in AscensionX 2.0 support redesign for an existing SBD classic cycle. Main prescriptions and completion records remain owned by the legacy engine. */
(function(root){root.SXAscensionV2Bridge=(function bridgeFactory(root){
"use strict";
const KEY="sx_ascension_v2_classic_bridge_v1",LEGACY="ascensionx_strength_v1",PREF="sx_ascension_adaptive_v1",DB="spartx_db",DRAFT="spartx_draft_v1",QUEUE="spartx_ascension_completion_queue_v1";
const LIFTS=["Back Squat","Bench Press","Deadlift"],DAYS=["MON","TUE","THU","SAT"];
const parse=(s,k)=>{try{return JSON.parse(s.getItem(k)||"null")}catch{return null}};
const round=(x,step)=>Math.max(step,Math.floor((x+1e-7)/step)*step);
const norm=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]/g,"");
function snapshot(storage=root.localStorage){
 const state=root.SXAscensionPrescription?.read(storage),c=state?.cycle,p=state?.profile;
 if(!c||!Array.isArray(c.exercises)||c.exercises.length!==3||!LIFTS.every(l=>c.exercises.includes(l)))return {ok:false,message:"An existing three-lift AscensionX cycle is required."};
 if(c.exercises.some((l,i)=>l!==LIFTS[i]))return {ok:false,message:"This transition currently supports the squat, bench, deadlift order only."};
 const pref=parse(storage,PREF)?.[c.created];
 if(!pref?.enabled||Number(pref.days)!==4)return {ok:false,message:"Enable Adaptive Programming with four training days in your current AscensionX cycle first."};
 const main=LIFTS.map(l=>root.SXAscensionPrescription.build(state,l,storage));
 if(main.some(x=>!x||!Number.isFinite(x.tm)||x.tm<=0||!Number.isInteger(x.week)||!x.sets.every(s=>Number.isFinite(s.weight)&&s.weight>0)))return {ok:false,message:"Could not validate the current compound prescriptions."};
 const maxes=Object.fromEntries(LIFTS.map(l=>[l,Number(p.max[l])]));
 if(Object.values(maxes).some(x=>!Number.isFinite(x)||x<20||x>500))return {ok:false,message:"Review the saved 1RM values before redesigning the cycle."};
 const startWeek=Math.max(...main.map(x=>x.week)),logs=(state.logs||[]).filter(x=>x.cycleId===c.created||(!x.cycleId&&Date.parse(x.date)>=Date.parse(c.created)));
 const completed=Object.fromEntries(LIFTS.map(l=>[l,[...new Set(logs.filter(x=>x.lift===l&&x.setsComplete===true).map(x=>Number(x.week)))].filter(w=>w>=1&&w<=6).sort((a,b)=>a-b)]));
 const firstWholeWeek=main.some(x=>completed[x.exercise].includes(startWeek))?startWeek+1:startWeek;
 return {ok:true,id:c.created,main,maxes,startWeek:firstWholeWeek,completed,step:Number(p.rounding)||2.5,signature:JSON.stringify({id:c.created,main:main.map(x=>[x.exercise,x.week,x.tm,x.sets]),completed,pref}),logs};
}
function read(storage=root.localStorage){const x=parse(storage,KEY),s=snapshot(storage);return x?.schema===1&&s.ok&&x.cycleId===s.id&&x.startWeek>=1&&x.startWeek<=5&&x.profile?.maxes&&LIFTS.every(l=>x.profile.maxes[l]===s.maxes[l])?x:null;}
function history(storage,id,name,week,lift){
 const db=parse(storage,DB),records=[];
 for(const session of Array.isArray(db?.sessions)?db.sessions:[]){
  for(const e of session.exercises||[]){
   const link=e.sxStrengthSizeCompanion||e.sxPowerbuildingSupport;
   if(link?.cycleId!==id||Number(link.week)>=week||norm(e.name)!==norm(name)||!Number.isInteger(Number(link.plannedSets))||Number(link.plannedSets)<=0)continue;
   if(lift==="Support"?link.day!=="SAT":link.lift!==lift)continue;
   const sets=(e.sets||[]).filter(z=>z.done===true&&!/warm.?up/i.test(String(z.type||""))&&Number(z.weight)>0&&Number.isInteger(Number(z.reps))&&Number(z.reps)>0);
   if(sets.length<Number(link.plannedSets))continue;
   records.push({week:Number(link.week),date:Date.parse(session.date)||0,sets});
  }
 }
 records.sort((a,b)=>b.week-a.week||b.date-a.date);
 return records.filter((x,i)=>i===0||x.week!==records[i-1].week).slice(0,2);
}
function mainAt(s,week,lift){return s.main.find(x=>x.exercise===lift);}
function build(profile,s,week,lift,storage=root.localStorage){
 if(week>=6)return [];
 // Use the v2 engine to allocate eligible exercises, then adapt its dose to
 // the EXISTING six-week phase. Never substitute the generated primary loads.
 const p={...profile,maxes:s.maxes,weeks:8,availability:["Mon","Tue","Thu","Sat"],minutes:Number(profile.minutes),step:s.step};
 const generated=root.SXAscensionV2.generate(p,root.SXVolumeIntelligence);
 if(generated.days.length!==4||!generated.validation.passed)return null;
 const w=generated.weeks[week<=3?week-1:week===4?4:5],index=lift==="Support"?3:LIFTS.indexOf(lift);
 if(index<0)return null;
 const session=w.sessions[index];
 let chosen=session.exercises.filter(e=>e.role!=="primary");
 // During the existing heavy weeks 4–5 keep secondary work very light.
 // Preserve the requested RDL-first order in normal weeks.
 if(lift==="Deadlift")chosen=chosen.slice().sort((a,b)=>(a.name==="Romanian Deadlift"?-1:0)-(b.name==="Romanian Deadlift"?-1:0));
 const nameMap={"Chest Supported Row":"Iso-Lateral Row","Triceps Pushdown":"Triceps Pushdown (Bar)","Dumbbell Lateral Raise":"Dumbbell Lateral Raise","Cable Crunch":"Cable Crunch","Dumbbell Row":"Dumbbell Row"};
 const out=[];
 for(const e of chosen){
  const name=nameMap[e.name]||e.name,secondary=e.role==="secondary",hinge=name==="Romanian Deadlift";
  const first=e.sets.find(z=>z.type!=="warmup");if(!first)continue;
  let sets=e.sets.length,rpe=first.rpe,reps=first.reps,kg=null;
  if(secondary){
   const primary=/squat/i.test(name)?"Back Squat":/bench/i.test(name)?"Bench Press":"Deadlift";
   const tm=mainAt(s,week,primary)?.tm;if(!tm)continue;
   // Submaximal technique only; no secondary set can advance the main lift.
   sets=Math.min(sets,week>=4?1:2+(lift==="Support"&&primary==="Bench Press"?1:0));
   rpe=week>=4?6:Math.min(7,Number(rpe)||7);
   kg=round(Math.min(first.kg,tm*(week>=4?.55:.67)),s.step);
   if(week>=4&&/squat/i.test(name))continue;
  }else{
   sets=Math.min(sets,week>=4?2:3);
   rpe=week>=4?6.5:Math.min(8,Number(rpe)||8);
   const recent=history(storage,s.id,name,week,lift),last=recent[0],prior=recent[1];
   if(last){
    const weights=last.sets.map(z=>Number(z.weight));
    kg=Math.min(...weights);
    const hard=x=>x.sets.some(z=>Number(z.reps)<reps||(z.rpe!==null&&z.rpe!==""&&Number(z.rpe)>=9.5));
    if(prior&&hard(last)&&hard(prior)){sets=Math.max(1,sets-1);kg=round(kg*.95,.5);}
    else if(week>=4)kg=round(kg*.95,.5);
   }
   if(hinge){sets=Math.min(sets,2);rpe=Math.min(rpe,7);}
  }
  if(!sets)continue;
  out.push({name,sets,min:reps,max:reps,targetReps:reps,targetRpe:rpe,rir:10-rpe,rest:e.restSeconds,suggestedKg:kg,sourceLift:lift,week,sxV2Bridge:true,reason:"AscensionX 2.0 · "+e.reason+" "+(secondary?"Secondary practice only; adjust to RPE.":"Exercise-specific history, when available; do not infer machine loads from barbell strength.")});
 }
 // Re-budget against actual classic main sets rather than the hypothetical v2 main.
 const primary=lift==="Support"?null:mainAt(s,week,lift);
 // Use the largest classic main set count to avoid optimistic future-session estimates.
 const mainMinutes=primary?8+4*2+5*5:8;
 const duration=()=>mainMinutes+out.reduce((n,e)=>n+3+e.sets*(1+e.rest/60)+(/squat|bench/i.test(e.name)?6:0),0);
 while(out.length&&duration()>p.minutes){const e=out.at(-1);if(e.sets>1)e.sets--;else out.pop();}
 return out.length?out:null;
}
// The session name follows the actual final prescription after tapering and time trimming.
function supportTitle(exercises,week){
 const list=Array.isArray(exercises)?exercises:[];
 const hasSquat=list.some(e=>/^(?:(?:Paused|Tempo|Back|Front) )?Squat$/i.test(e.name)&&Number(e.sets)>0);
 const hasBench=list.some(e=>/^(?:(?:Paused|Close-Grip) )?Bench Press$/i.test(e.name)&&Number(e.sets)>0);
 const label=hasSquat&&hasBench?"Secondary Squat & Bench":hasSquat?"Secondary Squat & Assistance":hasBench?"Secondary Bench & Assistance":"Adaptive Assistance";
 return label+" - Week "+week;
}
function proposal(profile,storage=root.localStorage){
 const s=snapshot(storage);if(!s.ok)throw Error(s.message);
 if(s.startWeek>5)throw Error("Only deload or assessment remains. Finish the current cycle instead of introducing new support.");
 const p={...profile,maxes:s.maxes,weeks:8,availability:["Mon","Tue","Thu","Sat"],step:s.step};
 const base=root.SXAscensionV2.generate(p,root.SXVolumeIntelligence);
 if(base.days.length!==4||!base.validation.passed)throw Error("The current inputs do not support a validated four-day draft. Review recovery and session time, or keep the classic cycle.");
 // Freeze exercise templates for this approval; actual historical loads are
 // re-evaluated at each future import. The legacy cycle stays authoritative.
 const slots=LIFTS.concat("Support").map((lift,i)=>({day:DAYS[i],lift,week:s.startWeek,exercises:build(p,s,s.startWeek,lift,storage)}));
 if(slots.some(x=>!x.exercises?.length))throw Error("Could not fit all four training days. Keep the classic cycle or revise the profile.");
 for(const slot of slots)slot.title=slot.lift==="Support"?supportTitle(slot.exercises,slot.week):slot.lift+" - Week "+slot.week;
 return {cycleId:s.id,startWeek:s.startWeek,signature:s.signature,profile:base.profile,main:s.main,completed:s.completed,slots};
}
function apply(draft,storage=root.localStorage){
 const s=snapshot(storage);if(!s.ok||s.id!==draft?.cycleId||s.signature!==draft.signature)throw Error("Cycle progress has changed. Generate a new preview.");
 if(parse(storage,DRAFT)?.sessionActive||parse(storage,DRAFT)?.editingSessionId!=null)throw Error("Finish or discard the active workout before applying this redesign.");
 if((parse(storage,QUEUE)||[]).some?.(p=>p.cycleId===s.id))throw Error("Pending workout completion: open AscensionX to synchronise your latest session, then generate again.");
 const fresh=proposal(draft.profile,storage);
 const record={schema:1,cycleId:s.id,startWeek:fresh.startWeek,profile:fresh.profile,approvedAt:new Date().toISOString()};
 storage.setItem(KEY,JSON.stringify(record));return record;
}
function plan(lift,week,cycleId,storage=root.localStorage){
 try{const record=read(storage),s=snapshot(storage);if(!record||record.cycleId!==cycleId||week<record.startWeek||week>6||!Number.isInteger(week))return null;
 return build(record.profile,s,week,lift,storage);}catch{return null;}
}
function disable(storage=root.localStorage){storage.removeItem(KEY);}
return {KEY,snapshot,read,proposal,apply,plan,disable,supportTitle};
})(root);})(typeof window!=='undefined'?window:globalThis);
