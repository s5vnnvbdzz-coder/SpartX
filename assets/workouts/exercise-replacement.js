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
 const pushdownNames=new Set(['Triceps Pushdown','Triceps Pushdown (Bar)','Triceps Pushdown (Rope)'].map(norm));
 const isAdaptivePushdownSwap=(exercise,nextName)=>
  !!(exercise?.sxStrengthSizeCompanion||exercise?.sxPowerbuildingSupport)&&
  pushdownNames.has(norm(exercise?.name))&&pushdownNames.has(norm(nextName));
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
  const keepAdaptivePrescription=!isCardio&&(isAdaptiveRowSwap(exercise,nextName)||isAdaptivePushdownSwap(exercise,nextName));
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
   // The current linked prescription applies to the old replacement only if
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
 // Update only active AscensionX-linked generic pushdowns to the specific
 // bar attachment. Preserve every set and programme link by renaming in place.
 // Historical sessions and unlinked/manual movements remain unchanged.
 function renameActiveAscensionPushdowns(work,adaptive){
  if(!Array.isArray(work))return 0;
  let cycle=null;
  try{cycle=adaptive?.activeCycle?.()}catch(_){}
  if(!cycle?.id)return 0;
  let changed=0;
  for(const exercise of work){
   if(!exercise||norm(exercise.name)!==norm('Triceps Pushdown')||
      clean(exercise.replacementOf)||exercise.ascensionLink)continue;
   const linked=exercise.sxStrengthSizeCompanion||exercise.sxPowerbuildingSupport;
   const week=Number(linked?.week);
   if(!linked||linked.cycleId!==cycle.id||!Number.isInteger(week)||week<1||week>6)continue;
   if(exercise.sxStrengthSizeCompanion){
    if(!Array.isArray(cycle.lifts)||!cycle.lifts.includes(linked.lift))continue;
   }else if(!clean(linked.day))continue;
   exercise.name='Triceps Pushdown (Bar)';
   changed++;
  }
  return changed;
 }
 // Apply the current cycle's rear-delt programme selection to a restored
 // active AscensionX support entry. Both the original Rear Delt Fly and the
 // short-lived Iso Rear Delt Fly programme version need a safe migration.
 // Never reinterpret finished sets as a different exercise.
 function renameActiveAscensionRearDelts(work,adaptive){
  if(!Array.isArray(work))return 0;
  let cycle=null;
  try{cycle=adaptive?.activeCycle?.()}catch(_){}
  if(!cycle?.id||!Array.isArray(cycle.lifts))return 0;
  const oldNames=new Set(['Rear Delt Fly','Iso Rear Delt Fly'].map(norm));
  const newName='Rear Delt Reverse Fly';
  let changed=0;
  for(const exercise of work){
   if(!exercise||!oldNames.has(norm(exercise.name))||
      exercise.ascensionLink||exercise.bodybuildingLink)continue;
   // Preserve deliberate substitutions, except an Iso swap directly from
   // the previous programme's Rear Delt Fly.
   const replaced=norm(exercise.replacementOf);
   if(replaced&&!(norm(exercise.name)===norm('Iso Rear Delt Fly')&&
      replaced===norm('Rear Delt Fly')))continue;
   const link=exercise.sxStrengthSizeCompanion;
   const week=Number(link?.week);
   if(!link||link.cycleId!==cycle.id||!cycle.lifts.includes(link.lift)||
      !Number.isInteger(week)||week<1||week>6)continue;
   let prescription=null;
   try{
    if(!adaptive?.enabled?.(cycle.id))continue;
    prescription=adaptive.plan(link.lift,week).find(p=>norm(p.name)===norm(newName));
   }catch(_){continue}
   if(!prescription)continue;
   if((exercise.sets||[]).some(set=>set?.done===true))continue;
   // Rename in place: set quantities, entered values, rest, RIR guidance,
   // the cycle/bench linkage and other exercises are all left untouched.
   exercise.name=newName;
   changed++;
  }
  return changed;
 }
 // Upgrade only an untouched, imported support-day Machine Chest Press
 // draft to the new Bench Press assistance prescription. Never transfer
 // any recorded machine load, reps or RPE to a barbell exercise.
 function upgradeUntouchedSupportBench(work,adaptive){
  if(!Array.isArray(work)||!adaptive?.activeCycle||!adaptive?.enabled)return 0;
  let cycle=null,schedule=null;
  try{
   cycle=adaptive.activeCycle();
   if(!cycle?.id||!adaptive.enabled(cycle.id))return 0;
   schedule=adaptive.schedule(cycle);
  }catch(_){return 0}
  if(!schedule?.valid)return 0;
  let changed=0;
  for(const ex of work){
   if(!ex||norm(ex.name)!==norm('Machine Chest Press')||
      ex.ascensionLink||ex.bodybuildingLink||clean(ex.replacementOf))continue;
   const link=ex.sxPowerbuildingSupport;
   const week=Number(link?.week);
   if(!link||link.cycleId!==cycle.id||!clean(link.day)||
      !Number.isInteger(week)||week<1||week>5)continue;
   const slot=schedule.slots?.find(x=>x.kind==='support'&&
    x.day===link.day&&Number(x.week)===week);
   const planned=slot?.exercises?.find(x=>norm(x.name)===norm('Bench Press'));
   if(!planned)continue;
   const sets=ex.sets;
   const original=Number(link.plannedSets),minimum=Number(link.repsMin);
   if(!Array.isArray(sets)||sets.length!==original||
      !Number.isInteger(minimum)||minimum<1||
      !sets.every(set=>set&&set.done===false&&
       String(set.type||'Working Set')==='Working Set'&&
       !filled(set.weight)&&!filled(set.rpe)&&Number(set.reps)===minimum))continue;
   ex.name='Bench Press';
   ex.rest=planned.rest||150;
   ex.sets=Array.from({length:planned.sets},()=>({
    weight:'',reps:String(planned.min),rpe:'',type:'Working Set',done:false
   }));
   ex.notes='AscensionX Upper Assistance · Week '+week+
    ' · '+planned.min+'–'+planned.max+' reps · Target RPE '+
    (planned.targetRpe??10-planned.rir)+'. Technique-focused bench volume, not a main-lift top set.';
   link.repsMin=planned.min;
   link.repsMax=planned.max;
   link.rir=planned.rir;
   link.plannedSets=planned.sets;
   changed++;
  }
  return changed;
 }
 // Align ONLY untouched active, imported AscensionX support rows with a new
 // prescription after the athlete updates the app. Saved sessions, individual
 // edited sets and completed exercises are never rewritten.
 function refreshUntouchedAdaptiveSets(work,adaptive){
  if(!Array.isArray(work)||!adaptive?.activeCycle||!adaptive?.enabled)return 0;
  let cycle=null;
  try{cycle=adaptive.activeCycle()}catch(_){return 0}
  if(!cycle?.id||!adaptive.enabled(cycle.id))return 0;
  let changed=0;
  for(const ex of work){
   if(!ex||ex.ascensionLink||ex.bodybuildingLink||clean(ex.replacementOf))continue;
   const link=ex.sxStrengthSizeCompanion||ex.sxPowerbuildingSupport;
   const week=Number(link?.week),prior=Number(link?.plannedSets);
   const sets=ex.sets;
   if(!link||link.cycleId!==cycle.id||!Number.isInteger(week)||
      week<1||week>6||!Array.isArray(sets)||!sets.length||
      !Number.isInteger(prior)||prior<1||sets.length!==prior)continue;
   // A prefilled load or changed reps could represent an athlete decision:
   // preserve every such row, including unsaved work and replacement rows.
   const initialReps=Number(link.repsMin);
   if(!Number.isInteger(initialReps)||initialReps<1||!sets.every(s=>
     s&&s.done===false&&String(s.type||'Working Set')==='Working Set'&&
     !filled(s.weight)&&!filled(s.rpe)&&Number(s.reps)===initialReps))continue;
   let planned=null;
   try{
    if(ex.sxStrengthSizeCompanion&&cycle.lifts.includes(link.lift)){
     planned=adaptive.plan(link.lift,week).find(p=>norm(p.name)===norm(ex.name))||null;
    }else if(ex.sxPowerbuildingSupport){
     const slot=adaptive.schedule(cycle)?.slots?.find(s=>
      s.kind==='support'&&s.day===link.day&&Number(s.week)===week);
     planned=slot?.exercises.find(p=>norm(p.name)===norm(ex.name))||null;
    }
   }catch(_){continue}
   const desired=Number(planned?.sets);
   if(!Number.isInteger(desired)||desired<=prior||desired>4)continue;
   for(let i=prior;i<desired;i++)sets.push({
    weight:'',reps:String(initialReps),rpe:'',type:'Working Set',done:false
   });
   link.plannedSets=desired;changed++;
  }
  return changed;
 }
 global.SpartanXExerciseReplacement=Object.freeze({
  prepare,hasRecordedData,repairActiveIsoLateralRows,
  renameActiveAscensionPushdowns,renameActiveAscensionRearDelts,
  upgradeUntouchedSupportBench,refreshUntouchedAdaptiveSets
 });
})(window);
