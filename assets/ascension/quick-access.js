/* Active AscensionX cycle quick access on SpartanX's existing Workout page.
 * Reads the SAME local cycle record as embedded AscensionX: no duplicate planner,
 * no copied sets and no changes to standalone AscensionX behaviour.
 */
(function(){
'use strict';
const STORAGE_KEY='ascensionx_strength_v1';
const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
const SHORT={'Back Squat':'SQUAT','Bench Press':'BENCH','Deadlift':'DEADLIFT','Overhead Press':'OHP'};
const workout=document.getElementById('workout');
if(!workout||document.getElementById('sxAscensionQuickCard'))return;
const card=document.createElement('section');
card.id='sxAscensionQuickCard';
card.className='card sx-ascension-quick-card sx-programme-card';
card.setAttribute('aria-label','Active AscensionX cycle');
card.hidden=true;
card.innerHTML=`
 <div class="sx-programme-head">
  <div><div class="sx-programme-kicker">ASCENSIONX · POWERLIFTING</div><h2 class="sx-programme-title" id="sxAscensionTitle">AscensionX</h2></div>
  <div class="sx-programme-menu-wrap"><button type="button" class="sx-programme-menu-button" id="sxAscensionOptions" aria-label="AscensionX programme options" aria-expanded="false" aria-controls="sxAscensionOptionsMenu"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="19" height="19"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg></button>
   <div class="sx-programme-options" id="sxAscensionOptionsMenu" hidden><button type="button" id="sxAscensionView">VIEW CYCLE</button><button type="button" id="sxAscensionManage">MANAGE CYCLE</button></div>
  </div>
 </div>
 <p class="sx-programme-meta" id="sxAscensionSummary">AscensionX · Powerlifting · Week 1 of 6</p>
 <div class="sx-programme-progressline"><span>CYCLE PROGRESS</span><strong id="sxAscensionPercent">0%</strong></div>
 <div class="sx-programme-progress" role="progressbar" aria-label="AscensionX cycle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="sxAscensionProgress"><span id="sxAscensionProgressFill"></span></div>
 <div class="sx-programme-footer"><div class="sx-programme-next" id="sxAscensionNext">NEXT: Select lift</div><button type="button" class="sx-programme-continue" id="sxAscensionContinue">CONTINUE ›</button></div>`;
const slot=document.getElementById('sxAscensionProgrammeSlot');
const startCard=workout.querySelector('.start-card');
if(slot)slot.prepend(card);
else if(startCard)startCard.before(card);
else workout.appendChild(card);
const byId=id=>document.getElementById(id);

/* First-party Continue dialog: SpartanX Workout stays underneath.
 * All barbell prescription calculations come from shared AscensionX import.
 * No iframe, second workout logger or navigation on Cancel/Load.
 */
let sxAscModal=null,sxAscOrigin=null;
function sxAscModalGet(){
 if(sxAscModal)return sxAscModal;
 const css=document.createElement('style');
 css.id='sxAscContinueNativeStyle';
 css.textContent=[
 '#sxAscContinueBackdrop[hidden]{display:none!important}',
 '#sxAscContinueBackdrop{position:fixed;inset:0;z-index:290000;display:flex;align-items:center;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px));background:#000b;backdrop-filter:blur(4px);overscroll-behavior:contain}',
 '#sxAscContinueDialog{width:min(100%,550px);max-height:100%;display:flex;flex-direction:column;overflow:hidden;border-radius:17px;border:1px solid var(--line);background:var(--panel);box-shadow:0 20px 70px #000c;color:var(--txt)}',
 '#sxAscContinueDialog .sx-asc-scroll{padding:18px;overflow-y:auto;min-height:0;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
 '#sxAscContinueDialog h2{font-size:20px;margin:8px 0 10px}',
 '#sxAscContinueDialog p{font-size:12px;color:var(--muted);line-height:1.5}',
 '#sxAscContinueDialog label{display:block;font-size:12px;color:var(--muted);margin:12px 0 5px}',
 '#sxAscContinueDialog select{width:100%;font-size:16px;min-height:45px;padding:9px;border:1px solid var(--line);border-radius:11px;background:var(--panel2);color:var(--txt)}',
 '#sxAscContinuePreview{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px;margin-top:12px;font-size:12px;line-height:1.55}',
 '#sxAscContinuePreview .sx-asc-heading{color:var(--lime);font-weight:850;font-size:10px;letter-spacing:.5px;margin:12px 0 4px}',
 '#sxAscContinuePreview .sx-asc-line{padding:3px 0;border-bottom:1px solid var(--line)}',
 '#sxAscContinueDialog .sx-asc-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 15px calc(13px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line)}',
 '#sxAscContinueDialog .sx-asc-actions button{width:100%;min-width:0;min-height:49px;font-weight:900;font-size:11px;border-radius:12px;padding:10px 7px}',
 '#sxAscContinueCancel{background:var(--panel2)!important;color:var(--txt)!important;border:1px solid var(--line)!important}',
 '#sxAscContinueLoad{background:color-mix(in srgb,var(--lime) 17%,var(--panel2))!important;color:var(--txt)!important;border:1px solid var(--lime)!important}',
 '#sxAscContinueError{color:#ff8990!important}'
 ].join('\n');
 document.head.appendChild(css);
 const overlay=document.createElement('div');
 overlay.id='sxAscContinueBackdrop';overlay.hidden=true;
 overlay.setAttribute('role','presentation');
 overlay.innerHTML='<section id="sxAscContinueDialog" role="dialog" aria-modal="true" aria-labelledby="sxAscContinueTitle">'+
 '<div class="sx-asc-scroll"><div class="eyebrow">ASCENSIONX × SPARTANX</div>'+
 '<h2 id="sxAscContinueTitle">Log this workout in SpartanX?</h2>'+
 '<p>Choose a training day. Its exact prescribed sets will load into SpartanX Workout.</p>'+
 '<label for="sxAscContinueLift">Exercise</label><select id="sxAscContinueLift"></select>'+
 '<div id="sxAscContinuePreview" aria-live="polite"></div><div id="sxAscSupportRecovery" hidden></div>'+
 '<p>All sets start unchecked. Completing the prescribed working sets advances your AscensionX programme.</p>'+
 '<p id="sxAscContinueError" role="alert" hidden></p></div>'+
 '<div class="sx-asc-actions"><button type="button" id="sxAscContinueCancel">CANCEL</button>'+
 '<button type="button" id="sxAscContinueLoad">LOAD INTO SPARTANX</button></div></section>';
 document.body.appendChild(overlay);
 overlay.addEventListener('click',event=>{if(event.target===overlay)sxAscModalClose()});
 overlay.querySelector('#sxAscContinueCancel').addEventListener('click',sxAscModalClose);
 overlay.querySelector('#sxAscContinueLift').addEventListener('change',sxAscModalRender);
 overlay.querySelector('#sxAscContinueLoad').addEventListener('click',sxAscModalLoad);
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();sxAscModalClose()}
  if(event.key==='Tab'){
   const items=[...overlay.querySelectorAll('select,button')].filter(el=>!el.closest('[hidden]')&&!el.disabled);
   if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus()}
   else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus()}
  }
 });
 sxAscModal=overlay;return overlay;
}
function sxAscModalClose(){
 if(!sxAscModal||sxAscModal.hidden)return;
 sxAscModal.hidden=true;sxAscModal.setAttribute('aria-hidden','true');
 if(sxAscOrigin?.isConnected)sxAscOrigin.focus({preventScroll:true});
 sxAscOrigin=null;
}
function sxAscModalMessage(message){
 const node=document.getElementById('sxAscContinueError');
 if(node){node.textContent=message;node.hidden=!message}
}
function sxAscModalLine(box,message,heading=false){
 const el=document.createElement('div');el.className=heading?'sx-asc-heading':'sx-asc-line';
 el.textContent=message;box.appendChild(el);
}
function sxAscModalRender(){
 const select=document.getElementById('sxAscContinueLift'),box=document.getElementById('sxAscContinuePreview');
 const state=window.SXAscensionPrescription?.read?.();
 if(!select||!box||!state)return;
 box.replaceChildren();sxAscModalMessage('');
 const recovery=byId('sxAscSupportRecovery');if(recovery){recovery.replaceChildren();recovery.hidden=true;}
 const unit=state.profile.unit==='lbs'?'lbs':'kg';
 const weight=value=>Number(Number(value)*(unit==='lbs'?2.2046226218:1)).toLocaleString(undefined,{maximumFractionDigits:1})+' '+unit;
 if(select.value==='__ADAPTIVE_SUPPORT__'){
  const slot=window.SXAscensionAdaptive?.pendingSupportDay?.();
  if(!slot){sxAscModalMessage('This assistance day is no longer due.');return}
  sxAscModalLine(box,slot.title,true);
  for(const ex of slot.exercises||[]){
   const reps=ex.min===ex.max?ex.min:ex.min+'–'+ex.max;
   sxAscModalLine(box,ex.name+' · '+ex.sets+' × '+reps+' · RPE '+(ex.targetRpe??10-ex.rir));
  }
  const api=window.SXAscensionAdaptive,c=api?.activeCycle?.();
  const candidates=c?api.supportCandidates?.(c,slot.day,slot.week)||[]:[];
  if(recovery&&candidates.length){
   recovery.hidden=false;
   const label=document.createElement('p');label.textContent='Already completed this assistance day? Confirm your saved workout without logging it again.';recovery.appendChild(label);
   for(const saved of candidates){
    const b=document.createElement('button');b.type='button';b.className='secondary';b.style.cssText='display:block;width:100%;margin:8px 0;white-space:normal';b.textContent='Confirm saved: '+saved.name+' · '+new Date(saved.date).toLocaleDateString()+' · '+saved.sets+' logged sets';
    b.onclick=()=>{if(!confirm('Confirm that this saved workout completed '+slot.title+'? Your training history will not change.'))return;
     try{if(!api.confirmSavedSupport(saved.id)){sxAscModalMessage('Saved workout is no longer eligible. Reopen Continue.');return;}refresh();sxAscModalOpen();}catch(e){sxAscModalMessage('Unable to save completion: '+e.message);}
    };recovery.appendChild(b);
   }
  }
  return;
 }
 const workout=window.SXAscensionPrescription?.build?.(state,select.value);
 if(!workout){sxAscModalMessage('Could not calculate this workout. Check your programme.');return}
 sxAscModalLine(box,'WEEK '+workout.week+' · '+workout.weekLabel,true);
 if(workout.recoveryBridge)sxAscModalLine(box,'RECOVERY BRIDGE · Adjusted top set '+weight(workout.recoveryBridge.adjustedTop));
 sxAscModalLine(box,'WARM-UP · '+workout.warmupSets.length+' SETS',true);
 workout.warmupSets.forEach((set,i)=>sxAscModalLine(box,'W'+(i+1)+' · '+weight(set.weight)+' × '+set.reps));
 sxAscModalLine(box,'WORKING SETS · '+workout.sets.length,true);
 workout.sets.forEach((set,i)=>sxAscModalLine(box,
  (workout.week===6?'Deload Set '+(i+1):i===0?'Top Set':'Back Down '+i)+
  ' · '+weight(set.weight)+' × '+set.reps));
 if(window.SXAscensionAdaptive?.enabled?.(workout.cycleId)){
  const items=window.SXAscensionAdaptive?.plan?.(select.value,workout.week)||[];
  if(items.length)sxAscModalLine(box,'ADAPTIVE SUPPORT',true);
  for(const ex of items)sxAscModalLine(box,ex.name+' · '+ex.sets+' × '+
   (ex.min===ex.max?ex.min:ex.min+'–'+ex.max)+' · RPE '+(ex.targetRpe??10-ex.rir));
 }
}
function sxAscModalOpen(preferred){
 const cycle=readCycle(),state=window.SXAscensionPrescription?.read?.();
 if(!cycle||!state)return false;
 const modal=sxAscModalGet(),select=modal.querySelector('#sxAscContinueLift');
 select.replaceChildren();
 const lifts=(Array.isArray(state.cycle.exercises)?state.cycle.exercises:LIFTS)
  .filter((lift,i,arr)=>LIFTS.includes(lift)&&arr.indexOf(lift)===i);
 for(const lift of lifts){
  const option=document.createElement('option');option.value=lift;
  option.textContent=lift+' · Week '+(state.cycle.weeks?.[lift]||state.cycle.currentWeek||1);
  select.appendChild(option);
 }
 const pending=window.SXAscensionAdaptive?.pendingSupportDay?.();
 if(pending?.kind==='support'){
  const option=document.createElement('option');option.value='__ADAPTIVE_SUPPORT__';
  option.textContent=pending.title;select.appendChild(option);
 }
 const selected=preferred&&[...select.options].some(o=>o.value===preferred)?preferred:
  pending?'__ADAPTIVE_SUPPORT__':cycle.upNext.lift;
 select.value=[...select.options].some(o=>o.value===selected)?selected:lifts[0];
 if(modal.hidden)sxAscOrigin=document.activeElement;
 modal.hidden=false;modal.setAttribute('aria-hidden','false');
 sxAscModalRender();modal.querySelector('#sxAscContinueCancel').focus({preventScroll:true});
 return true;
}
function sxAscModalLoad(){
 const state=window.SXAscensionPrescription?.read?.(),select=document.getElementById('sxAscContinueLift');
 if(!state||!select){sxAscModalMessage('Active AscensionX cycle unavailable.');return}
 let loaded=false;
 if(select.value==='__ADAPTIVE_SUPPORT__'){
  const slot=window.SXAscensionAdaptive?.pendingSupportDay?.();
  if(slot)loaded=window.SpartanXStartAscensionAdaptiveSupportSession?.({
   cycleId:state.cycle.created,week:slot.week,day:slot.day,name:slot.title
  })===true;
 }else{
  const workout=window.SXAscensionPrescription?.build?.(state,select.value);
  loaded=!!workout&&window.spartanxImport531?.(workout)===true;
 }
 if(loaded){sxAscModalClose();return}
 sxAscModalMessage('Could not load the prescribed session. Your saved cycle has not been changed.');
}
window.spartanxOpenAscensionWorkoutPopup=sxAscModalOpen;

