/* Shared AscensionX six-week exercise selection.
 * Assistance ONLY: it never replaces classic top sets, back-downs, weeks or completed logs.
 * Deterministic choices preserve useful exercise continuity within a block.
 */
(function(root){
 'use strict';
 const QUAD_2=Object.freeze(['Bulgarian Split Squat','Leg Extension']);
 const BENCH=Object.freeze({
  strength:Object.freeze(['Iso-Lateral Row','Triceps Pushdown (Bar)','Rear Delt Reverse Fly','Lat Pulldown']),
  balanced:Object.freeze(['Iso-Lateral Row','Machine Chest Press','Rear Delt Reverse Fly','Triceps Pushdown (Bar)']),
  hypertrophy:Object.freeze(['Seated Cable Row','Machine Chest Press','Rear Delt Reverse Fly','Triceps Pushdown (Bar)'])
 });
 const FOUR_DAY=Object.freeze(['Pause Squat','Bench Press','Seated Cable Row',
  'Lateral Raise','Dumbbell Curl','Triceps Pushdown (Bar)']);
 function squat(week,quad){
  if(!Number.isInteger(Number(week))||week<1||week>5)return [];
  // Rotate to a less demanding isolation choice during the existing heavy weeks.
  return [quad==='Leg Press'?'Leg Press':'Hack Squat',week>=4?QUAD_2[1]:QUAD_2[0],
   '45° Back Extension','Cable Crunch'];
 }
 function bench(focus){
  return Array.from(BENCH[focus]||BENCH.strength);
 }
 function fourth({days,lifts,role,week,fatigue}={}){
  if(Number(days)!==4||!Array.isArray(lifts)||lifts.join('|')!==
   'Back Squat|Bench Press|Deadlift'||role!=='upper'||Number(week)>=6)return null;
  // If recent heavy leg sets warn of fatigue, do not add a second squat exposure.
  return (fatigue?.lower?FOUR_DAY.slice(1):FOUR_DAY).slice();
 }
 root.SXAscensionSelection=Object.freeze({squat,bench,fourth});
})(typeof window!=='undefined'?window:globalThis);
