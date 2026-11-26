/* Independent next-generation programme preview. No storage or live workout writes.
 * Uses SX2Engine for technique-informed exercise selection and scheduling;
 * primary lifts use explicit TM-based phase tables. */
(function(root){
'use strict';
const base=root.SX2Engine||(typeof require==='function'?require('./engine.js'):null);
const LIFTS=base.LIFTS;
const E=(phase,pct,reps,backPct,backSets,backReps,rpe)=>({phase,pct,reps,backPct,backSets,backReps,rpe});
const P={
 4:[E('Foundation',.85,5,.75,3,5,7),E('Strength',.90,3,.80,3,3,7.5),E('Intensification',.95,1,.85,3,2,8),E('Deload',.60,5,.55,2,5,6)],
 8:[E('Accumulation',.80,5,.70,3,5,7),E('Accumulation',.85,5,.75,3,5,7.5),E('Build',.90,4,.78,3,4,8),E('Deload',.60,5,.55,2,5,6),E('Strength',.925,3,.82,3,3,8),E('Intensification',.975,2,.85,2,3,8),E('Peak practice',1,1,.82,2,2,8),E('Assessment',.90,1,.65,1,2,7)],
 12:[E('Accumulation',.775,5,.68,3,5,7),E('Accumulation',.825,5,.72,3,5,7),E('Accumulation',.85,5,.75,3,5,7.5),E('Deload',.60,5,.55,2,5,6),E('Build',.875,4,.78,3,4,7.5),E('Strength',.925,3,.82,3,3,8),E('Strength',.95,3,.83,3,3,8),E('Recovery',.65,3,.60,1,3,6),E('Intensification',.975,2,.85,2,2,8),E('Heavy singles',1.025,1,.85,2,2,8),E('Taper',.85,1,.65,1,2,6.5),E('Assessment',.90,1,.65,1,2,7)]
};
const B={
 4:[E('Accumulation',.775,6,.68,3,8,7),E('Development',.825,5,.72,3,7,7.5),E('Rep strength',.875,4,.75,3,6,8),E('Deload',.60,6,.55,1,6,6)],
 8:[E('Accumulation',.75,8,.65,3,8,7),E('Accumulation',.775,7,.68,3,8,7),E('Build',.825,6,.72,3,8,7.5),E('Deload',.60,6,.55,1,6,6),E('Strength & size',.85,5,.75,3,6,8),E('Strength & size',.875,5,.77,3,6,8),E('Rep strength',.90,4,.78,3,6,8),E('Rep assessment',.875,5,.70,1,6,8)],
 12:[E('Accumulation',.75,8,.65,3,8,7),E('Accumulation',.775,8,.68,3,8,7),E('Accumulation',.80,7,.70,3,8,7.5),E('Deload',.60,6,.55,1,6,6),E('Build',.825,6,.72,3,8,7.5),E('Strength & size',.85,6,.75,3,7,8),E('Strength & size',.875,5,.77,3,6,8),E('Recovery',.65,6,.55,1,6,6),E('Rep strength',.875,5,.77,3,6,8),E('Rep strength',.90,4,.78,3,6,8),E('Taper',.75,5,.65,1,6,6),E('Rep assessment',.875,5,.70,1,6,8)]
};
const isLean=phase=>/Deload|Recovery|Taper|Assessment/i.test(phase);
const round=(n,step)=>Math.max(step,Math.round(n/step)*step);
const support=(name,n,reps,rpe,reason)=>({name,role:'accessory',rest:90,rationale:reason,sets:Array.from({length:n},()=>({type:'work',kg:null,reps,rpe}))});
function generate(raw){
 const discipline=raw.discipline;
 if(!['powerlifting','powerbuilding'].includes(discipline))throw Error('Choose a training discipline.');
 const tmRatio=Number(raw.tmRatio??.9);
 if(![.85,.9,.925].includes(tmRatio))throw Error('Choose a conservative training max ratio.');
 const pb=discipline==='powerbuilding';
 const plan=base.generate({...raw,focus:pb?'balanced':'strength'}),p=plan.profile,step=p.step;
 const tables=(pb?B:P)[p.weeks];
 const tm=Object.fromEntries(LIFTS.map(l=>[l,round(p.maxes[l]*tmRatio,step)]));
 const low=p.sleep<6||p.recovery==='limited'||p.job==='high'||p.activity==='high'||p.nutrition==='deficit'||p.experience==='beginner';
 const weeks=tables.map((cfg,i)=>{
  const lean=isLean(cfg.phase),assessment=/Assessment/i.test(cfg.phase);
  // Reuse full normal session template for assessment and the four-week deload,
  // since the former standalone engine returned a one-day test instead.
  const template=plan.weeks[i].assessment?plan.weeks[Math.max(0,i-1)]:plan.weeks[i];
  const sessions=JSON.parse(JSON.stringify(template.sessions));
  const count=lean?1:low?2:3;
  for(const d of sessions){
   for(const ex of d.exercises){
    if(ex.role==='primary'){
     const lift=ex.name,scale=low&&!lean?.96:1,dead=lift==='Deadlift'&&!lean?.985:1;
     const top=round(tm[lift]*cfg.pct*scale*dead,step),back=round(tm[lift]*cfg.backPct*scale*dead,step);
     const warm=[.40,.55,.70,.85].map((r,k)=>({type:'warmup',kg:round(top*r,step),reps:[5,3,2,1][k],rpe:null})).filter((s,k,a)=>s.kg<top&&(k===0||s.kg>a[k-1].kg));
     const rpe=low?Math.min(cfg.rpe,7):cfg.rpe;
     ex.sets=[...warm,{type:'top',kg:top,reps:cfg.reps,rpe},...Array.from({length:Math.max(1,cfg.backSets-(low&&!lean?1:0))},()=>({type:'backdown',kg:Math.min(top,back),reps:cfg.backReps,rpe:Math.min(rpe,7.5)}))];
     ex.rationale=assessment?(pb?'Submaximal comparable rep assessment; do not force a PB.':'Readiness check; any maximum attempt is optional and separately athlete-controlled.'):'TM-based phase prescription. Reduce the load if the RPE ceiling is exceeded.';
    }else if(ex.role==='secondary'){
     const ref=/squat/i.test(ex.name)?'Back Squat':'Bench Press';
     ex.sets=Array.from({length:lean?1:low?2:3},()=>({type:'work',kg:round(tm[ref]*(lean?.55:pb?.68:.72),step),reps:lean?3:pb?6:4,rpe:lean?6:7}));
    }else{
     ex.sets=Array.from({length:count},()=>({...ex.sets[0],rpe:lean?6:Math.min(ex.sets[0].rpe||8,low?7:8)}));
     if(/Romanian Deadlift/i.test(ex.name)){ex.sets=Array.from({length:count},()=>({type:'work',kg:round(tm.Deadlift*.45,step),reps:8,rpe:lean?6:7}));}
    }
   }
   if(lean)d.exercises=d.exercises.filter(e=>e.role==='primary'||e.role==='secondary'||/Row|Pulldown|Pull-Up|Leg Curl|Crunch|Dead Bug/.test(e.name)).slice(0,4);
   if(pb&&!lean){
    const add=(name,reps,reason)=>{if(!d.exercises.some(e=>e.name===name))d.exercises.push(support(name,count,reps,low?7:8,reason))};
    if(/Squat$/.test(d.name))add('Standing Calf Raise',12,'Direct calf development.');
    if(/Bench Press$/.test(d.name)){add('Dumbbell Lateral Raise',12,'Direct lateral-delt development.');if(p.equipment==='full')add('Cable Fly',12,'Additional chest hypertrophy.');}
    if(/Deadlift$/.test(d.name)){add('Dumbbell Curl',10,'Direct elbow-flexor development.');}
   }
   // Estimated duration is advisory. Preserve the big lifts; remove the last
   // optional isolation slots first if the available session time is short.
   const duration=()=>Math.round(5+d.exercises.reduce((m,e)=>m+3+e.sets.reduce((t,s)=>t+(s.type==='warmup'?2.5:e.role==='primary'?5:e.role==='secondary'?4:3),0),0));
   while(duration()>p.minutes){let k=d.exercises.findLastIndex((e,j)=>e.role==='accessory'&&j>=3);if(k<0)break;d.exercises.splice(k,1);}
   d.estimatedMinutes=duration();
  }
  return {week:i+1,phase:cfg.phase,assessment,sessions,topPercent:cfg.pct};
 });
 return {discipline,profile:p,trainingMaxes:tm,weeks,lowReadiness:low,independent:true,preview:true};
}
function advice(target,actual,step=2.5){
 if(!target||!actual||!Number.isFinite(+actual.rpe)||+actual.rpe<6||+actual.rpe>10||!Number.isInteger(+actual.reps)||!Number.isFinite(+actual.kg)||+actual.kg<=0)return {status:'insufficient',delta:0};
 if(+actual.reps<target.reps||+actual.rpe>=9.5)return {status:'reduce-review',delta:0};
 if(+actual.rpe>target.rpe)return {status:'consolidate',delta:0};
 if(+actual.reps>=target.reps&&+actual.rpe<target.rpe)return {status:'increase-candidate',delta:step};
 return {status:'on-target',delta:0};
}
const api=Object.freeze({generate,advice,LIFTS});root.SXNextEngine=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
