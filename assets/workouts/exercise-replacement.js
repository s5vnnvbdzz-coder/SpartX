/* SpartanX active-session exercise replacement.
 * Replacements are explicit: no completed weights/reps/RPE transfer to a
 * different exercise. The rest timer and all other workout entries stay live.
 */
(function(global){
 'use strict';
 const clean=s=>String(s||'').trim();
 const filled=value=>value!==undefined&&value!==null&&value!==''&&Number(value)!==0;
 const norm=value=>clean(value).toLowerCase().replace(/[^a-z0-9]/g,'');
 const oldAdaptiveRow='Chest-Supported Row',newAdaptiveRow='Iso-Lateral Row';
 const isAdaptiveRowSwap=(exercise,nextName)=>!!(exercise?.sxStrengthSizeCompanion||exercise?.sxPowerbuildingSupport)&&
  norm(exercise?.name)===norm(oldAdaptiveRow)&&norm(nextName)===norm(newAdaptiveRow);
 function hasRecordedData(exercise){
  return (exercise?.sets||[]).some(s=>s.done===true||
   ['weight','reps','rpe','durationSeconds','distanceKm','floors','steps','calories']
    .some(field=>filled(s?.[field])));
 }
 function prepare(exercise,name,cardio){
  const nextName=clean(name);
  if(!exercise||!nextName||clean(exercise.name).toLowerCase()===nextName.toLowerCase())return null;
  const isCardio=!!cardio?.isCardio?.(nextName);
  const wasCardio=!!cardio?.isCardio?.(exercise.name);
  const oldSets=Array.isArray(exercise.sets)?exercise.sets:[];
  const keepAdaptivePrescription=!isCardio&&isAdaptiveRowSwap(exercise,nextName);
  // Preserve the planned number/type of sets for strength-to-strength swaps,
  // but never carry recorded performance over to the new movement.
  const sets=isCardio?[cardio.blank()]:wasCardio?
   Array.from({length:3},()=>({weight:'',reps:'',rpe:'',type:'Working Set',done:false})):
   (oldSets.length?oldSets:[{type:'Working Set'},{type:'Working Set'},{type:'Working Set'}])
    .map(s=>({weight:'',reps:'',rpe:'',
     type:s.type==='Warm-up'?'Warm-up':s.type==='Backdown Set'?'Backdown Set':
      s.type==='Failure Set'?'Failure Set':'Working Set',done:false}));
  if(keepAdaptivePrescription){
   const target=Number(exercise.sxStrengthSizeCompanion?.repsMin||
    exercise.sxPowerbuildingSupport?.repsMin)||8;
   sets.forEach((set,index)=>{
    if(set.type==='Warm-up')return;
    const oldReps=Number(oldSets[index]?.reps);
    set.reps=String(Number.isFinite(oldReps)&&oldReps>0?oldReps:target);
   });
  }
  const result={name:nextName,rest:Number(exercise.rest)||120,
   notes:keepAdaptivePrescription?clean(exercise.notes):'',
   replacementOf:clean(exercise.name),sets};
  // Bodybuilding replacements still satisfy the planned programme slot.
  // Adaptive progression separately checks the exercise's NAME to prevent
  // using the substitute's weights to progress the original movement.
  if(exercise.bodybuildingLink&&!isCardio){
   result.bodybuildingLink={...exercise.bodybuildingLink,substitutedFrom:clean(exercise.name)};
  }
  if(exercise.sxPowerbuildingSupport&&!isCardio)
   result.sxPowerbuildingSupport={...exercise.sxPowerbuildingSupport};
  if(exercise.sxStrengthSizeCompanion&&!isCardio)
   result.sxStrengthSizeCompanion={...exercise.sxStrengthSizeCompanion};
  // Never copy ascensionLink: that would mark a different exercise as a
  // completed main lift and could incorrectly advance the user's cycle.
  return {
   exercise:result,hadLoggedData:hasRecordedData(exercise),
   unlinksAscension:!!exercise.ascensionLink,
   unlinksBodybuilding:!!exercise.bodybuildingLink&&isCardio,
   source531:!!(exercise.notes&&/(?:Imported from SpartanX Tools|SpartanX cycle:)/.test(exercise.notes))
  };
 }
 // Repair only a verified, manually replaced AscensionX accessory in an ACTIVE
 // draft. Never touch completed sessions, unrelated rows or a main-lift link.
 // Keep every entered weight, rep, RPE, completion and rest interval intact.
 function repairActiveIsoLateralRows(work,adaptive){
  if(!Array.isArray(work))return 0;
  let changed=0;
  for(const exercise of work){
   if(!exercise||norm(exercise.name)!==norm(newAdaptiveRow)||
      norm(exercise.replacementOf)!==norm(oldAdaptiveRow))continue;
   const link=exercise.sxStrengthSizeCompanion||exercise.sxPowerbuildingSupport;
   if(!link||!Number.isInteger(Number(link.week))||
      Number(link.week)<1||Number(link.week)>6)continue;
   let planned=null;
   try{
    const cycle=adaptive?.activeCycle?.();
    if(cycle?.id===link.cycleId&&adaptive?.enabled?.(cycle.id)){
     if(exercise.sxStrengthSizeCompanion&&cycle.lifts.includes(link.lift)){
      planned=adaptive.plan(link.lift,Number(link.week)).find(e=>norm(e.name)===norm(newAdaptiveRow))||null;
     }else if(exercise.sxPowerbuildingSupport){
      const slots=adaptive.schedule(cycle)?.slots||[];
      const slot=slots.find(s=>s.kind==='support'&&s.day===link.day&&Number(s.week)===Number(link.week));
      planned=slot?.exercises.find(e=>norm(e.name)===norm(newAdaptiveRow))||null;
     }
    }
   }catch(_){}
   const min=Number(link.repsMin)||Number(planned?.min)||8;
   const max=Number(link.repsMax)||Number(planned?.max)||12;
   const rir=Number(exercise.sxStrengthSizeCompanion?link.targetRir:link.rir)||
     Number(planned?.rir)||3;
   let modified=false;
   if(!clean(exercise.notes)){
    exercise.notes=exercise.sxStrengthSizeCompanion?
     'AscensionX Adaptive Programming · '+link.lift+' · Week '+link.week+
     ' · '+min+'–'+max+' reps · ~'+rir+
     ' reps in reserve. Optional. Does not affect AscensionX cycle progression.':
     'Powerbuilding support · Week '+link.week+' · '+min+'–'+max+
     ' reps · '+rir+' RIR · Target RPE '+(10-rir);
    modified=true;
   }
   const sets=Array.isArray(exercise.sets)?exercise.sets:[];
   for(const set of sets){
    if(!set||set.done===true||set.type==='Warm-up'||clean(set.reps))continue;
    set.reps=String(min);modified=true;
   }
   // The standard three-set default applies to the old replacement only if
   // the current linked plan still prescribes it and no set is completed.
   const desired=Number(planned?.sets)||Number(link.plannedSets)||0;
   if(desired>sets.length&&desired<=5&&sets.length>0&&
      !sets.some(set=>set?.done===true)){
    for(let i=sets.length;i<desired;i++)
     sets.push({weight:'',reps:String(min),rpe:'',type:'Working Set',done:false});
    exercise.sets=sets;
    if(exercise.sxStrengthSizeCompanion)exercise.sxStrengthSizeCompanion.plannedSets=desired;
    modified=true;
   }
   if(modified)changed++;
  }
  return changed;
 }
 global.SpartanXExerciseReplacement=Object.freeze({prepare,hasRecordedData,repairActiveIsoLateralRows});
})(window);
