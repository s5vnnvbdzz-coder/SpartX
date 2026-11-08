/* SpartanX active 5/3/1 cycles: lift chooser, week preview, set import and verified progress. */
(function(){
'use strict';
const KEY='spartanx_531_saved_cycles_v1',LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
const LABEL={'Back Squat':'SQUAT','Bench Press':'BENCH','Deadlift':'DEADLIFT','Overhead Press':'OHP'};
const $=id=>document.getElementById(id),round=n=>Math.round(Number(n)/2.5)*2.5;
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}}
function lifts(c){return (Array.isArray(c.exercises)&&c.exercises.length?c.exercises:[c.lift]).filter(l=>LIFTS.includes(l))}
function completed(c,lift){
 const byLift=c.completedSessions?.[lift];
 return new Set((Array.isArray(byLift)?byLift:(c.lift===lift?c.completedWeeks||[]:[])).map(Number));
}
function nextWeek(c,lift){const done=completed(c,lift);for(let n=1;n<=c.weeks;n++)if(!done.has(n))return n;return null}
function activeCycles(){return read().filter(c=>lifts(c).some(l=>nextWeek(c,l)!==null))}
function weekData(c,lift,n){
 const blocks=c.liftPlans?.[lift]?.cycles||(c.lift===lift?c.cycles:[])||[];
 const original=blocks.flatMap(b=>b.weeks||[]).find(w=>Number(w.number)===Number(n));
 if(!original)return null;
 const tm=Number(original.tm)||Number(c.startTM)||0;
 return {...original,warmups:Array.isArray(original.warmups)?original.warmups:(n%4===0?[]:[
  {pct:.4,rep:'5',weight:round(tm*.4)},{pct:.5,rep:'5',weight:round(tm*.5)},{pct:.6,rep:'3',weight:round(tm*.6)}])};
}
function minimumReps(set){return Math.max(1,Number(String(set.rep??set.reps??1).replace('+',''))||1)}
function volumeOf(w){
 if(!w)return 0;
 let total=[...(w.warmups||[]),...(w.sets||[])].reduce((n,s)=>n+Number(s.weight)*minimumReps(s),0);
 if(w.bbb)total+=Number(w.bbb.weight)*Number(w.bbb.sets)*Number(w.bbb.reps);
 return Math.round(total);
}
function selectDefault(c){
 const candidates=lifts(c).map(l=>({lift:l,week:nextWeek(c,l)})).filter(x=>x.week!==null);
 return candidates.sort((a,b)=>a.week-b.week||LIFTS.indexOf(a.lift)-LIFTS.indexOf(b.lift))[0]||null;
}
const style=document.createElement('style');
style.id='sx531CycleFlowStyle';
style.textContent='body:has(#sx531CyclePreview:not([hidden])) #trackerNav{display:none!important}#sx531CyclePreview[hidden],#sx531WorkoutCard[hidden]{display:none!important}#sx531CyclePreview{position:fixed;inset:0;z-index:290000;height:100dvh;display:flex;justify-content:center;align-items:stretch;background:var(--bg);padding:calc(8px + env(safe-area-inset-top,0px)) 10px calc(6px + env(safe-area-inset-bottom,0px));overscroll-behavior:contain}#sx531CyclePreview *{box-sizing:border-box}#sx531CyclePreview .sx531-dialog{display:flex;flex-direction:column;width:min(100%,660px);min-height:0;max-height:100%;border:1px solid var(--line);border-radius:16px;background:var(--bg);overflow:hidden;color:var(--txt);box-shadow:0 15px 50px #0007}#sx531CyclePreview header{position:static!important;flex:0 0 auto;padding:12px 14px!important;margin:0!important;background:var(--panel)!important;border-bottom:1px solid var(--line)!important;display:flex!important;justify-content:space-between;align-items:center}#sx531CyclePreview h2{font-size:18px;margin:5px 0 0}#sx531CyclePreview .sx531-content{overflow:auto;overscroll-behavior:contain;min-height:0;flex:1;padding:12px;-webkit-overflow-scrolling:touch}#sx531CyclePreview .sx531-caption{font-size:10px;letter-spacing:1px;font-weight:850;color:var(--lime)}#sx531CyclePreview .sx531-select{margin:10px 0}#sx531CyclePreview select{width:100%;font-size:15px;background:var(--panel2);border:1px solid var(--line);color:var(--txt);padding:10px;border-radius:10px}#sx531CyclePreview .sx531-lifts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}#sx531CyclePreview .sx531-lifts button{padding:10px 7px;min-height:56px;background:var(--panel2)!important;color:var(--txt)!important;border:1px solid var(--line)!important;display:flex;flex-direction:column;gap:4px;justify-content:center;align-items:center;font-size:11px}#sx531CyclePreview .sx531-lifts button.current{border-color:var(--lime)!important;box-shadow:inset 0 0 0 1px var(--lime)}#sx531CyclePreview .sx531-lifts button:disabled{opacity:.45}#sx531CyclePreview .sx531-lifts small{font-size:10px;color:var(--muted)}#sx531CyclePreview .sx531-week-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 8px}#sx531CyclePreview .sx531-week-head strong{font-size:17px}#sx531CyclePreview .sx531-week-head span{font-size:12px;color:var(--lime)}#sx531CyclePreview .sx531-bars{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(11px,1fr);gap:3px;align-items:end;min-height:105px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 7px 8px;overflow:hidden}#sx531CyclePreview .sx531-bar{height:85px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;min-width:0}#sx531CyclePreview .sx531-bar i{display:block;width:100%;min-height:5px;border-radius:4px 4px 2px 2px;background:color-mix(in srgb,var(--lime) 42%,var(--panel2))}#sx531CyclePreview .sx531-bar.current i{background:var(--lime);box-shadow:0 0 8px color-mix(in srgb,var(--lime) 35%,transparent)}#sx531CyclePreview .sx531-bar small{font-size:8px;color:var(--muted)}#sx531CyclePreview .sx531-legend{font-size:10px;color:var(--muted);margin:7px 0 13px;line-height:1.5}#sx531CyclePreview .sx531-sets{border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden}#sx531CyclePreview .sx531-set{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border-bottom:1px solid var(--line);font-size:12px}#sx531CyclePreview .sx531-set:last-child{border-bottom:0}#sx531CyclePreview .sx531-set strong{white-space:nowrap;font-size:13px;color:var(--lime)}#sx531CyclePreview .sx531-section{font-size:10px;letter-spacing:.9px;color:var(--muted);padding:12px 11px 5px;font-weight:900}#sx531CyclePreview .sx531-footer{display:grid;grid-template-columns:1fr 1.5fr;gap:8px;padding:10px 12px 12px;background:var(--panel);border-top:1px solid var(--line);flex:0 0 auto}#sx531CyclePreview .sx531-footer button{min-height:45px;padding:10px 5px;font-size:11px;border-radius:10px;font-weight:900}#sx531CyclePreview #sx531Cancel{background:var(--panel2)!important;color:var(--txt)!important;border:1px solid var(--line)!important}#sx531CyclePreview #sx531Load{background:var(--lime)!important;color:var(--bg)!important;border:1px solid var(--lime)!important}#sx531CyclePreview .sx531-sub-actions{display:flex;justify-content:space-between;gap:8px;margin:10px 0}#sx531CyclePreview .sx531-sub-actions button{font-size:10px;padding:10px;flex:1;color:var(--txt);background:var(--panel2);border:1px solid var(--line)}#sx531WorkoutCard{border:1px solid color-mix(in srgb,var(--lime) 40%,var(--line));background:linear-gradient(135deg,color-mix(in srgb,var(--lime) 9%,var(--panel)),var(--panel));padding:15px}#sx531WorkoutCard h2{font-size:18px;margin:5px 0 9px}#sx531WorkoutCard .sx531-quick-row{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}#sx531WorkoutCard .sx531-quick-row span{flex:1;min-width:65px;text-align:center;border:1px solid var(--line);border-radius:9px;padding:9px 4px;font-size:10px;background:var(--panel2)}#sx531WorkoutCard .sx531-quick-row strong{display:block;margin-top:5px;color:var(--lime);font-size:13px}#sx531WorkoutCard .sx531-progress{height:6px;border-radius:5px;background:var(--panel2);overflow:hidden;margin:10px 0}#sx531WorkoutCard .sx531-progress i{display:block;height:100%;background:var(--lime)}#sx531WorkoutCard .sx531-actions{display:flex;gap:8px}#sx531WorkoutCard .sx531-actions button{flex:1;min-width:0;font-size:10px;padding:12px 8px}#sx531WorkoutCard .sx531-actions button:first-child{background:var(--lime)!important;color:var(--bg)!important}@media(max-height:580px){#sx531CyclePreview .sx531-content{padding:8px}}';
document.head.appendChild(style);
const overlay=document.createElement('div');
overlay.id='sx531CyclePreview';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','5/3/1 programme preview');
overlay.innerHTML='<div class="sx531-dialog"><header><div><div class="sx531-caption">SPARTANX · 5/3/1</div><h2>Current cycle</h2></div><span class="sx531-caption" id="sx531CycleStatus"></span></header><div class="sx531-content" id="sx531CycleContent"></div><footer class="sx531-footer"><button type="button" id="sx531Cancel">CANCEL</button><button type="button" id="sx531Load">LOAD INTO SPARTANX</button></footer></div>';
document.body.appendChild(overlay);
const card=document.createElement('section');card.id='sx531WorkoutCard';card.className='card';card.hidden=true;
const workout=$('workout'),start=workout?.querySelector('.start-card');
if(start)start.before(card);
let cycleId=null,selectedLift=null,returnMenu=false,oldOverflow=null,bypass=false;
function chosenCycle(){return activeCycles().find(c=>c.id===cycleId)||activeCycles()[0]}
function renderPreview(){
 const all=activeCycles(),c=chosenCycle();
 if(!c){closePreview(false);return}
 cycleId=c.id;
 const pick=selectDefault(c),available=lifts(c).filter(l=>nextWeek(c,l)!==null);
 if(!available.includes(selectedLift))selectedLift=pick?.lift||available[0];
 const n=nextWeek(c,selectedLift),w=weekData(c,selectedLift,n);
 if(!w){$('sx531CycleContent').textContent='The selected cycle has no stored sets for this week.';$('sx531Load').disabled=true;return}
 $('sx531Load').disabled=false;
 $('sx531CycleStatus').textContent=n+'/'+c.weeks+' WEEKS';
 const selector=all.length>1?'<label class="sx531-caption" for="sx531ProgrammeSelect">PROGRAMME</label><select id="sx531ProgrammeSelect" class="sx531-select">'+all.map(x=>'<option value="'+safe(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+safe(x.name)+'</option>').join('')+'</select>':'';
 const cards='<div class="sx531-lifts">'+lifts(c).map(l=>{
  const week=nextWeek(c,l);
  return '<button type="button" data-sx531-lift="'+safe(l)+'" '+(week===null?'disabled':'')+' class="'+(l===selectedLift?'current':'')+'"><strong>'+LABEL[l]+'</strong><small>'+(week===null?'✓ COMPLETE':'WEEK '+week)+'</small></button>';
 }).join('')+'</div>';
 const vols=Array.from({length:c.weeks},(_,i)=>volumeOf(weekData(c,selectedLift,i+1)));
 const maximum=Math.max(...vols,1);
 const bars='<div class="sx531-bars" aria-label="Estimated weekly training volume">'+vols.map((v,i)=>'<div class="sx531-bar '+(i+1===n?'current':'')+'" title="Week '+(i+1)+': '+v.toLocaleString()+' kg estimated volume"><i style="height:'+Math.max(5,Math.round(v/maximum*62))+'px"></i><small>'+(completed(c,selectedLift).has(i+1)?'✓':i+1)+'</small></div>').join('')+'</div>';
 const row=(label,weight,reps)=>'<div class="sx531-set"><span>'+safe(label)+'</span><strong>'+safe(reps)+' × '+Number(weight).toLocaleString()+' kg</strong></div>';
 let sets='<div class="sx531-sets">';
 if(w.warmups.length){sets+='<div class="sx531-section">WARM-UP SETS</div>'+w.warmups.map(s=>row(Math.round(s.pct*100)+'% Training Max',s.weight,s.rep)).join('')}
 sets+='<div class="sx531-section">WORKING SETS</div>'+w.sets.map((s,i)=>row('Set '+(i+1)+' · '+Math.round(s.pct*100)+'% Training Max',s.weight,s.rep)).join('');
 if(w.bbb){sets+='<div class="sx531-section">BORING BUT BIG</div>'+row('5 sets · '+w.bbb.pct+'% TM',w.bbb.weight,'5 × 10')}
 sets+='</div>';
 $('sx531CycleContent').innerHTML=selector+'<div class="sx531-caption">'+safe(c.name)+'</div>'+cards+
  '<div class="sx531-week-head"><strong>WEEK '+n+' · '+safe(w.name?.split('·').at(-1)?.trim()||'5/3/1')+'</strong><span>TM '+w.tm+' kg</span></div>'+
  bars+'<p class="sx531-legend">Weekly volume estimate (kg × minimum prescribed reps, including warm-ups and BBB where programmed). AMRAP sets may exceed this estimate. Current week highlighted.</p>'+sets+
  '<div class="sx531-sub-actions"><button type="button" id="sx531EditCycle">EDIT PROGRAMME / LIFTS</button><button type="button" id="sx531OpenCalculator">5/3/1 CALCULATOR</button></div>';
}
function openPreview(fromMenu=false,requestedId=null){
 const all=activeCycles();if(!all.length)return false;
 returnMenu=fromMenu;const c=all.find(x=>x.id===requestedId)||all[0];cycleId=c.id;selectedLift=selectDefault(c)?.lift||null;
 oldOverflow={body:document.body.style.overflow,html:document.documentElement.style.overflow,scroll:window.scrollY||0};
 document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
 renderPreview();overlay.hidden=false;$('sx531Cancel').focus({preventScroll:true});
 return true;
}
function closePreview(reopen=false){
 if(overlay.hidden)return;
 overlay.hidden=true;
 if(oldOverflow){document.body.style.overflow=oldOverflow.body;document.documentElement.style.overflow=oldOverflow.html;window.scrollTo(0,oldOverflow.scroll)}
 oldOverflow=null;
 const menu=returnMenu;returnMenu=false;
 if(reopen&&menu)window.dispatchEvent(new Event('spartx:showSessionOptions'));
}
function load(){
 const c=chosenCycle(),lift=selectedLift;if(!c||!lift)return;
 const n=nextWeek(c,lift),w=weekData(c,lift,n);
 if(!w)return;
 if(typeof sessionActive!=='undefined'&&sessionActive){
  if(!confirm('Replace the current active workout with this 5/3/1 session?'))return;
  resetSession();
 }
 $('workoutName').value=lift+' - Week '+n;
 startSession();
 const base={weight:'',reps:'',rpe:'',type:'Working Set',done:false};
 const mk=(s,type)=>({...base,weight:String(s.weight),reps:String(minimumReps(s)),type});
 const mainSets=[...w.warmups.map(s=>mk(s,'Warm-up')),...w.sets.map(s=>mk(s,'Working Set'))];
 const planned=w.sets.map(s=>({weight:Number(s.weight),reps:minimumReps(s),exercise:lift}));
 work=[{name:lift,rest:180,notes:'SpartanX 5/3/1 · '+c.name+' · Week '+n+' · TM '+w.tm+' kg',sets:mainSets}];
 if(w.bbb){
  const bbbName=lift+' · BBB';
  const bbbSets=Array.from({length:Number(w.bbb.sets)},()=>({weight:Number(w.bbb.weight),reps:Number(w.bbb.reps),exercise:bbbName}));
  planned.push(...bbbSets);
  work.push({name:bbbName,rest:90,notes:'BBB · '+w.bbb.pct+'% training max',sets:bbbSets.map(s=>mk(s,'Working Set'))});
 }
 activeCycle={id:c.id,week:n,lift,plannedSets:planned};
 $('activeWorkoutName').textContent=lift+' - Week '+n;
 $('workoutName').value=lift+' - Week '+n;
 closePreview(false);
 switchScreen('activeWorkout',{instant:true});renderWork();updateMinimizedSession();saveDraft();window.scrollTo(0,0);
}
function recordCompleted(link,session){
 const all=read(),c=all.find(x=>x.id===link?.id);if(!c)return;
 const lift=link.lift||c.lift,n=Number(link.week);
 if(!lifts(c).includes(lift)||!Number.isInteger(n)||n<1||n>c.weeks)return;
 const w=weekData(c,lift,n);if(!w)return;
 const needed=Array.isArray(link.plannedSets)&&link.plannedSets.length?link.plannedSets.slice():
  w.sets.map(s=>({weight:Number(s.weight),reps:minimumReps(s),exercise:lift})).concat(w.bbb?Array.from({length:w.bbb.sets},()=>({weight:Number(w.bbb.weight),reps:Number(w.bbb.reps),exercise:lift+' · BBB'})):[]);
 const logged=(session.exercises||[]).flatMap(ex=>(ex.sets||[]).filter(s=>s.type!=='Warm-up').map(s=>({exercise:ex.name,weight:Number(s.weight),reps:Number(s.reps),used:false})));
 const allDone=needed.every(target=>{
  const match=logged.find(s=>!s.used&&s.exercise===target.exercise&&s.weight+0.01>=target.weight&&s.reps>=target.reps);
  if(match){match.used=true;return true}return false;
 });
 if(!allDone)return;
 c.completedSessions=c.completedSessions||{};
 const old=completed(c,lift);
 old.add(n);c.completedSessions[lift]=[...old].sort((a,b)=>a-b);
 c.completedWeeks=Array.from({length:c.weeks},(_,i)=>i+1).filter(week=>lifts(c).every(l=>completed(c,l).has(week)));
 try{localStorage.setItem(KEY,JSON.stringify(all));window.dispatchEvent(new Event('spartx:cycleUpdated'))}catch(_){}
}
window.spartanx531RecordCompleted=recordCompleted;
window.spartanxOpen531SavedPreview=id=>openPreview(false,id);
$('sx531Cancel').addEventListener('click',()=>closePreview(true));
$('sx531Load').addEventListener('click',load);
overlay.addEventListener('click',e=>{if(e.target===overlay)closePreview(true)});
$('sx531CycleContent').addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.sx531Lift){selectedLift=target.dataset.sx531Lift;renderPreview();return}
 if(target.id==='sx531EditCycle'){
  const c=chosenCycle();closePreview(false);
  if(!c)return;
  switchScreen('native531',{instant:true});
  const button=$('native531Host')?.shadowRoot?.querySelector('[data-edit="'+CSS.escape(String(c.id))+'"]');
  button?.click();
 }
 if(target.id==='sx531OpenCalculator'){
  closePreview(false);
  bypass=true;$('start531Shortcut')?.click();bypass=false;
 }
});
$('sx531CycleContent').addEventListener('change',e=>{if(e.target.id==='sx531ProgrammeSelect'){cycleId=e.target.value;selectedLift=null;renderPreview()}});
$('start531Shortcut')?.addEventListener('click',e=>{
 if(bypass||!activeCycles().length)return;
 e.preventDefault();e.stopImmediatePropagation();
 $('sxCloseSessionOptions')?.click();
 openPreview(true);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();closePreview(true)}});
