/* Advisory only: no edits to loads, reps, RPE, or fixed strength plans. */
(function(root){
 'use strict';
 const number=v=>v==null||v===''?NaN:Number(v);
 const working=s=>s&&/^(?:working set|working|backdown set|b)$/i.test(String(s.type||'Working Set').trim());
 const valid=s=>working(s)&&s.done===true&&number(s.weight)>0&&Number.isInteger(number(s.reps))&&number(s.reps)>0&&number(s.rpe)>=6&&number(s.rpe)<=10;
 function context(ex){
  if(!ex||ex.ascensionLink||/static.?hold|isometric/i.test(String(ex.name||'')))return null;
  const notes=String(ex.notes||'');
  const legacy=/AscensionX (?:Adaptive Programming|Adaptive Substitute|Upper Assistance)/i.test(notes);
  const link=ex.sxStrengthSizeCompanion||ex.sxPowerbuildingSupport;
  if(link?.adaptive===false||(!link?.cycleId&&!legacy))return null;
  // Legacy imported assistance may retain its explicit prescription in notes.
  const range=notes.match(/(?:\b\d+\s*[×x]\s*)?(\d+)(?:\s*[–—-]\s*(\d+))?\s+reps\b/i);
  const week=number(link?.week??notes.match(/\bWeek\s+(\d+)\b/i)?.[1]);
  const min=number(link?.repsMin??range?.[1]),max=number(link?.repsMax??range?.[2]??range?.[1]);
  const target=number(link?.targetRpe??(link?.targetRir!=null?10-number(link.targetRir):link?.rir!=null?10-number(link.rir):notes.match(/Target RPE\s+(\d+(?:\.\d+)?)/i)?.[1]));
  if(!Number.isInteger(week)||week<1||week>5||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||!Number.isFinite(target)||target<6||target>9)return null;
  return {week,min,max,target,sets:Array.isArray(ex.sets)?ex.sets:[],
   prescribed: number(link?.prescribedReps),fixed:!!link?.fixedDeadliftRdl||number(link?.trainingMaxPercent)>0||
   /romanian deadlift|^rdl$/i.test(String(ex.name||'')),technical:/^(?:bench press|pause squat)$/i.test(String(ex.name||''))};
 }
 function at(ctx,index){
  const {sets,min,max,target,prescribed,fixed,technical}=ctx;
  const s=sets[index];if(!valid(s))return null;
  const weight=number(s.weight),reps=number(s.reps),rpe=number(s.rpe);
  const nextIndex=sets.findIndex((x,j)=>j>index&&working(x)&&x.done!==true);
  const next=nextIndex>=0?sets[nextIndex]:null;
  const nextReps=number(next?.reps);
  // Compare against the actual programmed rep target, not automatically the
  // upper end of its permitted range. Fixed RDLs keep their exact 8 reps.
  const goal=Number.isInteger(prescribed)&&prescribed>=min&&prescribed<=max?prescribed:
   Number.isInteger(nextReps)&&nextReps>=min&&nextReps<=max?nextReps:min;
  const show=(field,direction,title,detail)=>({index,nextIndex,field,direction,title,detail,weight,reps,rpe,target});
  if(rpe>target)return show('rpe','down','Consolidate effort',
   'Completed '+weight+' kg × '+reps+' at RPE '+rpe+' against target '+target+
   '. Retain this load and repetition target as a progression reference until RPE is at or below target. Do not force repetitions through pain or excessive fatigue.'+
   (rpe>=9||reps<min?' Stop or adjust the set if technique or safety deteriorates.':''));
  if(rpe>=target||reps<min)return null;
  if(reps>=goal)return show('weight','up','Consider increasing weight',
   'Completed '+weight+' kg × '+reps+' at RPE '+rpe+' (target '+target+'). Consider the next available increment only if technique and recovery permit.'+
   (fixed?' The programmed 45% training-max RDL remains unchanged; this is advice only, not a new cycle prescription.':technical?' Keep secondary technical work controlled; do not chase heavy sets.':'')+
   ' No values are changed automatically.');
  return show('reps','up','Consider increasing repetitions',
   'Consider reaching the prescribed '+goal+' reps at the current load if technique and effort permit. No values are changed automatically.');
 }
 function advise(ex){
  const ctx=context(ex);if(!ctx)return null;
  let index=-1;for(let i=0;i<ctx.sets.length;i++)if(valid(ctx.sets[i]))index=i;
  return index<0?null:at(ctx,index);
 }
 function indicators(ex){
  const ctx=context(ex);if(!ctx)return [];
  return ctx.sets.flatMap((s,index)=>{const a=at(ctx,index);return a?[a]:[]});
 }
 root.SXAdaptiveSetGuidance=Object.freeze({advise,indicators});
})(typeof window!=='undefined'?window:globalThis);
