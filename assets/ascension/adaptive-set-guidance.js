/* Live advice only. No storage writes, no load/repetition/RPE mutations. */
(function(root){
 'use strict';
 const number=v=>v==null||v===''?NaN:Number(v);
 const working=s=>s&&/^(?:working set|working|backdown set|b)$/i.test(String(s.type||'Working Set'));
 const valid=s=>working(s)&&s.done===true&&number(s.weight)>0&&Number.isInteger(number(s.reps))&&number(s.reps)>0&&number(s.rpe)>=6&&number(s.rpe)<=10;
 function context(ex){
  const link=ex?.sxStrengthSizeCompanion||ex?.sxPowerbuildingSupport;
  if(!link?.cycleId||link.adaptive===false||ex.ascensionLink||link.fixedDeadliftRdl||Number(link.trainingMaxPercent)>0||
     /^(?:bench press|pause squat|romanian deadlift|bench press static hold)$/i.test(String(ex.name||'')))return null;
  const week=number(link.week),min=number(link.repsMin),max=number(link.repsMax),target=number(link.targetRpe??(10-number(link.rir)));
  if(!Number.isInteger(week)||week<1||week>5||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||!Number.isFinite(target)||target<6||target>9)return null;
  return {week,min,max,target,sets:Array.isArray(ex.sets)?ex.sets:[]};
 }
 function advise(ex){
  const ctx=context(ex);if(!ctx)return null;
  const {week,min,max,target,sets}=ctx;
  const index=sets.findIndex(s=>working(s)&&s.done!==true);
  if(index<1||sets.slice(index+1).some(s=>s.done===true))return null;
  const completed=sets.slice(0,index).filter(working);
  const last=completed.at(-1);
  if(!valid(last))return null;
  const weight=number(last.weight),reps=number(last.reps),rpe=number(last.rpe);
  const high=rpe>target;
  const show=(field,direction,title,detail)=>({index:sets.indexOf(last),nextIndex:index,field,direction,title,detail,weight,reps,rpe,target});
  if(high)return show('rpe','down','Consolidate effort','Keep '+weight+' kg as your progression reference. Work towards RPE '+target+' at comparable repetitions across sessions; do not force lower RPE immediately or push through pain or excessive fatigue. No further increase advised.'+(rpe>=9||reps<min?' Stop or adjust the set if technique or safety deteriorates.':''));
  // In heavy weeks only the first completed assistance set may prompt an increase.
  if((week>=4&&completed.length>1)||rpe>target-1||reps<min||completed.slice(0,-1).some(s=>valid(s)&&number(s.rpe)>target))return null;
  // A changed next-set value is an athlete decision, not an invitation to stack increases.
  const next=sets[index],nw=number(next.weight),nr=number(next.reps);
  if(Number.isFinite(nw)&&nw>weight||Number.isFinite(nr)&&nr>reps)return null;
  if(reps>=max)return show('weight','up','Consider increasing weight','You achieved '+weight+' kg × '+reps+' at RPE '+rpe+' (target '+target+'). Consider the next available equipment increment if comfortable; you choose the load.');
  return show('reps','up','Consider increasing repetitions','At '+weight+' kg, consider one more repetition within the '+min+'–'+max+' target range if technique and effort permit. Keep the load unchanged.');
 }
 // Red means effort is ABOVE target and needs consolidation; it is not an achievement.
 function indicators(ex){
  const ctx=context(ex);if(!ctx)return [];
  const {sets,target}=ctx;
  const result=sets.flatMap((set,index)=>valid(set)&&number(set.rpe)>target?[{
   index,field:'rpe',direction:'down',title:'Consolidate effort',
   detail:'Completed '+number(set.weight)+' kg × '+number(set.reps)+' at RPE '+number(set.rpe)+' against target RPE '+target+
    '. Retain this weight and repetition target as a progression reference until RPE is at or below target. Do not force repetitions through pain or excessive fatigue.'
  }]:[]);
  const advice=advise(ex);
  if(advice?.direction==='up')result.push(advice);
  return result;
 }
 root.SXAdaptiveSetGuidance=Object.freeze({advise,indicators});
})(typeof window!=='undefined'?window:globalThis);
