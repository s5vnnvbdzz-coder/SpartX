/* SpartanX exercise statistics — trends + personal records, shared by
   active exercise names and the exercise library. Predicted 1RM derives only from logged set weights/reps; Intelligence data is never used. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
// Shared with the logger's fallback renderer; do not read Intelligence summaries.
const predictedOneRepMax=window.SpartanXPredictedOneRepMax;
const screen=$('exerciseHistoryScreen');if(!screen)return;
const globalHeader=document.querySelector('body > header');
const localHeader=screen.querySelector('.sx-exercise-profile-heading');
if(globalHeader&&localHeader)globalHeader.appendChild(localHeader);
let exerciseName='',points=[],metric='heaviest',period='3m',selectedIndex=-1,activeTab='summary';
const metrics=[
 {id:'heaviest',name:'Heaviest Weight'},
 {id:'e1rm',name:'Predicted 1RM'},
 {id:'setVolume',name:'Best Set Volume'},
 {id:'sessionVolume',name:'Session Volume'},
 {id:'totalReps',name:'Total Reps'}
];
const cardioMetrics=[
 {id:'duration',name:'Time'},
 {id:'distance',name:'Distance'},
 {id:'floors',name:'Floors Climbed'},
 {id:'steps',name:'Steps Climbed'},
 {id:'calories',name:'Calories'}
];
const cardio=()=>!!window.SpartanXCardio?.isCardio(exerciseName);
const cardioMeasure=()=>window.SpartanXCardio?.measurement(exerciseName)||'distanceKm';
const currentMetrics=()=>cardio()?cardioMetrics.filter(m=>!['distance','floors','steps'].includes(m.id)||m.id===({distanceKm:'distance',floors:'floors',steps:'steps'}[cardioMeasure()])):metrics;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weight=n=>kg(Math.max(0,Number(n)||0));
const number=n=>Math.round(Number(n)||0).toLocaleString();
const shortDate=d=>Number.isFinite(new Date(d).getTime())?new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short'}):'—';
const longDate=d=>Number.isFinite(new Date(d).getTime())?new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'—';
const metricsFor=p=>{
 const sets=p.sets||[];
 const heavy=Math.max(0,...sets.map(s=>Number(s.weight)||0));
 const e1rm=Math.max(0,...sets.map(predictedOneRepMax));
 const setVolume=Math.max(0,...sets.map(s=>(Number(s.weight)||0)*(Number(s.reps)||0)));
 const total=k=>sets.reduce((sum,s)=>sum+Math.max(0,Number(s[k])||0),0);
 return {heaviest:heavy,e1rm,setVolume,sessionVolume:Number(p.volume)||0,totalReps:Number(p.totalReps)||0,
  duration:total('durationSeconds'),distance:total('distanceKm'),floors:total('floors'),steps:total('steps'),calories:total('calories')};
};
const display=(value,id)=>{
 if(id==='duration')return window.SpartanXCardio.duration(value);
 if(id==='distance')return window.SpartanXCardio.distance(value,preferences.distance);
 if(id==='floors')return number(value)+' floors';
 if(id==='steps')return number(value)+' steps';
 if(id==='calories')return number(value)+' kcal';
 return id==='totalReps'?number(value)+' reps':weight(value);
};
function allPoints(){
 return [...points].sort((a,b)=>{
  if(a.isLive&&!b.isLive)return 1;
  if(!a.isLive&&b.isLive)return -1;
  return (new Date(a.date).getTime()||0)-(new Date(b.date).getTime()||0);
 });
}
function selectedPoints(){
 const now=Date.now(),after=new Date(now);
 if(period==='4w')after.setDate(after.getDate()-28);
 else if(period==='3m')after.setMonth(after.getMonth()-3);
 else if(period==='6m')after.setMonth(after.getMonth()-6);
 else if(period==='1y')after.setFullYear(after.getFullYear()-1);
 else after.setFullYear(1970);
 return allPoints().filter(p=>p.isLive||new Date(p.date).getTime()>=after.getTime());
}
function records(){
 if(cardio()){
  const recordMetrics=currentMetrics();
  const rowsOut=recordMetrics.map(m=>{
   const best=Math.max(0,...allPoints().map(p=>metricsFor(p)[m.id]));
   return ['Best '+m.name,best?display(best,m.id):'—'];
  });
  $('sxExercisePersonalRecords').innerHTML=rowsOut.map(([label,value])=>
   '<div class="sx-exercise-pr-row"><span>'+escape(label)+'</span><strong>'+escape(value)+'</strong></div>').join('');
  return;
 }
 const rows=allPoints().flatMap(p=>(p.sets||[]).map(s=>({...s,isLive:p.isLive})));
 const weighted=rows.filter(s=>Number(s.weight)>0&&Number(s.reps)>0);
 const heavy=weighted.length?weighted.reduce((a,b)=>Number(a.weight)>=Number(b.weight)?a:b):null;
 const e1rm=weighted.length?Math.max(...weighted.map(predictedOneRepMax)):0;
 const bestSet=weighted.length?weighted.reduce((a,b)=>Number(a.weight)*Number(a.reps)>=Number(b.weight)*Number(b.reps)?a:b):null;
 const maxSession=allPoints().reduce((a,b)=>Number(a.volume)>=Number(b.volume)?a:b,{volume:0});
 const rowsOut=[
  ['Heaviest Weight',heavy?weight(heavy.weight):'—'],
  ['Best Predicted 1RM',e1rm?weight(e1rm):'—'],
  ['Best Set Volume',bestSet?weight(bestSet.weight)+' × '+number(bestSet.reps):'—'],
  ['Best Session Volume',Number(maxSession.volume)?weight(maxSession.volume):'—']
 ];
 $('sxExercisePersonalRecords').innerHTML=rowsOut.map(([label,value])=>
  '<div class="sx-exercise-pr-row"><span>'+escape(label)+'</span><strong>'+escape(value)+'</strong></div>').join('');
}
function chartSVG(series,id){
 if(!series.length)return '<p class="sx-exercise-no-history">No logged sets in this period. Try a longer time range or complete a workout.</p>';
 const width=350,height=210,left=35,right=13,top=14,bottom=33;
 const chartHeight=height-top-bottom,chartWidth=width-left-right;
 const values=series.map(p=>metricsFor(p)[id]);
 const max=Math.max(1,...values),min=Math.min(0,...values);
 const lineMin=min===max?0:min,span=Math.max(1,max-lineMin);
 const coords=values.map((v,i)=>({x:left+(series.length===1?chartWidth/2:i*chartWidth/(series.length-1)),
  y:top+chartHeight-(v-lineMin)/span*chartHeight}));
 const path=coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
 const horizontal=[0,0.5,1].map(frac=>{
  const y=top+chartHeight*(1-frac),n=lineMin+(span*frac);
  const label=id==='duration'?Math.round(n/60)+'m':id==='distance'?(preferences.distance==='mi'?+(n/1.609344).toFixed(1):+n.toFixed(1)):id==='totalReps'?number(n):n>=1000?Math.round(n/1000)+'k':number(n);
  return '<line x1="'+left+'" x2="'+(width-right)+'" y1="'+y+'" y2="'+y+'" class="sx-ex-chart-grid"/>'+
   '<text x="'+(left-6)+'" y="'+(y+4)+'" text-anchor="end" class="sx-ex-chart-axis">'+label+'</text>';
 }).join('');
 const dots=coords.map((p,i)=>'<circle tabindex="0" role="button" data-ex-stat-point="'+i+
  '" aria-label="'+escape(shortDate(series[i].date)+' · '+display(values[i],id))+
  '" cx="'+p.x+'" cy="'+p.y+'" r="'+(i===selectedIndex?5.6:4.2)+
  '" class="sx-ex-chart-dot '+(i===selectedIndex?'is-selected':'')+(series[i].isLive?' is-live':'')+'"><title>'+
  escape(shortDate(series[i].date)+' · '+display(values[i],id))+'</title></circle>').join('');
 const indexes=series.length===1?[0]:[0,Math.floor((series.length-1)/2),series.length-1].filter((n,i,a)=>a.indexOf(n)===i);
 const labels=indexes.map(i=>'<text class="sx-ex-chart-axis" x="'+coords[i].x+'" y="'+(height-6)+'" text-anchor="'+(i===0?'start':i===series.length-1?'end':'middle')+'">'+(series[i].isLive?'TODAY':shortDate(series[i].date))+'</text>').join('');
 return '<svg viewBox="0 0 350 210" role="img" aria-label="Exercise performance over time">'+horizontal+
  '<path d="'+path+'" class="sx-ex-chart-line"/>'+dots+labels+'</svg>';
}
function drawMetric(){
 const series=selectedPoints(),available=currentMetrics(),m=available.find(m=>m.id===metric)||available[0];
 if(selectedIndex>=series.length||selectedIndex<0)selectedIndex=series.length-1;
 const focus=series[selectedIndex]||null;
 const selectedValue=focus?metricsFor(focus)[metric]:0;
 $('exerciseMetricValue').textContent=focus?display(selectedValue,metric):'—';
 $('exerciseMetricDate').textContent=focus?(focus.isLive?'TODAY · LIVE':shortDate(focus.date)):'';
 $('exerciseMetricLabel').textContent=m.name.toUpperCase();
 $('exerciseMetricUnit').textContent=metric==='duration'?'min':metric==='distance'?preferences.distance:metric==='floors'?'floors':metric==='steps'?'steps':metric==='calories'?'kcal':metric==='totalReps'?'reps':preferences.weight==='lb'?'lbs':'kg';
 $('exerciseHistoryCharts').innerHTML=chartSVG(series,metric);
 const row=$('exerciseMetricTabs');
 row.innerHTML=available.map(m=>'<button type="button" role="tab" data-exercise-metric="'+m.id+
  '" aria-selected="'+(m.id===metric)+'" class="'+(m.id===metric?'selected':'')+'">'+m.name+'</button>').join('');
 if(selectedPoints().some(p=>p.isLive)){
  const live=series.find(p=>p.isLive),previous=series.filter(p=>!p.isLive).at(-1),current=live?metricsFor(live)[metric]:0;
  const el=document.createElement('p');el.className='sx-exercise-live-note';
  el.textContent='Today live: '+display(current,metric)+(previous?' · Previous: '+display(metricsFor(previous)[metric],metric):' · Not yet saved');
  $('exerciseHistoryCharts').append(el);
 }
}
function drawHistory(){
 const records=allPoints().slice().reverse();
 $('sxExerciseHistoryList').innerHTML='<h2>Workout History</h2>'+(records.length?
 records.map(p=>{
  const totals=metricsFor(p);
  return '<article class="sx-exercise-history-row"><div><strong>'+escape(p.isLive?'Today · Live':longDate(p.date))+'</strong><span>'+escape(p.name||exerciseName)+'</span></div><div><strong>'+escape(cardio()?display(totals.duration,'duration'):weight(totals.heaviest))+'</strong><span>'+escape(cardio()?display(totals[cardioMeasure()==='distanceKm'?'distance':cardioMeasure()],cardioMeasure()==='distanceKm'?'distance':cardioMeasure())+' · '+number(p.sets?.length||0)+' intervals':number(p.sets?.length||0)+' sets · '+weight(p.volume))+'</span></div></article>';
 }).join(''):'<p>No workouts logged for this exercise yet.</p>');
}
// A brief weight convention directly underneath the Summary subtitle.
function drawWeightLoggingSummary(){
 const el=$('sxExerciseLoggingSummaryNote');
 if(!el)return;
 const info=window.SpartanXExerciseLoggingGuide?.get(exerciseName,preferences.weight);
 const unit=preferences.weight==='lb'?'lb':'kg';
 let note='';
 switch(info?.kind){
  case 'two-dumbbells':
   note='How to log: 10 '+unit+' per dumbbell = 20 '+unit+' total. Log the combined weight.';
   break;
  case 'independent-sides':
   note='How to log: 40 '+unit+' per side = 80 '+unit+' total. Log the combined weight.';
   break;
  case 'one-dumbbell':
   note='How to log: One 10 '+unit+' dumbbell = 10 '+unit+' logged. Do not double a single-arm load.';
   break;
  case 'single-side':
   note='How to log: 40 '+unit+' on the working side = 40 '+unit+' logged.';
   break;
  case 'variable-dumbbell':
   note='How to log: One 10 '+unit+' dumbbell = 10 '+unit+'; two 10 '+unit+' dumbbells = 20 '+unit+' total.';
   break;
 }
 el.hidden=!note;
 el.textContent=note;
}
function drawHowTo(muscles){
 const el=$('sxExerciseHowTo');
 el.replaceChildren();
 const heading=document.createElement('h2');heading.textContent='Exercise information';
 const summary=document.createElement('p');summary.textContent=cardio()?'Record the time, '+(cardioMeasure()==='floors'?'floors climbed':cardioMeasure()==='steps'?'steps climbed':'distance')+' and optional calories from your machine. Each interval appears in your exercise history.':'Primary muscles: '+(muscleNames(muscles.primary)||'Not classified')+'. Secondary muscles: '+(muscleNames(muscles.secondary)||'Not classified')+'.';
 const note=document.createElement('p');note.textContent='Exercise-specific video instructions have not been added yet. This section will use the SpartanX exercise library.';
 el.append(heading,summary);
 const guideApi=window.SpartanXExerciseLoggingGuide;
 if(guideApi?.get){
  let weightUnit='kg';
  try{weightUnit=JSON.parse(localStorage.getItem('spartx_preferences_v1')||'{}').weight==='lb'?'lb':'kg'}catch(_){}
  const info=guideApi.get(exerciseName,weightUnit);
  const logHeading=document.createElement('h2');logHeading.textContent='How to log';
  const logRule=document.createElement('strong');logRule.textContent=info.title;
  const logDescription=document.createElement('p');logDescription.textContent=info.description;
  const example=document.createElement('p');example.textContent='Example: '+info.example;
  const logNote=document.createElement('p');logNote.textContent=info.note;
  el.append(logHeading,logRule,logDescription,example,logNote);
 }
 el.append(note);
}
function showTab(tab){
 activeTab=tab;
 for(const button of $('sxExerciseTopTabs').querySelectorAll('button')){
  const on=button.dataset.sxExerciseTab===tab;button.classList.toggle('selected',on);button.setAttribute('aria-selected',String(on));
 }
 $('sxExerciseSummaryPanel').hidden=tab!=='summary';
 $('sxExerciseHistoryList').hidden=tab!=='history';
 $('sxExerciseHowTo').hidden=tab!=='howto';
 $('sxExerciseLeaderboard').hidden=tab!=='leaderboard';
 if(tab==='history')drawHistory();
 if(tab==='leaderboard')$('sxExerciseLeaderboard').innerHTML='<h2>Leaderboard</h2><p>Rankings require real SpartanX athlete accounts. No comparison rankings are shown while the social system is offline.</p>';
}
function render(name,list,isLive,muscles){
 exerciseName=name;points=Array.isArray(list)?list:[];metric=cardio()?'duration':'heaviest';period='3m';selectedIndex=-1;
 $('exerciseHistoryTitle').textContent=name;
 $('sxExerciseChartRange').value='3m';
 $('exerciseHistorySubtitle').textContent=points.filter(x=>!x.isLive).length+' logged workouts'+(points.some(x=>x.isLive)?(cardio()?' · Live cardio intervals included':' · Live sets included'):'');
 $('exerciseHistoryMuscles').innerHTML=cardio()?'<strong>CARDIO SESSION</strong><span>Time, '+(cardioMeasure()==='floors'?'floors climbed':cardioMeasure()==='steps'?'steps climbed':'distance')+' and calories recorded separately from strength stats</span>':'<strong>MUSCLES WORKED</strong><span>'+escape(muscleNames(muscles.primary)||'Not classified')+' · '+escape(muscleNames(muscles.secondary)||'None')+'</span>';
 drawWeightLoggingSummary();drawMetric();records();drawHowTo(muscles);showTab('summary');
}
$('exerciseMetricTabs').addEventListener('click',e=>{
 const b=e.target.closest('[data-exercise-metric]');if(!b)return;
 metric=b.dataset.exerciseMetric;selectedIndex=-1;
 // The existing event handler also invokes the usual renderExerciseMetric.
 // Its native implementation delegates to this renderer.
});
$('sxExerciseChartRange').addEventListener('change',e=>{period=e.target.value;selectedIndex=-1;drawMetric();});
$('exerciseHistoryCharts').addEventListener('click',e=>{
 const dot=e.target.closest('[data-ex-stat-point]');if(!dot)return;
 selectedIndex=Number(dot.dataset.exStatPoint);drawMetric();
});
$('exerciseHistoryCharts').addEventListener('keydown',e=>{
 if(e.key!=='Enter'&&e.key!==' ')return;
 const dot=e.target.closest('[data-ex-stat-point]');if(!dot)return;e.preventDefault();selectedIndex=Number(dot.dataset.exStatPoint);drawMetric();
});
$('sxExerciseTopTabs').addEventListener('click',e=>{
 const b=e.target.closest('[data-sx-exercise-tab]');if(b)showTab(b.dataset.sxExerciseTab);
});
$('sxExerciseStatsShare').addEventListener('click',async()=>{
 const list=allPoints(),heavy=Math.max(0,...list.flatMap(p=>p.sets.map(s=>Number(s.weight)||0)));
 const message=cardio()?exerciseName+' — Best time '+display(Math.max(0,...list.map(p=>metricsFor(p).duration)),'duration')+' · SpartanX':exerciseName+' — Heaviest weight '+(heavy?weight(heavy):'no record yet')+' · SpartanX';
 try{if(navigator.share){await navigator.share({title:'SpartanX exercise stats',text:message});return;}
  if(navigator.clipboard){await navigator.clipboard.writeText(message);alert('Exercise summary copied.');return;}
 }catch(e){if(e.name==='AbortError')return;}
 prompt('Copy exercise summary',message);
});
window.SpartanXExerciseStats={
 render,
 renderMetric(_points,id){metric=currentMetrics().some(m=>m.id===id)?id:metric;selectedIndex=-1;drawMetric();},
 renderRecords:records
};
})();
