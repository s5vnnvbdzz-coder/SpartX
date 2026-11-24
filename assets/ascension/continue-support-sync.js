/* AscensionX Continue Training: reconcile an OLD, untouched imported
 * assistance snapshot with the current classic six-week adaptive plan.
 * Never edit completed sessions, main-lift sets or athlete-entered loads.
 */
(function(root){
 'use strict';
 const VERSION=417;
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const number=x=>Number.isFinite(Number(x))?Number(x):null;
 const same=(a,b)=>norm(a)===norm(b);
 function matchedLink(ex,details){
  const link=ex?.sxStrengthSizeCompanion;
  return link?.cycleId===details?.cycleId&&
   same(link.lift,details.exercise)&&Number(link.week)===Number(details.week);
 }
 function mainLink(ex,details){
  const link=ex?.ascensionLink;
  return link?.cycleId===details?.cycleId&&
   same(link.lift,details.exercise)&&Number(link.week)===Number(details.week);
 }
 function untouched(ex){
  const link=ex?.sxStrengthSizeCompanion;
  if(!link||!Array.isArray(ex.sets)||!ex.sets.length)return false;
  if(Number(link.plannedSets)!==ex.sets.length)return false;
  const originalReps=number(link.prescribedReps)??number(link.repsMin);
  const expectedKg=number(link.prescribedKg);
  return ex.sets.every(set=>
   set&&set.done===false&&String(set.type||'Working Set')==='Working Set'&&
   (set.rpe===null||set.rpe===undefined||set.rpe==='')&&
   Number(set.reps)===originalReps&&
   ((set.weight===null||set.weight===undefined||set.weight==='')||
    (expectedKg!==null&&Number(set.weight)===expectedKg)));
 }
 function reconcile(work,details,companion,storage=root.localStorage){
  if(!Array.isArray(work)||details?.source!=='AscensionX'||
     !details.cycleId||!Number.isInteger(Number(details.week)))return {handled:false,changed:false};
  const main=work.find(ex=>mainLink(ex,details));
  if(!main)return {handled:false,changed:false};
  const current=companion?.cycle?.(storage),p=companion?.preference?.(storage);
  if(!current||current.id!==details.cycleId||!p?.enabled||!p?.adaptive)
   return {handled:true,changed:false,reason:'Adaptive Programming is disabled'};
  if(Number(main.ascensionLink.supportSyncVersion)>=VERSION)
   return {handled:true,changed:false,reason:'Already loaded from the current support plan'};
  const prior=work.filter(ex=>matchedLink(ex,details));
  // Never partly rewrite a mixed, manually-edited assistance group.
  // A filled first set might be a genuine athlete decision, even if not done.
  if(prior.some(ex=>!untouched(ex)))
   return {handled:true,changed:false,protected:true,reason:'Entered assistance is preserved'};
  const planned=companion.forImport(details,[],storage);
  if(!Array.isArray(planned)||!planned.length)
   return {handled:true,changed:false,reason:'No support prescribed for this week'};
  const before=work.slice();
  const kept=before.filter(ex=>!prior.includes(ex));
  const mainIndex=kept.indexOf(main);
  if(mainIndex<0)return {handled:true,changed:false,reason:'Main exercise was not found'};
  const names=new Set(kept.map(ex=>norm(ex.name)));
  const fresh=[];
  for(const ex of planned){
   const key=norm(ex.name);
   // Preserve explicit manually-added exercises rather than duplicating them.
   if(names.has(key))continue;
   names.add(key);fresh.push(ex);
  }
  kept.splice(mainIndex+1,0,...fresh);
  const changed=kept.length!==before.length||kept.some((ex,i)=>ex!==before[i]);
  if(changed)work.splice(0,work.length,...kept);
  // Mark the original main lift as synced. This marker is never a strength
  // progression counter, and does not change prescribed top/back-down sets.
  main.ascensionLink.supportSyncVersion=VERSION;
  return {handled:true,changed,inserted:fresh.length,removed:prior.length,
   previousOrder:before,reason:changed?'Updated untouched support from the live six-week plan':'Live support is already present'};
 }
 root.SXAscensionContinueSupport=Object.freeze({VERSION,matchedLink,untouched,reconcile});
})(typeof window!=='undefined'?window:globalThis);
