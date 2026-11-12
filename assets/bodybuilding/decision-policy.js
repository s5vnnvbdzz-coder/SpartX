/* SpartanX Programme Decision Policy v2.
 * Pure, read-only interpretation of linked programme evidence. Only the next
 * accessory/workout plan may be recommended, never automatic AscensionX edits.
 * There are no timers, persistence, network requests or silent data changes.
 */
(function(global){
 'use strict';
 const norm=s=>String(s||'').trim();
 const bounded=(x,a,b)=>Math.max(a,Math.min(b,Number(x)||0));
 function powerbuilding(report){
  if(!report||report.status==='no-cycle')return {status:'no-cycle',decisions:[],summary:'Connect an active AscensionX cycle to enable decisions.'};
  const decisions=(report.lifts||[]).map(l=>{
   const weeks=Number(l.recordedWeeks)||0;
   const last=l.latest,confidence=weeks<2?'insufficient':weeks<4?'early':'developing';
   let action='collect',severity='neutral',title='Keep planned main lift',details='',accessorySetsDelta=0;
   if(weeks===0){
    details='No completed cycle-linked working sets found. Continue the programmed AscensionX session and record actual loads, reps and RPE.';
   }else if(weeks===1){
    details='Only one linked week is available. Follow the next prescribed AscensionX session; gather more evidence before adjusting accessories.';
   }else if(l.status==='caution'){
    action='review-reduction';severity='caution';title='Review accessory fatigue';
    accessorySetsDelta=-1;
    details='Two high-effort linked weeks and a lower estimated top-set strength were observed. Consider removing one hard accessory set in the same movement pattern, not reducing the AscensionX main lift.';
   }else if(l.status==='watch'){
    action='hold-accessories';severity='watch';title='Hold accessory volume';
    details='Estimated top-set strength is lower across linked weeks. Do not add accessory sets; compare session effort and recovery before making a larger change.';
   }else if(l.status==='positive'&&weeks>=3&&last?.avgRpe!=null&&last.avgRpe<=8){
    action='progress-accessories';severity='positive';title='Accessories may progress';
    details='Multiple linked weeks show encouraging strength estimates with manageable RPE. Progress an accessory only when its own rep and effort targets are met; keep AscensionX working weights unchanged.';
   }else{
    action='maintain';severity='steady';title='Maintain supporting workload';
    details='Evidence does not justify a change. Continue planned sets and record RPE; a small change in estimated strength is not a reliable recovery verdict.';
   }
   if(weeks>=2&&last?.avgRpe==null){
    if(action==='progress-accessories')action='maintain';
    details+=' RPE is missing from the latest linked session; avoid increasing assistance on estimated strength alone.';
   }
   return {lift:l.lift,cycleWeek:l.week,completedWeeks:weeks,confidence,action,severity,title,details,
    accessorySetsDelta,mainLiftAction:'preserve',mainLiftProtected:true,automatic:false};
  });
  const review=decisions.filter(d=>d.action==='review-reduction'||d.action==='hold-accessories');
  const progression=decisions.filter(d=>d.action==='progress-accessories');
  return {status:report.status,decisions,
   summary:review.length?'Fatigue or performance signals warrant accessory review; strength prescriptions stay protected.':
    progression.length?'Some accessory progression may be appropriate after confirming individual rep targets.':
    'Continue the current strength wave and accumulate linked working-set evidence.',
   readOnly:true};
 }
 function bodybuilding(report){
  if(!report||report.status==='no-programme')return {status:'no-programme',decisions:[],review:{due:false}};
  const decisions=(report.decisions||[]).map(d=>{
   const samples=Number(d.observations)||0;
   const note=norm(d.reason);
   const hard=/difficult sessions|load reduction|reassess recovery/i.test(note);
   const progress=/upper rep target|progress|increase/i.test(note)&&!/hold load/i.test(note);
   let action='collect',title='Collect linked sets',severity='neutral';
   if(samples>=2&&hard){action='review-load';title='Review the prescribed load';severity='caution'}
   else if(samples>=2&&progress){action='review-progress';title='Check progression targets';severity='positive'}
   else if(samples>=2){action='maintain';title='Maintain planned work';severity='steady'}
   else if(samples===1){action='maintain';title='Establish a second exposure';}
   return {exercise:d.exercise,day:d.day,week:d.week,observations:samples,action,title,severity,
    details:note||'Complete linked training sets before changing the prescription.',
    suggestedKg:d.prescribedKg??null,automatic:false};
  });
  const needsReview=decisions.filter(d=>d.action==='review-load');
  const candidates=decisions.filter(d=>d.action==='review-progress');
  const review={due:report.review?.due===true,period:report.review?{
    start:report.review.start,end:report.review.end,completed:report.review.completedBlockSessions,
    total:report.review.blockSessions}:null,
   recommendation:report.review?.due===true?
    'Four-week review available: retain exercises that are progressing. Consider substitutions only for repeatedly unproductive exercises after checking technique, recovery and available equipment. Review changes before saving.':
    'Continue linked training until the next complete four-week block; changes to exercise selection are not yet justified.',
   reviewExerciseNames:report.review?.due===true?needsReview.map(d=>d.exercise):[],
   preserveExerciseNames:candidates.map(d=>d.exercise)};
  return {status:report.status,decisions,review,readOnly:true,
   summary:report.sessions+' saved linked session(s); standalone workouts excluded.'};
 }
 function evaluate(snapshot){
  return {powerbuilding:powerbuilding(snapshot?.ascension),bodybuilding:bodybuilding(snapshot?.bodybuilding),
   safeguards:{mainLiftsPreserved:true,savedHistoryUnchanged:true,
    standaloneExcluded:true,needsApprovalForStructuralEdits:true}};
 }
 global.SXDecisionPolicy=Object.freeze({powerbuilding,bodybuilding,evaluate});
})(window);
