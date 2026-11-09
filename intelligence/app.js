/* SpartanX Intelligence v0.1 — dashboard controller (read-only).
   No calls to the SpartanX app, network endpoints, or external SDKs. */
(function () {
  'use strict';
  const E=window.SXEngine;
  const Bridge=window.SXBridge;
  if(!E){document.body.textContent='Unable to load SpartanX Intelligence analytics engine.';return;}
  const $=id=>document.getElementById(id);
  const escapeHtml=str=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=(n,max=0)=>Number.isFinite(n)?n.toLocaleString('en-GB',{maximumFractionDigits:max}):'—';
  const fmtKg=n=>Number.isFinite(n)?format(n,1)+' kg':'—';
  const formatPct=n=>n==null?'—':(n>0?'+':'')+format(n,1)+'%';
  const core=E.CORE;
  const SECTION_KEY='sx_intelligence_active_section_v1';
  const SECTION_NAMES=['overview','performance','muscles','intelligence'];
  const sectionValid=value=>SECTION_NAMES.includes(value);
  function initialSection(){
    const query=new URLSearchParams(window.location.search).get('tab');
    if(sectionValid(query))return query;
    try{
      const stored=localStorage.getItem(SECTION_KEY);
      if(sectionValid(stored))return stored;
    }catch(_){}
    return 'overview';
  }
  const state={tab:'overview',range:90,selectedLift:'Bench Press',overviewLift:'Bench Press',athlete:'strength',goals:{},source:'demo',profile:null,analysis:null,live:null,liveSummary:null,liveLift:'',liveSignature:''};
  const titles={
    overview:['YOUR TRAINING, DECODED','Athlete Dashboard','Every set is data. Every session is progress.'],
    performance:['STRENGTH & PROGRESSION','Performance Analytics','Understand your strength trends and track meaningful goals.'],
    muscles:['TRAINING EXPOSURE','Muscle Workload','Track where your weekly training effort is going.'],
    intelligence:['SMART TRAINING DECISIONS','SpartanX Intelligence','Explainable recommendations based on your training history.']
  };
  const defaultGoal={'Squat':200,'Bench Press':160,'Deadlift':230,'Overhead Press':100};
  const savedGoalsKey='sx_intelligence_demo_goals_v1';
  const linkedGoalsKey='sx_intelligence_linked_goals_v1';
  let toastTimer;
  function toast(msg){
    const node=$('toast');node.textContent=msg;node.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2700);
  }
  function readSavedGoals(){
    try{const g=JSON.parse(localStorage.getItem(savedGoalsKey)||'{}');return g&&typeof g==='object'?g:{}}catch(_){return{}}
  }
  function saveGoals(){
    // Only Intelligence-owned keys are writable; SpartanX workouts stay untouched.
    try{
      if(state.source==='demo'){
        const saved=readSavedGoals();saved[state.athlete]=state.goals;
        localStorage.setItem(savedGoalsKey,JSON.stringify(saved));
        return true;
      }
      if(state.source.startsWith('spartanx')){
        localStorage.setItem(linkedGoalsKey,JSON.stringify(state.goals));
        return true;
      }
      // Manually imported workout previews are held in memory, by design.
      return null;
    }catch(_){return false}
  }
  function readLinkedGoals(){
    try{const saved=JSON.parse(localStorage.getItem(linkedGoalsKey)||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{}}catch(_){return{}}
  }
  function loadDemo(type){
    state.profile=E.makeDemoProfile(type);
    state.athlete=type;
    state.source='demo';
    state.goals=Object.assign({},state.profile.goals,readSavedGoals()[type]||{});
    $('athleteSelect').value=type;
    $('modePill').textContent='● DEMO DATA';
    $('dataBanner').innerHTML='<span class="banner-symbol">ⓘ</span><span><strong>Demonstration mode</strong> — All training data is fictional. Recommendations are previews and must not be treated as individual coaching advice.</span>';
    state.analysis=E.analyse(state.profile.sessions,state.range);
    renderAll();
  }

  // The provisional panel NEVER enters state.profile.sessions or E.analyse().
  // SpartanX's historical charts use finished and saved workouts only.
  function renderLivePanel(){
    const section=$('liveSessionSection');
    if(!section)return;
    const live=state.live,summary=state.liveSummary;
    const active=state.source.startsWith('spartanx')&&['live','waiting'].includes(live?.status);
    section.hidden=!active;
    if(!active)return;
    $('liveWorkoutTitle').textContent=live.name||'Active workout';
    const elapsed=Math.floor(Math.max(0,Number(live.elapsed)||0)/60);
    $('liveWorkoutStatus').textContent=(live.paused?'Paused · ':'')+
      (elapsed>=60?Math.floor(elapsed/60)+' h '+elapsed%60+' min':elapsed+' min')+
      ' · '+summary.sets+' completed sets · not saved yet';
    const metric=(label,value,sub)=>
      '<div class="sx-live-metric"><small>'+escapeHtml(label)+'</small><strong>'+escapeHtml(String(value))+
      '</strong><span>'+escapeHtml(sub)+'</span></div>';
    $('liveSessionMetrics').innerHTML=
      metric('Completed sets',format(summary.sets),summary.workingSets+' working · '+summary.warmupSets+' other')+
      metric('Total volume',format(summary.volumeKg,1)+' kg','All checked resistance sets')+
      metric('Working volume',format(summary.workingVolumeKg,1)+' kg','Completed working sets only')+
      metric('Average RPE',summary.avgRpe==null?'—':format(summary.avgRpe,1),
       summary.avgRpe==null?'Log RPE on working sets':summary.highEffort+' sets at RPE 9+');
    const detail=$('liveWorkoutDetails');
    if(!summary.selected){
      detail.hidden=false;
      $('liveExerciseTitle').textContent='Waiting for completed sets';
      $('liveExerciseSelect').innerHTML='<option value="">No completed exercises</option>';
      $('liveExerciseSelect').disabled=true;
      $('liveExerciseCompare').innerHTML='<div class="sx-live-waiting">Finish and tick a valid set in SpartanX to start live exercise analysis.</div>';
      $('liveExerciseSets').innerHTML='';
      $('liveExerciseAdvice').innerHTML='';
      return;
    }
    detail.hidden=false;
    $('liveExerciseSelect').disabled=false;
    const exercise=summary.selected;
    state.liveLift=exercise.name;
    $('liveExerciseTitle').textContent=exercise.name;
    $('liveExerciseSelect').innerHTML=summary.exercises.map(ex=>
      '<option value="'+escapeHtml(ex.name)+'" '+(ex.name===exercise.name?'selected':'')+'>'+escapeHtml(ex.name)+'</option>').join('');
    const deltaText=n=>n==null?'No comparison':(n>0?'+':'')+format(n,1)+'%';
    const deltaClass=n=>n==null?'':n>0?'positive':n<0?'negative':'';
    const mini=(title,value,sub,cls='')=>'<div class="sx-live-mini"><small>'+escapeHtml(title)+
      '</small><strong>'+escapeHtml(value)+'</strong><em class="'+cls+'">'+escapeHtml(sub)+'</em></div>';
    $('liveExerciseCompare').innerHTML=
      mini('Estimated top-set 1RM',exercise.bestE1rm==null?'—':fmtKg(exercise.bestE1rm),
        exercise.bestE1rm==null?'Needs a 1–12 rep working set':'Epley estimate; not a verified max')+
      mini('Vs last saved top set',deltaText(exercise.estimateDelta),
        exercise.estimateDelta==null?'No comparable saved set':'Estimated 1RM comparison',deltaClass(exercise.estimateDelta))+
      mini('Working volume',fmtKg(exercise.workVolumeKg),
        exercise.volumeDelta==null?'Live partial session':deltaText(exercise.volumeDelta)+' vs previous full session',deltaClass(exercise.volumeDelta));
    $('liveExerciseSets').innerHTML='<strong>COMPLETED SETS · '+exercise.completed+'</strong>'+
      exercise.sets.map((set,index)=>{
        const main=window.SXLive.working(set);
        return '<div class="sx-live-set-row"><span class="sx-live-set-tag">'+(main?'SET':'OTHER')+' '+escapeHtml(String(set.index||index+1))+
        '</span><span>'+escapeHtml(format(set.weight,1)+' kg × '+set.reps+' reps')+
        '</span><span>'+escapeHtml(String(set.type||'Working Set'))+
        '</span><span>'+(set.rpe==null?'RPE —':'RPE '+escapeHtml(format(set.rpe,1)))+'</span></div>';
      }).join('');
    const signals=[{tag:'EFFORT / FATIGUE SIGNAL',data:exercise.fatigue},{tag:'NEXT-SESSION GUIDANCE',data:exercise.advice}];
    $('liveExerciseAdvice').innerHTML=signals.map(item=>
      '<article class="'+escapeHtml(item.data.kind)+'"><span class="sx-live-advice-tag">'+item.tag+
      '</span><h4>'+escapeHtml(item.data.title)+'</h4><p>'+escapeHtml(item.data.detail)+'</p></article>').join('');
  }
  function refreshLiveOnly(repaint=true){
    if(!state.source.startsWith('spartanx'))return;
    const live=window.SXBridge?.readLive?.()||{status:'idle',exercises:[]};
    // SpartanX saves its draft frequently. Avoid rerendering for irrelevant
    // elapsed-second changes when no set, RPE, or exercise data has changed.
    const signature=JSON.stringify([live.status,live.name,live.paused,Math.floor((live.elapsed||0)/60),live.exercises]);
    if(repaint&&signature===state.liveSignature)return;
    state.liveSignature=signature;
    state.live=live;
    state.liveSummary=window.SXLive.summarise(live,state.profile?.sessions||[],state.liveLift);
    if(repaint)renderLivePanel();
  }

  function loadSpartanX(silent=false){
    const result=Bridge?.read();
    const status=result?.status||'unavailable';
    const connected=status==='connected';
    // Intentionally show an empty dashboard, never switch silently to fictional data.
    state.profile={
      name:connected?(result.profile?.name||'SpartanX Athlete'):'SpartanX Athlete',
      label:connected?'Your completed workouts':'No saved workouts available',
      sessions:connected?result.sessions:[],
      isDemo:false
    };
    state.source=connected?'spartanx':'spartanx-'+status;
    state.goals=Object.assign({},defaultGoal,readLinkedGoals());
    refreshLiveOnly(false);
    const hasLive=['live','waiting'].includes(state.live?.status);
    $('modePill').textContent=hasLive?'● LIVE SESSION':connected?'● CONNECTED':'● '+(status==='empty'?'NO WORKOUTS':'NOT CONNECTED');
    const line=connected
      ?'<strong>Connected to SpartanX · '+result.sessions.length+' saved workouts.</strong> The Live Session panel separately reads completed sets from an active workout. Historical charts only use saved sessions; your records are not changed.'
      :hasLive
      ?'<strong>Active SpartanX workout connected.</strong> Live completed sets are available below. You have no saved workout history in this browser yet, so comparisons remain unavailable until Finish &amp; Save.'
      :'<strong>SpartanX history not available here.</strong> '+escapeHtml(result?.reason||'Unable to read this device’s workouts.')+' Open Intelligence using the button on SpartanX Home on the same device, or import a backup. iPhone Safari and Home Screen apps can use separate storage.';
    $('dataBanner').innerHTML='<span class="banner-symbol">ⓘ</span><span>'+line+' <a class="sx-back-link" href="../">Back to SpartanX</a></span>';
    const detail=$('connectionDetails');
    if(detail)detail.textContent=connected
      ?'Connected to '+result.sessions.length+' valid completed workouts (read-only)'+(hasLive?' and an active draft.':'.')
      :hasLive?'Active unsaved workout connected; no prior saved sessions found.':result?.reason||'Unable to find SpartanX workout history in this browser.';
    renderAll();
    if(!silent)toast(hasLive?'Live workout connected':connected?'SpartanX workouts loaded: '+result.sessions.length:'No local workout history found.');
    return connected||hasLive;
  }
  function loadImported(raw){
    const src=Array.isArray(raw)?raw:raw?.sessions||raw?.db?.sessions||raw?.data?.sessions;
    if(!Array.isArray(src))throw new Error('No sessions array found. Choose a SpartanX JSON workout export.');
    if(src.length>5000)throw new Error('This preview supports a maximum of 5,000 workouts.');
    const sessions=E.normalizeSessions(src);
    if(sessions.length===0)throw new Error('No valid completed workouts were found.');
    state.profile={name:'Imported Athlete',label:'Local JSON Preview',sessions,isDemo:false};
    state.source='import';
    state.goals=Object.assign({},defaultGoal);
    $('modePill').textContent='● LOCAL IMPORT';
    $('dataBanner').innerHTML='<span class="banner-symbol">ⓘ</span><span><strong>Local preview</strong> — You loaded '+sessions.length+' workout sessions from a JSON file. The data is held only in this tab and is not synced to SpartanX or uploaded.</span>';
    state.analysis=E.analyse(sessions,state.range);
    renderAll();
    return sessions.length;
  }
  function setTab(tab){
    if(!titles[tab])return;
    state.tab=tab;
    try{localStorage.setItem(SECTION_KEY,tab)}catch(_){}
    try{
      const url=new URL(window.location.href);
      url.searchParams.set('tab',tab);
      window.history.replaceState(null,'',url.pathname+url.search+url.hash);
    }catch(_){}
    document.querySelectorAll('[data-page]').forEach(el=>{const active=el.dataset.page===tab;el.hidden=!active;el.classList.toggle('active',active)});
    document.querySelectorAll('[data-tab]').forEach(btn=>{const active=btn.dataset.tab===tab;btn.classList.toggle('active',active);if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
    const title=titles[tab];$('sectionKicker').textContent=title[0];$('pageTitle').textContent=title[1];$('pageSubtitle').textContent=title[2];
    document.querySelector('.main-shell').scrollIntoView({behavior:'instant',block:'start'});
    renderAll();
  }
  function pathChart(records,large=false){
    if(!records||records.length===0)return '<div class="chart-empty">No completed comparable sets in this range yet.</div>';
    const width=650,height=large?258:190,padLeft=44,padRight=15,padTop=23,padBottom=35;
    const values=records.map(r=>r.max),min=Math.min(...values),max=Math.max(...values);
    const margin=Math.max(3,(max-min)*.19),lo=Math.max(0,min-margin),hi=max+margin;
    const plotW=width-padLeft-padRight,plotH=height-padTop-padBottom;
    const xx=i=>padLeft+(records.length===1?plotW/2:plotW*i/(records.length-1));
    const yy=v=>padTop+(hi-v)/(hi-lo)*plotH;
    const path=records.map((r,i)=>(i?'L':'M')+xx(i).toFixed(1)+' '+yy(r.max).toFixed(1)).join(' ');
    const fill=path+' L'+xx(records.length-1).toFixed(1)+' '+(padTop+plotH)+' L'+xx(0).toFixed(1)+' '+(padTop+plotH)+' Z';
    const guides=[0,.5,1].map(t=>{
      const y=padTop+t*plotH,n=hi-t*(hi-lo);
      return '<line x1="'+padLeft+'" x2="'+(width-padRight)+'" y1="'+y+'" y2="'+y+'" stroke="#35363b" stroke-dasharray="4 6"/><text x="'+(padLeft-8)+'" y="'+(y+3)+'" text-anchor="end" fill="#777c83" font-size="10">'+format(n,0)+'</text>';
    }).join('');
    const first=new Date(records[0].date),last=new Date(records.at(-1).date);
    const label=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    const dots=records.slice(-1).map((r,i)=>'<circle cx="'+xx(records.length-1)+'" cy="'+yy(r.max)+'" r="5.5" fill="#f4cd37" stroke="#181a1d" stroke-width="3"/>').join('');
    const grid='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Estimated one rep max, from '+format(min,1)+' to '+format(max,1)+' kilograms"><defs><linearGradient id="'+(large?'strengthFillLarge':'strengthFillSmall')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f4cd37" stop-opacity=".23"/><stop offset="100%" stop-color="#f4cd37" stop-opacity="0"/></linearGradient></defs>'+guides+
    '<path d="'+fill+'" fill="url(#'+(large?'strengthFillLarge':'strengthFillSmall')+')"/><path d="'+path+'" fill="none" stroke="#f4cd37" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+dots+
    '<text x="'+padLeft+'" y="'+(height-9)+'" fill="#898e96" font-size="10">'+label(first)+'</text><text x="'+(width-padRight)+'" y="'+(height-9)+'" fill="#898e96" font-size="10" text-anchor="end">'+label(last)+'</text></svg>';
    return grid;
  }
  function kpi(label,value,sub,icon){
    return '<article class="kpi'+(label==='Training volume'?' kpi-volume':'')+'"><div class="kpi-top"><span>'+escapeHtml(label)+'</span><span class="kpi-icon" aria-hidden="true">'+icon+'</span></div><div class="kpi-value">'+escapeHtml(value)+'</div><div class="kpi-sub">'+sub+'</div></article>';
  }
  function renderKpis(){
    const lift=state.overviewLift;
    const metrics=state.analysis.byLift[lift];
    const period=state.range===0?'All time':'Last '+state.range+' days';
    const delta=metrics.trend;
    const deltaSub=delta==null?'At least two comparable sessions needed':
      '<span class="'+(delta>=0?'positive':'negative')+'">'+formatPct(delta)+'</span> estimated 1RM change';
    $('snapshotTitle').textContent=lift+' performance snapshot';
    $('snapshotSubtitle').textContent='All four metrics reflect '+lift+' · '+period.toLowerCase();
    $('kpiGrid').innerHTML=
      kpi('Lift sessions',format(metrics.sessions),period+' · '+escapeHtml(lift),'▣')+
      kpi('Training volume',format(metrics.volumeKg)+' kg','Working sets × reps × kg · '+period,'▤')+
      kpi('Strength trend',formatPct(delta),deltaSub,'↗')+
      kpi('Training days',format(metrics.activeDays),'Unique '+escapeHtml(lift)+' training days','◷');
  }
  function renderOverview(){
    renderKpis();
    const records=state.analysis.strength[state.overviewLift].records;
    $('overviewChartTitle').textContent=state.overviewLift+' estimated 1RM';
    $('overviewStrengthChart').innerHTML=pathChart(records,false);
    const items=E.insights(state.analysis);
    $('overviewInsights').innerHTML=items.slice(0,3).map(x=>'<article class="insight-mini"><div class="insight-head '+x.kind+'">'+escapeHtml(x.title)+'</div><p>'+escapeHtml(x.text)+'</p></article>').join('');
    $('consistencyTitle').textContent=state.overviewLift+' training consistency';
    $('consistencySubtitle').textContent='Sessions containing '+state.overviewLift+' over the last eight weeks';
    const weeks=state.analysis.weeklyByLift[state.overviewLift];
    const max=Math.max(4,...weeks.map(x=>x.count));
    $('consistencyChart').innerHTML='<div class="week-bars">'+weeks.map(x=>{
      const size=Math.max(4,Math.round(x.count/max*82));
      return '<div class="week-col"><span class="week-value">'+x.count+'</span><span class="week-bar" style="height:'+size+'px"></span><small>W'+x.week+'</small></div>';
    }).join('')+'</div>';
  }
  function selectLift(name){
    if(!core.includes(name))return;
    state.selectedLift=name;
    $('goalStatus').textContent='';
    renderPerformance();
  }
  function renderPerformance(){
    const stats=state.analysis.strength;
    $('liftTabs').innerHTML=core.map(name=>'<button type="button" class="lift-tab '+(state.selectedLift===name?'active':'')+'" data-lift="'+escapeHtml(name)+'">'+escapeHtml(name)+'</button>').join('');
    const s=stats[state.selectedLift];
    $('performanceTitle').textContent=state.selectedLift+' estimated 1RM';
    $('performanceChart').innerHTML=pathChart(s.records,true);
    $('goalTitle').textContent=state.selectedLift;
    $('currentMax').textContent=s.latest?fmtKg(s.latest.max):'—';
    const goal=state.goals[state.selectedLift]||defaultGoal[state.selectedLift];
    $('goalValue').textContent=fmtKg(goal);
    // Do not overwrite an in-progress edit when analysis is refreshed.
    if(document.activeElement!==$('goalInput'))$('goalInput').value=String(goal);
    const pct=s.latest?Math.round(100*s.latest.max/goal):0;
    $('goalBar').style.width=Math.min(100,pct)+'%';
    $('goalExplanation').textContent=s.latest?format(pct)+'% of the selected target based on your latest estimated top-set strength.':'No recent comparable work sets for this exercise.';
    $('strengthTable').innerHTML=core.map(name=>{
      const row=stats[name];
      const sign=row.delta==null?'':row.delta>0?'trend-positive':row.delta<0?'trend-negative':'';
      return '<tr><td>'+escapeHtml(name)+'</td><td>'+fmtKg(row.latest?.max)+'</td><td>'+fmtKg(row.best)+'</td><td class="'+sign+'">'+formatPct(row.delta)+'</td><td>'+row.records.length+'</td></tr>';
    }).join('');
  }
  function renderMuscles(){
    const rows=state.analysis.muscleRows;
    // Reuse SpartanX's existing anatomy renderer rather than a second,
    // simplified silhouette. Only genuinely logged recent working sets are
    // highlighted; the detailed counts below remain the authoritative data.
    const mapNode=$('sxIntelligenceBodyMap');
    const anatomy=window.SpartanXAnatomy;
    if(mapNode && anatomy && typeof anatomy.render==='function'){
      const muscleKeys={
        'chest':['chest'],'quads':['quads'],'hamstrings':['hamstrings'],
        'glutes':['glutes'],'calves':['calves'],'back':['back'],
        'shoulders':['shoulders'],'triceps':['triceps'],
        'biceps':['biceps'],'traps':['traps'],'core':['core'],
        'posterior chain':['glutes','hamstrings']
      };
      const primary=new Set(rows.filter(row=>row.sets>0)
        .flatMap(row=>muscleKeys[String(row.name).toLowerCase()]||[]));
      let gender='male';
      // The SpartanX profile's anatomy preference is already saved locally.
      // Read without modifying the existing athlete profile or workouts.
      if(state.source.startsWith('spartanx')){
        try{
          const saved=localStorage.getItem('spartx_db');
          if(saved && saved.length<=12*1024*1024){
            const profile=JSON.parse(saved)?.profile;
            if(profile?.standard==='female')gender='female';
          }
        }catch(_){}
      }
      mapNode.innerHTML=anatomy.render(primary,new Set(),{gender});
      mapNode.setAttribute('aria-label',primary.size
        ?'Front and back SpartanX muscle map: '+[...primary].join(', ')+' highlighted as trained in the last seven days.'
        :'Front and back SpartanX muscle map: no recognised muscle groups trained in the last seven days.');
    }
    $('muscleGrid').innerHTML=rows.length?rows.map(row=>{
      const pct=Math.min(100,row.sets/16*100);
      const days=row.daysSince===0?'Trained today':row.daysSince===1?'Last trained yesterday':'Last trained '+row.daysSince+' days ago';
      const grade=row.sets>=10?'HIGH':row.sets>=4?'MODERATE':'LOW';
      return '<article class="muscle-card"><div class="muscle-card-head"><strong>'+escapeHtml(row.name)+'</strong><span class="flag '+(row.sets>=10?'positive':'neutral')+'">'+grade+'</span></div><div class="sets-count">'+row.sets+'<small>WORKING SETS · 7 DAYS</small></div><div class="muscle-track"><i style="width:'+pct+'%"></i></div><div class="muscle-card-foot"><span class="recent">'+escapeHtml(days)+'</span></div></article>';
    }).join(''):'<div class="panel">No workout history available for workload analysis.</div>';
  }
  function renderIntelligence(){
    const stats=state.analysis.strength;
    $('recommendationGrid').innerHTML=core.map(name=>{
      const records=stats[name].records,rec=E.recommendation(name,records);
      const latest=records.at(-1);
      const suggestion=rec.next==null?'Collect more sessions':rec.next===latest?.set.weight?'Maintain '+fmtKg(rec.next):rec.next>latest?.set.weight?'Consider '+fmtKg(rec.next):'Consider '+fmtKg(rec.next);
      return '<article class="recommend-card"><div class="recommend-top"><div><h3>'+escapeHtml(name)+'</h3><p>Based on most recent comparable top sets</p></div><span class="flag '+rec.kind+'">'+escapeHtml(rec.kind==='positive'?'PROGRESS':rec.kind==='caution'?'REVIEW':'STEADY')+'</span></div><div class="recommend-label">RECOMMENDATION</div><div class="recommend-title">'+escapeHtml(rec.title)+'</div><p>'+escapeHtml(rec.detail)+'</p><div class="recommend-foot"><span>Suggested load: <strong>'+escapeHtml(suggestion)+'</strong></span><span>Confidence: <strong>'+escapeHtml(rec.confidence)+'</strong></span></div></article>';
    }).join('');
    $('allInsights').innerHTML=E.insights(state.analysis).map(x=>'<article class="insight-card"><span class="insight-kicker '+x.kind+'">'+(x.kind==='positive'?'POSITIVE TREND':x.kind==='caution'?'WORTH REVIEWING':'TRAINING OBSERVATION')+'</span><h3>'+escapeHtml(x.title)+'</h3><p>'+escapeHtml(x.text)+'</p></article>').join('');
  }
  function renderAll(){
    if(!state.profile)return;
    state.analysis=E.analyse(state.profile.sessions,state.range);
    renderOverview();renderPerformance();renderMuscles();renderIntelligence();renderLivePanel();
  }
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.go)));
  $('rangeSelect').addEventListener('change',e=>{state.range=Number(e.target.value);renderAll()});
  $('liveExerciseSelect').addEventListener('change',e=>{
    state.liveLift=e.target.value;
    state.liveSummary=window.SXLive.summarise(state.live,state.profile?.sessions||[],state.liveLift);
    renderLivePanel();
  });
  $('overviewLift').addEventListener('change',e=>{state.overviewLift=e.target.value;renderOverview()});
  $('liftTabs').addEventListener('click',e=>{const target=e.target.closest('[data-lift]');if(target)selectLift(target.dataset.lift)});
  const goalField=$('goalInput');
  // Text input + numeric keyboard allows full text selection on mobile Safari.
  // Native <input type=number min=1 step=2.5> rejected valid goals such as
  // 160 kg without firing submit; validate the decimal ourselves instead.
  function selectGoalText(){
    try{goalField.select()}catch(_){}
  }
  goalField.addEventListener('focus',selectGoalText);
  goalField.addEventListener('click',selectGoalText);
  $('goalForm').addEventListener('submit',e=>{
    e.preventDefault();
    const typed=goalField.value.trim().replace(',', '.');
    const valid=/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(typed);
    const n=valid?Number(typed):NaN;
    if(!Number.isFinite(n)||n<1||n>1500){
      $('goalStatus').textContent='Enter a target between 1 and 1,500 kg.';
      toast('Enter a valid target from 1 to 1,500 kg.');
      return;
    }
    state.goals[state.selectedLift]=n;
    const saved=saveGoals();
    goalField.blur();
    renderPerformance();
    $('goalStatus').textContent=saved===false
      ?'Target updated, but this browser could not save it for next time.'
      :saved===null?'Target updated for this preview.'
      :'Saved '+state.selectedLift+' target: '+fmtKg(n)+'.';
    toast(saved===false?'Goal updated for now; local storage is unavailable.':'Saved '+state.selectedLift+' goal: '+fmtKg(n));
  });
  const dialog=$('sourceDialog');
  $('openSource').addEventListener('click',()=>dialog.showModal());
  $('connectSpartanX').addEventListener('click',()=>{const ok=loadSpartanX();if(ok)dialog.close()});
  $('refreshSpartanX').addEventListener('click',()=>{const ok=loadSpartanX();if(ok)dialog.close()});
  $('applyDemo').addEventListener('click',()=>{loadDemo($('athleteSelect').value);dialog.close();toast('Demo athlete loaded.')});
  $('resetDemo').addEventListener('click',()=>{loadDemo('strength');dialog.close();toast('Demo data restored.')});
  $('importInput').addEventListener('change',async e=>{
    const file=e.target.files?.[0],status=$('importStatus');if(!file)return;
    status.classList.remove('error');status.textContent='Reading locally...';
    if(file.size>10*1024*1024){status.classList.add('error');status.textContent='File exceeds the 10 MB preview limit.';return;}
    try{
      const raw=JSON.parse(await file.text());
      const count=loadImported(raw);
      status.textContent='Loaded '+count+' valid workout sessions. No data was uploaded.';
      dialog.close();setTab('overview');toast('Local workout preview loaded.');
    }catch(err){status.classList.add('error');status.textContent=err?.message||'Unable to read JSON file.'}
    finally{e.target.value=''}
  });
  loadSpartanX(true);
  // Restore the exact section selected before switching training focus.
  // Goal switching never resets the Powerlifting analysis or its workout data.
  const openingSection=initialSection();
  if(openingSection!=='overview')setTab(openingSection);
  else{
    try{localStorage.setItem(SECTION_KEY,'overview')}catch(_){}
  }
  // Same-origin local storage is shared only within the same browser/app context.
  // No timer polling: re-read after another tab edits the DB or when app regains focus.
  window.addEventListener('storage',event=>{
    if(!state.source.startsWith('spartanx'))return;
    if(event.key===Bridge?.storageKey)loadSpartanX(true);
    else if(event.key===Bridge?.draftKey){
      refreshLiveOnly(true);
      $('modePill').textContent=['live','waiting'].includes(state.live?.status)?'● LIVE SESSION':
        state.profile?.sessions?.length?'● CONNECTED':'● NO WORKOUTS';
    }
  });
  window.addEventListener('pageshow',()=>{
    if(state.source.startsWith('spartanx'))loadSpartanX(true);
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && state.source.startsWith('spartanx'))loadSpartanX(true);
  });
  window.addEventListener('focus',()=>{
    if(state.source.startsWith('spartanx'))loadSpartanX(true);
  });
  // All workouts are read-only. Only goals are saved under this module's own key.
})();