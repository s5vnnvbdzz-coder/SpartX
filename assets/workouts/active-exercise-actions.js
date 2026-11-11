/* Active Workout exercise actions: ordered edits + explicit two-exercise supersets.
 * UI drafts are disposable until Save. Current sessions and workout timers are
 * controlled by the app, never changed by opening this module's pages.
 */
(function(global){
 'use strict';
 const validIndex=(work,i)=>Array.isArray(work)&&Number.isInteger(i)&&i>=0&&i<work.length;
 const groupIds=work=>[...new Set((work||[]).map(ex=>ex?.sxSupersetId).filter(Boolean))];
 function members(work,id){
  return (work||[]).map((ex,i)=>ex?.sxSupersetId===id?i:-1).filter(i=>i>=0);
 }
 function badge(work,index){
  if(!validIndex(work,index))return null;
  const id=work[index]?.sxSupersetId;
  if(!id)return null;
  const pair=members(work,id);
  if(pair.length!==2)return null;
  const position=pair.indexOf(index),other=pair[1-position],number=groupIds(work).indexOf(id)+1;
  return {id,number,position,partnerIndex:other,
   partnerName:String(work[other]?.name||'Exercise'),
   label:'SS'+number+' · A'+(position+1)};
 }
 function next(work,index,setIndex){
  const group=badge(work,index);
  if(!group)return null;
  const source=work[index]?.sets?.[setIndex];
  // Let programmed warm-ups finish normally; alternation starts on
  // resistance working sets or a completed cardio interval.
  if(source?.type==='Warm-up'||source?.type==='W')return null;
  const available=i=>(work[i]?.sets||[]).findIndex(s=>!s.done&&s.type!=='Warm-up'&&s.type!=='W');
  let target=group.partnerIndex,nextSet=available(target);
  if(nextSet<0){target=index;nextSet=available(index);}
  return nextSet<0?null:{index:target,setIndex:nextSet,name:work[target].name,groupId:group.id};
 }
 function reorder(work,order){
  if(!Array.isArray(order)||order.length!==work.length||
   new Set(order).size!==work.length||order.some(i=>!validIndex(work,i)))return null;
  return order.map(index=>work[index]);
 }
 function setPair(work,selected,source,makeId=()=>('sxss-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8))){
  if(!validIndex(work,source)||!Array.isArray(selected)||selected.length!==2||
   new Set(selected).size!==2||!selected.includes(source)||
   selected.some(i=>!validIndex(work,i)))return null;
  const oldId=work[source]?.sxSupersetId;
  for(const i of selected)if(work[i]?.sxSupersetId&&work[i].sxSupersetId!==oldId)return null;
  const id=oldId||makeId();
  return work.map((ex,i)=>{
   if(ex.sxSupersetId!==oldId&&!(selected.includes(i)))return ex;
   // Do not accidentally unlink any other established pair.
   if(oldId===undefined&&!selected.includes(i))return ex;
   const updated={...ex};
   if(selected.includes(i))updated.sxSupersetId=id;
   else delete updated.sxSupersetId;
   return updated;
  });
 }
 function removePair(work,index){
  const id=work[index]?.sxSupersetId;
  if(!id)return work;
  return work.map(ex=>{
   if(ex.sxSupersetId!==id)return ex;
   const changed={...ex};delete changed.sxSupersetId;return changed;
  });
 }
 function create(opts){
  if(!global.document||!opts?.getWork)return null;
  const doc=global.document,body=doc.body,main=doc.querySelector('body > main');
  if(!main)return null;
  const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({
   '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const markup=(id,title,kicker,help)=>'<div class="sx-exercise-manage-header">'+
   '<div class="eyebrow">'+kicker+'</div><h1>'+title+'</h1><p>'+help+'</p></div>'+
   '<div class="sx-exercise-manage-list" data-sx-list></div>'+
   '<div class="sx-exercise-manage-footer"><button type="button" data-sx-cancel>CANCEL</button>'+
   '<button type="button" data-sx-save>SAVE CHANGES</button></div>';
  const reorderScreen=doc.createElement('section');
  reorderScreen.id='sxActiveExerciseReorder';reorderScreen.className='screen sx-exercise-manage';
  reorderScreen.innerHTML=markup('sxActiveExerciseReorder','Reorder Exercises','ACTIVE SESSION · EXERCISE ORDER',
   'Press and hold the arrow handle, then drag to move an exercise. Changes apply only when you save.');
  main.appendChild(reorderScreen);
  const supersetScreen=doc.createElement('section');
  supersetScreen.id='sxActiveExerciseSuperset';supersetScreen.className='screen sx-exercise-manage';
  supersetScreen.innerHTML=markup('sxActiveExerciseSuperset','Create Superset','ACTIVE SESSION · SUPERSET PAIR',
   'Select two exercises to alternate their sets. The countdown will show which exercise comes next.');
  supersetScreen.querySelector('.sx-exercise-manage-footer').insertAdjacentHTML('beforebegin',
   '<button type="button" class="sx-exercise-unpair" data-sx-unpair hidden>REMOVE EXISTING SUPERSET</button>');
  main.appendChild(supersetScreen);
  const overlay=doc.createElement('div');
  overlay.id='sxExerciseActionsOverlay';overlay.hidden=true;
  overlay.innerHTML='<section class="sx-exercise-actions-sheet" role="dialog" aria-modal="true" aria-labelledby="sxExerciseActionsTitle">'+
   '<div class="sx-exercise-actions-grip" aria-hidden="true"></div>'+
   '<h2 id="sxExerciseActionsTitle">Exercise Options</h2>'+
   '<p id="sxExerciseActionsName"></p>'+
   '<div class="sx-exercise-actions-list">'+
   '<button type="button" data-sx-action="reorder"><span aria-hidden="true">↕</span>Reorder Exercises</button>'+
   '<button type="button" data-sx-action="replace"><span aria-hidden="true">⇄</span>Replace Exercise</button>'+
   '<button type="button" data-sx-action="superset"><span aria-hidden="true">＋</span>Add to Superset</button>'+
   '<button type="button" class="sx-exercise-actions-remove" data-sx-action="remove"><span aria-hidden="true">×</span>Remove Exercise</button>'+
   '</div><button type="button" class="sx-exercise-actions-dismiss" data-sx-dismiss>Cancel</button></section>';
  body.appendChild(overlay);
  let selectedIndex=null,order=[],chosen=[],baseIndex=null,hadGroup=false,bodyOverflow='';
  function closeMenu(){
   if(overlay.hidden)return;
   overlay.hidden=true;body.style.overflow=bodyOverflow;
  }
  function openMenu(i){
   const work=opts.getWork();
   if(!validIndex(work,i))return;
   selectedIndex=i;
   doc.getElementById('sxExerciseActionsName').textContent=work[i].name;
   bodyOverflow=body.style.overflow||'';
   body.style.overflow='hidden';overlay.hidden=false;
   overlay.querySelector('[data-sx-action="reorder"]')?.focus({preventScroll:true});
  }
  function navigate(screen){
   closeMenu();
   opts.onNavigate?.(screen.id);
   if(!screen.classList.contains('active')){
    doc.querySelectorAll('.screen.active').forEach(el=>el.classList.remove('active'));
    screen.classList.add('active');
   }
   global.scrollTo?.(0,0);
  }
  function back(){
   const active=doc.querySelector('main > .screen.active')?.id;
   if(active==='sxActiveExerciseReorder'||active==='sxActiveExerciseSuperset'){
    opts.onBack?.();
    if(doc.getElementById(active)?.classList.contains('active')){
     doc.getElementById(active).classList.remove('active');
     doc.getElementById('activeWorkout')?.classList.add('active');
    }
   }
  }
  function orderHTML(){
   const list=reorderScreen.querySelector('[data-sx-list]');
   const work=opts.getWork();
   list.innerHTML=order.map((key,i)=>{
    const sup=badge(work,key);
    return '<div class="sx-exercise-manage-row" data-sx-key="'+key+'">'+
     '<span class="sx-exercise-row-index">'+(i+1)+'</span>'+
     '<div class="sx-exercise-row-name"><strong>'+escape(work[key].name)+'</strong>'+
     (sup?'<small>'+escape(sup.label)+' · '+escape(sup.partnerName)+'</small>':'')+'</div>'+
     '<button type="button" class="sx-exercise-drag-handle" data-sx-drag aria-label="Hold and drag to reorder '+escape(work[key].name)+
     '" title="Hold and drag · Arrow keys also work">☰</button></div>';
   }).join('');
  }
  function openReorder(){
   order=opts.getWork().map((_,i)=>i);
   orderHTML();navigate(reorderScreen);
  }
  function startDrag(event){
   const handle=event.target.closest?.('[data-sx-drag]');
   if(!handle||event.button>0)return;
   const row=handle.closest('[data-sx-key]'),key=Number(row?.dataset.sxKey);
   if(!row||!Number.isInteger(key))return;
   const startX=event.clientX,startY=event.clientY;
   let held=false,hover=null,closed=false;
   const arm=global.setTimeout(()=>{
    if(closed)return;
    held=true;row.classList.add('sx-exercise-held');
    try{handle.setPointerCapture(event.pointerId);}catch(_){}
    if(global.navigator?.vibrate)global.navigator.vibrate(25);
   },270);
   const reset=()=>{
    if(closed)return;
    closed=true;global.clearTimeout(arm);
    row.classList.remove('sx-exercise-held');
    reorderScreen.querySelectorAll('.sx-exercise-over').forEach(item=>item.classList.remove('sx-exercise-over'));
    doc.removeEventListener('pointermove',move);
    doc.removeEventListener('pointerup',end);
    doc.removeEventListener('pointercancel',cancel);
   };
   const move=ev=>{
    if(ev.pointerId!==event.pointerId)return;
    if(!held){
     if(Math.abs(ev.clientY-startY)>12||Math.abs(ev.clientX-startX)>12)reset();
     return;
    }
    ev.preventDefault();
    const target=doc.elementFromPoint(ev.clientX,ev.clientY)?.closest?.('[data-sx-key]');
    if(target&&reorderScreen.contains(target)){
     hover=Number(target.dataset.sxKey);
     reorderScreen.querySelectorAll('.sx-exercise-over').forEach(item=>item.classList.remove('sx-exercise-over'));
     if(hover!==key)target.classList.add('sx-exercise-over');
    }
    const list=reorderScreen.querySelector('[data-sx-list]');
    const rect=list.getBoundingClientRect();
    if(ev.clientY>rect.bottom-40)list.scrollTop+=16;
    else if(ev.clientY<rect.top+40)list.scrollTop-=16;
   };
   const end=ev=>{
    if(ev.pointerId!==event.pointerId)return;
    if(held&&Number.isInteger(hover)&&hover!==key){
     const from=order.indexOf(key),to=order.indexOf(hover);
     if(from>=0&&to>=0){order.splice(from,1);order.splice(to,0,key);orderHTML();}
    }
    reset();
   };
   const cancel=ev=>{if(ev.pointerId===event.pointerId)reset()};
   doc.addEventListener('pointermove',move,{passive:false});
   doc.addEventListener('pointerup',end);
   doc.addEventListener('pointercancel',cancel);
  }
  reorderScreen.querySelector('[data-sx-list]').addEventListener('pointerdown',startDrag);
  reorderScreen.querySelector('[data-sx-list]').addEventListener('keydown',event=>{
   const handle=event.target.closest?.('[data-sx-drag]');if(!handle)return;
   const delta=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0;
   if(!delta)return;
   event.preventDefault();
   const key=Number(handle.closest('[data-sx-key]')?.dataset.sxKey);
   const from=order.indexOf(key),to=from+delta;
   if(from<0||to<0||to>=order.length)return;
   order.splice(from,1);order.splice(to,0,key);orderHTML();
   reorderScreen.querySelector('[data-sx-key="'+key+'"] [data-sx-drag]')?.focus();
  });
  function supersetHTML(){
   const work=opts.getWork(),oldId=work[baseIndex]?.sxSupersetId;
   const list=supersetScreen.querySelector('[data-sx-list]');
   list.innerHTML=work.map((ex,i)=>{
    const locked=i===baseIndex,existing=!!ex.sxSupersetId&&ex.sxSupersetId!==oldId;
    const selected=chosen.includes(i);
    return '<button type="button" class="sx-exercise-select-row '+(selected?'is-selected':'')+
     '" data-sx-choose="'+i+'" aria-pressed="'+(selected?'true':'false')+'" '+(locked||existing?'disabled':'')+'>'+
     '<span class="sx-exercise-check" aria-hidden="true">'+(selected?'✓':'')+'</span>'+
     '<span class="sx-exercise-row-name"><strong>'+escape(ex.name)+'</strong>'+
     '<small>'+(locked?'STARTING EXERCISE':existing?'ALREADY IN ANOTHER SUPERSET':
       selected?'PAIRED EXERCISE':'TAP TO PAIR')+'</small></span></button>';
   }).join('');
   const save=supersetScreen.querySelector('[data-sx-save]');
   save.disabled=chosen.length!==2;
   save.textContent='SAVE SUPERSET';
   supersetScreen.querySelector('[data-sx-unpair]').hidden=!hadGroup;
  }
  function openSuperset(i){
   const work=opts.getWork();
   if(!validIndex(work,i))return;
   baseIndex=i;
   const oldId=work[i]?.sxSupersetId;
   const match=oldId?members(work,oldId).filter(n=>n!==i):[];
   hadGroup=match.length>0;
   chosen=[i,...match.slice(0,1)];
   supersetHTML();navigate(supersetScreen);
  }
  supersetScreen.querySelector('[data-sx-list]').addEventListener('click',event=>{
   const row=event.target.closest?.('[data-sx-choose]');if(!row||row.disabled)return;
   const i=Number(row.dataset.sxChoose);
   if(!validIndex(opts.getWork(),i)||i===baseIndex)return;
   chosen=chosen.includes(i)?[baseIndex]:[baseIndex,i];
   supersetHTML();
  });
  for(const screen of [reorderScreen,supersetScreen]){
   screen.querySelector('[data-sx-cancel]').addEventListener('click',back);
   screen.querySelector('[data-sx-save]').addEventListener('click',()=>{
    if(screen===reorderScreen){
     const result=opts.onReorder?.(order.slice());
     if(result!==false)back();
    }else if(chosen.length===2){
     const result=opts.onSuperset?.(chosen.slice(),baseIndex);
     if(result!==false)back();
    }
   });
  }
  supersetScreen.querySelector('[data-sx-unpair]').addEventListener('click',()=>{
   if(!hadGroup)return;
   const result=opts.onRemoveSuperset?.(baseIndex);
   if(result!==false)back();
  });
  overlay.addEventListener('click',event=>{
   if(event.target===overlay||event.target.closest('[data-sx-dismiss]')){closeMenu();return;}
   const control=event.target.closest?.('[data-sx-action]');
   if(!control||selectedIndex===null)return;
   const index=selectedIndex,action=control.dataset.sxAction;
   closeMenu();
   if(action==='reorder')openReorder();
   else if(action==='superset')openSuperset(index);
   else if(action==='replace')opts.onReplace?.(index);
   else if(action==='remove')opts.onRemove?.(index);
  });
  doc.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   if(!overlay.hidden){event.preventDefault();closeMenu();return;}
   const active=doc.querySelector('main > .screen.active')?.id;
   if(active===reorderScreen.id||active===supersetScreen.id){event.preventDefault();back();}
  });
  function flashNext(index){
   const card=doc.getElementById('exerciseList')?.children?.[index];
   if(!card)return;
   card.classList.add('sx-superset-ready');
   let indicator=card.querySelector('.sx-superset-ready-label');
   if(!indicator){indicator=doc.createElement('span');indicator.className='sx-superset-ready-label';card.prepend(indicator);}
   indicator.textContent='SUPERSET · NEXT SET READY';
   global.setTimeout(()=>{card.classList.remove('sx-superset-ready');indicator?.remove();},9500);
  }
  return Object.freeze({openMenu,openReorder,openSuperset,closeMenu,flashNext});
 }
 global.SXActiveExerciseActions=Object.freeze({badge,next,reorder,setPair,removePair,members,create});
})(window);
