/* AscensionX Deadlift accessory — Romanian Deadlift.
 * Optional supplemental exercise loaded into SpartanX ONLY when importing
 * a deadlift from Continue Training. It is not a required AscensionX lift.
 */
(function(root){
 'use strict';
 const WEEKS=Object.freeze({
  1:Object.freeze({factor:.65,sets:3,reps:8}),
  2:Object.freeze({factor:.65,sets:3,reps:8}),
  3:Object.freeze({factor:.60,sets:3,reps:6}),
  4:Object.freeze({factor:.55,sets:2,reps:6}),
  5:Object.freeze({factor:.50,sets:2,reps:5})
 });
 const TOP_PCTS=Object.freeze([72.5,77.5,82.5,87.5,92.5,60]);
 const round=(n,step)=>Math.round(n/step+Number.EPSILON)*step;
 function fromTopSet({week,topLoad,cycleId,tm,rounding=2.5}={}){
  const w=Number(week),load=Number(topLoad),increment=Number(rounding),config=WEEKS[w];
  if(!Number.isInteger(w)||!config||!Number.isFinite(load)||load<=0||
   !Number.isFinite(increment)||increment<=0||increment>10)return null;
  const weight=Number(round(load*config.factor,increment).toFixed(3));
  if(weight<=0)return null;
  return Object.freeze({
   id:'ascensionx-romanian-deadlift-v1',exercise:'Romanian Deadlift',
   week:w,cycleId:String(cycleId||''),topLoad:load,trainingMax:Number(tm)||null,
   factor:config.factor,sets:config.sets,reps:config.reps,weight,
   tempo:'2–3-second eccentric',targetRpe:'6–7'
  });
 }
 function fromAscensionState(data,weekOverride){
  const cycle=data?.cycle,profile=data?.profile;
  if(!cycle?.created||!Array.isArray(cycle.exercises)||!cycle.exercises.includes('Deadlift'))return null;
  const week=Number(weekOverride??cycle.weeks?.Deadlift??cycle.currentWeek);
  const max=Number(profile?.max?.Deadlift),tmPct=Number(profile?.tmPct??95);
  const increment=Number(profile?.rounding??2.5);
  if(!Number.isInteger(week)||week<1||week>5||
   !Number.isFinite(max)||max<=0||!Number.isFinite(tmPct)||tmPct<=0||tmPct>100||
   !Number.isFinite(increment)||increment<=0||increment>10)return null;
  const tm=round(max*tmPct/100,increment);
  const topLoad=round(tm*TOP_PCTS[week-1]/100,increment);
  return fromTopSet({week,topLoad,cycleId:cycle.created,tm,rounding:increment});
 }
 function createExercise(plan){
  if(plan?.id!=='ascensionx-romanian-deadlift-v1'||
   plan.exercise!=='Romanian Deadlift'||!Number.isInteger(plan.sets)||
   plan.sets<1||plan.sets>5||!Number.isInteger(plan.reps)||
   plan.reps<1||!Number.isFinite(plan.weight)||plan.weight<=0)return null;
  return {
   name:'Romanian Deadlift',rest:150,
   notes:'AscensionX Deadlift Week '+plan.week+' accessory · 2–3-second controlled lowering · '+
    Math.round(plan.factor*100)+'% of '+plan.topLoad+' kg top working set · RPE 6–7. '+
    'Hinge at the hips; keep bar close and stop at a controllable hamstring stretch. '+
    'Independent of AscensionX cycle progression.',
   ascensionAccessory:{
    id:'ascensionx-romanian-deadlift-v1',cycleId:plan.cycleId,week:plan.week,
    sourceLift:'Deadlift',tempo:'2–3-second eccentric',topLoad:plan.topLoad,accessoryLoad:plan.weight
   },
   sets:Array.from({length:plan.sets},()=>({
    weight:String(plan.weight),reps:String(plan.reps),rpe:'',type:'Working Set',done:false
   }))
  };
 }
 root.SpartanXRomanianDeadlift=Object.freeze({fromTopSet,fromAscensionState,createExercise});
})(typeof window!=='undefined'?window:globalThis);
