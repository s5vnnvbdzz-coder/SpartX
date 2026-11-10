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
/* 5/3/1 uses the AscensionX workout-import layout, coloured by the
   SAME active SpartanX theme tokens as the existing 5/3/1 page. */
#sx531CyclePreview{
 height:100dvh!important;width:100vw!important;inset:0!important;
 padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(14px + env(safe-area-inset-bottom,0px))!important;
 align-items:center!important;justify-content:center!important;
 background:rgba(0,0,0,.84)!important;
 -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
 animation:none!important;transition:none!important;
}
#sx531CyclePreview .sx531-dialog{
 flex:0 1 auto!important;
 width:min(100%,440px)!important;height:auto!important;min-height:0!important;
 max-width:440px!important;max-height:100%!important;
 border:1px solid color-mix(in srgb,var(--lime) 30%,var(--line))!important;
 border-radius:20px!important;box-shadow:0 20px 65px #000b!important;
 background:linear-gradient(145deg,var(--panel2),var(--panel) 60%,var(--bg))!important;
}
#sx531CyclePreview header{
 padding:22px 22px 9px!important;align-items:flex-start!important;
 background:transparent!important;border:0!important;
}
#sx531CyclePreview header h2{font-size:21px!important;line-height:1.28!important;margin:9px 0 0!important}
#sx531CyclePreview #sx531CycleStatus{padding-top:3px;white-space:nowrap}
#sx531CyclePreview .sx531-content{
 flex:1 1 auto!important;overflow-x:hidden!important;overflow-y:auto!important;
 min-height:0!important;padding:10px 22px 15px!important;-webkit-overflow-scrolling:touch;
}
#sx531CyclePreview .sx531-intro{margin:0 0 16px;color:var(--muted);font-size:12px;line-height:1.65}
#sx531CyclePreview .sx531-input-label{display:block;margin:10px 0 7px;color:var(--muted);font-size:12px}
#sx531CyclePreview .sx531-select{
 width:100%;margin:0 0 12px!important;border:1px solid var(--line);
 border-radius:11px;background:var(--panel2)!important;color:var(--txt)!important;
 padding:13px 12px!important;font-size:15px!important;
}
#sx531CyclePreview .sx531-plan{border:1px solid var(--line);border-radius:12px;background:var(--bg);padding:14px;margin:10px 0}
#sx531CyclePreview .sx531-plan-head{display:flex;gap:12px;align-items:center;justify-content:space-between;font-size:12px;margin-bottom:13px}
#sx531CyclePreview .sx531-plan-head strong{font-size:13px}
#sx531CyclePreview .sx531-plan-head span{color:var(--lime);white-space:nowrap}
#sx531CyclePreview .sx531-plan-group+.sx531-plan-group{margin-top:13px}
#sx531CyclePreview .sx531-plan-group>strong{display:block;color:var(--lime);font-size:10px;letter-spacing:1.4px;margin-bottom:5px}
#sx531CyclePreview .sx531-plan-group>p{font-size:12px;line-height:1.75;margin:0;color:var(--txt);overflow-wrap:anywhere}
#sx531CyclePreview .sx531-help{font-size:12px;line-height:1.6;color:var(--muted);margin:13px 0 11px}
#sx531CyclePreview .sx531-expand{margin:12px 0;padding:11px 12px;background:var(--panel2);border:1px solid var(--line);border-radius:11px}
#sx531CyclePreview .sx531-expand summary{cursor:pointer;font-size:11px;font-weight:850;color:var(--txt);list-style-position:inside}
#sx531CyclePreview .sx531-expand .sx531-bars{margin:12px 0}
#sx531CyclePreview .sx531-footer{background:transparent!important;border-color:var(--line)!important;padding:13px 22px 19px!important}
#sx531CyclePreview .sx531-footer button{min-height:49px;font-size:11px}
#sx531CyclePreview .sx531-sub-actions{margin:12px 0 0}
#sx531CyclePreview .sx531-sub-actions button{font-size:10px}
@media(max-width:380px){
 #sx531CyclePreview header{padding:17px 15px 8px!important}
 #sx531CyclePreview .sx531-content{padding:8px 15px 11px!important}
 #sx531CyclePreview .sx531-footer{padding:11px 15px 14px!important}
 #sx531CyclePreview header h2{font-size:19px!important}
}
`;
document.head.appendChild(style);
const overlay=document.createElement('div');
overlay.id='sx531CyclePreview';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','5/3/1 programme preview');
overlay.innerHTML='<div class="sx531-dialog"><header><div><div class="sx531-caption">5/3/1 × SPARTANX</div><h2>Log this workout in SpartanX?</h2></div><span class="sx531-caption" id="sx531CycleStatus"></span></header><div class="sx531-content" id="sx531CycleContent"></div><footer class="sx531-footer"><button type="button" id="sx531Cancel">CANCEL</button><button type="button" id="sx531Load">LOAD INTO SPARTANX</button></footer></div>';
document.body.appendChild(overlay);

/* Read-only programme overview, separate from Continue Training.
   AscensionX and 5/3/1 View Cycle share presentation and sections. */
const viewOverlay=document.createElement('div');
viewOverlay.id='sx531ViewCycle';viewOverlay.hidden=true;
viewOverlay.setAttribute('role','dialog');viewOverlay.setAttribute('aria-modal','true');
viewOverlay.setAttribute('aria-labelledby','sx531ViewTitle');
viewOverlay.innerHTML='<section class="sx531-view-dialog">'+
 '<header class="sx531-view-head"><div><div class="sx531-view-eyebrow">5/3/1 · POWERLIFTING</div><h2 id="sx531ViewTitle">View Cycle</h2></div>'+
 '<button type="button" id="sx531ViewClose" aria-label="Close cycle view">×</button></header>'+
 '<div class="sx531-view-scroll" id="sx531ViewScroll"><div id="sx531ViewBody"></div></div>'+
 '<footer class="sx531-view-actions"><button type="button" id="sx531ViewCancel">CANCEL</button>'+
 '<button type="button" id="sx531ViewSave">SAVE</button></footer></section>';
document.body.appendChild(viewOverlay);
const viewStyle=document.createElement('style');
viewStyle.id='sx531ViewCycleStyles';
viewStyle.textContent="\nbody:has(#sx531ViewCycle:not([hidden])) #trackerNav,\nbody:has(#sx531ViewCycle:not([hidden])) .minimized-session{display:none!important}\n#sx531ViewCycle[hidden]{display:none!important}\n#sx531ViewCycle{position:fixed;inset:0;z-index:290002;display:flex;align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overscroll-behavior:contain;box-sizing:border-box}\n#sx531ViewCycle *{box-sizing:border-box}\n#sx531ViewCycle .sx531-view-dialog{width:min(100%,700px);height:min(88dvh,760px);max-height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid color-mix(in srgb,var(--lime) 40%,var(--line));border-radius:16px;background:var(--panel);color:var(--txt);box-shadow:0 14px 42px #0007}\n#sx531ViewCycle .sx531-view-head{display:flex!important;flex:none!important;align-items:center;justify-content:space-between;gap:12px;position:static!important;margin:0!important;padding:15px!important;background:var(--panel)!important;border-bottom:1px solid var(--line)!important;box-shadow:none!important}\n#sx531ViewCycle .sx531-view-eyebrow{font-size:10px;letter-spacing:1.2px;font-weight:900;color:var(--lime)}\n#sx531ViewCycle h2{font-size:18px;margin:4px 0 0;color:var(--txt)}\n#sx531ViewCycle #sx531ViewClose{width:39px;height:39px;display:grid;place-items:center;background:var(--panel2);border:1px solid var(--line);border-radius:11px;color:var(--txt);font-size:23px;cursor:pointer}\n#sx531ViewCycle .sx531-view-scroll{min-height:0;flex:1 1 auto;overflow-y:auto;padding:10px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}\n#sx531ViewCycle .sx531-view-actions{display:grid;grid-template-columns:1fr 1fr;flex:0 0 auto;gap:10px;margin:0;padding:12px 15px calc(13px + env(safe-area-inset-bottom,0px));background:var(--panel);border-top:1px solid var(--line)}\n#sx531ViewCycle .sx531-view-actions button{min-height:45px;min-width:0;padding:10px 8px;border-radius:10px;font-weight:850;font-size:11px;cursor:pointer}\n#sx531ViewCancel{background:var(--panel2);border:1px solid var(--line);color:var(--txt)}\n#sx531ViewSave{background:color-mix(in srgb,var(--lime) 17%,var(--panel2));border:1px solid var(--lime);color:var(--txt)}\n#sx531ViewCycle .sx531-view-section{padding:13px;margin:11px 0;border:1px solid var(--line);border-radius:12px;background:var(--panel2)}\n#sx531ViewCycle .sx531-view-section h3{font-size:15px;margin:0 0 12px}\n#sx531ViewCycle .sx531-view-info{font-size:11px;color:var(--muted);line-height:1.6;overflow-wrap:anywhere}\n#sx531ViewCycle .sx531-view-statrow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;font-size:11px}\n#sx531ViewCycle .sx531-view-statrow strong{color:var(--txt)}\n#sx531ViewCycle .sx531-view-progress{height:6px;border-radius:99px;overflow:hidden;background:var(--line);margin:11px 0}\n#sx531ViewCycle .sx531-view-progress i{display:block;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--lime) 45%,var(--panel2)),var(--lime));border-radius:99px}\n#sx531ViewCycle table{border-collapse:collapse;min-width:100%;width:100%;font-size:11px}\n#sx531ViewCycle th,#sx531ViewCycle td{padding:9px 7px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}\n#sx531ViewCycle th{color:var(--lime);font-size:10px;letter-spacing:.5px}\n#sx531ViewCycle .sx531-view-tablebox{width:100%;overflow-x:auto;max-width:100%}\n#sx531ViewCycle .sx531-view-select{display:block;width:100%;max-width:100%;margin:6px 0 12px;padding:11px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--txt);font-size:13px}\n#sx531ViewCycle .sx531-view-pill{display:inline-block;border-radius:10px;padding:3px 7px;background:color-mix(in srgb,var(--lime) 10%,var(--panel2));border:1px solid var(--line);color:var(--txt);font-size:10px;white-space:nowrap}\n#sx531ViewCycle .sx531-view-rule{border-bottom:1px solid var(--line);padding:9px 0;font-size:11px;line-height:1.6;color:var(--muted)}\n#sx531ViewCycle .sx531-view-rule:last-child{border-bottom:0}\n#sx531ViewCycle .sx531-view-rule strong{color:var(--txt)}\n@media(max-width:380px){#sx531ViewCycle .sx531-view-scroll{padding:7px 10px}#sx531ViewCycle .sx531-view-section{padding:11px}#sx531ViewCycle .sx531-view-head{padding:12px!important}#sx531ViewCycle .sx531-view-actions{padding:10px}}\n";
document.head.appendChild(viewStyle);
let viewCycleId=null,viewLift=null,viewOldOverflow=null,viewCaller=null;
function render531ViewCycle(){
 const c=read().find(x=>x.id===viewCycleId);if(!c)return;
 const allLifts=lifts(c);if(!allLifts.includes(viewLift))viewLift=allLifts[0];
 const count=allLifts.reduce((n,lift)=>n+completed(c,lift).size,0);
 const total=Math.max(1,allLifts.length*c.weeks);
 const pct=Math.round(Math.min(100,count/total*100));
 const next=selectDefault(c);
 const options=allLifts.map(lift=>'<option value="'+safe(lift)+'" '+(lift===viewLift?'selected':'')+'>'+safe(lift)+'</option>').join('');
 const byWeek=Array.from({length:c.weeks},(_,i)=>{
  const w=weekData(c,viewLift,i+1);if(!w)return '';
  const done=completed(c,viewLift).has(i+1);
  const work=(w.sets||[]).map(x=>minimumReps(x)+(String(x.rep||'').includes('+')?'+':'')+' @ '+(Number(x.pct)*100).toLocaleString(undefined,{maximumFractionDigits:1})+'%').join(' · ');
  return '<tr><td><strong>W'+(i+1)+'</strong> '+(done?'<span class="sx531-view-pill">✓</span>':'')+'</td>'+
   '<td>'+safe(w.name||'5/3/1')+'</td><td>'+safe(work||'—')+'</td>'+
   '<td>'+(w.bbb?'BBB '+safe(w.bbb.sets)+' × '+safe(w.bbb.reps):'—')+'</td></tr>';
 }).join('');
 const weights=Array.from({length:c.weeks},(_,i)=>{
  const w=weekData(c,viewLift,i+1);if(!w)return '';
  const warm=(w.warmups||[]).map(x=>Number(x.weight).toLocaleString()+' × '+minimumReps(x)).join(' · ')||'—';
  const working=(w.sets||[]).map(x=>Number(x.weight).toLocaleString()+' × '+minimumReps(x)+(String(x.rep||'').includes('+')?'+':'')).join(' · ');
  return '<tr><td><strong>W'+(i+1)+'</strong></td><td>'+Number(w.tm).toLocaleString()+' kg</td>'+
   '<td>'+safe(warm)+'</td><td>'+safe(working||'—')+'</td></tr>';
 }).join('');
 const nextLabel=next?'Next: '+safe(next.lift)+' · Week '+next.week:'All programmed weeks completed';
 $('sx531ViewBody').innerHTML=
  '<section class="sx531-view-section"><div class="sx531-view-statrow"><strong>'+safe(c.name||'5/3/1 Strength Cycle')+
  '</strong><span class="sx531-view-pill">'+safe(c.weeks)+' WEEKS</span></div>'+
  '<p class="sx531-view-info">Traditional 5/3/1 · '+allLifts.length+' programmed '+(allLifts.length===1?'lift':'lifts')+'</p>'+
  '<div class="sx531-view-statrow"><span>Cycle progress</span><strong>'+pct+'%</strong></div>'+
  '<div class="sx531-view-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div>'+
  '<p class="sx531-view-info">'+nextLabel+'</p></section>'+
  '<section class="sx531-view-section"><h3>Weekly prescriptions</h3>'+
  '<p class="sx531-view-info">Programme structure for the selected lift. AMRAP sets retain their + designation.</p>'+
  '<label class="sx531-view-info" for="sx531ViewLift">Select lift</label>'+
  '<select id="sx531ViewLift" class="sx531-view-select">'+options+'</select>'+
  '<div class="sx531-view-tablebox"><table><thead><tr><th>Week</th><th>Focus</th><th>Working sets</th><th>Accessory</th></tr></thead><tbody>'+
  byWeek+'</tbody></table></div></section>'+
  '<section class="sx531-view-section"><h3>Lift-specific loading</h3>'+
  '<div class="sx531-view-tablebox"><table><thead><tr><th>Week</th><th>TM</th><th>Warm-up (kg × reps)</th><th>Working (kg × reps)</th></tr></thead><tbody>'+
  weights+'</tbody></table></div></section>'+
  '<section class="sx531-view-section"><h3>Progression rules</h3>'+
  '<div class="sx531-view-rule"><strong>Progress</strong> — Prescribed working sets completed; the lift advances to its next saved week.</div>'+
  '<div class="sx531-view-rule"><strong>Hold</strong> — An incomplete session does not mark the week complete.</div>'+
  '<div class="sx531-view-rule"><strong>Review</strong> — Reassess training maxes before your next cycle.</div>'+
  '</section>';
}
function open531CycleView(c){
 if(!c||!lifts(c).length)return false;
 if(!viewOverlay.hidden)return true;
 viewCycleId=c.id;viewLift=selectDefault(c)?.lift||lifts(c)[0];
 viewOldOverflow={body:document.body.style.overflow,html:document.documentElement.style.overflow,scroll:window.scrollY||0};
 viewCaller=document.activeElement;
 document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
 render531ViewCycle();viewOverlay.hidden=false;
 $('sx531ViewScroll').scrollTop=0;
 $('sx531ViewClose').focus({preventScroll:true});
 return true;
}
function close531CycleView(){
 if(viewOverlay.hidden)return;
 viewOverlay.hidden=true;
 if(viewOldOverflow){
  document.body.style.overflow=viewOldOverflow.body;
  document.documentElement.style.overflow=viewOldOverflow.html;
  window.scrollTo(0,viewOldOverflow.scroll);
 }
 viewOldOverflow=null;viewCycleId=null;viewLift=null;
 const caller=viewCaller;viewCaller=null;if(caller?.isConnected)caller.focus({preventScroll:true});
}
$('sx531ViewClose').addEventListener('click',close531CycleView);
$('sx531ViewCancel').addEventListener('click',close531CycleView);
$('sx531ViewSave').addEventListener('click',close531CycleView);
viewOverlay.addEventListener('click',e=>{if(e.target===viewOverlay)close531CycleView()});
$('sx531ViewBody').addEventListener('change',e=>{
 if(e.target?.id==='sx531ViewLift'){
  const scroller=$('sx531ViewScroll'),at=scroller.scrollTop;
  viewLift=e.target.value;render531ViewCycle();scroller.scrollTop=at;
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!viewOverlay.hidden){e.preventDefault();close531CycleView()}
});

const card=document.createElement('section');card.id='sx531WorkoutCard';card.className='card sx-programme-card sx-531-quick-card';card.hidden=true;
const workout=$('workout'),start=workout?.querySelector('.start-card');
const slot=$('sx531ProgrammeSlot');
if(slot)slot.prepend(card);
else if(start)start.before(card);
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
 const selector=all.length>1?'<label class="sx531-input-label" for="sx531ProgrammeSelect">Programme</label><select id="sx531ProgrammeSelect" class="sx531-select">'+all.map(x=>'<option value="'+safe(x.id)+'" '+(x.id===c.id?'selected':'')+'>'+safe(x.name)+'</option>').join('')+'</select>':'';
 const liftPicker='<label class="sx531-input-label" for="sx531LiftSelect">Exercise</label><select id="sx531LiftSelect" class="sx531-select">'+lifts(c).map(l=>{
  const week=nextWeek(c,l);
  return '<option value="'+safe(l)+'" '+(l===selectedLift?'selected':'')+' '+(week===null?'disabled':'')+'>'+safe(l)+' · '+(week===null?'Completed':'Week '+week)+'</option>';
 }).join('')+'</select>';
 const human=(s,prefix,i)=>prefix+(i+1)+' · '+Number(s.weight).toLocaleString()+' kg × '+minimumReps(s)+(String(s.rep||'').includes('+')?'+':'');
 const group=(title,rows)=>'<div class="sx531-plan-group"><strong>'+title+'</strong><p>'+rows.join(' · ')+'</p></div>';
 let preview='<div class="sx531-plan"><div class="sx531-plan-head"><strong>WEEK '+n+' · '+safe(w.name?.split('·').at(-1)?.trim()||'5/3/1')+'</strong><span>TM '+w.tm+' kg</span></div>';
 if(w.warmups?.length)preview+=group('WARM-UP · '+w.warmups.length+' SETS',w.warmups.map((x,i)=>human(x,'W',i)));
 preview+=group('WORKING SETS · '+w.sets.length,w.sets.map((x,i)=>human(x,'Set ',i)));
 if(w.bbb)preview+=group('BORING BUT BIG · '+w.bbb.sets+' SETS',[w.bbb.sets+' × '+w.bbb.reps+' @ '+w.bbb.weight+' kg']);
 preview+='</div>';
 const vols=Array.from({length:c.weeks},(_,i)=>volumeOf(weekData(c,selectedLift,i+1)));
 const maximum=Math.max(...vols,1);
 const bars='<div class="sx531-bars" aria-label="Estimated weekly training volume">'+vols.map((v,i)=>'<div class="sx531-bar '+(i+1===n?'current':'')+'" title="Week '+(i+1)+': '+v.toLocaleString()+' kg estimated volume"><i style="height:'+Math.max(5,Math.round(v/maximum*62))+'px"></i><small>'+(completed(c,selectedLift).has(i+1)?'✓':i+1)+'</small></div>').join('')+'</div>';
 const row=(label,weight,reps)=>'<div class="sx531-set"><span>'+safe(label)+'</span><strong>'+safe(reps)+' × '+Number(weight).toLocaleString()+' kg</strong></div>';
 let detail='<div class="sx531-sets">';
 if(w.warmups.length)detail+='<div class="sx531-section">WARM-UP SETS</div>'+w.warmups.map(s=>row(Math.round(s.pct*100)+'% Training Max',s.weight,s.rep)).join('');
 detail+='<div class="sx531-section">WORKING SETS</div>'+w.sets.map((s,i)=>row('Set '+(i+1)+' · '+Math.round(s.pct*100)+'% Training Max',s.weight,s.rep)).join('');
 detail+='</div>';
 const expanded='<details class="sx531-expand"><summary>VIEW WEEKLY VOLUME &amp; DETAILED SETS</summary>'+bars+
  '<p class="sx531-legend">Weekly volume estimate (kg × minimum prescribed reps, including warm-ups and BBB where programmed). AMRAP sets may exceed this estimate.</p>'+detail+'</details>';
 $('sx531CycleContent').innerHTML='<p class="sx531-intro">Choose the lift to load as an active SpartanX workout. Prescribed warm-up and working sets will be added automatically.</p>'+
  selector+liftPicker+preview+
  '<p class="sx531-help">Sets will be pre-filled and unchecked. <strong>Finish &amp; Save all prescribed working sets</strong> to advance this lift to the next week. Partial sessions are saved but do not advance.</p>'+
  expanded+'<div class="sx531-sub-actions"><button type="button" id="sx531EditCycle">EDIT PROGRAMME / LIFTS</button><button type="button" id="sx531OpenCalculator">5/3/1 CALCULATOR</button></div>';
}
function openCompletedPreview(c){
 if(!c)return false;
 returnMenu=false;cycleId=c.id;selectedLift=null;
 oldOverflow={body:document.body.style.overflow,html:document.documentElement.style.overflow,scroll:window.scrollY||0};
 document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
 $('sx531CycleStatus').textContent='CYCLE COMPLETED';
 $('sx531Load').disabled=true;
 $('sx531Load').hidden=true;
 $('sx531CycleContent').innerHTML='<p class="sx531-intro">This saved programme is complete. Your training prescription and history remain available.</p>'+
 lifts(c).map(lift=>'<div class="sx531-plan"><strong>'+safe(lift)+'</strong>'+
 Array.from({length:c.weeks},(_,index)=>{
  const n=index+1,w=weekData(c,lift,n);
  if(!w)return '';
  const main=(w.sets||[]).map(set=>Number(set.weight).toLocaleString()+' kg × '+minimumReps(set)).join(' · ');
  const label=completed(c,lift).has(n)?'✓ ':'';
  return '<div class="sx531-plan-group"><strong>'+label+'Week '+n+'</strong><p>'+main+'</p></div>';
 }).join('')+'</div>').join('');
 overlay.hidden=false;$('sx531Cancel').focus({preventScroll:true});
 return true;
}
function openPreview(fromMenu=false,requestedId=null){
 const all=activeCycles();if(!all.length)return false;
 returnMenu=fromMenu;const c=all.find(x=>x.id===requestedId)||all[0];cycleId=c.id;selectedLift=selectDefault(c)?.lift||null;
 $('sx531Load').hidden=false;
 oldOverflow={body:document.body.style.overflow,html:document.documentElement.style.overflow,scroll:window.scrollY||0};
 document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
 renderPreview();overlay.hidden=false;$('sx531Cancel').focus({preventScroll:true});
 return true;
}
function closePreview(reopen=false){
 if(overlay.hidden)return;
 overlay.hidden=true;
 $('sx531Load').hidden=false;
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
 const all=activeCycles(),saved=read(),empty=$('sx531Empty');
 if(!card||!saved.length){
  if(card)card.hidden=true;
  if(empty)empty.hidden=false;
  return;
 }
 if(empty)empty.hidden=true;
 const c=all[0]||saved[0],l=lifts(c),total=Math.max(1,l.length*c.weeks);
 const done=l.reduce((sum,lift)=>sum+completed(c,lift).size,0);
 const percent=Math.min(100,Math.max(0,Math.round(done/total*100)));
 const next=selectDefault(c);
 card.hidden=false;
 card.innerHTML=
  '<div class="sx-programme-head"><div><div class="sx-programme-kicker">5/3/1 · POWERLIFTING</div><h2 class="sx-programme-title">'+safe(c.name||'5/3/1 Strength Cycle')+'</h2></div>'+
  '<div class="sx-programme-menu-wrap"><button type="button" class="sx-programme-menu-button" id="sx531QuickMenu" aria-label="5/3/1 programme options" aria-expanded="false" aria-controls="sx531QuickOptions">•••</button>'+
  '<div class="sx-programme-options" id="sx531QuickOptions" hidden><button type="button" id="sx531QuickView">VIEW CYCLE</button><button type="button" id="sx531QuickManage">MANAGE CYCLE</button></div></div></div>'+
  '<p class="sx-programme-meta">5/3/1 · Powerlifting · '+(next?'Week '+next.week+' of '+c.weeks:'Completed · '+c.weeks+' weeks')+(all.length>1?' · '+(all.length-1)+' more active':'')+'</p>'+
  '<div class="sx-programme-progressline"><span>CYCLE PROGRESS</span><strong>'+percent+'%</strong></div>'+
  '<div class="sx-programme-progress" role="progressbar" aria-label="5/3/1 cycle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div>'+
  '<div class="sx-programme-footer"><div class="sx-programme-next">'+(next?'NEXT: <b>'+safe(next.lift)+' · Week '+next.week+'</b>':'<b>All programmed weeks completed</b>')+'</div>'+
  '<button type="button" class="sx-programme-continue" id="sx531QuickContinue" '+(next?'':'disabled aria-disabled="true"')+'>'+(next?'CONTINUE ›':'COMPLETED')+'</button></div>';
}
card.addEventListener('click',e=>{
 if(e.target.closest('#sx531QuickContinue')){openPreview(false);return}
 const menuButton=e.target.closest('#sx531QuickMenu');
 if(menuButton){
  const pop=$('sx531QuickOptions');pop.hidden=!pop.hidden;
  menuButton.setAttribute('aria-expanded',String(!pop.hidden));return;
 }
 if(e.target.closest('#sx531QuickView')){
  const pop=$('sx531QuickOptions');if(pop)pop.hidden=true;
  $('sx531QuickMenu')?.setAttribute('aria-expanded','false');
  const c=activeCycles()[0]||read()[0];
  if(c)open531CycleView(c);
  return;
 }
 if(e.target.closest('#sx531QuickManage')){
  const pop=$('sx531QuickOptions');if(pop)pop.hidden=true;
  $('sx531QuickMenu')?.setAttribute('aria-expanded','false');
  const selected=activeCycles()[0]||read()[0];
  if(selected)window.dispatchEvent(new CustomEvent('spartx:open531CycleEditor',{detail:{id:selected.id,returnToMenu:false,skipPreview:true}}));
  return;
 }
});
window.addEventListener('spartx:cycleUpdated',renderCard);
window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)renderCard()});
window.addEventListener('pageshow',renderCard);
renderCard();
})();
