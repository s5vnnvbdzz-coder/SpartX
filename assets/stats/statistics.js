/* SpartanX Statistics as a real screen, preserving existing four-tab navigation.
 * All data continues to come from SpartanX saved workouts and muscle classifications.
 * Exercise thumbnails: RepDB Free tier, visible attribution in Statistics/library.
 */
(function(){
'use strict';
const el=id=>document.getElementById(id);
const oldPage=el('trainingStatsOverlay');
if(!oldPage || oldPage.classList.contains('sx-statistics-page'))return;
const page=document.createElement('section');
page.id='trainingStatsOverlay';
page.className='screen sx-statistics-page';
page.setAttribute('aria-labelledby','trainingStatsTitle');
page.innerHTML=`
<div class="sx-statistics-heading">
 <div><div class="eyebrow">YOUR TRAINING, TRACKED</div><h1 id="trainingStatsTitle">Statistics</h1></div>
 <button type="button" class="back-button sx-page-back" id="closeTrainingStats" aria-label="Back to Profile"><span class="sx-page-back-arrow" aria-hidden="true">←</span></button>
</div>
<div class="sx-stats-module sx-stats-week">
 <div class="sx-seven-day-header"><strong>LAST 7 DAYS</strong><span id="sxSevenDayCount">0 workouts</span></div>
 <div id="sxSevenDayStrip" class="sx-week-strip" aria-label="Rolling seven-day workout calendar"></div>
</div>
<section class="sx-stats-module sx-stats-anatomy">
 <div class="sx-section-title"><div><div class="eyebrow">WORKED MUSCLES</div><h2>Muscle activity</h2></div><span class="tiny muted">LAST 7 DAYS</span></div>
 <div class="sx-body-map-panel"><div id="sxSevenDayBody" aria-live="polite"></div></div>
 <div class="sx-muscle-map-legend"><span><i class="sx-highlight-swatch"></i>Primary</span><span><i class="sx-highlight-swatch is-secondary"></i>Secondary</span></div>
 <p id="sxSevenDayCaption" class="sx-week-map-caption">Complete a workout to see your trained muscles.</p>
</section>
<section class="sx-stats-module sx-30day-overview">
 <div class="sx-section-title"><div class="eyebrow">30-DAY STATISTICS</div><span class="tiny muted">LAST 30 DAYS</span></div>
 <div class="sx-overview-grid">
  <div class="sx-overview-metric"><span><span class="sx-metric-icon" aria-hidden="true">🏋</span> WORKOUTS</span><strong id="periodWorkouts">0</strong></div>
  <div class="sx-overview-metric"><span><span class="sx-metric-icon" aria-hidden="true">◷</span> DURATION</span><strong id="periodDuration">0h</strong></div>
  <div class="sx-overview-metric"><span><span class="sx-metric-icon" aria-hidden="true">▱</span> VOLUME</span><strong id="periodVolume">0 kg</strong></div>
  <div class="sx-overview-metric"><span><span class="sx-metric-icon" aria-hidden="true">▤</span> SETS</span><strong id="periodSets">0</strong></div>
 </div>
</section>
<section class="sx-stats-module sx-stats-breakdown">
 <div class="sx-section-title"><div class="eyebrow">FULL MUSCLE BREAKDOWN</div><span class="tiny muted">30 DAYS</span></div>
 <div id="trainingMuscleBreakdown" class="muscle-breakdown"></div>
 <p id="trainingUnclassified" class="tiny muted"></p>
 <p class="tiny muted sx-stats-footnote">Primary and secondary training sets are shown separately. Muscle involvement is estimated from each exercise, not measured activation.</p>
</section>
<section class="sx-stats-module sx-stats-distribution">
 <div class="sx-section-title"><div class="eyebrow">TRAINING DISTRIBUTION</div><span class="tiny muted">30 DAYS</span></div>
 <div id="trainingRadar" class="training-radar"></div>
</section>
<section class="sx-stats-module sx-stats-recent">
 <div class="sx-section-title"><div class="eyebrow">RECENT EXERCISES</div><span class="tiny muted">LAST 7 DAYS</span></div>
 <div id="sxRecentExercises" class="sx-recent-exercises"></div>
 <p class="sx-imagery-credit">Exercise imagery: <a href="https://repdb.co" target="_blank" rel="noopener noreferrer">RepDB (repdb.co)</a> · Free-tier in-app licence with attribution.</p>
</section>`;
oldPage.replaceWith(page);
const oldDraw=window.SpartanXAnatomy?.render;
if(oldDraw){
 window.SpartanXAnatomy.render=function(primary,secondary,opts){
  return oldDraw(primary,secondary,{...(opts||{}),gender:db.profile?.standard==='female'?'female':'male'});
 };
}
el('openTrainingStats').onclick=function(){
 switchScreen('trainingStatsOverlay');
 renderTrainingStats();
 document.querySelector('#trackerNav button[data-screen="profile"]')?.classList.add('active');
 window.scrollTo(0,0);
};
el('closeTrainingStats').onclick=function(){returnToScreen('profile')};
function imageElement(name,extraClass=''){
 const img=document.createElement('img');
 img.src=window.spartanExerciseImage(name);
 img.alt='';
 img.className='sx-exercise-thumb '+extraClass;
 img.loading='lazy';
 img.decoding='async';
 img.onerror=()=>{img.onerror=null;img.src=window.spartanExerciseImageFallback;};
 return img;
}
function decorateLibrary(){
 const host=el('libraryList');if(!host)return;
 host.querySelectorAll('.library-pick[data-add-exercise]').forEach(button=>{
  if(button.classList.contains('sx-illustrated-library-pick'))return;
  const name=button.dataset.addExercise;
  const copy=document.createElement('span');copy.className='sx-library-copy';
  while(button.firstChild)copy.appendChild(button.firstChild);
  const art=imageElement(name,'sx-library-art');art.style.cssText='width:52px;height:52px';
  button.classList.add('sx-illustrated-library-pick');
  button.append(art,copy);
 });
 if(!el('sxLibraryArtCredits')){
  const credit=document.createElement('p');credit.id='sxLibraryArtCredits';credit.className='sx-credits-note';
  credit.innerHTML='Exercise imagery by <a href="https://repdb.co" target="_blank" rel="noopener noreferrer">RepDB (repdb.co)</a>.';
  host.after(credit);
 }
}
function decorateLive(){
 const host=el('exerciseList');if(!host)return;
 host.querySelectorAll('.exercise-card').forEach((card,i)=>{
  const avatar=card.querySelector('.exercise-title-row .exercise-avatar');
  const title=card.querySelector('.exercise-title-row .exercise-title');
  if(!avatar||!title)return;
  avatar.replaceChildren(imageElement(work[i]?.name||title.textContent));
 });
}
function decorateFeed(){
 const host=el('workoutFeed');if(!host)return;
 host.querySelectorAll('.feed-exercise').forEach(row=>{
  const label=row.querySelector('.feed-exercise-copy strong')?.textContent;
  const circle=row.querySelector('.feed-exercise-mark');
  if(!label||!circle)return;
  circle.replaceChildren(imageElement(label));
 });
}
function decorateExerciseStats(){
 const host=el('exerciseStatsList');if(!host)return;
 host.querySelectorAll('.library-item').forEach(row=>{
  if(row.querySelector('img.sx-exercise-thumb'))return;
  const name=row.querySelector('.library-item-name')?.textContent;
  if(!name)return;
  const art=imageElement(name);art.style.cssText='width:52px;height:52px;margin-right:9px';
  row.prepend(art);
 });
}
function decorateCompleted(id){
 const session=(db.sessions||[]).find(s=>String(s.id)===String(id));
 const nodes=el('completedWorkoutDetails')?.querySelectorAll('.completed-exercise')||[];
 nodes.forEach((node,i)=>{
  const heading=node.querySelector('h3'),name=session?.exercises?.[i]?.name;
  if(!heading||!name||node.querySelector('.sx-completed-title'))return;
  const holder=document.createElement('div');holder.className='sx-completed-title';
  holder.append(imageElement(name),heading);
  node.prepend(holder);
 });
}
function makeThumbWrappers(){
 const originalLibrary=renderLibrary;
 renderLibrary=function(){const result=originalLibrary.apply(this,arguments);decorateLibrary();return result;};
 const originalWork=renderWork;
 renderWork=function(){const result=originalWork.apply(this,arguments);decorateLive();return result;};
 const originalFeed=renderWorkoutFeed;
 renderWorkoutFeed=function(){const result=originalFeed.apply(this,arguments);decorateFeed();return result;};
 const originalExercises=renderExerciseStats;
 renderExerciseStats=function(){const result=originalExercises.apply(this,arguments);decorateExerciseStats();return result;};
 const originalComplete=openCompletedWorkout;
 openCompletedWorkout=function(id){const result=originalComplete.apply(this,arguments);decorateCompleted(id);return result;};
}
makeThumbWrappers();
function renderRecent(){
 const host=el('sxRecentExercises');if(!host)return;
 const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
 const recent=(db.sessions||[]).filter(s=>{const d=new Date(s.date);return Number.isFinite(d.getTime())&&d>=start&&d<end}).sort((a,b)=>new Date(b.date)-new Date(a.date));
 const muscles=new Map();
 recent.forEach(session=>(session.exercises||[]).forEach(ex=>{
  const name=(ex.name||'Exercise').trim(),key=name.toLowerCase();
  const count=(ex.sets||[]).filter(set=>isValidTrackedSet(set,ex.name)).length;
  if(!count)return;
  if(!muscles.has(key))muscles.set(key,{name,sets:0});
  muscles.get(key).sets+=count;
 }));
 const exercises=[...muscles.values()].slice(0,12);
 if(!exercises.length){host.innerHTML='<p class="sx-recent-empty">No completed exercises in the last 7 days.</p>';return;}
 host.innerHTML=exercises.map(ex=>{
  const src=window.spartanExerciseImage(ex.name);
  return '<button type="button" class="sx-recent-exercise" data-sx-recent-name="'+esc(ex.name)+'" aria-label="View '+esc(ex.name)+' exercise history"><span class="sx-recent-exercise-art"><img src="'+src+'" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.spartanExerciseImageFallback"></span><strong>'+esc(ex.name)+'</strong><small>'+ex.sets+' '+(ex.sets===1?'set':'sets')+'</small></button>';
 }).join('');
}
el('sxRecentExercises').addEventListener('click',event=>{
 const item=event.target.closest('button[data-sx-recent-name]');if(!item)return;
 if(typeof window.showExercisePR==='function')window.showExercisePR(item.dataset.sxRecentName);
});
function enhanceBreakdown(){
 const host=el('trainingMuscleBreakdown');if(!host)return;
 const rows=[...host.querySelectorAll('.muscle-breakdown-item')];
 const totals=rows.map(x=>Number.parseInt(x.querySelector('span b')?.textContent||'0',10)||0);
 const max=Math.max(1,...totals);
 rows.forEach((row,i)=>{
  const old=row.querySelector('.sx-mv-bar');if(old)old.remove();
  const track=document.createElement('div');track.className='sx-mv-bar';
  const bar=document.createElement('b');bar.style.width=(totals[i]/max*100).toFixed(1)+'%';
  track.appendChild(bar);row.appendChild(track);
 });
}
const originalStats=renderTrainingStats;
renderTrainingStats=function(){
 const result=originalStats.apply(this,arguments);
 enhanceBreakdown();renderRecent();
 return result;
};
decorateFeed();
decorateLive();
if(el('libraryList')?.children.length)decorateLibrary();
if(typeof renderMuscles==='function')renderMuscles();
})();