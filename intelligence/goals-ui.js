/* SpartanX goal-specific Intelligence UI. No changes to spartx_db. */
(function(){
  'use strict';
  const M=window.SXGoalModels, E=window.SXEngine;
  const $=id=>document.getElementById(id);
  if(!M||!E){document.body.insertAdjacentText('afterbegin','Unable to load Intelligence models.');return}
  const state={mode:'bodybuilding',demo:false,muscle:'Chest',exercise:'',settings:M.loadSettings(),weights:M.loadWeights(),raw:[]};
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
  function refresh(){state.raw=state.demo?demo.raw:M.readRaw();render();}
  function renderOptions(select,items,current){
    const previous=current||'';
    select.replaceChildren();
    for(const item of items){const op=document.createElement('option');op.value=item;op.textContent=item;select.append(op)}
    if(items.includes(previous))select.value=previous;
  }
  function render(){
    $('gxBodybuilding').hidden=state.mode!=='bodybuilding';
    $('gxWeightLoss').hidden=state.mode!=='weight-loss';
    $('gxBodyButton').classList.toggle('active',state.mode==='bodybuilding');
    $('gxWeightButton').classList.toggle('active',state.mode==='weight-loss');
    $('gxBodyButton').setAttribute('aria-pressed',state.mode==='bodybuilding');
    $('gxWeightButton').setAttribute('aria-pressed',state.mode==='weight-loss');
    $('gxDemo').textContent=state.demo?'USE MY WORKOUTS':'TRY DEMO DATA';
    const count=state.raw.length;
    $('gxSourceLabel').textContent=state.demo?'● DEMONSTRATION DATA':count?'● CONNECTED TO SPARTANX':'● NO SAVED WORKOUTS';
    $('gxSourceDescription').textContent=state.demo?'Fictional example records; your own workout data is untouched.':
      count?count+' saved sessions found on this device. Intelligence reads them without modifying records.':
      'No completed workouts are visible in this browser. Log sessions in SpartanX or use demonstration mode.';
    const targetMap=state.settings.setTargets||{},target=Number(targetMap[state.muscle]||12);
    renderOptions($('gxMuscle'),M.MUSCLES,state.muscle);
    $('gxTarget').value=target;
    const result=M.bodybuilding(state.raw,{muscle:state.muscle,exercise:state.exercise,setTarget:target});
    state.exercise=result.exercise;
    renderOptions($('gxExercise'),result.names,result.exercise);
    if(!result.names.length){const op=document.createElement('option');op.textContent='No exercises yet';$('gxExercise').append(op)}
    $('gxMuscleSets').textContent=fmt(result.weeks.at(-1).value);
    $('gxSetGoal').textContent=fmt(target);
    const reps=result.exerciseProgress.filter(p=>p.value!=null);
    const delta=reps.length>=2?reps.at(-1).value-reps[0].value:null;
    $('gxRepDelta').textContent=delta==null?'—':(delta>0?'+':'')+fmt(delta)+' reps';
    chart($('gxVolumeChart'),result.weeks,{zero:true,goal:target,title:state.muscle+' working sets'});
    chart($('gxProgressChart'),result.exerciseProgress,{zero:true,title:result.exercise+' repetitions'});
    $('gxProgressDescription').textContent=result.referenceLoad!=null?
      'Best completed repetitions at '+result.referenceLoad+' kg for '+result.exercise+'. Weeks without a matched load are left blank.':
      'Not enough comparable sets yet. Log an exercise at the same weight over several weeks.';
    $('gxBodyInsight').textContent=result.insight;
    $('gxBodyCoverage').textContent=result.unmapped?
      result.unmapped+' working sets excluded from muscle totals because the exercises need reliable muscle mappings.':
      'Muscle totals represent primary-muscle working sets; secondary muscle contribution is not double-counted.';
    const weights=state.demo?demo.weights:state.weights;
    const weight=M.weightLoss(state.raw,weights,{weeklySessions:Number(state.settings.weeklySessions||3)});
    $('gxWeightChange').textContent=weight.change==null?'—':(weight.change>0?'+':'')+fmt(weight.change,2)+' kg';
    $('gxDays').textContent=fmt(weight.sessionDays28);
    $('gxCardioMinutes').textContent=fmt(weight.cardio.at(-1).value,1)+' min';
    chart($('gxWeightChart'),weight.bodyweight,{decimals:1,title:'Seven-day average bodyweight'});
    chart($('gxCardioChart'),weight.cardio,{zero:true,title:'Cardio minutes'});
    chart($('gxConsistencyChart'),weight.weeklyDays,{zero:true,goal:weight.weeklySessionTarget,title:'Completed training days per week'});
    const retain=M.bodybuilding(state.raw,{muscle:'Chest',exercise:'Bench Press'});
    chart($('gxRetentionChart'),retain.exerciseProgress,{zero:true,title:'Comparable exercise repetitions'});
    $('gxRetentionDescription').textContent=retain.referenceLoad!=null?
      'Best repetitions at '+retain.referenceLoad+' kg for '+retain.exercise+'. Similar performance during weight loss is encouraging, but cannot prove muscle retention.':
      'Log repeat strength exercises to monitor performance while changing bodyweight.';
    $('gxWeightInsight').textContent=weight.insight;
    $('gxFrequency').value=state.settings.weeklySessions||3;
    $('gxTarget').disabled=state.demo;
    $('gxSetForm').querySelector('button').disabled=state.demo;
    $('gxFrequency').disabled=state.demo;
    $('gxFrequencyForm').querySelector('button').disabled=state.demo;
    $('gxWeightInput').disabled=state.demo;
    $('gxWeightDate').disabled=state.demo;
    $('gxAddWeight').disabled=state.demo;
    $('gxWeightLog').replaceChildren();
    if(state.demo){$('gxWeightLog').textContent='Weight logging is disabled while showing demonstration data.'}
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
  }
  $('gxBodyButton').addEventListener('click',()=>{state.mode='bodybuilding';render()});
  $('gxWeightButton').addEventListener('click',()=>{state.mode='weight-loss';render()});
  $('gxDemo').addEventListener('click',()=>{state.demo=!state.demo;refresh()});
  $('gxMuscle').addEventListener('change',e=>{state.muscle=e.target.value;render()});
  $('gxExercise').addEventListener('change',e=>{state.exercise=e.target.value;render()});
  $('gxSetForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.demo)return;
    const v=Number($('gxTarget').value);if(!Number.isInteger(v)||v<1||v>50)return;
    state.settings.setTargets=state.settings.setTargets||{};
    state.settings.setTargets[state.muscle]=v;M.saveSettings(state.settings);render();
  });
  $('gxFrequencyForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.demo)return;
    const v=Number($('gxFrequency').value);if(!Number.isInteger(v)||v<1||v>14)return;
    state.settings.weeklySessions=v;M.saveSettings(state.settings);render();
  });
  $('gxWeightForm').addEventListener('submit',e=>{
    e.preventDefault();if(state.demo)return;
    const date=$('gxWeightDate').value,weight=Number($('gxWeightInput').value);
    if(!date||date>today()||!Number.isFinite(weight)||weight<20||weight>500){alert('Enter a valid date not in the future and a weight between 20 and 500 kg.');return}
    state.weights=M.validWeightEntries([...state.weights,{date,weight}]);M.saveWeights(state.weights);
    $('gxWeightInput').value='';render();
  });
  $('gxWeightDate').value=today();$('gxWeightDate').max=today();
  window.addEventListener('storage',e=>{if(e.key==='spartx_db'||e.key==='sx_intelligence_weight_logs_v1'||e.key==='sx_intelligence_goal_settings_v1'){
    state.settings=M.loadSettings();state.weights=M.loadWeights();if(!state.demo)refresh();
  }});
  window.addEventListener('pageshow',()=>{if(!state.demo){state.settings=M.loadSettings();state.weights=M.loadWeights();refresh()}});
  refresh();
})();
