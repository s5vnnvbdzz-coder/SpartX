/* SpartanX Prestige Showcase and laurel-tier celebrations v372.
 * Read-only lifetime achievements, separate from the six repeating ranks.
 */
(function(global){
 'use strict';
 const engine=global.SpartanXXP;
 if(!engine)return;
 const titleCase=s=>String(s||'none').replace(/\b[a-z]/g,m=>m.toUpperCase());
 const integer=n=>Math.max(0,Math.floor(Number(n)||0));
 const laurelSvg=extra=>'<svg viewBox="0 0 80 80" class="sx-prestige-crest" fill="none" aria-hidden="true">'+
  '<path d="M35 66C18 57 13 40 23 16M45 66C62 57 67 40 57 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'+
  '<path d="m24 55-11-5 4 12m1-22-8-9-3 10m16-18-1-13 10 6m24 39 11-5-4 12m-1-22 8-9 3 10M57 23l1-13-10 6" stroke="currentColor" stroke-width="2"/>'+
  (extra?'<circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4"/>':'')+
  '<path d="m40 23 6 12 13 5-13 5-6 12-6-12-13-5 13-5z" fill="currentColor"/>'+
  '</svg>';
 function describe(input={}){
  const prestige=integer(input.prestige);
  const tier=engine.prestigeTier(prestige);
  const next=engine.LAUREL_TIERS.find(t=>t.start>prestige)||null;
  const previous=tier?.start||0;
  const progress=next?Math.max(0,Math.min(1,(prestige-previous)/(next.start-previous))):1;
  return Object.freeze({
   prestige,totalXP:integer(input.totalXP),cycleXP:integer(input.cycleXP),
   earnedBadges:Math.min(6,Math.max(0,integer(input.badgeHighWater)+1)),
   tier:tier?.name||'none',next,remaining:next?next.start-prestige:0,
   progress,
   tiers:engine.LAUREL_TIERS.map(t=>({
    ...t,unlocked:prestige>=t.start,current:tier?.name===t.name
   }))
  });
 }
 let overlay=null,previousFocus=null;
 function ensureOverlay(){
  if(overlay)return overlay;
  if(!global.document?.body)return null;
  overlay=global.document.createElement('div');
  overlay.id='sxPrestigeShowcaseOverlay';
  overlay.className='sx-prestige-overlay';
  overlay.hidden=true;
  overlay.setAttribute('role','presentation');
  overlay.innerHTML='<section class="sx-prestige-dialog" role="dialog" aria-modal="true" aria-labelledby="sxPrestigeDialogTitle" tabindex="-1">'+
   '<button class="sx-prestige-dismiss" type="button" data-sx-prestige-close aria-label="Close Prestige Showcase">×</button>'+
   '<div id="sxPrestigeDialogBody"></div></section>';
  global.document.body.appendChild(overlay);
  return overlay;
 }
 function currentModel(){
  if(typeof global.getWorkoutRank!=='function')return null;
  try{return describe(global.getWorkoutRank())}catch(_){return null}
 }
 function stageRows(model){
  return model.tiers.map(t=>{
   const state=t.current?' current':t.unlocked?' earned':' locked';
   const label=t.end===null?'P'+t.start+'+':'P'+t.start+'–'+t.end;
   return '<li class="sx-prestige-stage'+state+'" data-sx-prestige-band="'+t.name+'">'+
    '<span class="sx-prestige-stage-gem" aria-hidden="true">✦</span>'+
    '<span class="sx-prestige-stage-name">'+titleCase(t.name)+
     '<small>'+label+'</small></span>'+
    '<span class="sx-prestige-stage-status">'+(t.current?'CURRENT':t.unlocked?'EARNED':'LOCKED')+'</span></li>';
  }).join('');
 }
 function display(source){
  const root=ensureOverlay(),model=source||currentModel();
  if(!root||!model)return false;
  if(root.hidden)previousFocus=global.document.activeElement;
  root.hidden=false;
  root.dataset.sxPrestigeBand=model.tier;
  root.classList.remove('is-celebration');
  global.document.body.classList.add('sx-prestige-open');
  root.querySelector('#sxPrestigeDialogBody').innerHTML=
   '<div class="sx-prestige-eyebrow">SPARTANX · LIFETIME ACHIEVEMENTS</div>'+
   '<div class="sx-prestige-hero" data-sx-prestige-band="'+model.tier+'">'+laurelSvg(model.tier==='apotheosis')+
   '<div class="sx-prestige-hero-label">PRESTIGE SHOWCASE</div>'+
   '<h2 id="sxPrestigeDialogTitle">'+titleCase(model.tier==='none'?'Your journey':model.tier+' Laurel')+'</h2>'+
   '<p class="sx-prestige-hero-sub">Lifetime Prestige '+String(model.prestige).padStart(2,'0')+'</p></div>'+
   '<div class="sx-prestige-stat-grid">'+
   '<div><span>PRESTIGES</span><strong>'+model.prestige+'</strong></div>'+
   '<div><span>LIFETIME XP</span><strong>'+model.totalXP.toLocaleString('en-GB')+'</strong></div>'+
   '<div><span>RANK BADGES</span><strong>'+model.earnedBadges+' / 6</strong></div></div>'+
   '<div class="sx-prestige-next">'+
   '<div class="sx-prestige-next-top"><strong>'+(model.next?'NEXT LAUREL · '+titleCase(model.next.name):'HIGHEST LAUREL ACHIEVED')+'</strong>'+
   '<span>'+(model.next?model.remaining+' prestiges to P'+model.next.start:'APOTHEOSIS · P60+')+'</span></div>'+
   '<div class="sx-prestige-meter" role="progressbar" aria-label="Progress towards next prestige laurel" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(model.progress*100)+'"><span style="width:'+Math.round(model.progress*100)+'%"></span></div></div>'+
   '<h3 class="sx-prestige-stages-title">SIX LAUREL TIERS</h3>'+
   '<ol class="sx-prestige-stage-list">'+stageRows(model)+'</ol>'+
   '<p class="sx-prestige-footnote">Prestige is continuous. Rank progression repeats every 6,000 XP; previously unlocked badges remain yours.</p>'+
   '<button class="sx-prestige-primary" type="button" data-sx-prestige-close>CLOSE SHOWCASE</button>';
  root.querySelector('.sx-prestige-dismiss')?.focus();
  return true;
 }
 function celebrate(state){
  const model=describe(state);
  const tier=engine.prestigeTier(model.prestige);
  if(!tier)return false;
  const root=ensureOverlay();
  if(!root)return false;
  previousFocus=global.document.activeElement;
  root.hidden=false;
  root.dataset.sxPrestigeBand=tier.name;
  root.classList.add('is-celebration');
  global.document.body.classList.add('sx-prestige-open');
  root.querySelector('#sxPrestigeDialogBody').innerHTML=
   '<div class="sx-prestige-unlock-stars" aria-hidden="true">✦ · ✧ · ✦</div>'+
   '<div class="sx-prestige-celebration-crest" data-sx-prestige-band="'+tier.name+'">'+laurelSvg(tier.name==='apotheosis')+'</div>'+
   '<div class="sx-prestige-eyebrow">SPARTANX · LAUREL ACHIEVED</div>'+
   '<h2 id="sxPrestigeDialogTitle" class="sx-prestige-unlocked-title">'+titleCase(tier.name)+' Unlocked</h2>'+
   '<p class="sx-prestige-celebration-copy">Prestige '+model.prestige+' · Your '+titleCase(tier.name)+
   ' insignia is now yours to display.</p>'+
   '<p class="sx-prestige-celebration-permanent">All earned rank badges remain permanently unlocked.</p>'+
   '<button type="button" class="sx-prestige-primary" data-sx-prestige-view>VIEW PRESTIGE SHOWCASE</button>'+
   '<button type="button" class="sx-prestige-secondary" data-sx-prestige-close>CONTINUE</button>';
  root.querySelector('.sx-prestige-primary')?.focus();
  return true;
 }
 function close(){
  if(!overlay||overlay.hidden)return;
  overlay.hidden=true;
  overlay.classList.remove('is-celebration');
  global.document.body.classList.remove('sx-prestige-open');
  if(previousFocus?.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus();
  previousFocus=null;
 }
 global.document?.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-open-prestige-showcase]')){
   event.preventDefault();display();return;
  }
  if(!overlay||overlay.hidden)return;
  if(event.target===overlay||event.target?.closest?.('[data-sx-prestige-close]')){
   close();return;
  }
  if(event.target?.closest?.('[data-sx-prestige-view]')){
   display();
  }
 });
 global.document?.addEventListener('keydown',event=>{
  if(!overlay||overlay.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close();return}
  if(event.key!=='Tab')return;
  const controls=[...overlay.querySelectorAll('button:not([disabled])')];
  if(!controls.length)return;
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&global.document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&global.document.activeElement===last){event.preventDefault();first.focus()}
 });
 global.SpartanXPrestigeShowcase=Object.freeze({describe,open:display,celebrate,close});
})(window);
