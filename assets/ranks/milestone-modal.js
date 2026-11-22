/* SpartanX full-screen Milestone Progression modal · v379.
 * No app navigation or extra page; opens from the existing badge collection.
 */
(function(root){
 'use strict';
 const engine=root.SpartanXMilestoneEngine;
 if(!engine||!root.document)return;
 const $=id=>document.getElementById(id);
 const KEY='spartanx_milestone_badge_highwater_v1';
 const number=n=>Math.round(n).toLocaleString('en-GB');
 const compact=n=>n>=1000000?(n/1000000).toFixed(n%1000000?1:0)+'M':
  n>=1000?(n/1000).toFixed(n%1000?1:0)+'k':number(n);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const icons={
  shield:'<path d="M12 2 20 6v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/><path d="M8 12l3 3 5-6"/>',
  anvil:'<path d="M5 4h14v5l-4 3v3h5v4H4v-4h5v-3L5 9z"/><path d="M9 12h6"/>',
  swords:'<path d="m4 3 14 14m-2 1 3 3m-4-5 5-5M20 3 6 17m2 1-3 3m4-5-5-5"/>',
  flame:'<path d="M12 22c5 0 8-4 8-8 0-3-2-5-3-6 .1 3-2 4-3 4 1-5-2-8-5-10 .2 4-1 6-3 9-4 6-1 11 6 11Z"/><path d="M12 22c2 0 4-2 4-5s-2-4-3-5c0 2-1 3-2 4-2 2-2 6 1 6Z"/>'
 };
 let overlay,opener=null;
 function loadSaved(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(_){return {}}}
 function getSnapshot(){
  let a=null;
  try{a=JSON.parse(localStorage.getItem('ascensionx_strength_v1')||'null')}catch(_){}
  const sessions=typeof db!=='undefined'&&Array.isArray(db?.sessions)?db.sessions:[];
  const model=engine.snapshot(sessions,a,loadSaved(),
   name=>root.SpartanXCardio?.isCardio?.(name)===true);
  try{
   const old=loadSaved();
   if(Object.entries(model.highWater).some(([k,v])=>Number(old[k])<v||!Number.isFinite(Number(old[k]))))
    localStorage.setItem(KEY,JSON.stringify({...old,...model.highWater}));
  }catch(_){}
  return model;
 }
 function card(c){
  const next=c.nextGoal===null?'ALL MILESTONES EARNED':'NEXT · '+compact(c.nextGoal)+' '+c.unit;
  const num=c.id==='volume'?compact(c.value):number(c.value);
  const current=c.nextGoal===null?num+' '+c.unit:
   num+' / '+compact(c.nextGoal)+' '+c.unit;
  const steps=c.tierDetails.map(t=>
   '<div class="sx-milestone-tier'+(t.unlocked?' is-earned':'')+'"><span class="sx-milestone-tier-gem" aria-hidden="true">✦</span>'+
   '<span>'+esc(t.name)+'</span><small>'+compact(t.goal)+'</small></div>').join('');
  return '<section class="sx-milestone-card" data-milestone-id="'+esc(c.id)+'">'+
   '<div class="sx-milestone-top"><div class="sx-milestone-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+icons[c.icon]+'</svg></div>'+
   '<div class="sx-milestone-title"><h3>'+esc(c.name)+'</h3><small>'+(c.currentBadge?esc(c.currentTier+' · '+c.currentBadge):'First achievement pending')+'</small></div>'+
   '<span class="sx-milestone-step">'+c.unlocked+' / 3</span></div>'+
   '<div class="sx-milestone-next">'+esc(next)+'</div>'+
   '<div class="sx-milestone-count">'+esc(current)+'</div>'+
   '<div class="sx-milestone-progress" role="progressbar" aria-label="'+esc(c.name)+' progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(c.progress*100)+'"><span style="width:'+Math.round(c.progress*100)+'%"></span></div>'+
   '<div class="sx-milestone-levels">'+steps+'</div></section>';
 }
 function mount(){
  if(overlay)return overlay;
  const grid=$('profileBadgeGrid'),badgeCollection=$('badgeCollection');
  if(!grid||!badgeCollection)return null;
  const entry=document.createElement('button');
  entry.type='button';
  entry.id='sxOpenMilestoneProgression';
  entry.className='sx-milestone-entry';
  entry.textContent='✦ VIEW MILESTONE PROGRESSION';
  entry.setAttribute('aria-haspopup','dialog');
  entry.setAttribute('aria-controls','sxMilestoneOverlay');
  grid.insertAdjacentElement('beforebegin',entry);
  entry.addEventListener('click',()=>open(entry));
  overlay=document.createElement('div');
  overlay.id='sxMilestoneOverlay';
  overlay.className='sx-milestone-overlay';
  overlay.hidden=true;
  overlay.setAttribute('role','presentation');
  overlay.innerHTML='<section class="sx-milestone-dialog" role="dialog" aria-modal="true" aria-labelledby="sxMilestoneTitle" tabindex="-1">'+
   '<div class="sx-milestone-toolbar"><span>SPARTANX · LIFETIME ACHIEVEMENTS</span>'+
   '<button type="button" class="sx-milestone-close" data-close-milestones aria-label="Close Milestone Progression">✕</button></div>'+
   '<header class="sx-milestone-heading"><h2 id="sxMilestoneTitle">Milestone Progression</h2>'+
   '<p>Earn achievement badges through consistent training. Prestige never resets these milestones.</p></header>'+
   '<div class="sx-milestone-overview" id="sxMilestoneOverview"></div>'+
   '<div class="sx-milestone-collection" id="sxMilestoneCollection"></div>'+
   '<p class="sx-milestone-note">Figures come from saved workouts and verified completed AscensionX cycles. Unlocked achievement tiers are retained on this device.</p>'+
   '<button type="button" class="sx-milestone-done" data-close-milestones>CLOSE</button></section>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',event=>{
   if(event.target===overlay||event.target.closest('[data-close-milestones]'))close();
  });
  return overlay;
 }
 function open(trigger){
  const ui=mount();if(!ui)return false;
  opener=trigger||document.activeElement;
  const model=getSnapshot();
  $('sxMilestoneOverview').innerHTML='<strong>'+model.earned+' <span>/ '+model.total+'</span></strong>'+
   '<div><span>ACHIEVEMENT TIERS EARNED</span><small>4 paths · Bronze / Silver / Gold</small></div>';
  $('sxMilestoneCollection').innerHTML=model.categories.map(card).join('');
  ui.hidden=false;
  document.body.classList.add('sx-milestones-open');
  ui.querySelector('.sx-milestone-close').focus();
  return true;
 }
 function close(){
  if(!overlay||overlay.hidden)return;
  overlay.hidden=true;
  document.body.classList.remove('sx-milestones-open');
  if(opener?.isConnected&&typeof opener.focus==='function')opener.focus();
  opener=null;
 }
 document.addEventListener('keydown',event=>{
  if(!overlay||overlay.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close();return}
  if(event.key!=='Tab')return;
  const controls=[...overlay.querySelectorAll('button:not([disabled])')];
  if(!controls.length)return;
  if(event.shiftKey&&document.activeElement===controls[0]){
   event.preventDefault();controls[controls.length-1].focus();
  }else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){
   event.preventDefault();controls[0].focus();
  }
 });
 // The existing badgeCollection is moved into the Profile's collapsible
 // "Badges & strength details" container during Profile preview setup.
 mount();
 root.SpartanXMilestoneProgression=Object.freeze({open,close,getSnapshot});
})(window);
