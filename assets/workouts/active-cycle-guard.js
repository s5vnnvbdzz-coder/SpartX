/* A saved 5/3/1 programme stays active while at least one selected lift
   has a scheduled week that has not been completed. This shares the same
   completion logic used by the existing 5/3/1 quick-access card. */
(function(){
 'use strict';
 const KEY='spartanx_531_saved_cycles_v1';
 const LIFTS=new Set(['Back Squat','Bench Press','Deadlift','Overhead Press']);
 function hasActive531Cycle(){
  let cycles;
  try{cycles=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return false}
  if(!Array.isArray(cycles))return false;
  return cycles.some(c=>{
   if(!c||!Number.isInteger(+c.weeks)||+c.weeks<1)return false;
   const lifts=(Array.isArray(c.exercises)&&c.exercises.length?c.exercises:[c.lift]).filter(x=>LIFTS.has(x));
   return lifts.some(lift=>{
    const byLift=c.completedSessions?.[lift];
    const prior=Array.isArray(byLift)?byLift:(c.lift===lift?c.completedWeeks||[]:[]);
    const finished=new Set((Array.isArray(prior)?prior:[]).map(Number));
    for(let week=1;week<=+c.weeks;week++)if(!finished.has(week))return true;
    return false;
   });
  });
 }
 window.spartanxHasActive531Cycle=hasActive531Cycle;
})();
