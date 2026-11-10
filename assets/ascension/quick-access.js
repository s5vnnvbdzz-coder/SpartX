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
  <div class="sx-programme-menu-wrap"><button type="button" class="sx-programme-menu-button" id="sxAscensionOptions" aria-label="AscensionX programme options" aria-expanded="false" aria-controls="sxAscensionOptionsMenu">•••</button>
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
 const upNext=items.filter(x=>!x.done).sort((a,b)=>a.week-b.week||LIFTS.indexOf(a.lift)-LIFTS.indexOf(b.lift))[0];
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
 byId('sxAscensionNext').textContent='NEXT: '+upNext.lift+' · Week '+upNext.week;
 byId('sxAscensionPercent').textContent=percent+'%';
 byId('sxAscensionProgressFill').style.width=percent+'%';
 byId('sxAscensionProgress').setAttribute('aria-valuenow',String(percent));
 byId('sxAscensionContinue').dataset.lift=upNext.lift;
}
function launch(mode,context='auto'){
 const state=readCycle();
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
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===null)refresh()});
window.addEventListener('pageshow',refresh);
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
byId('trackerNav')?.addEventListener('click',()=>requestAnimationFrame(refresh));
window.spartanxRefreshAscensionQuickAccess=refresh;
refresh();
})();