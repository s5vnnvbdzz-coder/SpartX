/* Spartan Intelligence · AscensionX cycle check-in and approved next-cycle accessory dose.
 * Pure evaluation. Current workouts / historical logs are never rewritten.
 * Conservative coaching heuristics; no claim of a validated personal SFR score.
 */
(function(root){
 'use strict';
 const VERSION='1.0.0',KEY='sx_ascension_cycle_intelligence_v1';
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const finite=x=>Number.isFinite(Number(x))?Number(x):null;
 const effort=x=>x!==null&&x!==undefined&&x!==''&&finite(x)>=6&&finite(x)<=10?Number(x):null;
 const between=(n,min,max)=>Math.max(min,Math.min(max,n));
 const shortName=name=>String(name||'').slice(0,100);
 const parseJSON=(storage,key,fallback)=>{try{
  const raw=storage?.getItem?.(key);
  return raw&&raw.length<1000000?JSON.parse(raw):fallback;
 }catch(_){return fallback}};
 const cycleLogs=(cycle,logs)=>{
  const start=Date.parse(cycle?.created||'');
  return (Array.isArray(logs)?logs:[]).filter(log=>log?.cycleId?
   log.cycleId===cycle?.created:Number.isFinite(start)&&
   (Date.parse(log?.date||'')||0)>=start);
 };
 function latest(logs,lift,week){
  return logs.filter(x=>x?.lift===lift&&Number(x.week)===week)
   .sort((a,b)=>(Date.parse(b.date||'')||0)-(Date.parse(a.date||'')||0))[0]||null;
 }
 function mainWeeks(cycle,logs,plan){
  const lifts=(Array.isArray(cycle?.exercises)?cycle.exercises:[]).filter(x=>typeof x==='string');
  const matched=cycleLogs(cycle,logs);
  const weeks=Array.from({length:6},(_,index)=>{
   const week=index+1;
   const matches=lifts.map(lift=>{
    const record=latest(matched,lift,week);
    const rpe=effort(record?.sets?.[0]?.rpe)??effort(record?.avgRpe);
    const target=Number(plan?.[index]?.rpe)||8;
    return {lift,done:record?.setsComplete===true,logged:!!record,
     high:rpe!==null&&(rpe>=9.5||rpe>target+.75),
     rpe,plannedRpe:target};
   });
   return {week,done:matches.filter(x=>x.done).length,total:lifts.length,
    high:matches.filter(x=>x.high).length,
    logged:matches.filter(x=>x.logged).length,
    rpeKnown:matches.filter(x=>x.rpe!==null).length};
  });
  const assessed=weeks.slice(0,5);
  return {weeks,lifts:lifts.length,completed:assessed.reduce((a,w)=>a+w.done,0),
   possible:5*lifts.length,highEffort:assessed.reduce((a,w)=>a+w.high,0),
   rpeKnown:assessed.reduce((a,w)=>a+w.rpeKnown,0)};
 }
 function accessoryLogs(cycleId,sessions){
  const grouped=new Map();
  if(!cycleId)return grouped;
  for(const session of (Array.isArray(sessions)?sessions:[]).slice(-1500)){
   const timestamp=Date.parse(session?.date||session?.savedAt||'');
   const date=Number.isFinite(timestamp)?new Date(timestamp).toISOString().slice(0,10):null;
   if(!date)continue;
   for(const ex of (Array.isArray(session?.exercises)?session.exercises:[])){
    const link=ex?.sxStrengthSizeCompanion||ex?.sxPowerbuildingSupport;
    if(link?.cycleId!==cycleId||!ex?.name)continue;
    const sets=(Array.isArray(ex.sets)?ex.sets:[]).filter(s=>
     s?.done===true&&!/^(w|warm.?up|cardio)$/i.test(String(s.type||''))&&
     Number(s.reps)>0&&Number.isFinite(Number(s.weight))&&Number(s.weight)>=0);
    if(!sets.length)continue;
    const rpes=sets.map(s=>effort(s.rpe)).filter(x=>x!==null);
    // Advice needs every completed set's RPE: missing effort is not a low RPE.
    const avg=rpes.length===sets.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:null;
    const key=norm(ex.name);
    if(!key)continue;
    const prior=grouped.get(key)||{name:shortName(ex.name),records:[]};
    const id=String(session?.id??date)+'|'+date;
    prior.records.push({id,date,sets:sets.length,avgRpe:avg,
     reps:sets.reduce((a,x)=>a+Number(x.reps),0)/sets.length});
    grouped.set(key,prior);
   }
  }
  return grouped;
 }
 function accessorySuggestions(cycleId,sessions){
  const grouped=accessoryLogs(cycleId,sessions),proposals=[];
  for(const [key,data] of grouped){
   const unique=[...new Map(data.records.map(x=>[x.id,x])).values()]
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(-5);
   const valid=unique.filter(x=>x.avgRpe!==null);
   if(valid.length<3)continue;
   const last=valid.slice(-3);
   // Only consistent, comparable signals trigger a dose proposal:
   // all three sessions clearly high effort, at least three working sets.
   const overworked=last.every(r=>r.avgRpe>=9)&&last.every(r=>r.sets>=3);
   if(!overworked)continue;
   proposals.push({key,name:data.name,delta:-1,confidence:'cautious',
    sessions:last.length,reason:'High RPE in 3 logged sessions; consider one fewer working set.',
    note:'Not proof that volume caused fatigue. Review technique, sleep and performance.'});
  }
  return proposals.slice(0,6);
 }
 function evaluate(cycle,logs,spartanSessions,plan){
  const weekly=mainWeeks(cycle,logs,plan);
  const suggestions=accessorySuggestions(cycle?.created,spartanSessions);
  return {version:VERSION,cycleId:cycle?.created||null,readOnly:true,
   weekly,suggestions,
   summary:weekly.possible?
    weekly.completed+'/'+weekly.possible+' loading sessions complete · '+
    weekly.highEffort+' high-effort flags':'No active main-lift sessions',
   note:weekly.rpeKnown<weekly.completed?'Some completed sessions have no valid RPE.':'RPE is a subjective effort indicator, not a full recovery assessment.'};
 }
 function approvedFor(cycleId,storage=root.localStorage){
  if(!cycleId||typeof cycleId!=='string')return {};
  const state=parseJSON(storage,KEY,{});
  const row=state?.[cycleId];
  if(!row||row.version!==VERSION||!row.adjustments||typeof row.adjustments!=='object')return {};
  return row.adjustments;
 }
 function adjustment(cycleId,exerciseName,storage=root.localStorage){
  const key=norm(exerciseName);
  const delta=approvedFor(cycleId,storage)[key];
  return delta===-1||delta===1?delta:0;
 }
 function saveApproved(newCycleId,previousCycleId,approved=[],storage=root.localStorage){
  if(typeof newCycleId!=='string'||!Number.isFinite(Date.parse(newCycleId))||
    typeof previousCycleId!=='string')return false;
  const existing=parseJSON(storage,KEY,{});
  const state=existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{};
  const adjustments={};
  for(const item of (Array.isArray(approved)?approved:[]).slice(0,6)){
   const key=norm(item?.name);
   if(key&&key.length<=100&&(item.delta===-1||item.delta===1))adjustments[key]=item.delta;
  }
  state[newCycleId]={version:VERSION,previousCycleId,approvedAt:new Date().toISOString(),adjustments};
  const entries=Object.keys(state).sort();
  while(entries.length>25)delete state[entries.shift()];
  try{storage.setItem(KEY,JSON.stringify(state));return true}catch(_){return false}
 }
 root.SXAscensionCycleIntelligence=Object.freeze({
  VERSION,KEY,mainWeeks,accessoryLogs,accessorySuggestions,evaluate,approvedFor,adjustment,saveApproved
 });
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SXAscensionCycleIntelligence;
})(typeof window!=='undefined'?window:globalThis);
