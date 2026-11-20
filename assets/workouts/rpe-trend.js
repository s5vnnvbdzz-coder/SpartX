/* SpartanX programme RPE comparison.
 * Compares the same exercise, weight (0.1 kg precision) and reps against
 * the most recent completed saved set with a valid RPE. Never edits history.
 */
(function(global){
 'use strict';
 const GREEN=['#5ebf84','#3eaf72','#229a5a','#087d46'];
 const RED=['#d98279','#dd655e','#da464c','#bb1d32'];
 const neutral='#9ca3af';
 const normalizedName=name=>{
  const raw=String(name||'').trim().replace(/\s+/g,' ').toLowerCase();
  // Only equivalent labels for the same lift, not different implements or variants.
  if(raw==='barbell bench press')return 'bench press';
  if(raw==='squat'||raw==='barbell back squat'||raw==='barbell squat')return 'back squat';
  if(raw==='conventional deadlift'||raw==='barbell deadlift')return 'deadlift';
  if(raw==='military press'||raw==='barbell overhead press'||raw==='ohp')return 'overhead press';
  return raw;
 };
 const validRpe=value=>{
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const rpe=Number(value);
  return Number.isFinite(rpe)&&rpe>=6&&rpe<=10?rpe:null;
 };
 const warmup=set=>/^(?:w|warm[ -]?up)$/i.test(String(set?.type||set?.marker||'').trim());
 function key(name,weight,reps){
  if(weight===null||weight===undefined||String(weight).trim()===''||reps===null||reps===undefined||String(reps).trim()==='')return null;
  const w=Number(weight),r=Number(reps),exercise=normalizedName(name);
  if(!exercise||!Number.isFinite(w)||w<0||!Number.isInteger(r)||r<1)return null;
  // All stored weights are in kilograms; round only to ignore lb-entry noise.
  return exercise+'|'+w.toFixed(1)+'|'+r;
 }
 function historyIndex(sessions){
  const index=new Map();
  if(!Array.isArray(sessions))return index;
  // Sort a copy by actual session date; original history order is unchanged.
  const ordered=sessions.map((session,order)=>({
   session,order,date:Date.parse(session?.date)||0
  })).sort((a,b)=>b.date-a.date||a.order-b.order);
  for(const {session} of ordered){
   const exercises=Array.isArray(session?.exercises)?session.exercises:[];
   for(let i=exercises.length-1;i>=0;i--){
    const exercise=exercises[i],sets=Array.isArray(exercise?.sets)?exercise.sets:[];
    for(let j=sets.length-1;j>=0;j--){
     const set=sets[j],rpe=validRpe(set?.rpe);
     if(set?.done===false||warmup(set)||rpe===null)continue;
     const match=key(exercise?.name,set.weight,set.reps);
     if(match&&!index.has(match))index.set(match,{rpe,date:session.date,weight:Number(set.weight),reps:Number(set.reps)});
    }
   }
  }
  return index;
 }
 function reference(exercise,set,history,cycleLoaded){
  if(!cycleLoaded||warmup(set)||!(history instanceof Map))return null;
  const match=key(exercise,set?.weight,set?.reps);
  return match?history.get(match)||null:null;
 }
 function compare(exercise,set,history,cycleLoaded){
  const current=validRpe(set?.rpe);
  if(current===null)return null;
  const previous=reference(exercise,set,history,cycleLoaded);
  if(!previous)return null;
  const delta=Math.round((current-previous.rpe)*100)/100;
  const direction=delta>0?'harder':delta<0?'easier':'same';
  const strength=Math.min(3,Math.max(0,Math.ceil(Math.abs(delta)/0.5)-1));
  const color=delta>0?RED[strength]:delta<0?GREEN[strength]:neutral;
  const amount=Math.abs(delta).toFixed(1);
  const change=delta>0?'Harder by '+amount+' RPE':delta<0?'Easier by '+amount+' RPE':'Unchanged RPE';
  const label='RPE '+current+' vs previous '+previous.rpe+' at '+Number(set.weight).toFixed(1)+' kg × '+Number(set.reps)+' — '+change;
  return {direction,delta,color,current,previous:previous.rpe,label};
 }
 global.SpartanXRpeTrend=Object.freeze({historyIndex,reference,compare});
})(window);
