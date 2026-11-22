/* SpartanX lifetime milestone engine · v379.
 * Read-only progress. Never awards XP or modifies saved workouts.
 */
(function(root){
 'use strict';
 const CATEGORIES=Object.freeze([
  Object.freeze({id:'workouts',name:'Workout Consistency',icon:'shield',unit:'workouts',
   tiers:Object.freeze([100,250,500]),badgeNames:['Centurion','Veteran','Immortal']}),
  Object.freeze({id:'volume',name:'Lifetime Volume',icon:'anvil',unit:'kg lifted',
   tiers:Object.freeze([1000000,5000000,10000000]),badgeNames:['Iron Initiate','Iron Titan','Colossus']}),
  Object.freeze({id:'reps',name:'Lifetime Repetitions',icon:'swords',unit:'reps',
   tiers:Object.freeze([10000,25000,50000]),badgeNames:['Relentless','Unbreakable','Enduring Legend']}),
  Object.freeze({id:'cycles',name:'AscensionX Mastery',icon:'flame',unit:'completed cycles',
   tiers:Object.freeze([1,3,6]),badgeNames:['Ascended','Master of Ascension','Ascension Legend']})
 ]);
 const names=['Bronze','Silver','Gold'];
 const actual=n=>Math.max(0,Number.isFinite(Number(n))?Number(n):0);
 function completedAscensionCycles(state){
  const groups=new Map();
  for(const log of Array.isArray(state?.logs)?state.logs:[]){
   const id=typeof log?.cycleId==='string'?log.cycleId:'';
   if(!id||!Number.isFinite(Date.parse(id)))continue;
   if(log.setsComplete!==true||Number(log.week)!==6)continue;
   if(!['Back Squat','Bench Press','Deadlift'].includes(log.lift))continue;
   if(!groups.has(id))groups.set(id,new Set());
   groups.get(id).add(log.lift);
  }
  // Conservative: AscensionX's prescribed 3-main-lift full cycle is verified
  // only when all three lifts have completed their sixth week.
  return [...groups.values()].filter(set=>
   ['Back Squat','Bench Press','Deadlift'].every(lift=>set.has(lift))).length;
 }
 function totals(sessions,ascension,isCardio){
  const saved=Array.isArray(sessions)?sessions:[];
  let volume=0,reps=0,sets=0;
  for(const session of saved){
   for(const exercise of Array.isArray(session?.exercises)?session.exercises:[]){
    if(typeof isCardio==='function'&&isCardio(exercise?.name||''))continue;
    for(const set of Array.isArray(exercise?.sets)?exercise.sets:[]){
     if(set?.done===false)continue; // historical sessions contain only saved sets
     const r=actual(set?.reps),weight=actual(set?.weight);
     if(!Number.isFinite(r)||!Number.isFinite(weight)||r<=0)continue;
     sets+=1;reps+=r;
     if(weight>0)volume+=weight*r;
    }
   }
  }
  return Object.freeze({workouts:saved.length,volume,reps,cycles:completedAscensionCycles(ascension),sets});
 }
 function snapshot(sessions,ascension,highest={},isCardio){
  const values=totals(sessions,ascension,isCardio);
  const categories=CATEGORIES.map(cfg=>{
   const current=values[cfg.id]||0;
   const reached=cfg.tiers.filter(goal=>current>=goal).length;
   const stored=Math.min(3,Math.max(0,Math.floor(actual(highest?.[cfg.id]))));
   const unlocked=Math.max(stored,reached);
   const next=cfg.tiers[unlocked]??null;
   const previous=unlocked?cfg.tiers[unlocked-1]:0;
   return {...cfg,value:current,unlocked,reached,
    currentTier:unlocked?names[unlocked-1]:null,
    currentBadge:unlocked?cfg.badgeNames[unlocked-1]:null,
    nextGoal:next,remaining:next===null?0:Math.max(0,next-current),
    progress:next===null?1:Math.max(0,Math.min(1,(current-previous)/(next-previous))),
    tierDetails:cfg.tiers.map((goal,i)=>({
     name:names[i],badge:cfg.badgeNames[i],goal,unlocked:i<unlocked
    }))};
  });
  return Object.freeze({values,categories,earned:categories.reduce((n,c)=>n+c.unlocked,0),total:12,
   highWater:Object.fromEntries(categories.map(c=>[c.id,c.unlocked]))});
 }
 root.SpartanXMilestoneEngine=Object.freeze({CATEGORIES,totals,snapshot,completedAscensionCycles});
})(window);
