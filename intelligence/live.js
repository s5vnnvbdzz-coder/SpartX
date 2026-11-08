/* SpartanX Intelligence Live: read-only, provisional set analysis. */
(function(global){
 'use strict';
 const E=global.SXEngine;
 const working=s=>{
  const t=String(s?.type||'Working Set').toLowerCase();
  return !/(warm|drop|failure|excluded|backdown)/.test(t)&&!['w','b','x','f'].includes(t);
 };
 const round=(n,d=1)=>Math.round(n*10**d)/10**d;
 const volume=sets=>sets.reduce((n,s)=>n+s.weight*s.reps,0);
 const bestEstimate=sets=>{
  const nums=sets.map(s=>E.estimatedMax(s)).filter(n=>n!=null&&Number.isFinite(n));
  return nums.length?Math.max(...nums):null;
 };
 const avgRpe=sets=>{const arr=sets.map(s=>s.rpe).filter(n=>Number.isFinite(n));return arr.length?round(arr.reduce((a,b)=>a+b,0)/arr.length):null};
 const change=(cur,prev)=>prev>0?round(100*(cur-prev)/prev):null;
 function summarise(live,history,requestedLift){
  if(!live||!['live','waiting'].includes(live.status))return {status:'idle',exercises:[],selected:null,sets:0,volumeKg:0};
  const grouped=new Map();
  for(const ex of live.exercises||[]){
   const name=E.canonical(ex.name);
   if(!name)continue;
   if(!grouped.has(name))grouped.set(name,{name,sets:[],programmed:false});
   const row=grouped.get(name);
   row.sets.push(...ex.sets);row.programmed ||= !!ex.programmed;
  }
  const saved=Array.isArray(history)?history:[];
  const exercises=[...grouped.values()].map(group=>{
   const sets=group.sets,work=sets.filter(working);
   const previous=saved.slice().reverse().find(s=>s.exercises?.some(e=>E.canonical(e.name)===group.name))||null;
   const previousSets=previous?.exercises?.filter(e=>E.canonical(e.name)===group.name).flatMap(e=>e.sets||[])||[];
   const previousWork=previousSets.filter(working);
   const prevMax=bestEstimate(previousWork),max=bestEstimate(work),delta=max!=null&&prevMax!=null?change(max,prevMax):null;
   const currentVolume=volume(work),priorVolume=volume(previousWork);
   const rpe=avgRpe(work),high=work.filter(s=>s.rpe!=null&&s.rpe>=9).length;
   const maxRpe=Math.max(0,...work.map(s=>s.rpe||0));
   const firstAvg=avgRpe(work.slice(0,Math.floor(work.length/2)));
   const latterAvg=avgRpe(work.slice(Math.floor(work.length/2)));
   const rising=work.length>=4&&firstAvg!=null&&latterAvg!=null&&latterAvg-firstAvg>=.75;
   let fatigue;
   if(!work.length)fatigue={kind:'neutral',title:'Working sets pending',detail:'Complete a working set to review perceived effort.'};
   else if(rpe==null)fatigue={kind:'neutral',title:'RPE not yet recorded',detail:'Log effort on completed working sets to monitor a fatigue signal.'};
   else if(rising)fatigue={kind:'caution',title:'Effort rising',detail:'RPE is higher in later sets. Different loads, rest periods and fatigue may all contribute.'};
   else if(high>=2||maxRpe>=9.5)fatigue={kind:'caution',title:'High perceived effort',detail:'One or more working sets were near maximal effort. Monitor form and recovery.'};
   else fatigue={kind:'positive',title:'Effort appears manageable',detail:'Logged RPE suggests controlled work so far. RPE is not a direct measure of recovery.'};
   const step=E.MOVES[group.name]?.step||2.5;
   let advice;
   if(group.programmed)advice={kind:'neutral',title:'Follow your cycle progression',detail:'This lift belongs to a programmed cycle. Use its prescribed progression rather than an automatic increase.'};
   else if(!work.length)advice={kind:'neutral',title:'Complete working sets first',detail:'There is not enough performance data to recommend a load change.'};
   else if(rpe==null)advice={kind:'neutral',title:'Record RPE for better guidance',detail:'Keep the planned load and log effort before considering an increase.'};
   else if(maxRpe>=9)advice={kind:'caution',title:'Maintain the planned load',detail:'A working set reached RPE '+maxRpe+'. Prioritise controlled repetitions and recovery.'};
   else if(delta!=null&&delta>=-2&&work.length>=2&&rpe<=7.5&&step>0)
    advice={kind:'positive',title:'Small increase may be suitable next time',detail:'Estimated top-set strength is broadly stable and effort appears controlled. Consider up to +'+step+' kg only if technique and programming allow.'};
   else advice={kind:'neutral',title:'Build a comparable session',detail:'Follow your planned load. In-session volume changes alone do not establish strength progress.'};
   return {
    ...group,completed:sets.length,working:work.length,warmups:sets.length-work.length,
    volumeKg:volume(sets),workVolumeKg:currentVolume,avgRpe:rpe,highEffort:high,bestE1rm:max,
    previousE1rm:prevMax,estimateDelta:delta,volumeDelta:previousWork.length&&priorVolume>0?change(currentVolume,priorVolume):null,
    previousSession:previous?{date:previous.date,volumeKg:priorVolume,workingSets:previousWork.length}:null,
    fatigue,advice
   };
  });
  const all=exercises.flatMap(e=>e.sets),work=all.filter(working);
  return {
   status:live.status,name:live.name||'Active workout',paused:!!live.paused,elapsed:live.elapsed||0,
   exercises,selected:exercises.find(e=>e.name===requestedLift)||exercises[0]||null,
   sets:all.length,workingSets:work.length,warmupSets:all.length-work.length,
   volumeKg:volume(all),workingVolumeKg:volume(work),avgRpe:avgRpe(work),
   highEffort:work.filter(s=>s.rpe!=null&&s.rpe>=9).length
  };
 }
 global.SXLive=Object.freeze({summarise,working,bestEstimate,avgRpe});
})(window);
