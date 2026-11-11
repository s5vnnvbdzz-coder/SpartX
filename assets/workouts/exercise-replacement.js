/* SpartanX active-session exercise replacement.
 * Replacements are explicit: no completed weights/reps/RPE transfer to a
 * different exercise. The rest timer and all other workout entries stay live.
 */
(function(global){
 'use strict';
 const clean=s=>String(s||'').trim();
 const filled=value=>value!==undefined&&value!==null&&value!==''&&Number(value)!==0;
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
  // Preserve the planned number/type of sets for strength-to-strength swaps,
  // but never carry recorded performance over to the new movement.
  const sets=isCardio?[cardio.blank()]:wasCardio?
   Array.from({length:3},()=>({weight:'',reps:'',rpe:'',type:'Working Set',done:false})):
   (oldSets.length?oldSets:[{type:'Working Set'},{type:'Working Set'},{type:'Working Set'}])
    .map(s=>({weight:'',reps:'',rpe:'',
     type:s.type==='Warm-up'?'Warm-up':s.type==='Backdown Set'?'Backdown Set':
      s.type==='Failure Set'?'Failure Set':'Working Set',done:false}));
  const result={name:nextName,rest:Number(exercise.rest)||120,notes:'',
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
 global.SpartanXExerciseReplacement=Object.freeze({prepare,hasRecordedData});
})(window);
