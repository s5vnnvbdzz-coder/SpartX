/* SpartanX Workout cards: saved order and hold-to-drag handles. */
(()=>{
 'use strict';
 const workout=document.getElementById('workout'),stack=document.getElementById('sxProgrammeStack');
 const toggle=document.getElementById('sxWorkoutReorder');
 if(!workout||!stack||!toggle)return;
 const STORAGE_KEY='spartxWorkoutCardOrder_v1';
 const $=id=>document.getElementById(id);
 const initial=[
  {id:'start',el:workout.querySelector('.sx-programme-start')},
  {id:'531',el:$('sx531ProgrammeSlot')},
  {id:'ascension',el:$('sxAscensionProgrammeSlot')},
  {id:'bodybuilding',el:$('sxBodybuildingProgrammeCard')},
  {id:'routines',el:workout.querySelector('.sx-programme-routines')}
 ];
 if(initial.some(item=>!item.el))return;
 function wrap(el,id){
  if(id==='531'||id==='ascension'){el.classList.add('sx-workout-sort-item');el.dataset.workoutCard=id;return el}
  const slot=document.createElement('div');slot.className='sx-workout-sort-item';slot.dataset.workoutCard=id;
  el.parentNode.insertBefore(slot,el);slot.appendChild(el);return slot;
 }
 const nodes=initial.map(({id,el})=>({id,el:wrap(el,id)}));
 // Preserve the existing live card elements and all registered workout handlers.
 nodes.forEach(({el})=>stack.appendChild(el));
 const bar=document.createElement('div');
 bar.id='sxWorkoutOrderBar';bar.hidden=true;bar.setAttribute('role','group');bar.setAttribute('aria-label','Rearrange Workout cards');
 bar.innerHTML='<span>Hold and drag a card handle to rearrange the order.</span>'+
  '<button type="button" id="sxWorkoutOrderCancel">CANCEL</button>'+
  '<button type="button" id="sxWorkoutOrderSave">SAVE</button>';
 stack.before(bar);
 const css=document.createElement('style');
 css.textContent=`
 #workout .sx-programme-stack{display:grid;gap:10px}
 #workout .sx-workout-sort-item{position:relative;min-width:0}
 #workout .sx-workout-sort-item>.sx-programme-start,#workout .sx-workout-sort-item>.sx-programme-routines{margin:0!important}
 #sxWorkoutOrderBar[hidden]{display:none!important}
 #sxWorkoutOrderBar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:10px 0;padding:9px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
 #sxWorkoutOrderBar span{flex:1 1 140px;font-size:11px;color:var(--muted);line-height:1.4}
 #sxWorkoutOrderBar button{min-height:37px;padding:8px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--txt);font-size:11px;font-weight:850}
 #sxWorkoutOrderSave{border-color:var(--lime)!important;color:var(--lime)!important}
 #workout .sx-workout-sort-controls{display:none;align-items:center;justify-content:space-between;gap:7px;min-height:40px;margin:0 0 5px;padding:5px 8px;border:1px dashed var(--lime);border-radius:10px;background:var(--panel2);color:var(--txt)}
 #workout.sx-workout-ordering .sx-workout-sort-controls{display:flex}
 #workout .sx-workout-sort-controls .sx-workout-drag{flex:1;display:flex;align-items:center;gap:8px;min-height:34px;background:transparent;border:0;color:var(--txt);text-align:left;font-size:11px;font-weight:800;touch-action:none;cursor:grab}
 #workout .sx-workout-sort-controls .sx-workout-drag span{color:var(--lime);font-size:18px}
 #workout.sx-workout-ordering .sx-workout-sort-item{outline:1px solid color-mix(in srgb,var(--lime) 45%,transparent);outline-offset:1px;border-radius:12px}
 #workout .sx-workout-sort-item.sx-workout-dragging{opacity:.67}
 #workout.sx-workout-ordering .sx-workout-sort-item button:not(.sx-workout-sort-controls button),#workout.sx-workout-ordering .sx-workout-sort-item a{pointer-events:none}
 #workout .sx-workout-sort-item .sx-workout-drag:focus-visible{outline:2px solid var(--lime);outline-offset:2px}
 #workout .sx-workout-header-actions{display:flex;align-items:center;gap:8px}
 #workout .sx-workout-header-actions>a,#workout .sx-workout-header-actions>button{width:41px;height:41px;flex:none;display:grid;place-items:center;padding:0;border:1px solid color-mix(in srgb,var(--lime) 45%,var(--line));border-radius:50%;background:var(--panel2);color:var(--lime);text-decoration:none}
 #workout .sx-workout-header-actions svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}
 #workout .sx-workout-header-actions>button[aria-pressed="true"]{background:color-mix(in srgb,var(--lime) 16%,var(--panel2));box-shadow:0 0 9px color-mix(in srgb,var(--lime) 25%,transparent)}
 #workout .sx-workout-heading-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0}
 #workout .sx-workout-heading-row h1{margin:0;min-width:0;font-size:clamp(18px,5vw,25px)}
 #workout .sx-workout-header-actions{flex-shrink:0}
 @media(max-width:365px){#workout .sx-workout-header-actions>a,#workout .sx-workout-header-actions>button{width:36px;height:36px}}
 `;
 document.head.appendChild(css);
 const labels={start:'Start Workout','531':'5/3/1 Powerlifting',ascension:'AscensionX',bodybuilding:'Strength & Bodybuilding',routines:'Custom Routines'};
 for(const {id,el} of nodes){
  const controls=document.createElement('div');controls.className='sx-workout-sort-controls';
  controls.innerHTML='<button type="button" class="sx-workout-drag" data-workout-drag="'+id+'" aria-label="Hold and drag '+labels[id]+'"><span aria-hidden="true">⠿</span> Hold and drag · '+labels[id]+'</button>';
  el.prepend(controls);
 }
 const items=()=>Array.from(stack.children).filter(el=>el.matches('.sx-workout-sort-item'));
 const current=()=>items().map(el=>el.dataset.workoutCard);
 function restore(order){
  const saved=new Map(items().map(el=>[el.dataset.workoutCard,el]));
  for(const id of order)if(saved.has(id)){stack.appendChild(saved.get(id));saved.delete(id)}
  for(const item of saved.values())stack.appendChild(item);
 }
 try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(Array.isArray(saved))restore(saved)}catch(_){}
 let original=null,dragged=null,pointer=null;
 function setMode(enabled){
  workout.classList.toggle('sx-workout-ordering',enabled);bar.hidden=!enabled;toggle.setAttribute('aria-pressed',String(enabled));
  toggle.setAttribute('aria-label',enabled?'Rearranging Workout cards':'Rearrange Workout cards');
 }
 function finishDrag(){
  if(dragged)dragged.classList.remove('sx-workout-dragging');
  if(pointer!==null)try{if(stack.hasPointerCapture(pointer))stack.releasePointerCapture(pointer)}catch(_){}
  dragged=null;pointer=null;
 }
 toggle.addEventListener('click',()=>{if(workout.classList.contains('sx-workout-ordering'))return;original=current();setMode(true)});
 $('sxWorkoutOrderSave').addEventListener('click',()=>{finishDrag();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(current()))}catch(_){}original=null;setMode(false)});
 $('sxWorkoutOrderCancel').addEventListener('click',()=>{finishDrag();if(original)restore(original);original=null;setMode(false)});
 stack.addEventListener('pointerdown',e=>{
  if(!workout.classList.contains('sx-workout-ordering')||dragged||e.button!==0)return;
  const handle=e.target.closest('[data-workout-drag]');if(!handle)return;
  e.preventDefault();dragged=handle.closest('.sx-workout-sort-item');pointer=e.pointerId;
  dragged.classList.add('sx-workout-dragging');try{stack.setPointerCapture(pointer)}catch(_){}
 });
 stack.addEventListener('pointermove',e=>{
  if(!dragged||pointer!==e.pointerId)return;
  e.preventDefault();
  const other=items().find(el=>el!==dragged&&e.clientY<el.getBoundingClientRect().top+el.getBoundingClientRect().height/2);
  if(other)stack.insertBefore(dragged,other);else stack.appendChild(dragged);
 });
 stack.addEventListener('pointerup',finishDrag);
 stack.addEventListener('pointercancel',finishDrag);
 // The two live programme menus are mutually exclusive and dismiss on outside tap.
 function closeMenu(buttonId,menuId){
  const menu=$(menuId),button=$(buttonId);
  if(menu&&!menu.hidden){menu.hidden=true;if(button)button.setAttribute('aria-expanded','false')}
 }
 document.addEventListener('click',e=>{
  const a=!!e.target.closest('#sxAscensionOptions'),b=!!e.target.closest('#sx531QuickMenu');
  if(a)closeMenu('sx531QuickMenu','sx531QuickOptions');
  else if(b)closeMenu('sxAscensionOptions','sxAscensionOptionsMenu');
  else if(!e.target.closest('.sx-programme-menu-wrap')){
   closeMenu('sxAscensionOptions','sxAscensionOptionsMenu');
   closeMenu('sx531QuickMenu','sx531QuickOptions');
  }
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  closeMenu('sxAscensionOptions','sxAscensionOptionsMenu');closeMenu('sx531QuickMenu','sx531QuickOptions');
 }});
})();
