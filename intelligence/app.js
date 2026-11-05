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
  const state={tab:'overview',range:90,selectedLift:'Bench Press',overviewLift:'Bench Press',athlete:'strength',goals:{},source:'demo',profile:null,analysis:null};
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
    // Never writes to SpartanX's original workout database.
    try{
      if(state.source==='demo'){
        const saved=readSavedGoals();saved[state.athlete]=state.goals;
        localStorage.setItem(savedGoalsKey,JSON.stringify(saved));
      }else if(state.source==='spartanx'){
        localStorage.setItem(linkedGoalsKey,JSON.stringify(state.goals));
      }
    }catch(_){}
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
    $('modePill').textContent=connected?'● CONNECTED':'● '+(status==='empty'?'NO WORKOUTS':'NOT CONNECTED');
    const line=connected
      ?'<strong>Connected to SpartanX · '+result.sessions.length+' workouts.</strong> Training history is read from this device whenever Intelligence opens or returns to the foreground. Completed workouts only; no changes are made to your records.'
      :'<strong>SpartanX history not available here.</strong> '+escapeHtml(result?.reason||'Unable to read this device’s workouts.')+' Open Intelligence using the button on SpartanX Home on the same device, or import a backup. iPhone Safari and Home Screen apps can use separate storage.';
    $('dataBanner').innerHTML='<span class="banner-symbol">ⓘ</span><span>'+line+' <a class="sx-back-link" href="../">Back to SpartanX</a></span>';
    const detail=$('connectionDetails');
    if(detail)detail.textContent=connected
      ?'Connected to '+result.sessions.length+' valid completed workouts on this device (read-only).'
      :result?.reason||'Unable to find SpartanX workout history in this browser.';
    renderAll();
    if(!silent)toast(connected?'SpartanX workouts loaded: '+result.sessions.length:'No local workout history found.');
    return connected;
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
    return '<article class="kpi"><div class="kpi-top"><span>'+escapeHtml(label)+'</span><span class="kpi-icon" aria-hidden="true">'+icon+'</span></div><div class="kpi-value">'+escapeHtml(value)+'</div><div class="kpi-sub">'+sub+'</div></article>';
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
    $('goalInput').value=goal;
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
    renderOverview();renderPerformance();renderMuscles();renderIntelligence();
  }
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.go)));
  $('rangeSelect').addEventListener('change',e=>{state.range=Number(e.target.value);renderAll()});
  $('overviewLift').addEventListener('change',e=>{state.overviewLift=e.target.value;renderOverview()});
  $('liftTabs').addEventListener('click',e=>{const target=e.target.closest('[data-lift]');if(target)selectLift(target.dataset.lift)});
  $('goalForm').addEventListener('submit',e=>{
    e.preventDefault();const n=Number($('goalInput').value);
    if(!Number.isFinite(n)||n<1||n>1500){toast('Enter a target from 1 to 1,500 kg.');return}
    state.goals[state.selectedLift]=n;saveGoals();renderPerformance();
    toast(state.source==='demo'?'Goal saved for this demo athlete.':state.source==='spartanx'?'Goal saved in Intelligence only.':'Goal updated for this preview only.');
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
  // Same-origin local storage is shared only within the same browser/app context.
  // No timer polling: re-read after another tab edits the DB or when app regains focus.
  window.addEventListener('storage',event=>{
    if(event.key===Bridge?.storageKey && state.source.startsWith('spartanx'))loadSpartanX(true);
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