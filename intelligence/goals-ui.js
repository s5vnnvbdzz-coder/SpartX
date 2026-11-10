/* SpartanX goal-specific Intelligence UI. No changes to spartx_db. */
(function(){
  'use strict';
  const M=window.SXGoalModels, E=window.SXEngine;
  const $=id=>document.getElementById(id);
  if(!M||!E){document.body.insertAdjacentText('afterbegin','Unable to load Intelligence models.');return}
  const initialGoal=window.SXGoalNavigation?.currentGoal;
  const UI_KEY='sx_intelligence_goal_view_v1';
  const SECTION_KEY='sx_intelligence_active_section_v1';
  const VALID_SECTIONS=['overview','performance','muscles','intelligence'];
  function readStartingSection(){
    const urlTab=new URLSearchParams(window.location.search).get('tab');
    if(VALID_SECTIONS.includes(urlTab))return urlTab;
    try{
      const remembered=localStorage.getItem(SECTION_KEY);
      if(VALID_SECTIONS.includes(remembered))return remembered;
    }catch(_){}
    return null;
  }
  const RANGE_KEY='sx_intelligence_range_v1';
  function readUI(){try{const x=JSON.parse(localStorage.getItem(UI_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
  const ui=readUI();
  let range=90;
  try{const saved=localStorage.getItem(RANGE_KEY);if(saved!==null&&['0','30','90'].includes(saved))range=Number(saved)}catch(_){}
  const state={mode:initialGoal==='weight-loss'?'weight-loss':'bodybuilding',source:'spartanx',demo:false,imported:[],tab:'overview',range,muscle:ui.muscle||'Chest',exercise:ui.exercise||'',settings:M.loadSettings(),weights:M.loadWeights(),raw:[]};
  state.tab=readStartingSection()||
    (VALID_SECTIONS.includes(ui.tabs?.[state.mode])?ui.tabs[state.mode]:'overview');
  function persistUI(){
    try{
      const tabs=readUI().tabs||{};
      tabs[state.mode]=state.tab;
      localStorage.setItem(UI_KEY,JSON.stringify({tabs,muscle:state.muscle,exercise:state.exercise}));
      localStorage.setItem(RANGE_KEY,String(state.range));
      localStorage.setItem(SECTION_KEY,state.tab);
    }catch(_){}
  }
  const headings={
    bodybuilding:{
      overview:['YOUR TRAINING, DECODED','Athlete Dashboard','Track working sets, hypertrophy training and progression.'],
      performance:['HYPERTROPHY PERFORMANCE','Exercise Progression','Watch your reps and load change across comparable sessions.'],
      muscles:['TRAINING EXPOSURE','Muscle Workload','Review working sets by muscle and manage personal targets.'],
      intelligence:['SMART TRAINING DECISIONS','SpartanX Intelligence','Understand the patterns behind your training history.']
    },
    'weight-loss':{
      overview:['YOUR TRAINING, DECODED','Athlete Dashboard','Follow meaningful weight and fitness trends over time.'],
      performance:['CARDIO & STRENGTH','Performance Analytics','Review your cardio minutes and exercise performance.'],
      muscles:['TRAINING CONSISTENCY','Training Habits','Track completed training days against your own goals.'],
      intelligence:['SMART TRAINING DECISIONS','SpartanX Intelligence','Review bodyweight and fitness patterns with context.']
    }
  };
  function setTab(next,scroll=false){
    if(!['overview','performance','muscles','intelligence'].includes(next))return;
    state.tab=next;
    document.querySelectorAll('.gx-nav-page').forEach(n=>{n.hidden=n.dataset.tabPage!==next});
    document.querySelectorAll('.sidebar-nav [data-tab], .bottom-nav [data-tab]').forEach(n=>{
      const active=n.dataset.tab===next;
      n.classList.toggle('active',active);
      if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');
    });
    const [kicker,title,subtitle]=headings[state.mode][next];
    $('sectionKicker').textContent=kicker;
    $('pageTitle').textContent=title;
    $('pageSubtitle').textContent=subtitle;
    document.querySelectorAll('.gx-muscle-label').forEach(n=>{n.textContent=state.mode==='bodybuilding'?'Muscle workload':'Training consistency'});
    $('gxMobileMuscleLabel').textContent=state.mode==='bodybuilding'?'MUSCLES':'HABITS';
    persistUI();
    try{
      const url=new URL(window.location.href);
      url.searchParams.set('tab',next);
      window.history.replaceState(null,'',url.pathname+url.search+url.hash);
    }catch(_){}
    if(scroll && typeof window.scrollTo==='function')window.scrollTo(0,0);
  }
  const fmt=(n,d=0)=>Number.isFinite(n)?Number(n).toLocaleString('en-GB',{maximumFractionDigits:d}):'—';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const monday=(daysAgo)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-daysAgo);return d.toISOString()};
  const chart=(node,points,opts)=>{
    const data=(points||[]).map(p=>({label:p.label||'',value:p.value==null?null:Number(p.value)}));
    const vals=data.map(p=>p.value).filter(Number.isFinite);
    if(!vals.length){node.innerHTML='<div class="gx-empty">Not enough logged data yet. Save workouts or choose Try Demo Data.</div>';return}
    const W=620,H=220,L=49,R=20,T=20,B=37;
    let lo=Math.min(...vals),hi=Math.max(...vals);
    if(opts.goal!=null&&Number.isFinite(opts.goal)){lo=Math.min(lo,opts.goal);hi=Math.max(hi,opts.goal)}
    if(opts.zero){lo=Math.min(lo,0)}
    if(lo===hi){lo=Math.max(0,lo-1);hi+=1}
    const span=hi-lo,pad=span*.12;hi+=pad;lo=opts.zero?Math.max(0,lo):lo-pad;
    const x=i=>L+(W-L-R)*(data.length<=1?.5:i/(data.length-1));
    const y=v=>T+(H-T-B)*(hi-v)/(hi-lo);
    let html='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    for(let i=0;i<4;i++){const value=lo+(hi-lo)*i/3,yy=y(value);
      html+='<line x1="'+L+'" y1="'+yy+'" x2="'+(W-R)+'" y2="'+yy+'" stroke="#33363c" stroke-width="1"/>';
      html+='<text x="'+(L-9)+'" y="'+(yy+4)+'" text-anchor="end" fill="#949ba4" font-size="12">'+fmt(value,opts.decimals||0)+'</text>';
    }
    if(opts.goal!=null&&Number.isFinite(opts.goal)){
      const yy=y(opts.goal);html+='<line x1="'+L+'" y1="'+yy+'" x2="'+(W-R)+'" y2="'+yy+'" stroke="#d8a742" stroke-dasharray="6 5" stroke-width="1.5"/>';
    }
    const ticks=data.length>40?6:Math.min(data.length,6);
    for(let i=0;i<ticks;i++){const idx=Math.round(i*(data.length-1)/Math.max(1,ticks-1));
      html+='<text x="'+x(idx)+'" y="'+(H-11)+'" text-anchor="middle" font-size="12" fill="#949ba4">'+escape(data[idx].label)+'</text>';
    }
    let current=[],paths=[];
    data.forEach((p,i)=>{if(p.value==null||!Number.isFinite(p.value)){if(current.length)paths.push(current);current=[]}else current.push([x(i),y(p.value),p])});
    if(current.length)paths.push(current);
    for(const segment of paths){
      const d=segment.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
      html+='<path d="'+d+'" stroke="var(--gold)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      if(data.length<=24||segment.length===1){
        for(const p of segment){html+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="#101114" stroke="var(--gold)" stroke-width="2"><title>'+escape(p[2].label)+': '+fmt(p[2].value,opts.decimals||0)+'</title></circle>'}
      }
    }
    html+='</svg>';node.innerHTML=html;
    node.setAttribute('aria-label',(opts.title||'Trend')+'; '+vals.length+' recorded points; first '+fmt(vals[0],opts.decimals||0)+', last '+fmt(vals[vals.length-1],opts.decimals||0));
  };
  function demoData(){
    const raw=[],weights=[],now=new Date();now.setHours(12,0,0,0);
    for(let i=11;i>=0;i--){
      const date=new Date(now);date.setDate(date.getDate()-i*7-2);
      const bench=40+(11-i)*.5;
      raw.push({id:'demo-b-'+i,date:date.toISOString(),name:'Upper Body',exercises:[
        {name:'Bench Press',sets:[{weight:Math.round(bench/2.5)*2.5,reps:8+Math.floor((11-i)/3),type:'Working Set',done:true},{weight:40,reps:7+Math.floor((11-i)/2),type:'Working Set',done:true},{weight:40,reps:8+Math.floor((11-i)/2),type:'Working Set',done:true}]},
        {name:'Barbell Row',sets:[{weight:45,reps:10,done:true},{weight:45,reps:10,done:true},{weight:45,reps:11,done:true}]}
      ]});
      const cardioDate=new Date(date);cardioDate.setDate(cardioDate.getDate()+2);
      raw.push({id:'demo-c-'+i,date:cardioDate.toISOString(),name:'Legs and Cardio',exercises:[
        {name:'Squat',sets:[{weight:65,reps:10,done:true},{weight:65,reps:10,done:true},{weight:65,reps:9,done:true}]},
        {name:'Treadmill',sets:[{type:'Cardio',done:true,durationSeconds:1200+(11-i)*110,distanceKm:2.1}]}
      ]});
    }
    for(let i=0;i<84;i+=2){
      const d=new Date(now);d.setDate(d.getDate()-83+i);
      weights.push({date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),weight:Math.round((93-i*.03+Math.sin(i*.38)*.25)*10)/10});
    }
    return {raw,weights};
  }
  const demo=demoData();
  function refresh(){
    state.raw=state.source==='demo'?demo.raw:state.source==='import'?state.imported:M.readRaw();
    state.demo=state.source==='demo';
    render();
  }
  function renderOptions(select,items,current){
    const previous=current||'';
    select.replaceChildren();
    for(const item of items){const op=document.createElement('option');op.value=item;op.textContent=item;select.append(op)}
    if(items.includes(previous))select.value=previous;
  }
  function render(){
    $('gxBodybuilding').hidden=state.mode!=='bodybuilding';
    $('gxWeightLoss').hidden=state.mode!=='weight-loss';
    $('gxDemo').textContent=state.demo?'RESTORE MY WORKOUTS':'LOAD DEMO ATHLETE';
    const count=state.raw.length;
    $('gxSourceLabel').textContent=state.demo?'● DEMO DATA':state.source==='import'?'● LOCAL IMPORT':count?'● CONNECTED':'● NO WORKOUTS';
    $('gxSourceDescription').textContent=state.demo?'Demonstration mode — fictional data. Your saved workouts and weight logs remain unchanged.':
      state.source==='import'?'Analysing '+count+' imported sessions in memory. No SpartanX records were modified.':
      count?count+' saved workouts from this browser. Switching goals keeps your full history.':
      'No saved workouts found in this browser. Use the gear icon to try the demo or import a backup.';
    $('gxConnectionDetails').textContent=state.source==='import'?'Local JSON preview active — not written to SpartanX.':
      count+' workout session(s) available in the current data source.';
    $('rangeSelect').value=String(state.range);
    const targetMap=state.settings.setTargets||{},target=Number(targetMap[state.muscle]||12);
    renderOptions($('gxMuscle'),M.MUSCLES,state.muscle);
    $('gxTarget').value=target;
    const result=M.bodybuilding(state.raw,{muscle:state.muscle,exercise:state.exercise,setTarget:target,rangeDays:state.range});
    state.exercise=result.exercise;
    renderOptions($('gxExercise'),result.names,result.exercise);
    if(!result.names.length){const op=document.createElement('option');op.textContent='No exercises yet';$('gxExercise').append(op)}
    $('gxMuscleSets').textContent=fmt(result.weeks.at(-1).value);
    $('gxSetGoal').textContent=fmt(target);
    const reps=result.exerciseProgress.filter(p=>p.value!=null);
    const delta=reps.length>=2?reps.at(-1).value-reps[0].value:null;
    $('gxRepDelta').textContent=delta==null?'—':(delta>0?'+':'')+fmt(delta)+' reps';
    if(!count){$('gxOverviewVolumeChart').innerHTML='<div class="gx-empty">Complete workouts to see training trends.</div>';}
    else chart($('gxOverviewVolumeChart'),result.weeks,{zero:true,goal:target,title:state.muscle+' working sets'});
    if(!count){$('gxVolumeChart').innerHTML='<div class="gx-empty">Complete workouts to see working-set trends.</div>';}
    else chart($('gxVolumeChart'),result.weeks,{zero:true,goal:target,title:state.muscle+' working sets'});
    chart($('gxProgressChart'),result.exerciseProgress,{zero:true,title:result.exercise+' repetitions'});
    $('gxProgressDescription').textContent=result.referenceLoad!=null?
      'Best completed repetitions at '+result.referenceLoad+' kg for '+result.exercise+'. Weeks without a matched load are left blank.':
      'Not enough comparable sets yet. Log an exercise at the same weight over several weeks.';
    $('gxBodyInsight').textContent=result.insight;
    $('gxBodyOverviewInsight').textContent=result.insight;
    const breakdown=$('gxMuscleBreakdown');breakdown.replaceChildren();
    for(const item of result.muscleTotals){
      const row=document.createElement('div');row.className='gx-muscle-row';
      const name=document.createElement('span');name.textContent=item.name;
      const value=document.createElement('strong');value.textContent=fmt(item.sets)+' sets';
      row.append(name,value);breakdown.append(row);
    }
    $('gxBodyCoverage').textContent=result.unmapped?
      result.unmapped+' working sets excluded from muscle totals because the exercises need reliable muscle mappings.':
      'Muscle totals represent primary-muscle working sets; secondary muscle contribution is not double-counted.';
    const weights=state.demo?demo.weights:state.source==='import'?[]:state.weights;
    const weight=M.weightLoss(state.raw,weights,{weeklySessions:Number(state.settings.weeklySessions||3),rangeDays:state.range});
    $('gxWeightChange').textContent=weight.change==null?'—':(weight.change>0?'+':'')+fmt(weight.change,2)+' kg';
    $('gxDays').textContent=fmt(weight.sessionDays28);
    $('gxCardioMinutes').textContent=fmt(weight.cardio.at(-1).value,1)+' min';
    chart($('gxWeightChart'),weight.bodyweight,{decimals:1,title:'Seven-day average bodyweight'});
    chart($('gxCardioChart'),weight.cardio,{zero:true,title:'Cardio minutes'});
    chart($('gxConsistencyChart'),weight.weeklyDays,{zero:true,goal:weight.weeklySessionTarget,title:'Completed training days per week'});
    const retain=M.bodybuilding(state.raw,{muscle:'Chest',exercise:'Bench Press',rangeDays:state.range});
    chart($('gxRetentionChart'),retain.exerciseProgress,{zero:true,title:'Comparable exercise repetitions'});
    $('gxRetentionDescription').textContent=retain.referenceLoad!=null?
      'Best repetitions at '+retain.referenceLoad+' kg for '+retain.exercise+'. Similar performance during weight loss is encouraging, but cannot prove muscle retention.':
      'Log repeat strength exercises to monitor performance while changing bodyweight.';
    $('gxWeightInsight').textContent=weight.insight;
    $('gxWeightOverviewInsight').textContent=weight.insight;
    $('gxFrequency').value=state.settings.weeklySessions||3;
    const readOnlyPreview=state.source!=='spartanx';
    $('gxTarget').disabled=readOnlyPreview;
    $('gxSetForm').querySelector('button').disabled=readOnlyPreview;
    $('gxFrequency').disabled=readOnlyPreview;
    $('gxFrequencyForm').querySelector('button').disabled=readOnlyPreview;
    $('gxWeightInput').disabled=readOnlyPreview;
    $('gxWeightDate').disabled=readOnlyPreview;
    $('gxAddWeight').disabled=readOnlyPreview;
    $('gxWeightLog').replaceChildren();
    if(state.source!=='spartanx'){$('gxWeightLog').textContent='Weight logging is disabled in demo and imported data previews.'}
    else if(!weights.length){$('gxWeightLog').textContent='No bodyweight readings saved yet.'}
    else{
      const list=weights.slice(-5).reverse();
      for(const w of list){
        const row=document.createElement('div');row.className='gx-log-row';
        const txt=document.createElement('span');txt.textContent=w.date+' · '+fmt(w.weight,2)+' kg';
        const btn=document.createElement('button');btn.type='button';btn.textContent='REMOVE';btn.setAttribute('aria-label','Remove weight logged on '+w.date);
        btn.addEventListener('click',()=>{state.weights=state.weights.filter(x=>x.date!==w.date);M.saveWeights(state.weights);render()});
        row.append(txt,btn);$('gxWeightLog').append(row);
      }
    }
    // Reuse the same read-only full-workout/accessory breakdown shown in
    // Powerlifting Intelligence, without changing Bodybuilding model totals.
    window.SXSessionBreakdown?.render({mode:state.source,range:state.range,sessions:state.raw});
    setTab(state.tab);
  }
  window.addEventListener('sx:intelligence-goal-change',event=>{
    const goal=event.detail?.goal;
    if(goal!=='bodybuilding'&&goal!=='weight-loss')return;
    // Training focus changes never jump to Overview or to a different
    // goal's last-viewed tab. Keep this exact section selected.
    state.mode=goal;
    if(VALID_SECTIONS.includes(event.detail?.tab))state.tab=event.detail.tab;
    render();
  });
  document.querySelectorAll('.sidebar-nav [data-tab],.bottom-nav [data-tab], [data-go]').forEach(btn=>{
    btn.addEventListener('click',()=>setTab(btn.dataset.tab||btn.dataset.go,true));
  });
  $('rangeSelect').addEventListener('change',e=>{
    state.range=[0,30,90].includes(Number(e.target.value))?Number(e.target.value):90;persistUI();render();
  });
  const sourceDialog=$('gxSourceDialog');
  $('gxOpenSource').addEventListener('click',()=>sourceDialog.showModal());
  $('gxConnect').addEventListener('click',()=>{state.source='spartanx';refresh();sourceDialog.close()});
  $('gxRefresh').addEventListener('click',()=>{state.source='spartanx';refresh();sourceDialog.close()});
  $('gxDemo').addEventListener('click',()=>{state.source=state.demo?'spartanx':'demo';refresh();sourceDialog.close()});
  $('gxImportInput').addEventListener('change',async e=>{
    const file=e.target.files?.[0],status=$('gxImportStatus');if(!file)return;
    if(file.size>10*1024*1024){status.textContent='File exceeds the 10 MB preview limit.';return}
    try{
      const parsed=JSON.parse(await file.text());
      const raw=Array.isArray(parsed?.sessions)?parsed.sessions:Array.isArray(parsed?.db?.sessions)?parsed.db.sessions:null;
      if(!raw||raw.length>5000)throw Error('Import a SpartanX JSON export with up to 5,000 sessions.');
      state.imported=raw;state.source='import';refresh();status.textContent='Imported '+raw.length+' sessions for read-only analysis.';
      sourceDialog.close();
    }catch(error){status.textContent=error.message||'Could not read the JSON file.'}
    finally{e.target.value=''}
  });
  $('gxMuscle').addEventListener('change',e=>{state.muscle=e.target.value;persistUI();render()});
  $('gxExercise').addEventListener('change',e=>{state.exercise=e.target.value;persistUI();render()});
  $('gxSetForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.source!=='spartanx')return;
    const v=Number($('gxTarget').value);if(!Number.isInteger(v)||v<1||v>50)return;
    state.settings.setTargets=state.settings.setTargets||{};
    state.settings.setTargets[state.muscle]=v;M.saveSettings(state.settings);render();
  });
  $('gxFrequencyForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.source!=='spartanx')return;
    const v=Number($('gxFrequency').value);if(!Number.isInteger(v)||v<1||v>14)return;
    state.settings.weeklySessions=v;M.saveSettings(state.settings);render();
  });
  $('gxWeightForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.source!=='spartanx')return;
    const date=$('gxWeightDate').value,weight=Number($('gxWeightInput').value);
    if(!date||date>today()||!Number.isFinite(weight)||weight<20||weight>500){alert('Enter a valid date not in the future and a weight between 20 and 500 kg.');return}
    state.weights=M.validWeightEntries([...state.weights,{date,weight}]);M.saveWeights(state.weights);
    $('gxWeightInput').value='';render();
  });
  $('gxWeightDate').value=today();$('gxWeightDate').max=today();
  window.addEventListener('storage',e=>{if(e.key==='spartx_db'||e.key==='sx_intelligence_weight_logs_v1'||e.key==='sx_intelligence_goal_settings_v1'){
    state.settings=M.loadSettings();state.weights=M.loadWeights();if(state.source==='spartanx')refresh();
  }});
  window.addEventListener('pageshow',()=>{if(state.source==='spartanx'){state.settings=M.loadSettings();state.weights=M.loadWeights();refresh()}});
  refresh();
})();
