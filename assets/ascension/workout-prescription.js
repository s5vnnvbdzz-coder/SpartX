/* Shared AscensionX → SpartanX workout prescription.
 * Both the AscensionX programme page and native SpartanX Continue popup
 * call this single import builder. It does not mutate athlete records.
 * Plans and the recovery bridge are derived from the existing cycle state.
 */
(function(global){
 'use strict';
 const PLAN=[
 {week:1,name:'Volume foundation',topPct:72.5,topReps:6,backPct:67.5,backSets:3,backReps:6,rpe:7},
 {week:2,name:'Volume progression',topPct:77.5,topReps:5,backPct:72.5,backSets:4,backReps:5,rpe:7},
 {week:3,name:'Strength development',topPct:82.5,topReps:4,backPct:77.5,backSets:4,backReps:4,rpe:7.5},
 {week:4,name:'Intensification',topPct:87.5,topReps:3,backPct:82.5,backSets:3,backReps:3,rpe:8},
 {week:5,name:'Heavy strength',topPct:92.5,topReps:2,backPct:87.5,backSets:3,backReps:2,rpe:8.5},
 {week:6,name:'Deload & consolidate',topPct:60,topReps:5,backPct:null,backSets:0,backReps:0,rpe:6,deload:true}
];
 const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const key='ascensionx_strength_v1';
 const round=(n,step)=>Math.round(n/step)*step;
 // Repair a stale per-lift pointer only when a completed, cycle-linked log
 // already proves the next week. Preserve all logged sets, RPE and training maxes.
 function reconcileCompletedWeeks(state){
  const c=state?.cycle;
  if(!c?.created||!Array.isArray(state.logs))return state;
  const lifts=(Array.isArray(c.exercises)?c.exercises:LIFTS).filter(x=>LIFTS.includes(x));
  const logs=activeLogs(state);
  const weeks={...(c.weeks||{})};
  let changed=false;
  for(const lift of lifts){
   const current=Math.min(6,Math.max(1,Number(weeks[lift]||c.currentWeek)||1));
   const completed=Math.max(0,...logs.filter(x=>x.lift===lift&&x.setsComplete===true&&
    Number.isInteger(Number(x.week))&&Number(x.week)>=1&&Number(x.week)<=5)
    .map(x=>Number(x.week)));
   const next=Math.min(6,completed+1);
   if(next>current){weeks[lift]=next;changed=true;}
  }
  return changed?{...state,cycle:{...c,weeks}}:state;
 }
 // A completed SpartanX workout is the durable source of truth when the
 // cross-page completion queue was consumed by an older broken app version.
 // Only same-cycle, explicitly linked, fully prescribed sets may be recovered.
 function reconcileSavedSpartanSessions(state,storage=global.localStorage){
  const cycle=state?.cycle;
  if(!cycle?.created||!Array.isArray(state.logs))return state;
  const start=Date.parse(cycle.created);
  if(!Number.isFinite(start))return state;
  const allowed=new Set((Array.isArray(cycle.exercises)?cycle.exercises:LIFTS).filter(x=>LIFTS.includes(x)));
  const saved=sessions(storage);
  if(!saved.length)return reconcileCompletedWeeks(state);
  const logs=state.logs.slice();
  let changed=false;
  for(const session of saved.slice().reverse()){
   if(!Array.isArray(session?.exercises)||session.id==null)continue;
   const date=Date.parse(session.date||'');
   if(!Number.isFinite(date)||date<start)continue;
   for(const exercise of session.exercises){
    const link=exercise?.ascensionLink;
    if(!link||link.cycleId!==cycle.created||link.lift!==exercise.name||!allowed.has(link.lift))continue;
    const week=Number(link.week);
    if(!Number.isInteger(week)||week<1||week>PLAN.length)continue;
    const plan=PLAN[week-1],required=plan.deload?3:1+plan.backSets;
    const prescribed=Array.isArray(link.plannedSets)?link.plannedSets:[];
    const completed=(Array.isArray(exercise.sets)?exercise.sets:[]).filter(x=>
     ['Working Set','Backdown Set','B'].includes(x?.type));
    if(prescribed.length!==required||completed.length!==required||
     completed.some((set,i)=>set.done!==true||
      !Number.isFinite(Number(set.weight))||Number(set.weight)<=0||
      !Number.isInteger(Number(set.reps))||
      Number(set.reps)<(plan.deload?5:i===0?plan.topReps:plan.backReps)||
      !Number.isFinite(Number(prescribed[i]?.weight))||Number(prescribed[i].weight)<=0||
      !Number.isFinite(Number(prescribed[i]?.reps))||
      Number(set.weight)+0.01<Number(prescribed[i].weight)||
      Number(set.reps)<Number(prescribed[i].reps)))continue;
    const isThisLog=log=>log?.lift===link.lift&&Number(log.week)===week&&
     (log.cycleId===cycle.created||
      (!log.cycleId&&Number.isFinite(Date.parse(log.date||''))&&Date.parse(log.date)>=start));
    if(logs.some(log=>isThisLog(log)&&log.setsComplete===true))continue;
    const sets=completed.map((set,i)=>({
     label:plan.deload?'Deload '+(i+1):i===0?'Top set':'Back-off '+i,
     weight:Number(set.weight),reps:Number(set.reps),
     rpe:set.rpe==null||set.rpe===''?null:Number(set.rpe),done:true
    }));
    const scores=sets.map(x=>x.rpe).filter(x=>x!==null&&Number.isFinite(x));
    const avgRpe=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
    const existingIndex=logs.findIndex(isThisLog);
    const prior=existingIndex<0?null:logs[existingIndex];
    const recovered={...prior,id:prior?.id??(Number.isFinite(Number(session.id))?Number(session.id):date),
     date:session.date,source:'SpartanX',sourceSessionId:String(session.id),
     cycleId:cycle.created,lift:link.lift,week,sets,topWeight:sets[0].weight,
     topReps:sets[0].reps,volume:sets.reduce((sum,x)=>sum+x.weight*x.reps,0),
     notes:prior?.notes||'Recovered from completed SpartanX workout',
     avgRpe,success:avgRpe===null||avgRpe<=plan.rpe,setsComplete:true};
    if(existingIndex>=0)logs[existingIndex]=recovered;
    else logs.push(recovered);
    changed=true;
   }
  }
  return reconcileCompletedWeeks(changed?{...state,logs}:state);
 }
 function read(storage=global.localStorage){
  try{
   const state=JSON.parse(storage.getItem(key)||'null');
   if(!state?.cycle?.created||!Array.isArray(state.logs)||!state.profile?.max)return null;
   if(!Number.isFinite(Date.parse(state.cycle.created)))return null;
   const reconciled=reconcileSavedSpartanSessions(state,storage);
   if(reconciled!==state)try{storage.setItem(key,JSON.stringify(reconciled))}catch(_){}
   return reconciled;
  }catch(_){return null}
 }
 function activeLogs(state){
  const id=state?.cycle?.created,start=Date.parse(id||'');
  return (state?.logs||[]).filter(x=>x?.cycleId?
   x.cycleId===id:Number.isFinite(Date.parse(x?.date||''))&&
   Number.isFinite(start)&&Date.parse(x.date)>=start);
 }
 function sessions(storage){
  try{
   const raw=storage.getItem('spartx_db');
   if(!raw||raw.length>8000000)return [];
   const saved=JSON.parse(raw);
   return Array.isArray(saved?.sessions)?saved.sessions:[];
  }catch(_){return []}
 }
 function build(state,lift,storage=global.localStorage){
  const c=state?.cycle,p=state?.profile;
  if(!c?.created||!p||!LIFTS.includes(lift))return null;
  const lifts=Array.isArray(c.exercises)?c.exercises.filter(x=>LIFTS.includes(x)):LIFTS;
  if(!lifts.includes(lift))return null;
  const week=Math.min(6,Math.max(1,Number(c.weeks?.[lift]||c.currentWeek||1)));
  const plan=PLAN[week-1],step=Number(p.rounding)||2.5;
  const approved=Number(c.trainingMaxes?.[lift]);
  const tm=round(approved>0?approved:(Number(p.max[lift])||0)*(Number(p.tmPct)||95)/100,step);
  if(!(tm>0))return null;
  const topNormal=round(tm*plan.topPct/100,step);
  const backNormal=plan.backPct===null?null:round(tm*plan.backPct/100,step);
  const safe=global.SXAscensionLoadGuard?.reconcile({
   lift,week,trainingMax:tm,rounding:step,plan:PLAN,
   cycleId:c.created,logs:activeLogs(state),sessions:sessions(storage)
  });
  const top=safe?.topLoad??topNormal,back=safe?.backLoad??backNormal;
  const warmPct=plan.deload?[25,35,45,55]:plan.topPct<=75?[30,40,50,60]:[40,55,65,75];
  const warmupSets=warmPct.map((pct,i)=>({
   weight:Math.max(step,Math.min(round(tm*pct/100,step),
    safe?.adjusted?round(top*[.55,.7,.8,.9][i],step):top-(4-i)*step)),
   reps:[5,3,2,1][i]
  }));
  const sets=plan.deload?Array.from({length:3},()=>({weight:top,reps:plan.topReps})):
   [{weight:top,reps:plan.topReps},...Array.from({length:plan.backSets},()=>
    ({weight:back,reps:plan.backReps}))];
  const liftTitle=({'Back Squat':'Squats','Bench Press':'Bench Press',
   'Deadlift':'Deadlifts','Overhead Press':'Overhead Press'})[lift]||lift;
  const cycleTitle=String(c.title||c.name||'').trim().slice(0,75)||liftTitle+' (current week)';
  return {source:'AscensionX',cycleId:c.created,cycleTitle,exercise:lift,
   week,weekLabel:plan.name,tm,targetRpe:plan.rpe,warmupSets,sets,
   recoveryBridge:safe?.adjusted?{
    fromWeek:safe.sourceWeek,previousTop:safe.sourceTop,
    nominalTop:safe.nominalTop,adjustedTop:top
   }:null};
 }
 global.SXAscensionPrescription=Object.freeze({PLAN,LIFTS,read,build,reconcileCompletedWeeks,reconcileSavedSpartanSessions});
})(window);
