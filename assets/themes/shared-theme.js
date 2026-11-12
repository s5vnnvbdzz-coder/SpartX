/* SpartanX Shared Theme Bridge v315
 * One palette contract for Tracker, Settings, AscensionX, Intelligence,
 * and embedded 5/3/1 / Tools. No polling or data migration.
 */
(function(global){
 'use strict';
 const PREF='spartx_preferences_v1',SHARED='spartanx_shared_active_theme_v1';
 const palette={
  dark:['#0b0d0f','#171a1e','#22272d','#30363e','#f3f4f6','#9ba3ad','#c8f169'],
  light:['#f2f4f6','#ffffff','#e9edf0','#d5dbe0','#171b20','#68727c','#718f27'],
  'spartan-red':['#0a090a','#171315','#251b1e','#45272d','#f5f1f2','#b6a8ab','#ef3340'],
  'spartan-gold':['#0a090a','#171613','#25231e','#494232','#f5f1e9','#b8b09e','#b89b5e'],
  'spartan-bronze':['#0a0909','#171513','#26211d','#40352d','#f4eee8','#b6a99d','#a8794f'],
  'spartan-pantheon':['#110d0c','#211917','#30241f','#695045','#f7eada','#c2ab98','#dbb66e'],
  'spartan-blue':['#090e15','#141b25','#202c3b','#34465b','#eef3f8','#aab8c8','#628bb8'],
  'spartan-amethyst':['#0b0911','#17121f','#292037','#4b385f','#f1eaf7','#b5a5c4','#b58ae9'],
  'spartan-olympian':['#080808','#151414','#242222','#51483a','#f3eee5','#b8ad9b','#d8c49a'],
  'olympian-athena':['#0d0912','#1a1422','#292033','#70577d','#f7edf6','#c2abc9','#e8b4dd'],
  'amazonian-crimson':['#160c14','#291b26','#392436','#784957','#f8e9f2','#d4b1bf','#f07192'],
  'athenas-aegis':['#110d1b','#251c36','#33274b','#64547d','#f3edff','#c1b0d6','#af93e6'],
  'sx-monster':['#090d09','#171e13','#24311c','#4b7134','#f6f5ee','#c0b9b3','#8fe51b'],
  'premium-olympus':['#090c14','#111824','#1a2534','#a68043','#fff9ed','#c1bba9','#ffd376'],
  'sx-black-yellow':['#050505','#111113','#202024','#40371e','#f4f1e7','#beb7a3','#f4cd37'],
  'sx-obsidian-white':['#030303','#0b0b0b','#171717','#333333','#f0f0f0','#999999','#dfdfdf'],
  'cosmic-nebula':['#070919','#12162c','#202644','#6367a0','#f2f5ff','#afb9d8','#8bdcff'],
 };
 const accepted=Object.keys(palette);
 const tokenMap=['--bg','--panel','--panel2','--line','--txt','--muted','--lime'];
 let last='';
 function getSaved(){
  let chosen='';
  try{chosen=JSON.parse(localStorage.getItem(PREF)||'{}').theme||''}catch(_){}
  if(!chosen)try{chosen=localStorage.getItem(SHARED)||''}catch(_){}
  return accepted.includes(chosen)?chosen:'dark';
 }
 function isTracker(){return !!document.getElementById('themeChoice')}
 function theme(){
  const active=document.body?.dataset.activeTheme||'';
  if(active&&accepted.includes(active))return active;
  return getSaved();
 }
 function apply(choice){
  const body=document.body;if(!body)return;
  const selected=accepted.includes(choice)?choice:theme();
  const root=isTracker(),p=palette[selected]||palette.dark;
  body.dataset.sxTheme=selected;
  document.documentElement.dataset.sxTheme=selected;

  body.classList.toggle('sx-theme-child',!root);
  // Tracker defines retained themes already. Independent pages receive the full palette.
  if(!root){
   tokenMap.forEach((t,i)=>body.style.setProperty(t,p[i]));
   const derived={
    '--text':p[4],'--surface':p[1],'--surface2':p[2],
    '--surface3':p[2],'--stroke':p[3],'--gold':p[6],
    '--goldSoft':p[6],'--goldPale':p[4],
    '--red':p[6],'--red2':p[6],'--redDeep':p[3],
    '--panel3':p[2],'--accent':p[6]
   };
   for(const [t,v] of Object.entries(derived))body.style.setProperty(t,v);
  }else{
   // Switching themes clears stale inline colours from earlier versions.
   for(const t of tokenMap)body.style.removeProperty(t);
   for(const t of ['--text','--surface','--surface2','--surface3','--stroke','--gold',
     '--goldSoft','--goldPale','--red','--red2','--redDeep','--panel3','--accent'])
    body.style.removeProperty(t);
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=p[0];
  document.documentElement.style.colorScheme=selected==='light'?'light':'dark';
  last=selected;
  return selected;
 }
 function refresh(){return apply(theme())}
 function fromMessage(e){
  if(e.origin!==location.origin||e.source!==global.parent)return;
  if(e.data?.type!=='spartx:applyParentTheme'&&
     e.data?.type!=='spartx:applyTheme')return;
  if(typeof e.data.theme==='string'&&accepted.includes(e.data.theme))apply(e.data.theme);
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
 else refresh();
 global.addEventListener('pageshow',refresh);
 global.addEventListener('storage',e=>{
  if(e.key===PREF||e.key===SHARED)refresh();
 });
 global.addEventListener('spartx:preferencesChanged',refresh);
 global.addEventListener('message',fromMessage);
 const observe=()=>{
  if(typeof MutationObserver!=='function'||!document.body)return;
  new MutationObserver(mutations=>{
   if(mutations.some(m=>m.attributeName==='data-active-theme'))refresh();
  }).observe(document.body,{attributes:true,attributeFilter:['data-active-theme']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
 global.SXSharedThemes=Object.freeze({palette,refresh,apply,theme,getSaved,last:()=>last});
})(window);