function renderCard(){
 const all=activeCycles();if(!card||!all.length){if(card)card.hidden=true;return}
 const c=all[0],l=lifts(c);
 const total=l.length*c.weeks;
 const done=l.reduce((sum,lift)=>sum+completed(c,lift).size,0);
 const next=selectDefault(c);
 card.hidden=false;
 card.innerHTML='<div class="eyebrow">YOUR ACTIVE PROGRAMME</div><h2>5/3/1 CYCLE</h2><div class="tiny muted">'+safe(c.name)+' · Next: '+safe(next?.lift||'')+' (Week '+(next?.week||'—')+')</div>'+
  '<div class="sx531-quick-row">'+l.map(lift=>'<span>'+LABEL[lift]+'<strong>'+(nextWeek(c,lift)===null?'✓':'W'+nextWeek(c,lift))+'</strong></span>').join('')+'</div>'+
  '<div class="tiny muted">CYCLE PROGRESS · '+done+'/'+total+' LIFT SESSIONS</div><div class="sx531-progress"><i style="width:'+Math.min(100,100*done/total)+'%"></i></div>'+
  '<div class="sx531-actions"><button type="button" id="sx531QuickContinue">⚡ CONTINUE 5/3/1</button><button type="button" id="sx531QuickView">VIEW CYCLE</button></div>';
}
card.addEventListener('click',e=>{if(e.target.closest('#sx531QuickContinue,#sx531QuickView'))openPreview(false)});
window.addEventListener('spartx:cycleUpdated',renderCard);
window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)renderCard()});
window.addEventListener('pageshow',renderCard);
renderCard();
})();
