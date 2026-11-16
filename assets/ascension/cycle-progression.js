/* AscensionX: performance-gated, athlete-approved six-week TM progression.
 * Reviews logged main work only. Never modifies completed sessions.
 */
(function(global){
 'use strict';
 const STEPS={'Back Squat':5,'Bench Press':2.5,'Deadlift':5,'Overhead Press':2.5};
 const round=(n,step)=>Math.round(n/step)*step;
 const validRpe=r=>r!==null&&r!==undefined&&r!==''&&Number.isFinite(Number(r))&&Number(r)>=6&&Number(r)<=10;
 function latest(logs,lift,week){
  return (Array.isArray(logs)?logs:[]).filter(x=>x?.lift===lift&&Number(x.week)===week)
   .sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0))[0]||null;
 }
 function reviewLift(lift,logs,plan){
  const full=STEPS[lift]||0;
  if(!full)return null;
  const weeks=[1,2,3,4,5].map(w=>latest(logs,lift,w));
  const completed=weeks.filter(x=>x?.setsComplete===true).length;
  const done6=latest(logs,lift,6)?.setsComplete===true;
  const missed=5-completed;
  const effort=weeks.map((log,i)=>({
   target:Number(plan?.[i]?.rpe)||8,
   actual:validRpe(log?.sets?.[0]?.rpe)?Number(log.sets[0].rpe):
    validRpe(log?.avgRpe)?Number(log.avgRpe):null
  }));
  const known=effort.filter(x=>x.actual!==null);
  const high=known.filter(x=>x.actual>=9.5||x.actual>x.target+0.75).length;
  const hard=known.filter(x=>x.actual>x.target+0.5).length;
  let delta=full,level='progress',reason='All five loading weeks completed without excessive recorded effort.';
  if(missed>=2){
   delta=null;level='reduce';
   reason=missed+' loading weeks have incomplete prescribed work. Review technique and reduce the training max before repeating.';
  }else if(missed===1){
   delta=0;level='hold';reason='A loading week is incomplete; maintain the training max before another progression.';
  }else if(high>=2||effort[4].actual>=9.5){
   delta=0;level='hold';reason='Repeated very high effort or an excessively hard Week 5: prioritise recovery.';
  }else if(hard>0){
   delta=full>=5?2.5:0;level=delta?'cautious':'hold';
   reason='The prescribed work was completed but recorded RPE exceeded planned effort.';
  }
  if(level==='progress'&&known.length<3)reason+=' RPE data are limited; confirm technique and recovery before approval.';
  return {lift,done6,completed,missing:missed,knownRpe:known.length,
   highEffort:high,level,delta,standard:full,reason};
 }
 function review(cycle,logs,plan){
  const lifts=(Array.isArray(cycle?.exercises)?cycle.exercises:[]).filter(x=>STEPS[x]);
  const cycleId=cycle?.created;
  const start=Date.parse(cycleId||'');
  const current=(Array.isArray(logs)?logs:[]).filter(log=>
   log?.cycleId?log.cycleId===cycleId:
    Number.isFinite(start)&&(Date.parse(log?.date||'')||0)>=start);
  const results=lifts.map(l=>reviewLift(l,current,plan));
  return {ready:!!cycleId&&!!lifts.length&&results.every(r=>r.done6),
   cycleId,lifts:results,total:lifts.length,finished:results.filter(r=>r.done6).length};
 }
 function choices(lift,tm,step=2.5){
  const full=STEPS[lift]||2.5,rounding=Number(step)>0?Number(step):2.5;
  const reduction=-Math.max(rounding,round(Number(tm)*0.025,rounding));
  const deltas=[full,...(full>=5?[2.5]:[]),0,reduction];
  return [...new Set(deltas)].map(delta=>({delta,label:delta>0?'+'+delta+' kg':delta===0?'Hold TM':'Reduce '+Math.abs(delta)+' kg'}));
 }
 global.SXAscensionProgression=Object.freeze({STEPS,reviewLift,review,choices});
})(window);
