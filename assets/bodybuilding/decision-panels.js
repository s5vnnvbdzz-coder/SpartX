/* Read-only recommendation views shared by SpartanX and SpartanX Intelligence.
 * Never modifies workouts, training maxes, active cycles or programme plans.
 */
(function(global){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const $=id=>global.document?.getElementById(id);
 const fmt=n=>n==null||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('en-GB',{maximumFractionDigits:1});
 const statusClass=key=>key==='positive'?'good':key==='caution'||key==='watch'||key==='review'?'watch':'neutral';
 function load(){
  try{return global.SXDecisionEngine?.fromStorage?.(global.localStorage)}
  catch(_){return null}
 }
 const readOnlyMessage='<p class="sx-decision-foot">Analysis only. No strength percentages, training maxes, saved cycles or completed sessions have been changed. No recovery guarantees.</p>';
 function liftCards(report){
  return (report?.lifts||[]).map(lift=>{
   const last=lift.latest;
   const main=last?
    '<span>'+fmt(last.heaviest)+' kg top load</span><span>'+fmt(last.estimatedMax)+' kg estimated 1RM</span>'+
     (last.avgRpe!=null?'<span>Average RPE '+fmt(last.avgRpe)+'</span>':'<span>RPE not recorded</span>'):
    '<span>No saved linked working sets found yet</span>';
   return '<article class="sx-decision-lift"><div class="sx-decision-row">'+
    '<strong>'+esc(lift.lift)+'</strong><span class="sx-decision-label">'+esc(lift.recordedWeeks+' / 6 WEEKS LOGGED')+'</span></div>'+
    '<div class="sx-decision-meta"><span>CURRENT CYCLE: WEEK '+lift.week+'</span>'+
     '<span>'+esc(lift.confidence.toUpperCase())+' EVIDENCE</span></div>'+
    '<div class="sx-decision-measures">'+main+'</div>'+
    '<div class="sx-decision-signal '+statusClass(lift.status)+'"><strong>'+esc(lift.title)+'</strong>'+
     (lift.delta===null?'':'<span>'+esc(lift.delta>0?'+':'')+fmt(lift.delta)+'% estimated change vs prior linked week</span>')+'</div>'+
    '<p>'+esc(lift.reason)+'</p></article>';
  }).join('');
 }
 function power(id,snapshot){
  const host=$(id);if(!host)return;
  const data=snapshot||load(),report=data?.ascension;
  if(!data||data.status==='unavailable'){
   host.innerHTML='<article class="card sx-decision-card"><div class="eyebrow">SPARTAN INTELLIGENCE</div><h2>Training analysis unavailable</h2><p>'+esc(data?.reason||'Saved workout data cannot be read.')+'</p></article>';return;
  }
  if(!report||report.status==='no-cycle'){
   host.innerHTML='<article class="card sx-decision-card"><div class="eyebrow">SPARTAN INTELLIGENCE</div>'+
    '<h2>Cycle analysis will appear here</h2><p>Activate an AscensionX programme to review its completed, linked strength sessions.</p>'+readOnlyMessage+'</article>';return;
  }
  host.innerHTML='<article class="card sx-decision-card"><div class="sx-decision-head">'+
   '<div><div class="eyebrow">SPARTAN INTELLIGENCE · ASCENSIONX</div><h2>Strength cycle analysis</h2></div>'+
   '<span class="sx-decision-readonly">READ-ONLY</span></div>'+
   '<p class="sx-decision-intro">'+esc(report.message)+' Each lift remains on its own six-week progression, even when their current weeks differ.</p>'+
   '<div class="sx-decision-lift-grid">'+liftCards(report)+'</div>'+
   '<div class="sx-decision-subhead">WORKLOAD AND RECOVERY CHECK</div>'+
   '<div class="sx-decision-warnings">'+(report.warnings||[]).map(x=>
    '<div class="sx-decision-warning '+statusClass(x.status)+'"><strong>'+esc(x.title)+'</strong><p>'+esc(x.detail)+'</p></div>').join('')+'</div>'+
   '<p class="sx-decision-note">Recent linked working-set exposure: '+report.exposure.totalWorkingSets+
    ' sets in the last 7 days (strength and linked accessories). Unlinked workouts and draft sets are excluded.</p>'+
   readOnlyMessage+'</article>';
 }
 function body(id,snapshot){
  const host=$(id);if(!host)return;
  const data=snapshot||load(),report=data?.bodybuilding;
  if(!report||report.status==='no-programme'){
   host.innerHTML='<article class="card sx-decision-card"><div class="eyebrow">SPARTAN INTELLIGENCE</div>'+
    '<h2>Bodybuilding programme analysis</h2><p>Create or select a programme to build a linked-session performance history.</p></article>';return;
  }
  const withEvidence=report.decisions.filter(x=>x.observations>0);
  const show=(withEvidence.length?withEvidence:report.decisions).slice(0,8);
  host.innerHTML='<article class="card sx-decision-card"><div class="sx-decision-head">'+
   '<div><div class="eyebrow">SPARTAN INTELLIGENCE · BODYBUILDING</div><h2>Programme decision review</h2></div>'+
   '<span class="sx-decision-readonly">RECOMMENDATIONS</span></div>'+
   '<p class="sx-decision-intro">Linked workouts: '+report.sessions+'. Current training week: '+report.week+
     '. Standalone and unrelated workout sessions are excluded.</p>'+
   '<div class="sx-decision-compact-list">'+show.map(d=>'<div class="sx-decision-compact"><div>'+
    '<strong>'+esc(d.exercise)+'</strong><small>'+esc(d.day)+' · '+d.observations+
    ' linked observations · '+esc(d.confidence)+' evidence</small></div>'+
    '<p>'+esc(d.reason)+'</p></div>').join('')+'</div>'+
   (report.decisions.length>show.length?'<p class="sx-decision-note">Showing the first '+show.length+
    ' exercises with available evidence. Other programme exercises retain their planned targets.</p>':'')+
   '<div class="sx-decision-warning '+(report.review.due?'good':'neutral')+'">'+
    '<strong>FOUR-WEEK BLOCK REVIEW · '+(report.review.due?'READY':'GATHERING EVIDENCE')+'</strong>'+
    '<p>'+esc(report.review.advice)+'</p></div>'+readOnlyMessage+'</article>';
 }
 function intelligence(id,options={}){
  const host=$(id);if(!host)return;
  if(!String(options.mode||'').startsWith('spartanx')){
   host.innerHTML='<div class="eyebrow">PROGRAMME DECISION ENGINE</div><h3>Link your SpartanX training history</h3>'+
    '<p class="small-copy">Cycle-specific recommendations only appear for real, saved SpartanX workouts on this device. Demo data never affects your programmes.</p>';
   return;
  }
  const data=load();
  if(!data||data.status==='unavailable'){
   host.innerHTML='<div class="eyebrow">PROGRAMME DECISION ENGINE</div><h3>Training analysis unavailable</h3>'+
    '<p class="small-copy">'+esc(data?.reason||'Unable to read linked workout history.')+'</p>';
   return;
  }
  const r=data.ascension,active=r?.status!=='no-cycle',bodybuilding=data.bodybuilding;
  host.innerHTML='<div class="eyebrow">ASCENSIONX · PROGRAMME DECISION ENGINE</div>'+
   '<h3>Training decisions, grounded in your own linked sessions</h3>'+
   (active?'<p class="small-copy">'+esc(r.message)+'</p>'+
    '<div class="sx-decision-intel-lifts">'+(r.lifts||[]).map(l=>
     '<article class="sx-decision-intel-lift"><div class="sx-decision-row"><strong>'+esc(l.lift)+
     '</strong><small>Cycle week '+l.week+' · '+l.recordedWeeks+' logged week(s)</small></div>'+
     '<p>'+esc(l.title)+': '+esc(l.reason)+'</p></article>').join('')+'</div>':
    '<p class="small-copy">No active AscensionX cycle is available in this browser.</p>')+
   (bodybuilding?.status!=='no-programme'?
    '<p class="small-copy">Bodybuilding: '+bodybuilding.sessions+' linked saved sessions. Next block review: '+
     (bodybuilding.review.due?'ready':'awaiting completed linked sessions')+'.</p>':'')+
   '<p class="small-copy">Read-only · Existing AscensionX training maxes and all programmes remain unchanged.</p>'+
   '<a href="../?sxOpen=powerbuilding" class="sx-decision-link">OPEN FULL CYCLE ANALYSIS</a>';
 }
 global.SXDecisionPanels=Object.freeze({power,body,intelligence,load});
})(window);
