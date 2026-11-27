/* Presentation-only progress rings, driven by the existing programme and logger. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg';
const percent=n=>Math.max(0,Math.min(100,Number.isFinite(Number(n))?Number(n):0));
const counts=(done,total)=>total>0?percent(done/total*100):0;
function set(el,value,label,description){
 if(!el)return;
 const p=percent(value),rounded=Math.round(p);
 el.classList.add('sx-ring');
 if(!el.querySelector('.sx-ring-art')){
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 48 48');svg.setAttribute('aria-hidden','true');svg.classList.add('sx-ring-art');
  ['sx-ring-track','sx-ring-arc'].forEach(cls=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx','24');c.setAttribute('cy','24');c.setAttribute('r','20');c.setAttribute('pathLength','100');c.classList.add(cls);svg.appendChild(c);});
  const text=document.createElement('span');text.className='sx-ring-value';text.setAttribute('aria-hidden','true');el.append(svg,text);
 }
 el.style.setProperty('--sx-ring-pct',String(p));
 el.querySelector('.sx-ring-value').textContent=label==null?rounded+'%':String(label);
 el.setAttribute('role','progressbar');el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax','100');el.setAttribute('aria-valuenow',String(rounded));
 if(description)el.setAttribute('aria-label',description);
}
function activeSets(work,valid,isCardio){
 let total=0,done=0;
 for(const ex of Array.isArray(work)?work:[]){
  if(isCardio?.(ex.name))continue;
  for(const s of Array.isArray(ex.sets)?ex.sets:[]){
   if(!s||s.type==='Warm-up'||s.type==='W')continue;
   total++;if(s.done===true&&valid(s,ex.name))done++;
  }
 }
 return {done,total,percent:counts(done,total)};
}
function weekly(sessions,goal,now=new Date()){
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());start.setDate(start.getDate()-(start.getDay()+6)%7);
 const done=(sessions||[]).filter(s=>{const d=new Date(s.date);return Number.isFinite(d.getTime())&&d>=start&&d<=now;}).length;
 return {done,total:goal,percent:counts(done,goal)};
}
function updateWeekly(sessions){
 const el=document.getElementById('sxHomeWeeklyRing'),wrap=document.getElementById('sxHomeWeekly');if(!el||!wrap)return;
 let goal=0;
 try{const api=root.SXAscensionAdaptive,c=api?.activeCycle();if(c?.lifts?.length){const prefs=api.read(c.id);goal=prefs.enabled&&Number(prefs.days)>=c.lifts.length?Number(prefs.days):c.lifts.length;}}catch(_){}
 wrap.hidden=!(Number.isInteger(goal)&&goal>0);if(wrap.hidden)return;
 const m=weekly(sessions,goal);set(el,m.percent,m.done+'/'+m.total,'Logged workouts this calendar week: '+m.done+' of '+m.total+' target');
}
root.SXProgressRing=Object.freeze({set,percent,counts,activeSets,weekly,updateWeekly});
})(typeof window!=='undefined'?window:globalThis);
