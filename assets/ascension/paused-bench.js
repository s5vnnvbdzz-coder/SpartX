/* AscensionX-compatible paused bench accessory.
   An optional SpartanX session exercise, NOT an AscensionX cycle lift.
   No mutation of cycles, XP, linked-session completion or saved history. */
(function(root){
 'use strict';
 const FACTORS=Object.freeze({
  1:Object.freeze({factor:.85,sets:3,reps:5}),
  2:Object.freeze({factor:.85,sets:3,reps:5}),
  3:Object.freeze({factor:.80,sets:3,reps:4}),
  4:Object.freeze({factor:.75,sets:2,reps:4}),
  5:Object.freeze({factor:.70,sets:2,reps:3})
 });
 const TOP_PCTS=Object.freeze([72.5,77.5,82.5,87.5,92.5,60]);
 const round=(n,step)=>Math.round((n/step)+Number.EPSILON)*step;
 function fromTopSet({week,topLoad,cycleId,tm,rounding=2.5}={}){
  const w=Number(week),load=Number(topLoad),step=Number(rounding);
  const config=FACTORS[w];
  if(!Number.isInteger(w)||!config||!Number.isFinite(load)||load<=0||
    !Number.isFinite(step)||step<=0||step>10)return null;
  const weight=Number(round(load*config.factor,step).toFixed(3));
  if(weight<=0)return null;
  return Object.freeze({
   id:'ascensionx-paused-bench-v1',exercise:'Paused Bench Press',
   week:w,cycleId:String(cycleId||''),topLoad:load,
   trainingMax:Number(tm)||null,factor:config.factor,
   sets:config.sets,reps:config.reps,weight,pauseSeconds:2
  });
 }
 function fromAscensionState(data,weekOverride){
  const cycle=data?.cycle,profile=data?.profile;
  if(!cycle?.created||!Array.isArray(cycle.exercises)||!cycle.exercises.includes('Bench Press'))return null;
  const week=Number(weekOverride??cycle.weeks?.['Bench Press']??cycle.currentWeek);
  const max=Number(profile?.max?.['Bench Press']);
  const tmPct=Number(profile?.tmPct??95),increment=Number(profile?.rounding??2.5);
  if(!Number.isInteger(week)||week<1||week>5||
    !Number.isFinite(max)||max<=0||!Number.isFinite(tmPct)||tmPct<=0||tmPct>100||
    !Number.isFinite(increment)||increment<=0||increment>10)return null;
  const tm=round(max*tmPct/100,increment);
  const topLoad=round(tm*TOP_PCTS[week-1]/100,increment);
  return fromTopSet({week,topLoad,cycleId:cycle.created,tm});
 }
 function createExercise(plan){
  if(!plan?.id||plan.exercise!=='Paused Bench Press'||!Number.isInteger(plan.sets)||plan.sets<1||plan.sets>5||
    !Number.isInteger(plan.reps)||plan.reps<1||!Number.isFinite(plan.weight)||plan.weight<=0)return null;
  return {
   name:'Paused Bench Press',rest:150,
   notes:'AscensionX Bench Week '+plan.week+' accessory · 2-second pause on chest · '+
     Math.round(plan.factor*100)+'% of '+plan.topLoad+' kg top working set · RPE 6–7. Does not affect cycle progression.',
   ascensionAccessory:{id:'ascensionx-paused-bench-v1',cycleId:plan.cycleId,week:plan.week,
    sourceLift:'Bench Press',pauseSeconds:2,topLoad:plan.topLoad,pausedLoad:plan.weight},
   sets:Array.from({length:plan.sets},()=>({
    weight:String(plan.weight),reps:String(plan.reps),rpe:'',type:'Working Set',done:false
   }))
  };
 }
 root.SpartanXPausedBench=Object.freeze({fromTopSet,fromAscensionState,createExercise});
})(typeof window!=='undefined'?window:globalThis);
