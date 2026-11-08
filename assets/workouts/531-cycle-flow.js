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
style.textContent+=`
/* Use the same centred, independently scrolling dialog as AscensionX.
   Keep the screen behind it locked; do not turn this into a full page. */
#sx531CyclePreview{
 inset:0!important;height:100dvh!important;padding:calc(14px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px))!important;
 align-items:center!important;justify-content:center!important;background:rgba(0,0,0,.84)!important;
 -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
 animation:none!important;transition:none!important;
}
#sx531CyclePreview .sx531-dialog{
 width:min(100%,540px)!important;max-width:540px!important;height:auto!important;min-height:0!important;
 max-height:100%!important;border:1px solid color-mix(in srgb,var(--lime) 34%,var(--line))!important;
 border-radius:20px!important;box-shadow:0 20px 70px #000b!important;
 background:var(--panel)!important;
}
#sx531CyclePreview header{padding:20px 18px 14px!important;background:transparent!important}
#sx531CyclePreview header h2{font-size:22px!important;line-height:1.15;margin:8px 0 0!important}
#sx531CyclePreview .sx531-content{padding:8px 18px 16px!important}
#sx531CyclePreview .sx531-intro{font-size:13px;line-height:1.5;color:var(--muted);margin:4px 0 14px}
#sx531CyclePreview .sx531-programme-label{display:block;font-size:12px;color:var(--muted);margin:12px 0 6px}
#sx531CyclePreview .sx531-select{margin:0!important;padding:12px!important;font-size:15px!important}
#sx531CyclePreview .sx531-current-week{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:15px 0 12px;font-size:12px}
#sx531CyclePreview .sx531-current-week strong{font-size:14px}
#sx531CyclePreview .sx531-current-week span{color:var(--lime)}
#sx531CyclePreview .sx531-plan{padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--bg)}
#sx531CyclePreview .sx531-plan section+section{margin-top:16px}
#sx531CyclePreview .sx531-plan-title{display:block;font-size:11px;letter-spacing:1.2px;font-weight:900;color:var(--lime);margin:0 0 7px}
#sx531CyclePreview .sx531-plan p{font-size:12px;line-height:1.75;margin:0;color:var(--txt);overflow-wrap:anywhere}
#sx531CyclePreview .sx531-help{margin:13px 0;color:var(--muted);font-size:12px;line-height:1.6}
#sx531CyclePreview details.sx531-details{border:1px solid var(--line);border-radius:11px;margin:10px 0;padding:10px 12px;background:var(--panel2)}
#sx531CyclePreview details.sx531-details summary{cursor:pointer;font-size:11px;font-weight:850;color:var(--txt)}
#sx531CyclePreview details.sx531-details .sx531-bars{margin:12px 0 8px}
#sx531CyclePreview .sx531-footer{padding:12px 18px calc(13px + env(safe-area-inset-bottom,0px))!important;background:transparent!important}
#sx531CyclePreview .sx531-footer button{font-size:12px;min-height:48px}
#sx531CyclePreview .sx531-sub-actions{margin:13px 0 0}
#sx531WorkoutCard .sx531-card-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
#sx531WorkoutCard .sx531-card-heading h2{margin-bottom:4px}
#sx531WorkoutCard .sx531-card-cycle{font-size:11px;color:var(--muted);margin:7px 0}
#sx531WorkoutCard .sx531-card-cycle select{width:100%;margin-top:7px;background:var(--panel2);color:var(--txt);border:1px solid var(--line);padding:10px;border-radius:10px}
#sx531WorkoutCard .sx531-manage{position:relative;flex:none}
#sx531WorkoutCard .sx531-manage summary{list-style:none;cursor:pointer;color:var(--txt);border:1px solid var(--line);background:var(--panel2);padding:7px 11px;border-radius:9px;font-weight:900}
#sx531WorkoutCard .sx531-manage summary::-webkit-details-marker{display:none}
#sx531WorkoutCard .sx531-manage-menu{position:absolute;right:0;top:calc(100% + 5px);min-width:130px;z-index:30;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:6px;box-shadow:0 10px 22px #0008}
#sx531WorkoutCard .sx531-manage-menu button{display:block;width:100%;font-size:11px;background:var(--panel2);color:var(--txt);text-align:left;padding:10px;border:0;border-radius:6px}
#sx531WorkoutCard .sx531-manage-menu button+button{margin-top:4px}
#sx531WorkoutCard .sx531-card-complete{color:var(--lime);font-size:11px;font-weight:800;margin:9px 0}
#sx531WorkoutCard .sx531-actions button:disabled{opacity:.5;cursor:not-allowed}
#homeCycleCard{display:none!important}
@media(max-width:380px){#sx531CyclePreview header{padding:16px 13px 10px!important}#sx531CyclePreview .sx531-content{padding:6px 13px 12px!important}#sx531CyclePreview .sx531-footer{padding:10px 13px calc(10px + env(safe-area-inset-bottom,0px))!important}}
`;
document.head.appendChild(style);
const overlay=document.createElement('div');
overlay.id='sx531CyclePreview';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','5/3/1 programme preview');
overlay.innerHTML='<div class="sx531-dialog"><header><div><div class="sx531-caption">5/3/1 × SPARTANX</div><h2>Log this workout in SpartanX?</h2></div><span class="sx531-caption" id="sx531CycleStatus"></span></header><div class="sx531-content" id="sx531CycleContent"></div><footer class="sx531-footer"><button type="button" id="sx531Cancel">CANCEL</button><button type="button" id="sx531Load">LOAD INTO SPARTANX</button></footer></div>';
document.body.appendChild(overlay);
const card=document.createElement('section');card.id='sx531WorkoutCard';card.className='card';card.hidden=true;
const workout=$('workout'),start=workout?.querySelector('.start-card');
if(start)start.before(card);
let cycleId=null,selectedLift=null,selectedCardId=null,returnMenu=false,oldOverflow=null,bypass=false;
function chosenCycle(){return read().find(c=>c.id===cycleId)||read()[0]}
function renderPreview(){
 const all=read(),c=chosenCycle();
 if(!c){closePreview(false);return}
 cycleId=c.id;
 const available=lifts(c);
 if(!available.length){$('sx531CycleContent').textContent='This programme has no supported lifts.';$('sx531Load').disabled=true;return}
 if(!available.includes(selectedLift))selectedLift=selectDefault(c)?.lift||available[0];
 const pending=nextWeek(c,selectedLift),isComplete=pending===null;
 const n=isComplete?Number(c.weeks):pending,w=weekData(c,selectedLift,n);
 if(!w){$('sx531CycleContent').textContent='The selected cycle has no stored sets for this week.';$('sx531Load').disabled=true;return}
 $('sx531Load').disabled=isComplete;
 $('sx531Load').textContent=isComplete?'CYCLE COMPLETED':'LOAD INTO SPARTANX';
 $('sx531CycleStatus').textContent=isComplete?'✓ DONE':n+'/'+c.weeks+' WEEKS';
 const programme=all.length>1?
  '<label class="sx531-programme-label" for="sx531ProgrammeSelect">Programme</label><select id="sx531ProgrammeSelect" class="sx531-select">'+
   all.map(x=>'<option value="'+safe(x.id)+'" '+(String(x.id)===String(c.id)?'selected':'')+'>'+safe(x.name)+'</option>').join('')+'</select>':
  '<div class="sx531-caption" style="margin:0 0 7px">'+safe(c.name)+'</div>';
 const liftOptions=available.map(l=>{
  const week=nextWeek(c,l);
  return '<option value="'+safe(l)+'" '+(l===selectedLift?'selected':'')+'>'+safe(l)+' · '+(week===null?'Completed':'Week '+week)+'</option>';
 }).join('');
 const preview='<label class="sx531-programme-label" for="sx531LiftSelect">Exercise</label><select id="sx531LiftSelect" class="sx531-select">'+liftOptions+'</select>';
 const line=(s,i,prefix)=>prefix+(i+1)+' · '+Number(s.weight).toLocaleString()+' kg × '+minimumReps(s)+(String(s.rep??'').includes('+')?'+':'');
 const warmups=(w.warmups||[]).map((s,i)=>line(s,i,'W')).join(' · ');
 const working=(w.sets||[]).map((s,i)=>line(s,i,'Set ')).join(' · ');
 const bbb=w.bbb?'<section><span class="sx531-plan-title">BORING BUT BIG · '+w.bbb.sets+' SETS</span><p>'+w.bbb.sets+' × '+w.bbb.reps+' @ '+w.bbb.weight+' kg</p></section>':'';
 const plan='<div class="sx531-plan">'+(w.warmups.length?'<section><span class="sx531-plan-title">WARM-UP · '+w.warmups.length+' SETS</span><p>'+warmups+'</p></section>':'')+
  '<section><span class="sx531-plan-title">WORKING SETS · '+w.sets.length+'</span><p>'+working+'</p></section>'+bbb+'</div>';
 const vols=Array.from({length:c.weeks},(_,i)=>volumeOf(weekData(c,selectedLift,i+1)));
 const maximum=Math.max(...vols,1);
 const bars='<div class="sx531-bars" aria-label="Estimated weekly training volume">'+vols.map((v,i)=>'<div class="sx531-bar '+(i+1===n?'current':'')+'" title="Week '+(i+1)+': '+v.toLocaleString()+' kg estimated volume"><i style="height:'+Math.max(5,Math.round(v/maximum*62))+'px"></i><small>'+(completed(c,selectedLift).has(i+1)?'✓':i+1)+'</small></div>').join('')+'</div>';
 const detailRows=(arr,type)=>arr.map((s,i)=>'<div class="sx531-set"><span>'+safe(type)+(i+1)+' · '+Math.round(Number(s.pct||0)*100)+'% TM</span><strong>'+safe(s.rep)+' × '+Number(s.weight).toLocaleString()+' kg</strong></div>').join('');
 const detail='<details class="sx531-details"><summary>VIEW DETAILED SETS &amp; VOLUME PROGRESSION</summary>'+bars+
  '<p class="sx531-legend">Estimated volume uses minimum prescribed reps, including warm-ups and BBB where programmed.</p>'+
  '<div class="sx531-sets">'+(w.warmups.length?'<div class="sx531-section">WARM-UP SETS</div>'+detailRows(w.warmups,'W'):'')+
  '<div class="sx531-section">WORKING SETS</div>'+detailRows(w.sets,'Set ')+'</div></details>';
 $('sx531CycleContent').innerHTML='<p class="sx531-intro">Choose the lift to load as an active SpartanX workout. Your prescribed sets will be ready to log.</p>'+
  programme+preview+'<div class="sx531-current-week"><strong>WEEK '+n+' · '+safe(w.name?.split('·').at(-1)?.trim()||'5/3/1')+'</strong><span>TM '+w.tm+' kg</span></div>'+
  plan+'<p class="sx531-help">'+(isComplete?'This lift has completed its programmed cycle. Select another lift or programme to continue.':
  'Sets will be pre-filled and unchecked. Complete and save every prescribed working set to advance this lift to the next week. Partial sessions do not advance.')+'</p>'+
  detail+'<div class="sx531-sub-actions"><button type="button" id="sx531EditCycle">EDIT PROGRAMME / LIFTS</button><button type="button" id="sx531OpenCalculator">5/3/1 CALCULATOR</button></div>';
}
function openPreview(fromMenu=false,requestedId=null){
 const all=read();if(!all.length)return false;
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
 const n=nextWeek(c,lift);if(n===null)return;
 const w=weekData(c,lift,n);
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
window.spartanxOpen531SavedPreview=(id,fromMenu=false)=>openPreview(fromMenu,id);
$('sx531Cancel').addEventListener('click',()=>closePreview(true));
$('sx531Load').addEventListener('click',load);
overlay.addEventListener('click',e=>{if(e.target===overlay)closePreview(true)});
$('sx531CycleContent').addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.sx531Lift){selectedLift=target.dataset.sx531Lift;renderPreview();return}
 if(target.id==='sx531EditCycle'){
  const c=chosenCycle(),fromMenu=returnMenu;
  closePreview(false);
  if(!c)return;
  window.dispatchEvent(new CustomEvent('spartx:open531CycleEditor',{detail:{id:c.id,returnToMenu:fromMenu}}));
 }
 if(target.id==='sx531OpenCalculator'){
  closePreview(false);
  bypass=true;$('start531Shortcut')?.click();bypass=false;
 }
});
$('sx531CycleContent').addEventListener('change',e=>{if(e.target.id==='sx531ProgrammeSelect'){cycleId=e.target.value;selectedLift=null;renderPreview()}else if(e.target.id==='sx531LiftSelect'){selectedLift=e.target.value;renderPreview()}});
$('start531Shortcut')?.addEventListener('click',e=>{
 if(bypass||!activeCycles().length)return;
 e.preventDefault();e.stopImmediatePropagation();
 $('sxCloseSessionOptions')?.click();
 openPreview(true);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();closePreview(true)}});
