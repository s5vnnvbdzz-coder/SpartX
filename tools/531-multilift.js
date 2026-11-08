/* SpartanX 5/3/1 multi-lift programme editor. Preserves legacy single-lift cycles. */
(function(){
'use strict';
const host=document.getElementById('native531Host'),root=host&&host.shadowRoot;
if(!root)return;
const KEY='spartanx_531_saved_cycles_v1',DRAFT='spartanx_531_lifts_draft_v1';
const LIFTS=['Back Squat','Bench Press','Deadlift','Overhead Press'];
const LABEL={'Back Squat':'Squat','Bench Press':'Bench Press','Deadlift':'Deadlift','Overhead Press':'Overhead Press'};
const SCHEMES=[
 {name:'5s',p:[.65,.75,.85],r:['5','5','5+']},
 {name:'3s',p:[.70,.80,.90],r:['3','3','3+']},
 {name:'5/3/1',p:[.75,.85,.95],r:['5','3','1+']},
 {name:'Deload',p:[.45,.55,.65],r:['5','5','5']}
];
const el=id=>root.getElementById(id),round=n=>Math.round(Number(n)/2.5)*2.5;
const safe=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}}
function notify(){window.dispatchEvent(new StorageEvent('storage',{key:KEY}));window.dispatchEvent(new Event('spartx:cycleUpdated'))}
function write(items){try{localStorage.setItem(KEY,JSON.stringify(items));notify();return true}catch(_){alert('Unable to save programme to device storage.');return false}}
function configFor(lift){
 let rm=0;
 try{const a=JSON.parse(localStorage.getItem('spartxToolsInputs')||'{}');rm=Number(a.oneRmsByLiftKg?.[lift==='Deadlift'?'Conventional Deadlift':lift])||0}catch(_){}
 return {oneRm:rm||'',tm:rm?round(rm*.9):'',increase:lift==='Back Squat'||lift==='Deadlift'?5:2.5};
}
let activeLift=LIFTS.includes(el('lift').value)?el('lift').value:'Bench Press';
let selected=new Set([activeLift]),configs=Object.fromEntries(LIFTS.map(lift=>[lift,configFor(lift)]));
let proposed=null,editing=null;
function storeCurrent(){
 const c=configs[activeLift]||configFor(activeLift);
 c.oneRm=Number(el('oneRm').value)||'';
 c.tm=Number(el('tm').value)||'';
 c.increase=Number(el('increase').value);
 configs[activeLift]=c;
}
function showCurrent(){
 const c=configs[activeLift]||configFor(activeLift);
 el('lift').value=activeLift;
 el('oneRm').value=c.oneRm||'';
 el('tm').value=c.tm||'';
 el('increase').value=Number.isFinite(Number(c.increase))?c.increase:2.5;
}
function saveDraft(){
 try{localStorage.setItem(DRAFT,JSON.stringify({selected:[...selected],configs,activeLift}))}catch(_){}
}
const style=document.createElement('style');
style.textContent='.sx531-lift-picker{margin:15px 0;padding:13px;border:1px solid var(--line);border-radius:13px;background:color-mix(in srgb,var(--panel2) 45%,transparent)}.sx531-picker-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.sx531-picker-head strong{font-size:13px}.sx531-picker-head button{padding:7px 9px;font-size:10px;background:var(--panel2);color:var(--txt);border:1px solid var(--line)}.sx531-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.sx531-choices label{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:9px;margin:0;padding:9px 7px;color:var(--txt);font-size:12px;cursor:pointer}.sx531-choices label.chosen{border-color:var(--lime)}.sx531-choices input{width:17px;height:17px;min-width:17px;padding:0;margin:0;accent-color:var(--lime)}.sx531-lift-picker .hint{margin-top:9px}.sx531-plan-preview h3{margin:13px 0 5px;font-size:12px;color:var(--lime)}.sx531-plan-preview .sx531-week{padding:8px 0;border-bottom:1px solid var(--line)}.sx531-plan-preview small{color:var(--muted)}';
root.appendChild(style);
const picker=document.createElement('section');
picker.className='sx531-lift-picker';picker.id='sx531LiftPicker';
picker.innerHTML='<div class="sx531-picker-head"><strong>Programme lifts</strong><button type="button" id="sx531AllLifts">SELECT ALL FOUR</button></div><div class="sx531-choices" id="sx531LiftChoices"></div><p class="hint">Tick the lifts to include. Use Main lift above to edit each lift’s 1RM, training max and four-week increase independently. You can change the selection mid-cycle.</p>';
el('generate').before(picker);
function renderPicker(){
 el('sx531LiftChoices').innerHTML=LIFTS.map(lift=>'<label class="'+(selected.has(lift)?'chosen':'')+'"><input type="checkbox" data-sx531-lift="'+safe(lift)+'" '+(selected.has(lift)?'checked':'')+'><span>'+safe(LABEL[lift])+'</span></label>').join('');
}
function saveSelection(){storeCurrent();saveDraft();renderPicker()}
try{
 const d=JSON.parse(localStorage.getItem(DRAFT)||'null');
 if(d&&Array.isArray(d.selected)){
  const clean=d.selected.filter(l=>LIFTS.includes(l));
  if(clean.length)selected=new Set(clean);
  for(const lift of LIFTS)if(d.configs?.[lift])configs[lift]={...configFor(lift),...d.configs[lift]};
  if(LIFTS.includes(d.activeLift))activeLift=d.activeLift;
 }
}catch(_){}
const originalPrefill=window.spartanxPrefill531Cycle;
if(typeof originalPrefill==='function')window.spartanxPrefill531Cycle=function(detail){
 const ok=originalPrefill(detail);
 if(ok&&detail){
  activeLift=detail.lift==='Conventional Deadlift'?'Deadlift':detail.lift;
  if(!LIFTS.includes(activeLift))activeLift='Bench Press';
  selected=new Set([activeLift]);
  configs[activeLift]={oneRm:Number(detail.oneRm)||'',tm:Number(detail.tm)||round(Number(detail.oneRm)*.9)||'',increase:configs[activeLift]?.increase??2.5};
  showCurrent();renderPicker();saveDraft();
 }
 return ok;
};
showCurrent();renderPicker();
root.addEventListener('change',event=>{
 const t=event.target;
 if(t.id==='lift'){
  storeCurrent();activeLift=t.value;showCurrent();renderPicker();saveDraft();
  event.stopImmediatePropagation();return;
 }
 if(t.matches('[data-sx531-lift]')){
  const lift=t.dataset.sx531Lift;
  if(t.checked)selected.add(lift);
  else if(selected.size>1)selected.delete(lift);
  else t.checked=true;
  if(!selected.has(activeLift)){storeCurrent();activeLift=[...selected][0];showCurrent()}
  saveSelection();
 }
},true);
root.addEventListener('input',e=>{if(['oneRm','tm','increase'].includes(e.target.id)){storeCurrent();saveDraft()}});
el('sx531AllLifts').addEventListener('click',()=>{selected=new Set(LIFTS);saveSelection()});
function plans(lift,settings,count,bbb,bbbPct){
 const blocks=[];
 for(let block=0;block<count/4;block++){
  const tm=round(Number(settings.tm)+block*Number(settings.increase));
  const weeks=[];
  SCHEMES.forEach((s,i)=>{
   const number=block*4+i+1;
   const warmups=i===3?[]:[{pct:.4,rep:'5',weight:round(tm*.4)},{pct:.5,rep:'5',weight:round(tm*.5)},{pct:.6,rep:'3',weight:round(tm*.6)}];
   const sets=s.p.map((pct,j)=>({pct,rep:s.r[j],weight:round(tm*pct)}));
   weeks.push({number,name:'Week '+number+' · '+s.name,tm,sets,warmups,
    bbb:bbb&&i!==3?{pct:Number(bbbPct),sets:5,reps:10,weight:round(tm*Number(bbbPct)/100)}:null});
  });
  blocks.push({number:block+1,tm,weeks});
 }
 return blocks;
}
function priorSessions(c,lift){
 if(Array.isArray(c.completedSessions?.[lift]))return c.completedSessions[lift].map(Number);
 return c.lift===lift?(c.completedWeeks||[]).map(Number):[];
}
function getPriorCurrentWeek(c){
 const done=new Set((c.completedWeeks||[]).map(Number));
 for(let n=1;n<=Number(c.weeks);n++)if(!done.has(n))return n;
 return Number(c.weeks)+1;
}
function build(){
 storeCurrent();
 const lifts=LIFTS.filter(l=>selected.has(l));
 const count=Number(root.querySelector('#lengthChoices button.active')?.dataset.weeks)||4;
 const bbb=el('bbb').checked,bbbPct=Number(el('bbbPct').value);
 if(!lifts.length){alert('Select at least one lift.');return null}
 for(const lift of lifts){
  const s=configs[lift];
  if(!(Number(s.tm)>0)||Number(s.tm)>1000||!Number.isFinite(Number(s.increase))||Number(s.increase)<0||Number(s.increase)>50){
   activeLift=lift;showCurrent();alert('Enter a valid training max and TM increase for '+LABEL[lift]+'.');return null;
  }
 }
 const primary=lifts.includes(activeLift)?activeLift:lifts[0];
 const liftPlans={},liftSettings={};
 for(const lift of lifts){
  const s=configs[lift];liftSettings[lift]={oneRm:Number(s.oneRm)||'',tm:round(Number(s.tm)),increase:Number(s.increase)};
  liftPlans[lift]={cycles:plans(lift,liftSettings[lift],count,bbb,bbbPct)};
 }
 const first=liftPlans[primary].cycles;
 const data={id:editing?.id||null,name:'5/3/1 · '+count+' weeks · '+lifts.map(l=>LABEL[l]).join(' / '),
  lift:primary,exercises:lifts,liftSettings,liftPlans,created:editing?.created||new Date().toISOString(),
  startTM:liftSettings[primary].tm,increase:liftSettings[primary].increase,weeks:count,bbb,bbbPct,cycles:first,
  completedSessions:{},completedWeeks:[]};
 if(editing){
  const current=getPriorCurrentWeek(editing);
  const archived={...(editing.archivedSessions||{})};
  // Removing a lift preserves its previous completed weeks for possible re-adding.
  for(const oldLift of LIFTS){
   if(!lifts.includes(oldLift)&&(editing.exercises?.includes(oldLift)||editing.lift===oldLift))
    archived[oldLift]=priorSessions(editing,oldLift);
  }
  for(const lift of lifts){
   const already=editing.exercises?.includes(lift)||editing.lift===lift;
   const restored=Array.isArray(archived[lift])?archived[lift]:null;
   data.completedSessions[lift]=(already?priorSessions(editing,lift):
    restored||Array.from({length:Math.min(count,current-1)},(_,i)=>i+1))
    .filter(n=>Number.isInteger(Number(n))&&n>=1&&n<=count).map(Number);
   delete archived[lift];
  }
  data.archivedSessions=archived;
  data.completedWeeks=Array.from({length:count},(_,i)=>i+1).filter(n=>lifts.every(l=>data.completedSessions[l].includes(n)));
 }
 return data;
}
function planDetails(data){
 let text='';
 for(const lift of data.exercises){
  text+='<h3>'+safe(LABEL[lift])+'</h3>';
  for(const block of data.liftPlans[lift].cycles)for(const week of block.weeks){
   const completed=(data.completedSessions?.[lift]||[]).includes(week.number);
   text+='<div class="sx531-week"><strong>Week '+week.number+' · '+safe(SCHEMES[(week.number-1)%4].name)+'</strong> <small>TM '+week.tm+' kg '+(completed?'✓ Complete':'')+'</small>';
   const lines=[...(week.warmups||[]).map(s=>'Warm-up '+Math.round(s.pct*100)+'% · '+s.rep+' × '+s.weight+' kg'),
    ...week.sets.map(s=>'Working '+Math.round(s.pct*100)+'% · '+s.rep+' × '+s.weight+' kg')];
   if(week.bbb)lines.push('BBB · 5 × 10 × '+week.bbb.weight+' kg');
   text+='<div class="hint">'+lines.map(s=>safe(s)).join(' | ')+'</div></div>';
  }
 }
 return text;
}
function showPreview(data){
 proposed=data;
 el('programmeCard').classList.add('visible');
 el('programmeName').textContent=data.name;
 el('programmeMeta').textContent=data.exercises.length+' programmed lift'+(data.exercises.length===1?'':'s')+' · '+(data.bbb?'BBB '+data.bbbPct+'%':'Standard 5/3/1');
 el('programmeLength').textContent=data.weeks+' WEEKS';
 el('startTM').textContent=data.startTM+' kg';
 el('finalTM').textContent=data.liftPlans[data.lift].cycles.at(-1).tm+' kg';
 el('blockCount').textContent=data.weeks/4;
 el('programmeStatus').textContent=editing?'EDITING':'GENERATED';
 el('saveCycle').textContent=editing?'SAVE CHANGES':'SAVE CYCLE';
 el('cycleDetail').innerHTML='<div class="sx531-plan-preview">'+planDetails(data)+'</div>';
 el('cycleDetail').classList.remove('open');
 el('expandCycle').textContent='VIEW ENTIRE CYCLE ↓';
}
function finishEditor(){
 el('editModal').hidden=true;
 el('setupPlaceholder').after(el('setupCard'));
 el('setupCard').hidden=false;
 el('generate').textContent='GENERATE CYCLE';
 host.style.overflow='';
 editing=null;proposed=null;
}
root.addEventListener('click',event=>{
 const target=event.target.closest('button');
 if(!target)return;
 if(target.id==='generate'){
  event.preventDefault();event.stopImmediatePropagation();
  const next=build();if(!next)return;
  if(editing){
   const items=read(),idx=items.findIndex(c=>c.id===editing.id);
   if(idx<0){alert('This programme no longer exists.');return}
   items[idx]=next;
   if(write(items)){finishEditor();el('programmeCard').classList.remove('visible');saveDraft();window.dispatchEvent(new Event('spartx:quickCycleSaved'))}
  }else{showPreview(next);el('programmeCard').scrollIntoView({block:'start',behavior:'instant'})}
 }
 else if(target.id==='saveCycle'){
  event.preventDefault();event.stopImmediatePropagation();
  if(!proposed)return;
  const d=JSON.parse(JSON.stringify(proposed));
  d.id='sx531_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
  d.created=new Date().toISOString();
  const all=read();all.unshift(d);
  if(write(all)){
   el('programmeCard').classList.remove('visible');
   proposed=null;saveDraft();
   window.dispatchEvent(new Event('spartx:cycleSaved'));
  }
 }
 else if(target.hasAttribute('data-edit')){
  event.preventDefault();event.stopImmediatePropagation();
  const item=read().find(x=>String(x.id)===target.dataset.edit);
  if(!item)return;
  editing=item;proposed=null;
  selected=new Set((Array.isArray(item.exercises)?item.exercises:[item.lift]).filter(l=>LIFTS.includes(l)));
  if(!selected.size)selected.add('Bench Press');
  for(const lift of selected){
   const s=item.liftSettings?.[lift];
   configs[lift]=s?{...configFor(lift),...s}:{...configFor(lift),tm:lift===item.lift?item.startTM:configFor(lift).tm,increase:lift===item.lift?item.increase:configFor(lift).increase};
  }
  activeLift=selected.has(item.lift)?item.lift:[...selected][0];showCurrent();renderPicker();
  const buttons=[...root.querySelectorAll('#lengthChoices button')];
  buttons.forEach(b=>b.classList.toggle('active',Number(b.dataset.weeks)===Number(item.weeks)));
  el('bbb').checked=!!item.bbb;el('bbbPct').value=String(item.bbbPct||60);
  el('bbbOptions').hidden=!item.bbb;
  el('editModalBody').appendChild(el('setupCard'));
  el('generate').textContent='SAVE CHANGES';
  el('editModal').hidden=false;
  saveDraft();
 }
 else if(target.hasAttribute('data-load')){
  const item=read().find(x=>String(x.id)===target.dataset.load);
  if(item?.liftPlans){
   event.preventDefault();event.stopImmediatePropagation();
   const detail=el('savedList').querySelector('[data-detail="'+CSS.escape(String(item.id))+'"]');
   if(!detail)return;
   const wasOpen=detail.classList.contains('open');
   detail.innerHTML=wasOpen?'':'<div class="sx531-plan-preview">'+planDetails(item)+'</div>';
   detail.classList.toggle('open',!wasOpen);target.textContent=wasOpen?'OPEN':'CLOSE';
  }
 }
 else if((target.id==='cancelEdit'||target.id==='closeEdit')&&editing){
  finishEditor();
 }
},true);
window.spartanx531CycleRead=read;
window.spartanx531CycleLifts=c=>Array.isArray(c.exercises)&&c.exercises.length?c.exercises:[c.lift];
window.spartanx531CycleWeek=(c,lift,n)=>{
 const plan=c.liftPlans?.[lift]?.cycles||((c.lift===lift)?c.cycles:[]);
 return plan.flatMap(b=>b.weeks||[]).find(w=>Number(w.number)===Number(n))||null;
};
window.spartanx531CycleDone=(c,lift)=>priorSessions(c,lift);
window.addEventListener('spartx:cycleUpdated',()=>{if(!editing)proposed=null});
})();