function readCycle(){
 let state=null;
 try{state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch(e){return null}
 const cycle=state?.cycle;
 if(!cycle||typeof cycle.created!=='string'||!Number.isFinite(Date.parse(cycle.created)))return null;
 const lifts=(Array.isArray(cycle.exercises)?cycle.exercises:LIFTS).filter((lift,i,arr)=>LIFTS.includes(lift)&&arr.indexOf(lift)===i);
 if(!lifts.length)return null;
 const logs=(Array.isArray(state.logs)?state.logs:[]).filter(log=>{
  if(log?.cycleId)return log.cycleId===cycle.created;
  const time=Date.parse(log?.date||''),started=Date.parse(cycle.created);
  return Number.isFinite(time)&&time>=started;
 });
 const items=lifts.map(lift=>{
  const week=Math.max(1,Math.min(6,Math.round(Number(cycle.weeks?.[lift]||cycle.currentWeek)||1)));
  const doneWeek6=logs.some(x=>x.lift===lift&&Number(x.week)===6&&x.setsComplete===true);
  const completed=Math.max(doneWeek6?6:0,week-1,
   ...logs.filter(x=>x.lift===lift&&x.setsComplete===true).map(x=>Math.min(6,Math.max(0,Number(x.week)||0))));
  return {lift,week,completed,done:doneWeek6};
 });
 // Completed cycles are not active quick-access programmes.
 if(items.every(x=>x.done))return null;
 const primaryNext=items.filter(x=>!x.done).sort((a,b)=>a.week-b.week||
  lifts.indexOf(a.lift)-lifts.indexOf(b.lift))[0];
 // Once all three main lifts complete a week, choose the pending fourth
 // Adaptive Support day before starting the following week's Squats.
 const support=window.SXAscensionAdaptive?.pendingSupportDay?.();
 const upNext=support?.kind==='support'?
  {kind:'support',lift:'__ADAPTIVE_SUPPORT__',week:support.week,
   day:support.day,title:support.title}:primaryNext;
 const percent=Math.min(100,Math.max(0,Math.round(items.reduce((sum,x)=>sum+x.completed,0)/(items.length*6)*100)));
 return {created:cycle.created,title:String(cycle.title||cycle.name||'AscensionX').trim().slice(0,80)||'AscensionX',items,upNext,percent};
}
function refresh(){
 const cycle=readCycle();
 if(!cycle){
  card.hidden=true;card.dataset.cycleId='';
  const empty=byId('sxAscensionEmpty');if(empty)empty.hidden=false;
  return;
 }
 const {upNext,percent}=cycle;
 card.hidden=false;card.dataset.cycleId=cycle.created;
 const empty=byId('sxAscensionEmpty');if(empty)empty.hidden=true;
 byId('sxAscensionTitle').textContent=cycle.title;
 byId('sxAscensionSummary').textContent='AscensionX · Powerlifting · Week '+upNext.week+' of 6';
 byId('sxAscensionNext').textContent=upNext.kind==='support'?'NEXT: '+upNext.title:'NEXT: '+upNext.lift+' · Week '+upNext.week;
 byId('sxAscensionPercent').textContent=percent+'%';
 byId('sxAscensionProgressFill').style.width=percent+'%';
 byId('sxAscensionProgress').setAttribute('aria-valuenow',String(percent));
 byId('sxAscensionContinue').dataset.lift=upNext.lift;
}
function launch(mode,context='auto'){
 const state=readCycle();
 // Continue uses a native popup above the real Workout page.
 if(mode==='continue'&&state&&sxAscModalOpen(state.upNext?.lift))return true;
 if(typeof window.spartanxOpenEmbeddedAscensionX==='function'){
  // The linked cycle is read fresh from AscensionX state, not copied into a new planner.
  const destination=mode==='continue'&&state?'continue':mode==='manage'&&state?'manage':mode==='view'&&state?'view':'home';
  return window.spartanxOpenEmbeddedAscensionX(destination,destination==='continue'?state.upNext.lift:null,context)===true;
 }
 // The connection normally exists; gracefully retain access via Training Tools.
 if(typeof switchScreen==='function')switchScreen('tools');
 return false;
}
// Used by Active Session → Options. With a cycle: preview the next prescribed
// lift/week; without one: open the real AscensionX cycle setup.
window.spartanxQuickStartAscension=(context='auto')=>launch(readCycle()?'continue':'home',context);
byId('sxAscensionContinue').addEventListener('click',()=>launch('continue'));
byId('sxAscensionOptions').addEventListener('click',()=>{
 const menu=byId('sxAscensionOptionsMenu');
 menu.hidden=!menu.hidden;
 byId('sxAscensionOptions').setAttribute('aria-expanded',String(!menu.hidden));
});
byId('sxAscensionView').addEventListener('click',()=>{
 byId('sxAscensionOptionsMenu').hidden=true;
 byId('sxAscensionOptions').setAttribute('aria-expanded','false');
 launch('view','workout');
});
byId('sxAscensionManage').addEventListener('click',()=>{
 byId('sxAscensionOptionsMenu').hidden=true;
 byId('sxAscensionOptions').setAttribute('aria-expanded','false');
 launch('manage','workout');
});
window.addEventListener('spartx:ascensionCycleUpdated',refresh);
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key==='spartx_db'||e.key==='sx_ascension_support_confirm_v1'||e.key===null)refresh()});
window.addEventListener('pageshow',refresh);
// Adaptive Programming loads after this card. Refresh once the full page loads.
window.addEventListener('load',refresh);
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
byId('trackerNav')?.addEventListener('click',()=>requestAnimationFrame(refresh));
window.spartanxRefreshAscensionQuickAccess=refresh;
refresh();
})();