function renderCard(){
 const all=read();
 if(!card||!all.length){if(card)card.hidden=true;selectedCardId=null;return}
 const c=all.find(x=>String(x.id)===String(selectedCardId))||all[0];
 selectedCardId=c.id;
 const l=lifts(c),total=Math.max(1,l.length*c.weeks);
 const done=l.reduce((sum,lift)=>sum+completed(c,lift).size,0);
 const next=selectDefault(c);
 const allCompleted=!next;
 const picker=all.length>1?'<label class="sx531-card-cycle" for="sx531CardCycleSelect">PROGRAMME<select id="sx531CardCycleSelect">'+
  all.map(x=>'<option value="'+safe(x.id)+'" '+(String(x.id)===String(c.id)?'selected':'')+'>'+safe(x.name)+'</option>').join('')+
  '</select></label>':'';
 card.hidden=false;
 card.innerHTML='<div class="sx531-card-heading"><div><div class="eyebrow">YOUR ACTIVE PROGRAMME</div><h2>5/3/1 CYCLE</h2></div>'+
  '<details class="sx531-manage"><summary aria-label="Programme options">•••</summary><div class="sx531-manage-menu"><button type="button" id="sx531CardEdit">EDIT PROGRAMME</button><button type="button" id="sx531CardDelete">DELETE PROGRAMME</button></div></details></div>'+
  picker+'<div class="tiny muted">'+safe(c.name)+(next?' · Next: '+safe(next.lift)+' (Week '+next.week+')':' · All weeks completed')+'</div>'+
  '<div class="sx531-quick-row">'+l.map(lift=>'<span>'+LABEL[lift]+'<strong>'+(nextWeek(c,lift)===null?'✓':'W'+nextWeek(c,lift))+'</strong></span>').join('')+'</div>'+
  '<div class="tiny muted">CYCLE PROGRESS · '+done+'/'+total+' LIFT SESSIONS</div><div class="sx531-progress"><i style="width:'+Math.min(100,100*done/total)+'%"></i></div>'+
  (allCompleted?'<div class="sx531-card-complete">✓ CYCLE COMPLETED</div>':'')+
  '<div class="sx531-actions"><button type="button" id="sx531QuickContinue" '+(allCompleted?'disabled':'')+'>⚡ CONTINUE 5/3/1</button><button type="button" id="sx531QuickView">VIEW CYCLE</button></div>';
}
card.addEventListener('change',e=>{if(e.target.id==='sx531CardCycleSelect'){selectedCardId=e.target.value;renderCard()}});
card.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 const id=selectedCardId;
 if(target.id==='sx531QuickContinue'||target.id==='sx531QuickView'){
  openPreview(false,id);return;
 }
 if(target.id==='sx531CardEdit'){
  window.dispatchEvent(new CustomEvent('spartx:open531CycleEditor',{detail:{id}}));return;
 }
 if(target.id==='sx531CardDelete'){
  const remove=()=>{
   const all=read().filter(c=>String(c.id)!==String(id));
   try{localStorage.setItem(KEY,JSON.stringify(all));selectedCardId=all[0]?.id||null;window.dispatchEvent(new Event('spartx:cycleUpdated'))}catch(_){}
  };
  if(typeof requestProgramDelete==='function')requestProgramDelete('Delete this saved 5/3/1 programme? This cannot be undone.',remove);
  else if(confirm('Delete this saved 5/3/1 programme?'))remove();
 }
});
window.addEventListener('spartx:cycleUpdated',renderCard);
window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)renderCard()});
window.addEventListener('pageshow',renderCard);
renderCard();
})();
