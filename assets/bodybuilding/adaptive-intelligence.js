/* SpartanX Adaptive Intelligence v1 — local, read-only athlete response checks.
 * All decisions are advisory. Never changes completed sets, active programmes,
 * training maxima or prescriptions. Only programme-linked saved workouts qualify.
 */
(function(root){
 'use strict';
 const VERSION='1.0.0',DAYS=['MON','TUE','WED','THU','FRI','SAT','SUN'];
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const finite=v=>v!==''&&v!=null&&Number.isFinite(Number(v))?Number(v):null;
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const effort=s=>{const n=finite(s?.rpe);return n!==null&&n>=6&&n<=10?n:null};
 const working=s=>s?.done===true&&!/^(?:w|x|warm.?up|cardio|excluded)$/i.test(String(s?.type||'working set').trim())&&
  finite(s.weight)!==null&&Number(s.weight)>=0&&Number(s.weight)<=1500&&
  Number.isInteger(finite(s.reps))&&Number(s.reps)>=1&&Number(s.reps)<=30;
 const stamp=s=>Date.parse(s?.savedAt||s?.date||s?.createdAt||'')||0;
 function linked(ex,session){
  const meta=ex?.ascensionLink||ex?.sxStrengthSizeCompanion||ex?.sxPowerbuildingSupport||ex?.sx531Link;
  if(meta?.cycleId||meta?.programmeId)return true;
  // Bodybuilding's programme link is stored on the session, not every exercise.
  try{return !!root.SXBodybuildingModel?.linkedSession?.(session)?.programmeId}catch(_){return false}
 }
 function profiles(sessions,options={}){
  const grouped=new Map(),max=Math.min(5000,Math.max(0,Number(options.maxSessions)||5000));
  for(const session of (Array.isArray(sessions)?sessions:[]).slice(-max)){
   if(!stamp(session)||!Array.isArray(session.exercises))continue;
   for(const ex of session.exercises.slice(0,60)){
    if(!ex?.name||!linked(ex,session))continue;
    const valid=(Array.isArray(ex.sets)?ex.sets:[]).filter(working);
    if(!valid.length)continue;
    const key=norm(ex.name);if(!key)continue;
    const old=grouped.get(key)||{name:String(ex.name).slice(0,90),observations:[]};
    // A workout contributes at most one exposure per exercise. Keep completed
    // set RPE, including repeat identical loads, rather than counting every
    // set as an independent training session.
    const sets=valid.filter(s=>effort(s)!==null).map(s=>({
     weight:Number(s.weight),reps:Number(s.reps),rpe:effort(s)}));
    old.observations.push({date:stamp(session),id:String(session.id||stamp(session)),sets,
     totalWorkingSets:valid.length});
    grouped.set(key,old);
   }
  }
  return [...grouped.values()].map(g=>{
   const unique=new Map();
   g.observations.sort((a,b)=>a.date-b.date).forEach(x=>unique.set(x.id+'|'+x.date,x));
   const observations=[...unique.values()].slice(-12),latest=observations.at(-1);
   let comparison=null;
   if(latest){
    for(const current of latest.sets.slice().sort((a,b)=>b.weight-a.weight)){
     for(const previous of observations.slice(0,-1).reverse()){
      const matches=previous.sets.filter(s=>s.weight===current.weight&&s.reps===current.reps);
      if(!matches.length)continue;
      const currentMatch=latest.sets.filter(s=>s.weight===current.weight&&s.reps===current.reps);
      const average=list=>list.reduce((sum,s)=>sum+s.rpe,0)/list.length;
      const delta=Math.round((average(currentMatch)-average(matches))*10)/10;
      comparison={weight:current.weight,reps:current.reps,deltaRpe:delta,
       earlierDate:previous.date,laterDate:latest.date};
      break;
     }
     if(comparison)break;
    }
   }
   const high=observations.slice(-3).filter(o=>o.sets.length&&
    o.sets.some(s=>s.rpe>=9.5)).length;
   let status='collect',title='Build a comparable history',detail='';
   if(observations.length<3){
    detail='Only '+observations.length+' linked session(s). Keep recording full working sets and RPE before interpreting a pattern.';
   }else if(comparison&&comparison.deltaRpe<=-0.5){
    status='easier';title='Same work feels easier';
    detail=comparison.weight+' kg × '+comparison.reps+' averaged '+Math.abs(comparison.deltaRpe)+
     ' RPE lower than a previous linked exposure. A useful individual signal, not proof of increased 1RM.';
   }else if(comparison&&comparison.deltaRpe>=0.5){
    status='harder';title='Same work feels harder';
    detail=comparison.weight+' kg × '+comparison.reps+' averaged '+comparison.deltaRpe+
     ' RPE higher than a previous linked exposure. Review recovery and training context before changing volume.';
   }else if(high>=2){
    status='watch';title='Repeated very hard sessions';
    detail='Two or more recent linked sessions included RPE 9.5+ working sets. Review fatigue and session placement; different loads may explain the effort.';
   }else if(comparison){
    status='steady';title='Comparable effort is stable';
    detail='Repeated work at '+comparison.weight+' kg × '+comparison.reps+
     ' was within 0.5 RPE. Maintain the current plan unless other evidence suggests otherwise.';
   }else{
    detail='Sessions are logged, but no comparable load-and-rep pair with RPE was found. Keep collecting evidence rather than inventing a trend.';
   }
   return {name:g.name,sessions:observations.length,status,title,detail,comparison,
    highEffortSessions:high,readOnly:true,confidence:observations.length<3?'insufficient':
     comparison?'early':'limited'};
  }).sort((a,b)=>b.sessions-a.sessions||a.name.localeCompare(b.name))
   .slice(0,Math.min(8,Math.max(1,Number(options.limit)||5)));
 }
 function reviewLive(live){
  if(!live||!['live','waiting'].includes(live.status))return [];
  return (Array.isArray(live.exercises)?live.exercises:[]).slice(0,30).flatMap(ex=>{
   const sets=(ex.sets||[]).filter(working),valid=sets.map(effort).filter(x=>x!==null);
   if(!sets.length)return [];
   const target=finite(ex.targetRpe),hasTarget=target!==null&&target>=6&&target<=10;
   const peak=valid.length?Math.max(...valid):null;
   if(peak===null)return [{exercise:ex.name,status:'collect',title:'RPE needed',
    detail:'Record effort for this exercise to compare the completed sets against the target.'}];
   if(hasTarget&&peak>=target+0.75){
    return [{exercise:ex.name,status:'review',title:'Above prescribed effort',
     detail:'Completed working set reached RPE '+peak+' versus target '+target+
      '. Check technique and rest before the next set. Consider adjusting remaining accessory work; never silently change an AscensionX or 5/3/1 main-lift prescription.'}];
   }
   if(!hasTarget&&valid.filter(x=>x>=9.5).length>=2){
    return [{exercise:ex.name,status:'review',title:'Repeated high effort',
     detail:'Multiple completed working sets reached RPE 9.5+. Review technique and fatigue before adding workload; no target RPE was available.'}];
   }
   return [];
  }).slice(0,4);
 }
 function upperOverlap(schedule){
  if(!schedule?.valid||!Array.isArray(schedule.slots))return [];
  const main=schedule.slots.filter(s=>s?.kind==='ascension'&&/bench|overhead/i.test(String(s.lift||'')));
  const support=schedule.slots.filter(s=>s?.kind==='support');
  const out=[];
  for(const lift of main){
   const mainDay=DAYS.indexOf(String(lift.day||'').toUpperCase());
   if(mainDay<0)continue;
   for(const slot of support){
    const prev=DAYS.indexOf(String(slot.day||'').toUpperCase());
    if(prev<0||(mainDay-prev+7)%7!==1)continue;
    const conflict=(slot.exercises||[]).filter(e=>/bench|chest press|shoulder press|overhead press|dip|push.?up|skull.?crusher|triceps|pushdown/i.test(String(e.name||'')));
    if(conflict.length)out.push({status:'review',title:'Potential pressing overlap',
     detail:slot.day+' assistance ('+conflict.slice(0,3).map(e=>e.name).join(', ')+
      ') sits the day before '+lift.day+' '+lift.lift+'. Check effort and recovery before adding pressing volume.'});
   }
  }
  return out.slice(0,4);
 }
 function render(target='sxAdaptiveIntelligence',options={}){
  const host=root.document?.getElementById?.(target);if(!host)return;
  if(options.demo===true||options.mode==='import'){
   host.innerHTML='<div class="eyebrow">SPARTAN INTELLIGENCE · ADAPTIVE</div><h3>Athlete response</h3><p>Connect your saved SpartanX training history on this device for personalised signals. Demonstration and imported previews cannot change your real programme.</p>';
   return;
  }
  let saved={sessions:[],status:'empty'},live=null,cycle=null,warnings=[];
  try{
   saved=root.SXDecisionEngine?.safeSessions?.(root.localStorage)||saved;
   live=root.SXBridge?.readLive?.(root.localStorage);
   const companion=root.SXAscensionCompanion;
   if(companion?.cycle?.(root.localStorage)){
    const pref=companion?.preference?.(root.localStorage);
    cycle=companion?.schedule?.(pref?.trainingDays,root.localStorage);
    warnings=(root.SXDecisionEngine?.reviewSchedule?.(cycle,{groups:{}})||[])
     .filter(x=>x.status==='review');
   }
  }catch(_){}
  const history=profiles(saved.sessions),sessionAdvice=reviewLive(live);
  warnings.push(...upperOverlap(cycle));
  const hasEvidence=history.some(x=>x.sessions>=3);
  const card=r=>'<div style="padding:11px 0;border-top:1px solid var(--line,#303030)">'+
   '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>'+esc(r.name||r.exercise||r.title)+
   '</strong><small>'+esc(r.sessions!=null?r.sessions+' linked sessions':r.status==='review'?'REVIEW':'LIVE')+'</small></div>'+
   '<p style="margin:4px 0 0;color:var(--muted,#aaa);font-size:13px"><strong>'+esc(r.title)+'</strong> · '+
   esc(r.detail)+'</p></div>';
  host.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">'+
   '<div><div class="eyebrow">SPARTAN INTELLIGENCE · ADAPTIVE</div><h3>Athlete response &amp; session decisions</h3></div>'+
   '<span class="micro-tag">'+(hasEvidence?'EARLY PERSONAL SIGNALS':'COLLECTING EVIDENCE')+'</span></div>'+
   '<p style="margin:9px 0;color:var(--muted,#aaa)">Uses completed, programme-linked sets and matching RPE where available. No automatic changes to a current cycle or training max.</p>'+
   '<h4 style="margin:16px 0 4px">How your training is responding</h4>'+
   (history.length?history.map(card).join(''):'<p>No qualifying linked working-set history yet. Standalone workouts are excluded.</p>')+
   '<h4 style="margin:16px 0 4px">Live effort check</h4>'+
   (sessionAdvice.length?sessionAdvice.map(card).join(''):
    '<p style="color:var(--muted,#aaa)">No current session requires an RPE-based review. Complete and rate working sets to receive live guidance.</p>')+
   '<h4 style="margin:16px 0 4px">Upcoming session interference</h4>'+
   (warnings.length?warnings.slice(0,5).map(card).join(''):
    '<p style="color:var(--muted,#aaa)">'+(cycle?.valid?'No obvious conflicts flagged in the current schedule.':'No compatible active AscensionX schedule found for a whole-week check.')+'</p>')+
   '<p style="font-size:11px;color:var(--muted,#aaa);margin-top:14px">Read-only decision support, not a validated measure of recovery or a guarantee against interference. Missing RPE, inconsistent exercise naming and unsynchronised sessions reduce confidence.</p>';
 }
 root.SXAdaptiveIntelligence=Object.freeze({VERSION,profiles,reviewLive,upperOverlap,render});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SXAdaptiveIntelligence;
})(typeof window!=='undefined'?window:globalThis);
