/* SpartanX · live exercise achievement detection.
 * Read-only, on-device comparisons against SAVED session history.
 * Active edits and unchecked sets never create permanent records.
 */
(function(global){
 'use strict';
 const normalize=name=>String(name||'').trim().toLowerCase().replace(/\s+/g,' ');
 const warmup=set=>/^(?:w|warm\s*[- ]?\s*up|warmup)$/i.test(String(set?.type||'').trim());
 const eligible=(set,saved=false)=>{
  const kg=Number(set?.weight),reps=Number(set?.reps);
  return !!set&&(saved?set.done!==false:set.done===true)&&
   !warmup(set)&&Number.isFinite(kg)&&kg>0&&
   Number.isInteger(reps)&&reps>=1&&reps<=60;
 };
 const strength=set=>Number(set.weight)*(Number(set.reps)===1?1:1+Number(set.reps)/30);
 const record=set=>({kg:Number(set.weight),reps:Number(set.reps)});
 function historyIndex(sessions){
  const records=new Map();
  for(const session of Array.isArray(sessions)?sessions:[]){
   for(const exercise of Array.isArray(session?.exercises)?session.exercises:[]){
    const key=normalize(exercise?.name);
    if(!key)continue;
    for(const set of Array.isArray(exercise?.sets)?exercise.sets:[]){
     if(!eligible(set,true))continue;
     if(!records.has(key))records.set(key,[]);
     records.get(key).push(record(set));
    }
   }
  }
  return records;
 }
 function forExercise(exercise,index){
  const history=index instanceof Map?index.get(normalize(exercise?.name))||[]:[];
  // A genuine new PR requires prior completed history. The first session
  // establishes a baseline rather than awarding trophies for every set.
  if(!history.length)return [];
  const recorded=(Array.isArray(exercise?.sets)?exercise.sets:[])
   .filter(set=>eligible(set)).map(record);
  if(!recorded.length)return [];
  const bestPriorWeight=Math.max(...history.map(s=>s.kg));
  const priorEst=Math.max(...history.filter(s=>s.reps<=10)
   .map(s=>strength({weight:s.kg,reps:s.reps})),0);
  // A weight-for-reps PR is a non-dominated set: more weight for at least
  // the same reps, or more reps at a given load. We compare against history
  // and suppress weaker duplicates achieved in the SAME live session.
  const frontier=recorded.filter((set,i)=>!recorded.some((other,j)=>j!==i&&
   other.kg>=set.kg&&other.reps>=set.reps&&
   (other.kg>set.kg||other.reps>set.reps)));
  const records=[];
  for(const set of frontier){
   const priorForReps=Math.max(0,...history.filter(x=>x.reps>=set.reps).map(x=>x.kg));
   if(set.kg<=priorForReps+0.0001)continue;
   const trueSingle=set.reps===1&&set.kg>bestPriorWeight+0.0001;
   records.push({
    kind:trueSingle?'oneRm':'repPr',
    title:trueSingle?'New 1RM':'Weight × reps record',
    kg:set.kg,reps:set.reps,
    previousKg:priorForReps>0?priorForReps:null,
    subtitle:trueSingle?'Heaviest completed single recorded for this exercise':
     'Best completed weight for '+set.reps+' or more reps'
   });
  }
  // Only multi-rep sets can set an ESTIMATED 1RM. Never label an Epley
  // calculation a tested 1RM, or extrapolate from extreme rep counts.
  const bestEst=recorded.filter(set=>set.reps>=2&&set.reps<=10)
   .sort((a,b)=>strength({weight:b.kg,reps:b.reps})-strength({weight:a.kg,reps:a.reps}))[0];
  if(bestEst&&priorEst>0){
   const estimated=strength({weight:bestEst.kg,reps:bestEst.reps});
   if(estimated>priorEst+0.0001)records.push({
    kind:'estimated',title:'Estimated 1RM record',
    kg:bestEst.kg,reps:bestEst.reps,valueKg:estimated,previousKg:priorEst,
    subtitle:'Calculated from a completed '+bestEst.reps+'-rep set, not a tested single'
   });
  }
  const rank={oneRm:0,repPr:1,estimated:2};
  records.sort((a,b)=>rank[a.kind]-rank[b.kind]||b.kg-a.kg||b.reps-a.reps);
  return records;
 }
 global.SpartanXSessionAchievements=Object.freeze({
  historyIndex,forExercise,eligible
 });
})(window);
