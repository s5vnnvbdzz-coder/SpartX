/* AscensionX main-lift load reconciliation.
 * Workouts imported into SpartanX are immutable history. This calculator
 * compares the latest completed cycle-linked lift to TODAY's calculated
 * template, and prevents a sudden leap when the former is lighter.
 * No cycle training maxes, saved sessions or workout weeks are mutated.
 */
(function(global){
 'use strict';
 const value=x=>Number(x);
 const round=(n,step)=>Math.round(n/step)*step;
 const capDown=(n,step)=>Math.floor((n+1e-7)/step)*step;
 const valid=x=>Number.isFinite(value(x))&&value(x)>0;
 function fromLogs(lift,week,id,logs){
  const items=(Array.isArray(logs)?logs:[])
   .filter(x=>x?.cycleId===id&&x.lift===lift&&
     Number.isInteger(Number(x.week))&&Number(x.week)<week&&
     Number(x.week)>=1&&x.setsComplete===true&&valid(x.topWeight));
  items.sort((a,b)=>Number(a.week)-Number(b.week)||
    (Date.parse(a.date)||0)-(Date.parse(b.date)||0));
  const last=items[items.length-1];
  if(!last)return null;
  const other=(last.sets||[]).slice(1).map(x=>value(x.weight)).filter(valid);
  return {week:Number(last.week),top:value(last.topWeight),
   back:other.length?Math.min(...other):null,from:'AscensionX'};
 }
 function fromSpartan(lift,week,id,sessions){
  const matches=[];
  for(const session of Array.isArray(sessions)?sessions.slice(-500):[]){
   for(const ex of Array.isArray(session?.exercises)?session.exercises:[]){
    const link=ex?.ascensionLink;
    if(link?.cycleId!==id||link.lift!==lift||!Number.isInteger(Number(link.week))||
       Number(link.week)<1||Number(link.week)>=week||!Array.isArray(link.plannedSets))continue;
    const working=(ex.sets||[]).filter(set=>set?.type==='Working Set');
    if(working.length!==link.plannedSets.length||!working.length||
      !working.every((set,i)=>set.done===true&&valid(set.weight)&&
        Number(set.reps)>=Number(link.plannedSets[i].reps)&&
        Number(set.weight)>=Number(link.plannedSets[i].weight)-0.01))continue;
    const other=working.slice(1).map(set=>value(set.weight)).filter(valid);
    matches.push({week:Number(link.week),top:value(working[0].weight),
      back:other.length?Math.min(...other):null,from:'SpartanX',
      when:Date.parse(session.date)||0});
   }
  }
  matches.sort((a,b)=>a.week-b.week||a.when-b.when);
  return matches[matches.length-1]||null;
 }
 function reconcile(input){
  const {lift,week,trainingMax,rounding=2.5,plan,cycleId,logs,sessions}=input||{};
  const w=Number(week),step=Number(rounding),tm=Number(trainingMax);
  if(!Array.isArray(plan)||!Number.isInteger(w)||w<1||w>plan.length||
     !Number.isFinite(tm)||tm<=0||!Number.isFinite(step)||step<=0)return null;
  const p=plan[w-1];
  const nominalTop=round(tm*p.topPct/100,step);
  const nominalBack=p.backPct==null?null:round(tm*p.backPct/100,step);
  const result={topLoad:nominalTop,backLoad:nominalBack,nominalTop,nominalBack,
   adjusted:false,sourceWeek:null,sourceTop:null,sourceBack:null,projected:false,
   changeKg:0};
  if(w===1||p.deload||!cycleId)return result;
  const history=fromLogs(lift,w,cycleId,logs);
  const source=history||fromSpartan(lift,w,cycleId,
   typeof sessions==='function'?sessions():sessions);
  if(!source)return result;
  const previousPlan=plan[source.week-1];
  if(!previousPlan||previousPlan.deload)return result;
  const previousNominal=round(tm*previousPlan.topPct/100,step);
  const discrepancy=previousNominal-source.top;
  // A normal successful programme increment should not be rewritten.
  // Require a material mismatch (at least one rounding increment).
  if(discrepancy<step-1e-7)return result;
  const maxPerWeek=/^(?:Bench Press|Overhead Press)$/.test(lift)?2.5:5;
  const delta=w-source.week;
  const topCap=capDown(source.top+maxPerWeek*delta,step);
  if(topCap>=nominalTop)return result;
  const nextTop=Math.max(step,topCap);
  const byRatio=nominalBack===null?null:
    round(nextTop*p.backPct/p.topPct,step);
  const backCap=source.back===null?Infinity:
    capDown(source.back+maxPerWeek*delta,step);
  const nextBack=byRatio===null?null:
    Math.max(step,Math.min(nominalBack,byRatio,backCap,nextTop));
  return {...result,topLoad:nextTop,backLoad:nextBack,adjusted:true,
   sourceWeek:source.week,sourceTop:source.top,sourceBack:source.back,
   projected:delta>1,changeKg:nextTop-source.top,
   currentPreviousNominal:previousNominal};
 }
 global.SXAscensionLoadGuard=Object.freeze({reconcile});
})(window);
