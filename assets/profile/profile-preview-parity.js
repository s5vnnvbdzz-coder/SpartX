/* SpartanX Profile preview parity v239. Layout-only enhancement.
 * Existing nav, stored profile, rank, social and session models are unchanged. */
(function(){
'use strict';
const root=document.getElementById('profile');
if(!root||root.dataset.sxPreviewReady)return;
root.dataset.sxPreviewReady='true';
const $=id=>document.getElementById(id);
const icon={
 trophy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v7a5 5 0 0 1-10 0V4ZM7 6H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4M12 16v4m-4 1h8"/></svg>',
 share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
 dumbbell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6m4-9v12m10-12v12m4-9v6M7 12h10M1 9v6m22-6v6"/></svg>'
};
const top=root.querySelector('.sx-profile-layout-top'),profile=root.querySelector('.profile-identity'),avatar=$('profileAvatar'),title=$('profileDisplayName'),pTabs=$('performanceTabs'),chart=$('performanceCard');
if(!top||!profile||!avatar||!title||!pTabs||!chart)return;
/* Use the same two real buttons, grouped with a local summary share action. */
const topLabel=top.firstElementChild;
topLabel.innerHTML='<div class="sx-profile-handle" id="sxProfileHandle">SpartanX athlete</div>';
const actionPack=top.querySelector('.profile-action-buttons');
if(!actionPack.querySelector('.sx-profile-share-button')){
 const share=document.createElement('button');share.type='button';share.className='sx-profile-share-button';
 share.setAttribute('aria-label','Share profile summary');share.title='Share profile summary';share.innerHTML=icon.share;
 const settings=actionPack.querySelector('#openProfileSettings');actionPack.insertBefore(share,settings);
 share.addEventListener('click',async()=>{
  const p=db.profile||{},rank=getWorkoutRank();
  const text=[p.name||'SpartanX Athlete',spartanxRankLabel(rank.current.name,rank.index),(db.sessions||[]).length+' workouts'].join(' · ');
  try{
   if(navigator.share){await navigator.share({title:'SpartanX athlete',text});return;}
   if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Profile summary copied.');return;}
  }catch(e){if(e.name==='AbortError')return;}
  window.prompt('Copy your athlete summary',text);
 });
}
if(!avatar.parentElement.classList.contains('sx-profile-avatar-wrap')){
 const wrap=document.createElement('div');wrap.className='sx-profile-avatar-wrap';avatar.parentNode.insertBefore(wrap,avatar);wrap.appendChild(avatar);
 const medal=document.createElement('span');medal.className='sx-profile-avatar-medal';medal.setAttribute('aria-hidden','true');medal.innerHTML=icon.trophy;wrap.appendChild(medal);
}
if(!$('sxProfileRankLine')){
 const line=document.createElement('div');line.className='sx-profile-rank-line';line.id='sxProfileRankLine';
 line.innerHTML='<span class="sx-profile-rank-dot"></span><span class="sx-profile-rank-label" id="sxProfileRankLabel">Rank I</span><span id="sxProfileCountryFlag"></span>';
 title.insertAdjacentElement('afterend',line);
}
if(!$('sxProfileXP')){
 const panel=document.createElement('div');panel.id='sxProfileXP';panel.className='sx-profile-xp-panel';
 panel.innerHTML='<div class="sx-profile-xp-head"><strong>RANK PROGRESSION</strong><span id="sxProfileXPLevel"></span></div><div class="sx-profile-xp-track"><span class="sx-profile-xp-fill" id="sxProfileXPFill"></span></div><div class="sx-profile-xp-foot"><span id="sxProfileXPCount"></span><em id="sxProfileXPNext"></em></div>';
 profile.insertAdjacentElement('afterend',panel);
}
const oldHeader=chart.querySelector('.sx-profile-chart-header');
oldHeader.innerHTML='<div class="sx-profile-week-summary"><strong id="sxProfileWeekSummary">0 mins</strong> <span>this week</span></div><label class="sx-profile-chart-range"><select id="sxProfileRange" aria-label="Chart period"><option value="3m">Last 3 months</option><option value="4w">Last 4 weeks</option><option value="6m">Last 6 months</option></select></label>';
if(!$('sxProfileChart')){
 const holder=document.createElement('div');holder.id='sxProfileChart';holder.className='sx-profile-chart-card';
 holder.innerHTML='<div class="sx-profile-chart-body"><div class="sx-profile-chart-gridlines"><div class="sx-profile-chart-gridline"><span id="sxProfileChartMax"></span></div><div class="sx-profile-chart-gridline"><span id="sxProfileChartMid"></span></div><div class="sx-profile-chart-gridline"><span>0</span></div></div><div class="sx-profile-chart-bars" id="sxProfileChartBars"></div></div><div class="sx-profile-chart-labels" id="sxProfileChartLabels"></div><div class="sx-profile-chart-readout" id="sxProfileChartReadout"></div>';
 $('performanceChart').insertAdjacentElement('afterend',holder);
}
/* The previous chart controller is bound to the old tab element; leave it
   behind rather than breaking it when adding the preview's fourth metric. */
const tabsClone=pTabs.cloneNode(false);tabsClone.innerHTML=['duration','volume','reps','sets'].map((m,i)=>'<button type="button" role="tab" class="'+(i===0?'selected':'')+'" aria-selected="'+(i===0)+'" data-performance-metric="'+m+'">'+m.charAt(0).toUpperCase()+m.slice(1)+'</button>').join('');
pTabs.replaceWith(tabsClone);
let metric='duration',range='3m',selectedBar=11;
tabsClone.addEventListener('click',e=>{const b=e.target.closest('[data-performance-metric]');if(!b)return;metric=b.dataset.performanceMetric;tabsClone.querySelectorAll('button').forEach(x=>{const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-selected',String(active));});drawChart();});
$('sxProfileRange').addEventListener('change',e=>{range=e.target.value;selectedBar=11;drawChart();});
const dashTitle=root.querySelector('.sx-profile-dashboard-title');
if(dashTitle&&!root.querySelector('.sx-profile-dashboard-kicker'))dashTitle.insertAdjacentHTML('beforebegin','<div class="sx-profile-dashboard-kicker">YOUR TRAINING</div>');
/* Workout History is a second view of already logged sessions, not an import.
   All actual edit, delete, share, copy actions are delegated to the existing
   Home feed handlers, so there is no duplicate workout logic. */
let history=$('sxProfileHistory');
if(!history){
 history=document.createElement('section');history.id='sxProfileHistory';history.innerHTML='<div class="sx-profile-history-heading"><h2>Workout history</h2><span class="sx-profile-history-count" id="sxProfileHistoryCount"></span></div><div class="sx-profile-history-list" id="sxProfileHistoryList"></div>';
 const grid=root.querySelector('.sx-profile-dashboard-grid');grid.insertAdjacentElement('afterend',history);
 history.addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target)return;
  const id=target.dataset.profileView;
  if(id!=null){openCompletedWorkout(id);return;}
  const menu=target.dataset.profileMenu;
  if(menu!=null){const card=target.closest('.sx-profile-history-card');card.querySelector('.sx-profile-history-menu').classList.toggle('hidden');return;}
  const action=target.dataset.profileAction;
  if(action){const sid=target.dataset.sessionId;let rootFeed=$('workoutFeed');
   const button=[...rootFeed.querySelectorAll('[data-feed-'+action+']')].find(b=>b.getAttribute('data-feed-'+action)===sid);
   if(button){button.click();queueMicrotask(renderAll);}else{switchScreen('home');}
  }
 });
}
const moreTitle=root.querySelector('.sx-profile-more-title'),badges=$('badgeCollection'),rankHistory=root.querySelector('.sx-profile-lift-history');
if(moreTitle&&badges&&rankHistory&&!root.querySelector('.sx-profile-details')){
 const details=document.createElement('details');details.className='sx-profile-details';
 details.innerHTML='<summary>Badges &amp; strength details</summary><div class="sx-profile-details-content"></div>';
 moreTitle.replaceWith(details);const content=details.querySelector('.sx-profile-details-content');content.appendChild(badges);content.appendChild(rankHistory);
}
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function linkBio(text){
 const pattern=/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s<>]+|https?:\/\/[^\s<>]+/gi;
 let last=0,html='';
 for(const match of text.matchAll(pattern)){
  const raw=match[0],i=match.index??0;html+=escapeHTML(text.slice(last,i));
  const href=/^https?:\/\//i.test(raw)?raw:'https://'+raw;
  html+='<a class="sx-profile-bio-link" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(href)+'">'+escapeHTML(raw)+'</a>';
  last=i+raw.length;
 }
 return html+escapeHTML(text.slice(last));
}
function sessionsData(){return Array.isArray(db.sessions)?db.sessions:[]}
function totals(session){const exercises=Array.isArray(session.exercises)?session.exercises:[];let volume=0,reps=0,sets=0;for(const ex of exercises)for(const set of ex.sets||[]){const r=Math.max(0,+set.reps||0),w=Math.max(0,+set.weight||0);sets++;reps+=r;volume+=w*r;}return{duration:Math.max(0,+session.duration||0)/3600,volume:Math.max(0,+session.volume||0)||volume,reps,sets}}
function weeksSeries(){
 const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const period=range==='4w'?2:range==='6m'?15:7;
 const end=new Date(today);end.setDate(end.getDate()+1);
 const buckets=Array.from({length:12},(_,i)=>{
  const from=new Date(end);from.setDate(from.getDate()-(12-i)*period);
  const to=new Date(end);to.setDate(to.getDate()-(11-i)*period);
  return {from,to,label:from.toLocaleDateString(undefined,{month:'short',day:'numeric'}),duration:0,volume:0,reps:0,sets:0};
 });
 for(const s of sessionsData()){
  const d=new Date(s.date);if(!Number.isFinite(d.getTime()))continue;
  const b=buckets.find(x=>d>=x.from&&d<x.to);if(!b)continue;
  const t=totals(s);for(const key of ['duration','volume','reps','sets'])b[key]+=t[key];
 }
 return buckets;
}
function compactNumber(n){return Math.round(n).toLocaleString(undefined,{maximumFractionDigits:0})}
function formatted(n){if(metric==='duration')return Number(n.toFixed(1)).toLocaleString()+' hrs';if(metric==='volume')return compactNumber(n)+' kg';return compactNumber(n)+' '+(metric==='reps'?'reps':'sets')}
function drawChart(){
 if(!$('sxProfileChartBars'))return;
 const series=weeksSeries(),values=series.map(s=>s[metric]),max=Math.max(...values,0),scale=max?max*1.12:1;
 const bars=$('sxProfileChartBars');bars.innerHTML=series.map((s,i)=>'<button type="button" class="'+(i===selectedBar?'is-selected':'')+'" data-bar="'+i+'" style="--profile-bar:'+Math.max(s[metric]?3:1,s[metric]/scale*100).toFixed(2)+'%" title="'+escapeHTML(s.label+': '+formatted(s[metric]))+'" aria-label="'+escapeHTML(s.label+': '+formatted(s[metric]))+'"></button>').join('');
 bars.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedBar=Number(b.dataset.bar);drawChart();}));
 const grid=max?max:0;
 $('sxProfileChartMax').textContent=metric==='duration'?(Number(grid*1.12).toFixed(1)+' hrs'):compactNumber(grid*1.12);
 $('sxProfileChartMid').textContent=metric==='duration'?(Number(grid*.56).toFixed(1)+' hrs'):compactNumber(grid*.56);
 $('sxProfileChartLabels').innerHTML=[0,2,4,6,8,11].map(i=>'<span>'+escapeHTML(series[i].label)+'</span>').join('');
 const selected=series[selectedBar]||series[11];
 $('sxProfileChartReadout').innerHTML='<strong>'+escapeHTML(selected.label)+'</strong> · '+escapeHTML(formatted(selected[metric]));
}
function rankAndIdentity(){
 const p=db.profile||{},display=(p.name||'').trim()||'Your Name';
 $('sxProfileHandle').textContent=(p.username||p.handle||display.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'athlete').slice(0,48);
 const rank=getWorkoutRank();$('sxProfileRankLabel').textContent=spartanxRankLabel(rank.current.name,rank.index);
 const flag=p.countryPublic===true&&typeof countryFlag==='function'?countryFlag(p.countryCode||p.country||p.countryOfOrigin||''):'';
 $('sxProfileCountryFlag').textContent=flag;
 const prestige=Math.max(0,Number(localStorage.getItem('spartanx_prestige_level_v1'))||0);
 $('sxProfileXPLevel').innerHTML='Level '+(rank.index+1)+' <em>✦</em> Prestige '+String(prestige).padStart(2,'0');
 const start=rank.current.workouts,finish=rank.next?rank.next.workouts:start;
 const progress=rank.next?Math.max(0,Math.min(1,(rank.count-start)/(finish-start))):1;
 $('sxProfileXPFill').style.width=(progress*100).toFixed(1)+'%';
 $('sxProfileXPCount').textContent=rank.next?rank.count+' / '+finish+' XP':rank.count+' XP · MAX RANK';
 $('sxProfileXPNext').textContent=rank.next?Math.round(progress*100)+'% to next rank':'MAX RANK';
 const bio=(p.bio||'').trim()||'Add a little about yourself.';
 $('profileDisplayBio').innerHTML=linkBio(bio);
}
function weeklySummary(){
 const now=new Date(),since=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const day=(since.getDay()+6)%7;since.setDate(since.getDate()-day);
 let secs=0;for(const s of sessionsData()){const d=new Date(s.date);if(Number.isFinite(d.getTime())&&d>=since&&d<=now)secs+=Math.max(0,+s.duration||0)}
 const mins=Math.floor(secs/60),hrs=Math.floor(mins/60);
 $('sxProfileWeekSummary').textContent=hrs?hrs+' hrs'+(mins%60?' '+(mins%60)+' min':''):mins+' mins';
}
function renderHistory(){
 const sessions=sessionsData().slice().sort((a,b)=>(new Date(b.date)||0)-(new Date(a.date)||0));
 $('sxProfileHistoryCount').textContent=sessions.length+' '+(sessions.length===1?'workout':'workouts');
 if(!sessions.length){$('sxProfileHistoryList').innerHTML='<div class="sx-profile-history-empty">No workouts logged in SpartanX yet. The HTML preview showed example workouts; your Hevy history is not automatically imported.</div>';return;}
 $('sxProfileHistoryList').innerHTML=sessions.slice(0,3).map(s=>{
  const id=escapeHTML(s.id),name=escapeHTML(s.name||'Workout'),d=new Date(s.date),date=Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'Date unavailable';
  const t=totals(s),minutes=Math.round(t.duration*60);
  return '<article class="sx-profile-history-card"><div class="sx-profile-history-row"><span class="sx-profile-history-emblem">'+icon.dumbbell+'</span><div class="sx-profile-history-title"><button type="button" data-profile-view="'+id+'">'+name+'</button><small>'+escapeHTML(date)+'</small></div><button type="button" class="sx-profile-history-more" data-profile-menu="'+id+'" aria-label="Workout options for '+name+'">•••</button></div><div class="sx-profile-history-metrics"><span><b>◷</b> '+minutes+' min</span><span><b>▥</b> '+compactNumber(t.volume)+' kg</span><span><b>▱</b> '+t.sets+' sets</span></div><div class="sx-profile-history-menu hidden">'+[['copy','Copy'],['share','Share'],['edit','Edit'],['delete','Delete']].map(x=>'<button type="button" data-profile-action="'+x[0]+'" data-session-id="'+id+'">'+x[1]+'</button>').join('')+'</div></article>';
 }).join('');
}
function renderAll(){if(!document.getElementById('sxProfileXP'))return;rankAndIdentity();weeklySummary();drawChart();renderHistory();}
const originalRenderProfile=renderProfile;
renderProfile=function(){const v=originalRenderProfile.apply(this,arguments);renderAll();return v;};
const originalRenderWorkoutFeed=renderWorkoutFeed;
renderWorkoutFeed=function(){const v=originalRenderWorkoutFeed.apply(this,arguments);queueMicrotask(renderAll);return v;};
window.SpartanXProfilePreview={render:renderAll};
renderAll();
})();
