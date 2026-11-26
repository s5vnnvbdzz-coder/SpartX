/* AscensionX Continue Training: reconcile an OLD, untouched imported
 * assistance snapshot with the current classic six-week adaptive plan.
 * Never edit completed sessions, main-lift sets or athlete-entered loads.
 */
(function(root){
 'use strict';
 const VERSION=423;
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
 // Correct ONLY cycle-linked assistance order once for each active draft.
 // Preserve all athlete-entered weights, reps, RPE, completion and rest state.
 // The user's subsequent manual reordering is not silently overridden.
 const ORDER_VERSION=418;
 function alignLinked(work,details,companion,storage=root.localStorage){
  if(!Array.isArray(work)||details?.source!=='AscensionX'||!details.cycleId||
     !Number.isInteger(Number(details.week)))return {changed:false};
  const main=work.find(ex=>mainLink(ex,details));
  if(!main||Number(main.ascensionLink.supportOrderVersion)>=ORDER_VERSION)return {changed:false};
  const active=companion?.cycle?.(storage),prefs=companion?.preference?.(storage);
  if(active?.id!==details.cycleId||!prefs?.enabled)return {changed:false};
  const prior=work.filter(ex=>matchedLink(ex,details)&&!String(ex.replacementOf||'').trim());
  if(!prior.length)return {changed:false};
  const planned=companion.forImport(details,[],storage);
  if(!Array.isArray(planned)||!planned.length)return {changed:false};
  const order=new Map(planned.map((ex,i)=>[norm(ex.name),i]));
  const original=work.slice();
  const sortable=prior.map((ex,index)=>({ex,index})).sort((a,b)=>
   (order.get(norm(a.ex.name))??1e6)-(order.get(norm(b.ex.name))??1e6)||a.index-b.index)
   .map(x=>x.ex);
  const others=original.filter(ex=>!prior.includes(ex));
  const at=others.indexOf(main);
  if(at<0)return {changed:false};
  others.splice(at+1,0,...sortable);
  const changed=others.some((ex,i)=>ex!==original[i]);
  if(changed)work.splice(0,work.length,...others);
  main.ascensionLink.supportOrderVersion=ORDER_VERSION;
  return {changed,previousOrder:original,ordered:sortable.map(ex=>ex.name)};
 }

 // Targeted chest coverage migration: replace ONLY the untouched legacy
 // pulldown row, even when earlier assistance has already been completed.
 function upgradeBenchChest(work,details,companion,storage=root.localStorage){
  if(!Array.isArray(work)||details?.source!=='AscensionX'||!same(details.exercise,'Bench Press')||
    !details.cycleId||Number(details.week)<1||Number(details.week)>5)return {changed:false};
  const main=work.find(ex=>mainLink(ex,details));
  if(!main||Number(main.ascensionLink.chestCoverageVersion)>=428)return {changed:false};
  const active=companion?.cycle?.(storage),prefs=companion?.preference?.(storage);
  if(active?.id!==details.cycleId||!prefs?.enabled||!prefs?.adaptive)return {changed:false};
  const prior=work.find(ex=>matchedLink(ex,details)&&same(ex.name,'Lat Pulldown')&&!ex.replacementOf);
  if(!prior||!untouched(prior)||prior.sets.some(s=>String(s.weight??'')===''&&Number(prior.sxStrengthSizeCompanion.prescribedKg)>0))return {changed:false};
  const plan=companion.forImport(details,[],storage);
  const chest=Array.isArray(plan)?plan.find(ex=>['machinechestpress','inclinedumbbellpress'].includes(norm(ex.name))):null;
  if(!chest||plan.some(ex=>same(ex.name,'Lat Pulldown')))return {changed:false};
  // Do not override a manually added chest exercise or reorder any logged rows.
  const exists=work.some(ex=>same(ex.name,chest.name));
  const row=work.find(ex=>matchedLink(ex,details)&&same(ex.name,'Iso-Lateral Row'));
  const before=work.slice();
  work.splice(work.indexOf(prior),1);
  if(!exists)work.splice(work.indexOf(row||main)+1,0,chest);
  main.ascensionLink.chestCoverageVersion=428;
  return {changed:true,previousOrder:before};
 }
 root.SXAscensionContinueSupport=Object.freeze({VERSION,ORDER_VERSION,matchedLink,untouched,reconcile,alignLinked,upgradeBenchChest});
})(typeof window!=='undefined'?window:globalThis);
