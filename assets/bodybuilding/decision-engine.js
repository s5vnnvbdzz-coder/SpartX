/* SpartanX Adaptive Decision Engine v1 — read-only, deterministic and explainable.
 * IMPORTANT: NEVER write to spartx_db, ascensionx_strength_v1 or any saved
 * programme key. Review only finished, programme-linked sessions. Standalone
 * workouts, unsaved drafts, warmups and substitutions are not training evidence.
 */
(function(global){
 'use strict';
 const MAX_BYTES=12*1024*1024,MAX_SESSIONS=5000;
 const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
 const canonicalLift=value=>{
  const v=String(value||'').toLowerCase().replace(/[()]/g,' ').replace(/\bbarbell\b/g,'').replace(/\s+/g,' ').trim();
  if(/^(?:back )?squats?$/.test(v))return 'Back Squat';
  if(/^(?:flat )?bench press$/.test(v))return 'Bench Press';
  if(/^(?:(?:conventional|sumo) )?deadlift$/.test(v))return 'Deadlift';
  if(/^(?:overhead press|ohp)$/.test(v))return 'Overhead Press';
  return null;
 };
 const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const round=(n,d=1)=>Number.isFinite(n)?Number(n.toFixed(d)):null;
 const numeric=n=>n===''||n==null?null:Number.isFinite(Number(n))?Number(n):null;
 const validSet=s=>s?.done===true&&!/warm.?up|cardio/i.test(String(s.type||''))&&
  numeric(s.weight)>0&&Number.isInteger(numeric(s.reps))&&numeric(s.reps)>0&&numeric(s.reps)<=30;
 const validWorking=ex=>(Array.isArray(ex?.sets)?ex.sets:[]).filter(validSet).slice(0,30);
 const effort=sets=>{
  const valid=sets.map(s=>numeric(s.rpe)).filter(r=>r!==null&&r>=6&&r<=10);
  return valid.length?round(valid.reduce((a,b)=>a+b,0)/valid.length,1):null;
 };
 const estimatedMax=sets=>{
  const estimates=sets.filter(s=>numeric(s.reps)<=10).map(s=>
   Number(s.weight)*(1+Number(s.reps)/30));
  return estimates.length?round(Math.max(...estimates),1):null;
 };
 const dateValue=s=>Date.parse(s?.savedAt||s?.date||s?.createdAt||'')||0;
 const safeSessions=storage=>{
  try{
   const raw=storage?.getItem?.('spartx_db');
   if(raw==null)return {status:'empty',sessions:[],reason:'No completed SpartanX workouts found in this browser.'};
   if(raw.length>MAX_BYTES)return {status:'unavailable',sessions:[],reason:'Workout history is too large to analyse safely.'};
   const parsed=JSON.parse(raw),sessions=parsed?.sessions;
   if(!Array.isArray(sessions)||sessions.length>MAX_SESSIONS)
    return {status:'unavailable',sessions:[],reason:'Workout history format is unavailable.'};
   return {status:'ready',sessions,reason:''};
  }catch(_){return {status:'unavailable',sessions:[],reason:'Unable to read workout history on this device.'}}
 };
 function recordsForLift(lift,cycleId,sessions){
  const found=[];
  const seen=new Set();
  for(const [position,session] of sessions.entries()){
   if(!Array.isArray(session?.exercises))continue;
   const id=String(session?.id??position);
   session.exercises.forEach((ex,index)=>{
    const link=ex?.ascensionLink;
    if(!link||link.cycleId!==cycleId||canonicalLift(link.lift)!==lift||
       !Number.isInteger(Number(link.week))||Number(link.week)<1||Number(link.week)>6)return;
    if(canonicalLift(ex.name)!==lift)return; // a substitute must not count
    const identity=id+'|'+lift+'|'+Number(link.week)+'|'+index;
    if(seen.has(identity))return;
    seen.add(identity);
    const sets=validWorking(ex);
    if(!sets.length)return;
    found.push({
     week:Number(link.week),date:dateValue(session),position,
     sessionId:id,sets:sets.length,estimatedMax:estimatedMax(sets),
     heaviest:Math.max(...sets.map(s=>Number(s.weight))),
     volume:round(sets.reduce((a,s)=>a+Number(s.weight)*Number(s.reps),0),0),
     avgRpe:effort(sets),highEffort:sets.some(s=>numeric(s.rpe)>=9.5)
    });
   });
  }
  // A repeated/edited week is not an additional progression week. The latest
  // linked session for that week is shown, rather than cherry-picking a PR.
  const weeks=new Map();
  for(const record of found){
   const previous=weeks.get(record.week);
   if(!previous||record.date>previous.date||(record.date===previous.date&&record.position>previous.position))
    weeks.set(record.week,record);
  }
  return [...weeks.values()].sort((a,b)=>a.week-b.week);
 }
 function analyseLift(lift,cycle,sessions){
  const records=recordsForLift(lift,cycle.id,sessions);
  const recent=records[records.length-1],before=records[records.length-2];
  const comparable=recent?.estimatedMax!=null&&before?.estimatedMax!=null;
  const delta=comparable&&before.estimatedMax>0?
   round(100*(recent.estimatedMax/before.estimatedMax-1),1):null;
  const weeks=Object.entries(cycle.weeks||{}).find(([key])=>canonicalLift(key)===lift);
  const currentWeek=Math.max(1,Math.min(6,Number(weeks?.[1]||cycle.currentWeek)||1));
  let status='baseline',title='Establish your baseline',reason='';
  if(!records.length){
   status='missing';
   title='No linked strength sessions yet';
   reason='Only completed workouts saved with this exact AscensionX cycle link count. Standalone training remains excluded.';
  }else if(records.length===1){
   title='One week of evidence';
   reason='A completed linked session is available. Keep the prescribed AscensionX progression; one week cannot establish a trend.';
  }else if(recent?.highEffort&&before?.highEffort&&delta!==null&&delta<0){
   status='caution';title='Monitor high effort';
   reason='Both recent linked weeks contain RPE 9.5+ sets, with a lower estimated top-set strength. Review sleep, form and accessory fatigue before adding workload.';
  }else if(delta!==null&&delta>=3){
   status='positive';title='Positive early strength signal';
   reason='Estimated top-set strength increased versus the prior linked week. This is encouraging, but different rep schemes and fatigue limit comparability.';
  }else if(delta!==null&&delta<=-4){
   status='watch';title='Review before adding assistance';
   reason='Estimated top-set strength decreased across linked weeks. This is a signal to watch, not proof of regression; retain the programmed main lift.';
  }else if(delta!==null){
   status='steady';title='Performance broadly stable';
   reason='Estimated top-set strength is within a modest range of the last linked week. Maintain prescribed loading and keep recording RPE.';
  }else{
   title='More comparable sets needed';
   reason='Continue recording valid working sets of ten reps or fewer to compare estimated top-set strength.';
  }
  const confidence=records.length<2?'insufficient':records.length<4?'early':'moderate';
  return {lift,week:currentWeek,recordedWeeks:records.length,records,status,
   confidence,title,reason,delta,latest:recent||null,
   action:status==='caution'||status==='watch'?'review_accessories':'keep_main_lift',
   mainLiftProtected:true};
 }
 function linkedExposure(cycleId,sessions){
  const grouping=global.SXProgrammeIntelligence;
  const counts={},last7=[],now=Date.now(),day=86400000;
  for(const session of sessions){
   const date=dateValue(session);
   if(!date||date>now+day||now-date>7*day)continue;
   const tagged=(session.exercises||[]).filter(ex=>{
    const meta=ex?.ascensionLink||ex?.sxStrengthSizeCompanion||ex?.sxPowerbuildingSupport;
    return meta?.cycleId===cycleId;
   });
   for(const ex of tagged){
    const count=validWorking(ex).length;
    if(!count)continue;
    const groups=grouping?.groups?.(ex.name)||[];
    for(const muscle of groups)counts[muscle]=(counts[muscle]||0)+count;
    last7.push({name:ex.name,sets:count,date});
   }
  }
  return {groups:counts,exercises:last7,totalWorkingSets:last7.reduce((sum,x)=>sum+x.sets,0),
   disclaimer:'Multi-joint exercises contribute to several muscle-group counts. These are training exposures, not measured recovery.'};
 }
 function reviewSchedule(schedule,exposure){
  if(!schedule?.valid)return [{status:'unknown',title:'Training schedule not available',
   detail:'Choose compatible days and keep all selected AscensionX main lifts separate.'}];
  const days=['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const active=schedule.slots||[],warnings=[];
  const major=active.filter(s=>s.kind==='ascension'&&['Back Squat','Deadlift'].includes(s.lift));
  for(const main of major){
   const index=days.indexOf(main.day);
   for(const slot of active.filter(s=>s.kind==='support')){
    const before=(index-days.indexOf(slot.day)+7)%7;
    if(before===0||before>2)continue;
    const loads=(slot.exercises||[]).filter(e=>
     /deadlift|romanian|rdl|good morning|back extension|leg press|hack squat|squat|lunge/i.test(e.name));
    if(loads.length)
     warnings.push({status:'review',title:'Potential lower-body overlap',
      detail:slot.day+' support work precedes '+main.day+' '+main.lift+
       ' by '+before+' day(s). Check '+loads.map(x=>x.name).join(', ')+' before adding fatigue.'});
   }
  }
  for(const [group,n] of Object.entries(exposure?.groups||{})){
   if(['Hamstrings','Quads','Glutes'].includes(group)&&n>=16)
    warnings.push({status:'review',title:'Review '+group.toLowerCase()+' exposure',
     detail:n+' linked working-set exposures in the last seven days. Compound sets can overlap; check effort and recovery before adding more.'});
  }
  return warnings.length?warnings:[{status:'ok',title:'No obvious scheduling conflict detected',
    detail:'The current template avoids obvious consecutive heavy lower-body assistance. This is not a guarantee of recovery.'}];
 }
 function analyseAscension(cycle,sessions=[],schedule=null){
  if(!cycle?.id||!Array.isArray(cycle?.lifts)||!cycle.lifts.length)
   return {status:'no-cycle',lifts:[],warnings:[],message:'No active AscensionX cycle in this browser.'};
  const selected=[...new Set(cycle.lifts.map(canonicalLift).filter(Boolean))];
  const relevant=Array.isArray(sessions)?sessions:[];
  const lifts=selected.map(lift=>analyseLift(lift,cycle,relevant));
  const exposure=linkedExposure(cycle.id,relevant);
  const warnings=reviewSchedule(schedule,exposure);
  const weeksWithEvidence=lifts.reduce((n,x)=>n+x.recordedWeeks,0);
  return {status:weeksWithEvidence?'evidence':'waiting',cycleId:cycle.id,lifts,warnings,
   exposure,recordedWeeks:weeksWithEvidence,readOnly:true,
   message:weeksWithEvidence?'Evidence from saved, cycle-linked working sets only.':
    'Your cycle is preserved. No saved, matching AscensionX main-lift sets were found on this device.'};
 }
 function analyseBodybuilding(programme,sessions=[],model=global.SXBodybuildingModel,
  prescription=global.SXProgrammeIntelligence){
  if(!programme?.id||!Array.isArray(programme?.sessions))
   return {status:'no-programme',decisions:[],message:'No active bodybuilding programme.'};
  const history=(Array.isArray(sessions)?sessions:[]).filter(s=>
   model?.linkedSession?.(s)?.programmeId===programme.id);
  const progress=model?.progress?.(programme,history);
  const week=progress?.week||1;
  const decisions=[];
  for(const day of programme.sessions){
   for(const ex of day.exercises||[]){
    const link={programmeId:programme.id,dayId:day.id};
    const prior=prescription?.priorPerformance?.(ex,history,link,week)||[];
    const prescriptionNext=prescription?.prescribe?.(ex,week,history,link);
    const recommendation=prescriptionNext?.recommendation;
    const count=prior.length;
    const status=count===0?'baseline':count<2?'early':recommendation?.status||'hold';
    decisions.push({day:day.name,exercise:ex.name,week,observations:count,
     status,confidence:count<2?'insufficient':count<4?'early':'moderate',
     prescribedKg:prescriptionNext?.startingKg??null,
     targetRpe:prescriptionNext?.targetRpe??null,
     reason:count<2?'Continue the linked programme to build a reliable trend.':
      recommendation?.reason||'Keep the current prescription.',
     automatic:status==='hold'||status==='baseline'?false:false});
   }
  }
  const days=programme.sessions.length;
  const complete=progress?.days||[];
  const rows=progress?.completeCount||0;
  const blocks=Array.from({length:Math.ceil(programme.weeks/4)},(_,i)=>{
   const start=i*4+1,end=Math.min(programme.weeks,start+3);
   let completed=0;
   for(let w=start;w<=end;w++)for(const day of programme.sessions){
    if(history.some(session=>Number(model?.linkedSession?.(session)?.week)===w&&
      model?.linkedSession?.(session)?.dayId===day.id&&
      model?.completion?.(session)?.complete===true))completed++;
   }
   return {start,end,completed,total:(end-start+1)*days};
  });
  // Every fully completed 4-week block is a review milestone. Don't lose the
  // week-4 review just because next programme week is already 5.
  const ready=blocks.filter(b=>b.end%4===0&&b.completed===b.total).at(-1);
  const upcoming=blocks.find(b=>b.completed<b.total)||blocks.at(-1);
  const block=ready||upcoming||{start:1,end:4,completed:0,total:4*days};
  const review={start:block.start,end:block.end,due:!!ready,
   completedBlockSessions:block.completed,blockSessions:block.total,
   completedSessions:rows,totalProgrammeSessions:days*programme.weeks,
   advice:ready?
     'Four-week review ready. Keep effective exercises; consider substitutions only after repeated underperformance and a recovery check. Proposed changes require explicit approval.':
     'Complete linked programme sessions to reach the next four-week review. Unlinked workouts are excluded.'};
  return {status:history.length?'evidence':'waiting',programmeId:programme.id,week,
   sessions:history.length,decisions,review,readOnly:true,
   message:'Only saved, linked programme sessions inform these recommendations.'};
 }
 function fromStorage(storage=global.localStorage){
  const data=safeSessions(storage),api=global.SXAscensionCompanion;
  const cycle=api?.cycle?.(storage),prefs=api?.preference?.(storage);
  const schedule=cycle?api?.schedule?.(prefs?.trainingDays,storage):null;
  const ascension=analyseAscension(cycle,data.sessions,schedule);
  const saved=global.SXBodybuildingModel?.read?.(storage);
  const programme=saved?.programmes?.find(p=>p.id===saved.activeId)||saved?.programmes?.[0]||null;
  const bodybuilding=analyseBodybuilding(programme,data.sessions);
  return {status:data.status,reason:data.reason,ascension,bodybuilding,cycle,
   programmeName:programme?.name||null,readOnly:true};
 }
 global.SXDecisionEngine=Object.freeze({
  LIFTS,canonicalLift,validSet,validWorking,estimatedMax,safeSessions,
  recordsForLift,analyseLift,analyseAscension,linkedExposure,reviewSchedule,
  analyseBodybuilding,fromStorage
 });
 if(typeof module!=='undefined'&&module.exports)module.exports=global.SXDecisionEngine;
})(typeof window!=='undefined'?window:globalThis);
