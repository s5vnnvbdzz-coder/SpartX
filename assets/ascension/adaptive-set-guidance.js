/* Advisory only: no edits to loads, reps, RPE, or fixed strength plans. */
(function(root){
 'use strict';
 const number=v=>v==null||v===''?NaN:Number(v);
 const working=s=>s&&/^(?:working set|working|backdown set|b)$/i.test(String(s.type||'Working Set').trim());
 const valid=s=>working(s)&&s.done===true&&number(s.weight)>=0&&Number.isInteger(number(s.reps))&&number(s.reps)>0&&number(s.rpe)>=6&&number(s.rpe)<=10;
 // Only the actual programmed main lifts belong to cycle Intelligence.
 const mainLift=name=>/^(?:(?:barbell )?(?:back )?squat|(?:barbell )?bench(?: press)?|(?:(?:conventional|sumo|barbell) )?deadlift|(?:standing |barbell )?overhead press|ohp|military press)(?:\s*[·-]\s*bbb)?$/i.test(String(name||'').trim());
 function context(ex){
  if(!ex||ex.ascensionLink||/static.?hold|isometric/i.test(String(ex.name||'')))return null;
  const notes=String(ex.notes||'');
  const legacy=/AscensionX (?:Adaptive Programming|Adaptive Substitute|Upper Assistance)/i.test(notes);
  const link=ex.sxStrengthSizeCompanion||ex.sxPowerbuildingSupport||ex.bodybuildingLink||ex.programmeLink||ex.programLink;
  const programmed=!!link||legacy||/(?:SpartanX cycle:|Imported from (?:AscensionX|5\/3\/1|SpartanX Tools)|BBB supplemental work|Bodybuilding ·|Powerbuilding support ·)/i.test(notes);
  if(mainLift(ex.name)&&programmed)return null;
  const range=notes.match(/(?:\b\d+\s*[×x]\s*)?(\d+)(?:\s*[–—-]\s*(\d+))?\s+reps\b/i);
  const week=number(link?.week??notes.match(/\bWeek\s+(\d+)\b/i)?.[1]);
  const rawMin=number(link?.repsMin??range?.[1]),rawMax=number(link?.repsMax??range?.[2]??range?.[1]);
  const bounded=Number.isInteger(rawMin)&&Number.isInteger(rawMax)&&rawMin>=1&&rawMax>=rawMin;
  const noteTarget=number(notes.match(/(?:Target RPE|RPE target)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1]);
  const target=number(link?.targetRpe??(link?.targetRir!=null?10-number(link.targetRir):link?.rir!=null?10-number(link.rir):noteTarget));
  const hasTarget=Number.isFinite(target)&&target>=6&&target<=9;
  return {week,min:bounded?rawMin:null,max:bounded?rawMax:null,target:hasTarget?target:null,sets:Array.isArray(ex.sets)?ex.sets:[],
   prescribed:number(link?.prescribedReps),fixed:!!link?.fixedDeadliftRdl||number(link?.trainingMaxPercent)>0,
   technical:/^(?:bench press|pause squat|paused squat)$/i.test(String(ex.name||'')),
   recovery:/\b(?:deload|recovery week|taper)\b/i.test(notes)||(legacy&&week===6)||link?.adaptive===false};
 }
 function at(ctx,index,reference){
  const {sets,min,max,target,prescribed,fixed,technical,recovery}=ctx;
  const s=sets[index];if(!valid(s))return null;
  const weight=number(s.weight),reps=number(s.reps),rpe=number(s.rpe);
  const nextIndex=sets.findIndex((x,j)=>j>index&&working(x)&&x.done!==true);
  const next=nextIndex>=0?sets[nextIndex]:null;
  const nextReps=number(next?.reps);
  // Compare against the actual programmed rep target, not automatically the
  // upper end of its permitted range. Fixed RDLs keep their exact 8 reps.
  const goal=min!==null?(Number.isInteger(prescribed)&&prescribed>=min&&prescribed<=max?prescribed:
   Number.isInteger(nextReps)&&nextReps>=min&&nextReps<=max?nextReps:min):null;
  const previous=typeof reference==='function'?reference(s,index):null;
  const oldRpe=number(previous?.rpe);
  const comparable=Number.isFinite(oldRpe)&&oldRpe>=6&&oldRpe<=10&&number(previous?.weight).toFixed(1)===weight.toFixed(1)&&number(previous?.reps)===reps;
  const improved=comparable&&rpe<oldRpe;
  const show=(field,direction,title,detail,tone=direction==='up'?'positive':'negative')=>({index,nextIndex,field,direction,title,detail,tone,weight,reps,rpe,target,previousRpe:comparable?oldRpe:null});
  // Without an explicit prescription, compare performance only. Do not invent
  // an RPE or rep target or infer that an increase is appropriate.
  if(target===null||recovery){
   if(!comparable||rpe===oldRpe)return null;
   const reason=recovery?' Recovery prescription: do not increase load.':' No explicit RPE target is recorded; this is a performance comparison only.';
   return show('rpe','down',improved?'RPE improved — maintain load':'RPE increased — review effort',
    'Same '+weight+' kg × '+reps+' at RPE '+rpe+' versus previous '+oldRpe+'. '+(improved?'Effort improved by ':'Effort increased by ')+Math.abs(rpe-oldRpe).toFixed(1)+' RPE.'+reason+' No values are changed automatically.',improved?'positive':'negative');
  }
  if(improved&&rpe>=target&&rpe<9.5)return show('rpe','down','RPE improved — maintain load',
   'Same '+weight+' kg × '+reps+' at RPE '+rpe+' versus previous '+oldRpe+'. Effort improved by '+(oldRpe-rpe).toFixed(1)+' RPE. '+(rpe>target?'Target '+target+' has not yet been reached. Keep this load and reps while consolidating.':'Target '+target+' reached. Maintain the load until effort is below target before considering an increase.')+' No values are changed automatically.','positive');
  if(rpe>target)return show('rpe','down','Consolidate effort',
   'Completed '+weight+' kg × '+reps+' at RPE '+rpe+' against target '+target+
   '. Retain this load and repetition target as a progression reference until RPE is at or below target. Do not force repetitions through pain or excessive fatigue.'+
   (rpe>=9||reps<min?' Stop or adjust the set if technique or safety deteriorates.':''));
  if(rpe>=target||(min!==null&&reps<min))return null;
  if(goal===null)return improved?show('rpe','down','RPE improved — maintain load','Effort improved at the same load and repetitions. No prescribed repetition target is available; maintain the load or set a rep target before progressing.','positive'):null;
  if(reps>=goal&&weight>0)return show('weight','up','Consider increasing weight',
   'Completed '+weight+' kg × '+reps+' at RPE '+rpe+' (target '+target+'). Consider the next available increment only if technique and recovery permit.'+
   (fixed?' The programmed 45% training-max RDL remains unchanged; this is advice only, not a new cycle prescription.':technical?' Keep secondary technical work controlled; do not chase heavy sets.':'')+
   ' No values are changed automatically.');
  if(reps>=goal)return improved?show('rpe','down','RPE improved — maintain effort','Same bodyweight exercise and repetitions felt easier. No external weight increase is prescribed.','positive'):null;
  return show('reps','up','Consider increasing repetitions',
   'Consider reaching the prescribed '+goal+' reps at the current load if technique and effort permit. No values are changed automatically.');
 }
 function advise(ex,reference){
  const ctx=context(ex);if(!ctx)return null;
  let index=-1;for(let i=0;i<ctx.sets.length;i++)if(valid(ctx.sets[i]))index=i;
  return index<0?null:at(ctx,index,reference);
 }
 function indicators(ex,reference){
  const ctx=context(ex);if(!ctx)return [];
  return ctx.sets.flatMap((s,index)=>{const a=at(ctx,index,reference);return a?[a]:[]});
 }
 root.SXAdaptiveSetGuidance=Object.freeze({advise,indicators});
})(typeof window!=='undefined'?window:globalThis);
