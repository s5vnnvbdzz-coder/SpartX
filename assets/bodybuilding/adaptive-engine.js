/* SpartanX adaptive training prescriptions.
 * Reads completed programme-linked sets; never alters completed workouts or AscensionX training maxes.
 */
(function(global){
 'use strict';
 const PHASES={1:{name:'Foundation',minRir:3,factor:1},2:{name:'Foundation',minRir:3,factor:1},
  3:{name:'Build',minRir:2,factor:1},4:{name:'Build',minRir:2,factor:1},
  5:{name:'Fatigue management',minRir:4,factor:.65},
  6:{name:'Progression',minRir:2,factor:1},7:{name:'Progression',minRir:1,factor:1},
  8:{name:'Review',minRir:3,factor:.8}};
 const GROUPS=['Chest','Back','Shoulders','Quads','Hamstrings','Glutes','Calves','Biceps','Triceps','Core'];
 const bound=(n,low,high,fallback)=>Number.isFinite(Number(n))?Math.max(low,Math.min(high,Number(n))):fallback;
 const norm=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const roundKg=value=>Math.max(0,Math.round(value*2)/2);
 const workSet=set=>set&&set.done!==false&&!/warm.?up/i.test(String(set.type||''))&&
  Number(set.reps)>0&&Number.isFinite(Number(set.weight))&&Number(set.weight)>0;
 function groups(name){
  const n=String(name||'').toLowerCase(),result=new Set();
  const add=(...values)=>values.forEach(g=>result.add(g));
  if(/bench|chest|fly|pec|push.?up|dip/.test(n))add('Chest','Triceps');
  if(/row|pulldown|pull.?up|chin.?up|pullover/.test(n))add('Back','Biceps');
  if(/shoulder|overhead|lateral raise|rear delt|face pull|upright row/.test(n))add('Shoulders');
  if(/overhead|shoulder press/.test(n))add('Triceps');
  if(/squat|leg press|hack|lunge|split squat|leg extension|step.?up/.test(n))add('Quads','Glutes');
  if(/deadlift|rdl|leg curl|hamstring|nordic/.test(n))add('Hamstrings');
  if(/deadlift|rdl|hip thrust|glute|back extension/.test(n))add('Glutes');
  if(/deadlift/.test(n))add('Back');
  if(/calf|calves/.test(n))add('Calves');
  if(/curl/.test(n)&&!/leg curl/.test(n))add('Biceps');
  if(/triceps|pushdown|skull.?crusher|close.?grip/.test(n))add('Triceps');
  if(/pallof|plank|abdominal|crunch|dead bug|hanging leg raise|ab wheel|core/.test(n))add('Core');
  return [...result];
 }
 function coverage(program){
  const totals=Object.fromEntries(GROUPS.map(g=>[g,0]));
  (program?.sessions||[]).forEach(day=>(day.exercises||[]).forEach(ex=>{
   groups(ex.name).forEach(g=>{totals[g]+=Math.max(0,Number(ex.sets)||0)});
  }));
  return {totals,missing:GROUPS.filter(g=>totals[g]===0)};
 }
 function priorPerformance(ex,history,link,week){
  if(!link?.programmeId||!link?.dayId||!ex?.id)return [];
  const records=[];
  for(const session of Array.isArray(history)?history:[]){
   const src=session?.bodybuildingLink || (session?.exercises||[]).find(x=>x.bodybuildingLink?.programmeId)?.bodybuildingLink;
   if(src?.programmeId!==link.programmeId||src?.dayId!==link.dayId ||
      !(Number(src.week)>=1&&Number(src.week)<week))continue;
   const matching=(session.exercises||[]).find(x=>x.bodybuildingLink?.exerciseId===ex.id);
   if(!matching)continue;
   const sets=(matching.sets||[]).filter(workSet);
   if(!sets.length)continue;
   records.push({week:Number(src.week),date:Date.parse(session.date||session.createdAt||session.savedAt||'')||0,
    sets,weight:Number(sets[sets.length-1].weight),
    allHigh:sets.length>=Number(ex.sets)&&sets.slice(0,Number(ex.sets)).every(s=>
      Number(s.reps)>=Number(ex.repsMax)&&Math.abs(Number(s.weight)-Number(sets[sets.length-1].weight))<.01),
    low:sets.filter(s=>Number(s.reps)<Number(ex.repsMin)).length > sets.length/2,
    rpe:sets.filter(s=>Number(s.rpe)>=1&&Number(s.rpe)<=10).map(s=>Number(s.rpe))});
  }
  return records.sort((a,b)=>a.week-b.week||a.date-b.date);
 }
 function prescribe(ex,week,history=[],link={}){
  const w=Math.round(bound(week,1,12,1));
  const phase=PHASES[w]||{name:'Build',minRir:2,factor:1};
  const baseRir=bound(ex?.rir,0,5,2);
  // Keep athlete-chosen effort ceilings while prioritising recovery during base and deload weeks.
  const rir=Math.max(baseRir,phase.minRir);
  const sets=Math.max(1,Math.round(bound(ex?.sets,1,8,3)*phase.factor));
  const last=priorPerformance(ex,history,link,w);
  const previous=last[last.length-1];
  let kg=Number(ex?.startingKg)>0?Number(ex.startingKg):0;
  let reason=kg>0?'Starting load set in programme.':'Choose a comfortable starting load using target RIR.';
  let status='baseline';
  if(previous){
   kg=previous.weight;
   const meanRpe=previous.rpe.length?previous.rpe.reduce((a,b)=>a+b,0)/previous.rpe.length:null;
   const target=10-bound(ex?.rir,0,5,2);
   const lastTwo=last.slice(-2);
   if(lastTwo.length>=2&&lastTwo.every(x=>x.low||x.rpe.some(r=>r>=9.5))){
    kg=roundKg(previous.weight*.975);status='reduce';
    reason='Two difficult sessions: suggest a small load reduction and reassess recovery.';
   }else if(previous.allHigh&&meanRpe!==null&&meanRpe<=target+.5&&w!==5&&w!==8){
    const step=/dumbbell|cable|lateral|curl|fly|raise|pushdown|extension/i.test(String(ex.name))?1:2.5;
    kg=roundKg(previous.weight+step);status='increase';
    reason='All working sets reached the upper rep target at the prescribed effort.';
   }else{
    status='hold';
    reason=previous.rpe.length?
     'Hold load until all working sets reach the upper rep target near the planned RPE.':
     'Hold load: record RPE to unlock effort-based progression.';
   }
  }
  return {...ex,sets,rir,startingKg:roundKg(kg),targetRpe:bound(10-rir,5,10,8),
   recommendation:{status,reason,previousKg:previous?.weight||null,phase:phase.name,week:w}};
 }
 function planDay(day,week,history=[],link={}){
  return {...day,exercises:(day?.exercises||[]).map(ex=>prescribe(ex,week,history,link))};
 }
 global.SXProgrammeIntelligence=Object.freeze({PHASES,GROUPS,groups,coverage,workSet,priorPerformance,prescribe,planDay});
 if(typeof module!=='undefined'&&module.exports)module.exports=global.SXProgrammeIntelligence;
})(typeof window!=='undefined'?window:globalThis);
