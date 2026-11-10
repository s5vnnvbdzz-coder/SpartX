/* Full latest-session breakdown for SpartanX Intelligence.
 * Read-only and deliberately separate from AscensionX cycle-completion logic. */
(function(global){
 'use strict';
 const DAY=86400000;
 const html=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=v=>String(v==null?'':v).trim();
 const num=v=>v==null||v===''?NaN:Number(v);
 const fmt=(v,d=0)=>Number.isFinite(v)?v.toLocaleString('en-GB',{maximumFractionDigits:d}):'—';
 const key=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
 const cardioPattern=/^(?:stairmaster|treadmill|rowing machine|bike$|recumbent bike|cross trainer|ski[\s-]?erg|elliptical)/i;
 function lift(name){
  const n=key(name);
  if(/^(?:(?:back|barbell|high-bar|low-bar) )?squats?$/.test(n))return 'Squat';
  if(/^(?:(?:barbell|flat) )?bench press$/.test(n))return 'Bench Press';
  if(/^(?:(?:conventional|sumo|barbell) )?deadlift$/.test(n))return 'Deadlift';
  if(/^(?:overhead press|ohp|barbell overhead press)$/.test(n))return 'Overhead Press';
  return null;
 }
 function isWarmup(type){return /warm[\s-]?up|excluded|cardio/i.test(type)||/^(?:w|x)$/i.test(type)}
 function exercise(ex){
  const name=clean(ex?.name||ex?.exerciseName).slice(0,100);
  if(!name)return null;
  const entries=Array.isArray(ex?.sets)?ex.sets.slice(0,80):[];
  if(cardioPattern.test(name)){
   const done=entries.filter(s=>s?.done!==false);
   if(!done.length)return null;
   const sum=k=>done.reduce((a,s)=>a+Math.max(0,num(s[k])||0),0);
   return {name,key:key(name),kind:'cardio',label:'CARDIO',cardio:{
    count:done.length,seconds:sum('durationSeconds'),floors:sum('floors'),steps:sum('steps'),km:sum('distanceKm')
   },all:[],working:[],volume:0};
  }
  const all=entries.flatMap(s=>{
   if(!s||s.done===false)return [];
   const weight=num(s.weight),reps=num(s.reps);
   if(!Number.isFinite(weight)||weight<0||weight>1500||!Number.isFinite(reps)||reps<=0||reps>100)return [];
   const type=clean(s.type||'Working Set');
   return [{weight,reps,type,rpe:num(s.rpe),working:!isWarmup(type)}];
  });
  if(!all.length)return null;
  const working=all.filter(s=>s.working);
  const max=working.length?Math.max(...working.map(s=>s.weight)):null;
  const best=working.filter(s=>s.weight===max).sort((a,b)=>b.reps-a.reps)[0]||null;
  const rpes=working.map(s=>s.rpe).filter(v=>Number.isFinite(v)&&v>=6&&v<=10);
  const main=!!ex.ascensionLink||!!lift(name);
  const legacy=!!ex.ascensionAccessory,companion=!!ex.sxStrengthSizeCompanion;
  const kind=main?'main':legacy||companion?'linked':'additional';
  const label=ex.ascensionLink?'ASCENSIONX MAIN LIFT':
   legacy?'ASCENSIONX ACCESSORY':companion?'STRENGTH & SIZE':
   main?'COMPOUND LIFT':'ADDITIONAL EXERCISE';
  const metadata=ex.ascensionLink||ex.ascensionAccessory||ex.sxStrengthSizeCompanion||null;
  return {name,key:key(name),kind,label,all,working,max,best,
   volume:working.reduce((n,s)=>n+s.weight*s.reps,0),
   averageRpe:rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:null,
   linked:metadata?{week:num(metadata.week),lift:clean(metadata.lift||metadata.sourceLift||name)}:null};
 }
 function readRaw(storage=global.localStorage){
  try{
   const text=storage?.getItem?.('spartx_db');
   if(!text||text.length>12*1024*1024)return [];
   const db=JSON.parse(text);
   return Array.isArray(db?.sessions)?db.sessions.slice(0,5000):[];
  }catch(_){return []}
 }
 function analyse(raw,range=90,now=Date.now()){
  const days=[0,30,90].includes(Number(range))?Number(range):90;
  const sessions=(Array.isArray(raw)?raw:[]).slice(0,5000).map((s,index)=>({
   s,index,date:new Date(s?.date||s?.completedAt||s?.timestamp||'').getTime()
  })).filter(x=>Number.isFinite(x.date)&&x.date<=now+60000&&(!days||x.date>=now-days*DAY))
   .sort((a,b)=>b.date-a.date||a.index-b.index).map(({s,index,date})=>({
    id:String(s.id??index),name:clean(s.name||'Workout').slice(0,100),date,
    items:(Array.isArray(s.exercises)?s.exercises:[]).slice(0,80).map(exercise).filter(Boolean)
   })).filter(s=>s.items.length);
  const history=new Map();
  // Chronological entries for each exercise; the most recent session comes first.
  for(const session of sessions)for(const item of session.items){
   if(!item.working.length)continue;
   const list=history.get(item.key)||[];
   list.push({date:session.date,sessionId:session.id,volume:item.volume,
    max:item.max,best:item.best,sets:item.working});
   history.set(item.key,list);
  }
  const latest=sessions[0]||null;
  if(!latest)return {latest:null,history,range:days};
  const items=latest.items.map(item=>{
   if(!item.working.length)return {...item,comparison:null};
   const prior=(history.get(item.key)||[]).find(s=>s.sessionId!==latest.id);
   let comparison='First recorded session for this exercise within the selected date range.';
   if(prior&&item.best){
    const matched=prior.sets.filter(s=>s.weight===item.best.weight);
    if(matched.length){
     const difference=item.best.reps-Math.max(...matched.map(s=>s.reps));
     comparison=difference===0?'Same best-set reps at '+fmt(item.best.weight,1)+' kg as the previous session.':
      (difference>0?'+':'')+fmt(difference)+' best-set reps at '+fmt(item.best.weight,1)+' kg versus previous session.';
    }else comparison='Previous top load: '+fmt(prior.max,1)+' kg. Different loads mean a direct rep comparison is not valid.';
   }
   return {...item,comparison};
  });
  const resistance=items.filter(i=>i.kind!=='cardio');
  const accessories=resistance.filter(i=>i.kind!=='main');
  const latestCycle=items.find(i=>i.linked&&i.linked.week>=1&&i.linked.week<=6)?.linked||null;
  return {latest:{...latest,items,cycle:latestCycle,
   count:items.length,working:resistance.reduce((n,i)=>n+i.working.length,0),
   warmups:resistance.reduce((n,i)=>n+i.all.length-i.working.length,0),
   volume:resistance.reduce((n,i)=>n+i.volume,0),accessoryCount:accessories.length,
   accessorySets:accessories.reduce((n,i)=>n+i.working.length,0)},history,range:days};
 }
 function chart(history){
  const points=history.slice(0,12).reverse();
  if(!points.length)return '<p class="sx-session-muted">No saved data for this exercise yet.</p>';
  const w=600,h=173,l=56,r=16,t=18,b=37;
  const vals=points.map(p=>p.volume),hi=Math.max(1,...vals),lo=Math.max(0,Math.min(...vals)*.8);
  const upper=hi*1.12,areaW=w-l-r,areaH=h-t-b;
  const x=i=>l+(points.length===1?areaW/2:areaW*i/(points.length-1));
  const y=v=>t+(upper-v)/(upper-lo)*areaH;
  const path=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.volume).toFixed(1)).join(' ');
  const marks=[lo,(lo+upper)/2,upper].map(v=>'<line x1="'+l+'" x2="'+(w-r)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#373a40" stroke-dasharray="4 6"/>'+
   '<text x="'+(l-7)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="#acb0b7" font-size="10">'+html(fmt(v,0))+'</text>').join('');
  const dots=points.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p.volume)+'" r="'+(i===points.length-1?5:3.5)+'" fill="#f4cd37"/>').join('');
  const date=p=>new Date(p.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Logged resistance exercise volume across '+points.length+' saved sessions">'+
   marks+'<path d="'+path+'" fill="none" stroke="#f4cd37" stroke-width="3" stroke-linecap="round"/>'+dots+
   '<text x="'+l+'" y="'+(h-8)+'" fill="#a6abb3" font-size="10">'+html(date(points[0]))+'</text>'+
   '<text x="'+(w-r)+'" y="'+(h-8)+'" text-anchor="end" fill="#a6abb3" font-size="10">'+html(date(points.at(-1)))+'</text></svg>';
 }
 let report=null,selected='';
 function renderChart(){
  const select=document.getElementById('sxSessionTrendSelect');
  const plot=document.getElementById('sxSessionTrendChart'),note=document.getElementById('sxSessionTrendNote');
  if(!select||!plot||!note||!report)return;
  selected=select.value;
  const h=report.history.get(selected)||[];
  plot.innerHTML=chart(h);
  note.textContent=h.length<2?'Only one session recorded for this exercise in this date range. More sessions are needed for a trend.':
   'Session volume = completed non-warm-up sets × reps × external weight. Differences may reflect changes in sets, reps or loading; this alone does not establish muscle growth.';
 }
 function render({mode='spartanx',range=90,sessions=[]}={}){
  const host=document.getElementById('sxLatestWorkoutAnalysis');
  if(!host)return;
  const raw=String(mode).startsWith('spartanx')?readRaw():sessions;
  report=analyse(raw,range);
  const last=report.latest;
  const insight=document.getElementById('sxLatestSessionInsight');
  const select=document.getElementById('sxSessionTrendSelect');
  if(!last){
   host.innerHTML='<article class="panel sx-session-panel"><div class="eyebrow">LATEST COMPLETED WORKOUT</div><h3>No saved resistance workout in this range</h3>'+
    '<p class="sx-session-muted">Change the date range or save a workout to see every logged exercise here.</p></article>';
   if(select){select.replaceChildren();select.disabled=true}
   const plot=document.getElementById('sxSessionTrendChart');
   if(plot)plot.innerHTML='<p class="sx-session-muted">Save a workout to begin tracking individual exercises.</p>';
   if(insight)insight.innerHTML='<p class="sx-session-muted">No completed workout in the selected date range.</p>';
   return;
  }
  const date=new Date(last.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  const figures='<div class="sx-session-metrics">'+
   '<div><strong>'+fmt(last.count)+'</strong><span>Logged exercises</span></div>'+
   '<div><strong>'+fmt(last.working)+'</strong><span>Resistance sets</span></div>'+
   '<div><strong>'+fmt(last.accessorySets)+'</strong><span>Accessory sets</span></div>'+
   '<div><strong>'+fmt(last.volume)+' kg</strong><span>Work volume</span></div></div>';
  const cards=last.items.map(item=>{
   if(item.kind==='cardio'){
    const c=item.cardio,bits=[c.seconds?fmt(c.seconds/60,1)+' min':null,
     c.floors?fmt(c.floors)+' floors':null,c.steps?fmt(c.steps)+' steps':null,c.km?fmt(c.km,2)+' km':null].filter(Boolean);
    return '<details class="sx-session-exercise"><summary><div><small class="sx-session-tag">'+html(item.label)+'</small>'+
     '<strong>'+html(item.name)+'</strong><span>'+html(bits.join(' · ')||fmt(c.count)+' cardio entries')+'</span></div><span class="sx-session-expand">⌄</span></summary>'+
     '<p class="sx-session-muted">Cardio is listed but excluded from resistance workload calculations.</p></details>';
   }
   const facts=[fmt(item.working.length)+' resistance sets',
    item.max===null?null:'Top '+fmt(item.max,1)+' kg',
    fmt(item.volume)+' kg work volume',
    item.averageRpe!=null?'Avg RPE '+fmt(item.averageRpe,1):null].filter(Boolean).join(' · ');
   const rows=item.all.map((set,i)=>'<div class="sx-session-set"><span>SET '+(i+1)+'</span>'+
    '<strong>'+fmt(set.weight,1)+' kg × '+fmt(set.reps,0)+'</strong>'+
    '<span>'+html(set.type)+'</span><span>'+(Number.isFinite(set.rpe)&&set.rpe>=6&&set.rpe<=10?'RPE '+fmt(set.rpe,1):'RPE —')+'</span></div>').join('');
   return '<details class="sx-session-exercise"><summary><div><small class="sx-session-tag '+html(item.kind)+'">'+html(item.label)+'</small>'+
    '<strong>'+html(item.name)+'</strong><span>'+html(facts)+'</span></div><span class="sx-session-expand">⌄</span></summary>'+
    '<div class="sx-session-content"><p class="sx-session-comparison">'+html(item.comparison||'Only valid completed sets are included.')+'</p>'+
    '<div class="sx-session-set-list">'+rows+'</div>'+
    (item.all.length>item.working.length?'<p class="sx-session-muted">'+fmt(item.all.length-item.working.length)+' warm-up/excluded sets shown but not counted as work sets.</p>':'')+
    '</div></details>';
  }).join('');
  host.innerHTML='<article class="panel sx-session-panel"><div class="sx-session-heading"><div>'+
   '<div class="eyebrow">LATEST SAVED SESSION · ALL EXERCISES</div><h3>'+html(last.name)+'</h3>'+
   '<p class="sx-session-muted">'+html(date)+' · The complete workout, not just a powerlift</p></div>'+
   (last.cycle?'<span class="sx-session-week">ASCENSIONX · WEEK '+fmt(last.cycle.week)+'</span>':'')+
   '</div>'+figures+
   '<p class="sx-session-explainer">'+fmt(last.accessoryCount)+' additional/accessory exercises · '+fmt(last.accessorySets)+
    ' non-warm-up accessory sets. This records workload, not whether the accessories have improved strength.</p>'+
   '<div class="sx-session-exercises">'+cards+'</div>'+
   '<p class="sx-session-muted">Open an exercise to see every valid completed set and a cautious prior-session comparison. Exercises without muscle classification are still included.</p>'+
   '</article>';
  if(select){
   const choices=last.items.filter(i=>i.kind!=='cardio'&&i.working.length);
   const pick=choices.find(i=>i.key===selected)||choices.find(i=>i.kind!=='main')||choices[0];
   select.replaceChildren();
   for(const item of choices){
    const opt=document.createElement('option');opt.value=item.key;opt.textContent=item.name;
    select.appendChild(opt);
   }
   select.disabled=!pick;
   if(pick){select.value=pick.key;renderChart()}
   else{
    const plot=document.getElementById('sxSessionTrendChart');
    if(plot)plot.innerHTML='<p class="sx-session-muted">No resistance sets in this session.</p>';
   }
  }
  if(insight)insight.innerHTML='<div class="eyebrow">LATEST COMPLETED SESSION · MAIN & ACCESSORIES</div>'+
   '<h3>'+html(last.name)+'</h3><p>'+fmt(last.working)+' resistance sets from '+fmt(last.count)+
   ' exercises, including '+fmt(last.accessorySets)+' accessory sets.</p>'+
   '<p class="sx-session-muted">Overview now shows the full breakdown. One session cannot establish whether accessories are helping or hindering your deadlift progression.</p>';
 }
 document.addEventListener('change',e=>{if(e.target?.id==='sxSessionTrendSelect')renderChart()});
 global.SXSessionBreakdown=Object.freeze({readRaw,analyse,render});
})(window);