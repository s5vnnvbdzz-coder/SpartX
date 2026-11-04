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
card.className='card sx-ascension-quick-card';
card.setAttribute('aria-label','Active AscensionX cycle');
card.hidden=true;
card.innerHTML=`
 <div class="sx-asc-quick-head">
  <div><div class="eyebrow">YOUR ACTIVE PROGRAMME</div><h2>ASCENSION<span style="color:var(--lime)">X</span> CYCLE</h2></div>
  <span class="sx-asc-quick-tag">ACTIVE</span>
 </div>
 <p class="sx-asc-quick-summary" id="sxAscensionSummary">Your current six-week strength programme.</p>
 <div class="sx-asc-quick-lifts" id="sxAscensionLifts" aria-label="Current week for each lift"></div>
 <div class="sx-asc-quick-progress-top"><span>OVERALL CYCLE PROGRESS</span><strong id="sxAscensionPercent">0%</strong></div>
 <div class="sx-asc-quick-progress" role="progressbar" aria-label="AscensionX cycle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="sxAscensionProgress"><span id="sxAscensionProgressFill"></span></div>
 <div class="sx-asc-quick-actions">
  <button type="button" id="sxAscensionContinue">⚡ CONTINUE TRAINING</button>
  <button type="button" id="sxAscensionView">VIEW CYCLE</button>
 </div>`;
const startCard=workout.querySelector('.start-card');
if(startCard)startCard.before(card);
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
 return {created:cycle.created,items,upNext,percent};
}
function refresh(){
 const cycle=readCycle();
 if(!cycle){card.hidden=true;card.dataset.cycleId='';return}
 const {items,upNext,percent}=cycle;
 card.hidden=false;card.dataset.cycleId=cycle.created;
 const names=items.map(x=>SHORT[x.lift]||x.lift).join(', ');
 byId('sxAscensionSummary').textContent='6-week strength programme · '+items.length+' '+(items.length===1?'lift':'lifts')+' · Next: '+upNext.lift+' (Week '+upNext.week+')';
 const host=byId('sxAscensionLifts');
 host.style.gridTemplateColumns='repeat('+items.length+',minmax(0,1fr))';
 host.innerHTML=items.map(x=>'<div class="sx-asc-quick-lift'+(x.lift===upNext.lift?' is-up-next':'')+'" aria-label="'+x.lift+', '+(x.done?'completed':'week '+x.week)+'"><span>'+SHORT[x.lift]+'</span><strong>'+(x.done?'✓':'W'+x.week)+'</strong></div>').join('');
 byId('sxAscensionPercent').textContent=percent+'%';
 byId('sxAscensionProgressFill').style.width=percent+'%';
 byId('sxAscensionProgress').setAttribute('aria-valuenow',String(percent));
 byId('sxAscensionContinue').dataset.lift=upNext.lift;
}
function launch(mode){
 const state=readCycle();if(!state){refresh();return}
 if(typeof window.spartanxOpenEmbeddedAscensionX==='function'){
  window.spartanxOpenEmbeddedAscensionX(mode,mode==='continue'?state.upNext.lift:null);
 }else{
  // The connection normally exists; gracefully retain access via Training Tools.
  if(typeof switchScreen==='function')switchScreen('tools');
 }
}
byId('sxAscensionContinue').addEventListener('click',()=>launch('continue'));
byId('sxAscensionView').addEventListener('click',()=>launch('home'));
window.addEventListener('spartx:ascensionCycleUpdated',refresh);
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===null)refresh()});
window.addEventListener('pageshow',refresh);
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
byId('trackerNav')?.addEventListener('click',()=>requestAnimationFrame(refresh));
window.spartanxRefreshAscensionQuickAccess=refresh;
refresh();
})();